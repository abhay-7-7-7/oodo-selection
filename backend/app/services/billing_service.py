import json
import calendar
from datetime import date, timedelta, datetime, timezone
from typing import Dict, Any, List, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.subscription import Subscription
from app.models.invoice import Invoice, InvoiceLine
from app.models.discount import Discount
from app.services.pricing_service import PricingService, PricingLineItem


def utcnow():
    return datetime.now(timezone.utc)


class BillingService:
    @staticmethod
    def calculate_cycle_dates(start_d: date, period: str) -> Tuple[date, date]:
        """
        Advances the start_date by exactly one calendar cycle and returns (period_end, next_billing_date).
        - daily: period_end = start_d, next_billing_date = start_d + 1 day
        - weekly: period_end = start_d + 6 days, next_billing_date = start_d + 7 days
        - monthly: calendar month advance. Clamped to month length. period_end = next_billing_date - 1 day
        - yearly: calendar year advance. period_end = next_billing_date - 1 day
        """
        if period == "daily":
            next_start = start_d + timedelta(days=1)
            period_end = start_d
        elif period == "weekly":
            next_start = start_d + timedelta(days=7)
            period_end = start_d + timedelta(days=6)
        elif period == "monthly":
            y = start_d.year
            m = start_d.month + 1
            if m > 12:
                y += 1
                m = 1
            max_day = calendar.monthrange(y, m)[1]
            day = min(start_d.day, max_day)
            next_start = date(y, m, day)
            period_end = next_start - timedelta(days=1)
        elif period == "yearly":
            y = start_d.year + 1
            m = start_d.month
            max_day = calendar.monthrange(y, m)[1]
            day = min(start_d.day, max_day)
            next_start = date(y, m, day)
            period_end = next_start - timedelta(days=1)
        else:
            # Default monthly
            next_start = start_d + timedelta(days=30)
            period_end = next_start - timedelta(days=1)

        return period_end, next_start

    @staticmethod
    def calculate_due_date(issue_d: date, payment_terms: str) -> date:
        if payment_terms == "net_15":
            return issue_d + timedelta(days=15)
        elif payment_terms == "net_30":
            return issue_d + timedelta(days=30)
        return issue_d  # due_on_receipt or default

    @staticmethod
    def generate_invoice_number(db: Session) -> str:
        count = db.query(Invoice).count() + 1
        inv_num = f"INV-{count:05d}"
        while db.query(Invoice).filter(Invoice.number == inv_num).first():
            count += 1
            inv_num = f"INV-{count:05d}"
        return inv_num

    @staticmethod
    def run_billing(
        db: Session,
        as_of_date: date,
        dry_run: bool = False
    ) -> Dict[str, Any]:
        """
        Runs the automatic billing engine for all eligible subscriptions up to as_of_date.
        Idempotent, supports catch-up of missed billing periods, atomic discount counter,
        and transaction rollback on dry-run.
        """
        results = {
            "created": 0,
            "skipped": 0,
            "failed": 0,
            "items": []
        }

        # 1. Fetch all subscriptions that are active, not paused, and have next_billing_date <= as_of_date
        all_subs = db.query(Subscription).filter(
            Subscription.status.in_(["active", "closed"]),
            Subscription.next_billing_date <= as_of_date
        ).all()

        for sub in all_subs:
            # Check closed status
            if sub.status == "closed":
                results["skipped"] += 1
                results["items"].append({
                    "subscription_number": sub.number,
                    "status": "skipped",
                    "reason": "Subscription is closed"
                })
                continue

            # Check paused flag
            if sub.is_paused:
                results["skipped"] += 1
                results["items"].append({
                    "subscription_number": sub.number,
                    "status": "skipped",
                    "reason": "Subscription is paused"
                })
                continue

            # Check plan auto-close upon expiry
            if sub.expiry_date and sub.next_billing_date and sub.next_billing_date > sub.expiry_date:
                if sub.plan.auto_close and not dry_run:
                    sub.status = "closed"
                    db.commit()
                results["skipped"] += 1
                results["items"].append({
                    "subscription_number": sub.number,
                    "status": "skipped",
                    "reason": "Subscription has reached expiry date"
                })
                continue

            # Process missed periods and current period sequentially up to as_of_date
            current_billing_start = sub.next_billing_date
            while current_billing_start <= as_of_date:
                # If subscription has expired before this period, stop
                if sub.expiry_date and current_billing_start > sub.expiry_date:
                    break

                period_end, next_start = BillingService.calculate_cycle_dates(
                    current_billing_start,
                    sub.plan.period
                )

                # Check anti-double-billing database constraint / existing record
                existing_invoice = db.query(Invoice).filter(
                    Invoice.subscription_id == sub.id,
                    Invoice.period_start == current_billing_start,
                    Invoice.period_end == period_end
                ).first()

                if existing_invoice:
                    results["skipped"] += 1
                    results["items"].append({
                        "subscription_number": sub.number,
                        "status": "skipped",
                        "reason": f"Invoice already exists for period {current_billing_start} to {period_end}"
                    })
                    current_billing_start = next_start
                    if not dry_run:
                        sub.next_billing_date = next_start
                        db.commit()
                    continue

                # Prepare line items for pricing engine
                pricing_items = []
                for sub_line in sub.lines:
                    pricing_items.append(
                        PricingLineItem(
                            product=sub_line.product,
                            variant=sub_line.variant,
                            quantity=sub_line.quantity,
                            tax=sub_line.tax,
                            unit_price_override=None
                        )
                    )

                pricing_result = PricingService.calculate_pricing(
                    db=db,
                    items=pricing_items,
                    as_of_date=current_billing_start
                )

                inv_num = BillingService.generate_invoice_number(db)
                issue_d = current_billing_start
                due_d = BillingService.calculate_due_date(issue_d, sub.payment_terms)

                if dry_run:
                    results["created"] += 1
                    results["items"].append({
                        "subscription_number": sub.number,
                        "status": "projected",
                        "invoice_number": inv_num,
                        "period_start": str(current_billing_start),
                        "period_end": str(period_end),
                        "total": pricing_result["total"],
                        "dry_run": True
                    })
                else:
                    try:
                        invoice = Invoice(
                            number=inv_num,
                            subscription_id=sub.id,
                            customer_id=sub.customer_id,
                            period_start=current_billing_start,
                            period_end=period_end,
                            issue_date=issue_d,
                            due_date=due_d,
                            status="draft",
                            subtotal=pricing_result["subtotal"],
                            discount_total=pricing_result["discount_total"],
                            tax_total=pricing_result["tax_total"],
                            total=pricing_result["total"],
                            paid_total=0
                        )
                        db.add(invoice)
                        db.flush()

                        # Add invoice lines with complete breakdown snapshots
                        for lb in pricing_result["lines"]:
                            item = lb["item"]
                            desc = item.product.name
                            if item.variant:
                                desc += f" ({item.variant.attribute}: {item.variant.value})"

                            snapshot_data = {
                                "product_id": item.product.id,
                                "product_name": item.product.name,
                                "base_price": lb["base_price"],
                                "variant_id": item.variant.id if item.variant else None,
                                "variant_value": item.variant.value if item.variant else None,
                                "variant_extra": lb["variant_extra"],
                                "unit_price": lb["unit_price"],
                                "quantity": lb["quantity"],
                                "discount": lb["discount"],
                                "tax_rate": str(lb["tax_rate"]),
                                "tax": lb["tax"],
                                "amount": lb["total"]
                            }

                            inv_line = InvoiceLine(
                                invoice_id=invoice.id,
                                description=desc,
                                quantity=lb["quantity"],
                                unit_price=lb["unit_price"],
                                base=lb["line_base_total"],
                                variant_extra=lb["line_variant_total"],
                                discount=lb["discount"],
                                tax=lb["tax"],
                                amount=lb["total"],
                                snapshot=json.dumps(snapshot_data)
                            )
                            db.add(inv_line)

                        # Increment discount usage atomically if discount applied
                        if pricing_result.get("applied_discount"):
                            disc = pricing_result["applied_discount"]
                            db.query(Discount).filter(Discount.id == disc.id).update(
                                {Discount.times_used: Discount.times_used + 1}
                            )

                        # Advance next billing date
                        sub.next_billing_date = next_start
                        db.commit()

                        results["created"] += 1
                        results["items"].append({
                            "subscription_number": sub.number,
                            "status": "created",
                            "invoice_number": inv_num,
                            "period_start": str(current_billing_start),
                            "period_end": str(period_end),
                            "total": pricing_result["total"]
                        })
                    except IntegrityError:
                        db.rollback()
                        results["skipped"] += 1
                        results["items"].append({
                            "subscription_number": sub.number,
                            "status": "skipped",
                            "reason": "Duplicate billing period prevented by database constraint."
                        })
                    except Exception as e:
                        db.rollback()
                        results["failed"] += 1
                        results["items"].append({
                            "subscription_number": sub.number,
                            "status": "failed",
                            "reason": str(e)
                        })

                current_billing_start = next_start

        return results
