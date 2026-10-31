import time
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case
from app.models.subscription import Subscription, SubscriptionLine
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.plan import Plan
from app.models.user import User


def quantize_paise(val: Decimal) -> int:
    return int(val.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


class ReportService:
    @staticmethod
    def get_financial_summary(
        db: Session,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None
    ) -> Dict[str, Any]:
        start_time = time.perf_counter()
        today = date.today()

        # 1. Active Subscriptions count (active, not paused, not expired)
        active_subs_count = db.query(func.count(Subscription.id)).filter(
            Subscription.status == "active",
            Subscription.is_paused.is_(False),
            or_(Subscription.expiry_date.is_(None), Subscription.expiry_date >= today)
        ).scalar() or 0

        # 2. Revenue Received (sum of actual payments in period)
        payment_query = db.query(func.coalesce(func.sum(Payment.amount), 0))
        if from_date:
            payment_query = payment_query.filter(Payment.paid_on >= from_date)
        if to_date:
            payment_query = payment_query.filter(Payment.paid_on <= to_date)
        revenue_received = payment_query.scalar() or 0

        # 3. Outstanding Revenue (non-cancelled invoices with balance > 0)
        outstanding_rev = db.query(
            func.coalesce(func.sum(Invoice.total - Invoice.paid_total), 0)
        ).filter(
            Invoice.status != "cancelled",
            (Invoice.total - Invoice.paid_total) > 0
        ).scalar() or 0

        # 4. Overdue count (non-cancelled, due_date < today, outstanding > 0)
        overdue_count = db.query(func.count(Invoice.id)).filter(
            Invoice.status != "cancelled",
            Invoice.due_date < today,
            (Invoice.total - Invoice.paid_total) > 0
        ).scalar() or 0

        # 5. MRR calculation via aggregation grouped by period
        # Excludes closed, paused, expired subscriptions
        period_totals = db.query(
            Plan.period,
            func.coalesce(func.sum(SubscriptionLine.amount), 0)
        ).join(
            Subscription, Subscription.plan_id == Plan.id
        ).join(
            SubscriptionLine, SubscriptionLine.subscription_id == Subscription.id
        ).filter(
            Subscription.status == "active",
            Subscription.is_paused.is_(False),
            or_(Subscription.expiry_date.is_(None), Subscription.expiry_date >= today)
        ).group_by(Plan.period).all()

        mrr_total = Decimal("0")
        for period, amount_sum in period_totals:
            amt = Decimal(amount_sum)
            if period == "monthly":
                mrr_total += amt
            elif period == "yearly":
                mrr_total += amt / Decimal("12")
            elif period == "weekly":
                mrr_total += (amt * Decimal("52")) / Decimal("12")
            elif period == "daily":
                mrr_total += (amt * Decimal("365")) / Decimal("12")
            else:
                mrr_total += amt

        mrr = quantize_paise(mrr_total)

        elapsed_ms = int((time.perf_counter() - start_time) * 1000)

        return {
            "active_subscriptions": active_subs_count,
            "revenue_received": revenue_received,
            "outstanding": outstanding_rev,
            "overdue_count": overdue_count,
            "mrr": mrr,
            "query_ms": max(elapsed_ms, 1)
        }

    @staticmethod
    def get_overdue_invoices(
        db: Session,
        min_days_late: int = 0,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        today = date.today()
        base_query = db.query(
            Invoice,
            User.name.label("customer_name")
        ).join(
            User, Invoice.customer_id == User.id
        ).filter(
            Invoice.status != "cancelled",
            Invoice.due_date < today,
            (Invoice.total - Invoice.paid_total) > 0
        )

        all_overdue = base_query.order_by(Invoice.due_date.asc()).all()

        filtered_items = []
        for inv, cust_name in all_overdue:
            days_late = (today - inv.due_date).days
            if days_late >= min_days_late:
                filtered_items.append({
                    "invoice_number": inv.number,
                    "customer_name": cust_name,
                    "total": inv.total,
                    "paid_total": inv.paid_total,
                    "outstanding": inv.total - inv.paid_total,
                    "due_date": inv.due_date,
                    "days_late": days_late
                })

        total = len(filtered_items)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paged_items = filtered_items[start_idx:end_idx]

        return {
            "items": paged_items,
            "page": page,
            "page_size": page_size,
            "total": total
        }
