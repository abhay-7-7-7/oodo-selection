from datetime import datetime, date, timedelta, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.subscription import Subscription, SubscriptionLine
from app.models.audit import SubscriptionAudit
from app.models.user import User
from app.models.plan import Plan
from app.models.product import Product, Variant
from app.models.tax import Tax
from app.models.quotation import QuotationTemplate
from app.schemas.subscription import SubscriptionCreate, SubscriptionUpdate, SubscriptionLineCreate
from app.services.notification_service import NotificationService


def utcnow():
    return datetime.now(timezone.utc)


class SubscriptionService:
    @staticmethod
    def generate_subscription_number(db: Session) -> str:
        count = db.query(Subscription).count() + 1
        sub_num = f"SUB-{count:05d}"
        while db.query(Subscription).filter(Subscription.number == sub_num).first():
            count += 1
            sub_num = f"SUB-{count:05d}"
        return sub_num

    @staticmethod
    def create_subscription(
        db: Session,
        data: SubscriptionCreate,
        current_user_id: Optional[int] = None
    ) -> Subscription:
        customer = db.query(User).filter(User.id == data.customer_id).first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found."
            )
        if customer.role != "customer":
            raise HTTPException(
                status_code=422,
                detail="Selected user is not a customer."
            )

        plan = db.query(Plan).filter(Plan.id == data.plan_id).first()
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plan not found."
            )
        if plan.valid_from > data.start_date:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Plan '{plan.name}' is not yet available on the start date ({data.start_date}). Valid from: {plan.valid_from}."
            )
        if plan.valid_to and data.start_date > plan.valid_to:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Plan '{plan.name}' has expired before the start date ({data.start_date}). Valid until: {plan.valid_to}."
            )

        lines_to_add = []
        # Templates generate customer quotations with predefined validity; manual lines begin as drafts
        initial_status = "draft"
        expiry_date = None

        if data.template_id:
            template = db.query(QuotationTemplate).filter(QuotationTemplate.id == data.template_id).first()
            if not template:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Quotation template not found."
                )
            initial_status = "quotation"
            expiry_date = data.start_date + timedelta(days=template.validity_days)
            for t_line in template.lines:
                lines_to_add.append({
                    "product_id": t_line.product_id,
                    "variant_id": t_line.variant_id,
                    "quantity": t_line.quantity,
                    "unit_price_override": t_line.unit_price_override,
                    "tax_id": None
                })
        else:
            if not data.lines:
                raise HTTPException(
                    status_code=422,
                    detail="Subscription must contain at least one product line or be created from a template."
                )
            for m_line in data.lines:
                lines_to_add.append({
                    "product_id": m_line.product_id,
                    "variant_id": m_line.variant_id,
                    "quantity": m_line.quantity,
                    "unit_price_override": None,
                    "tax_id": m_line.tax_id
                })

        total_quantity = sum(line["quantity"] for line in lines_to_add)
        if total_quantity < plan.min_qty:
            raise HTTPException(
                status_code=422,
                detail=f"Total quantity ({total_quantity}) does not meet the plan's minimum required quantity ({plan.min_qty})."
            )

        sub_number = SubscriptionService.generate_subscription_number(db)
        subscription = Subscription(
            number=sub_number,
            customer_id=customer.id,
            plan_id=plan.id,
            start_date=data.start_date,
            expiry_date=expiry_date,
            payment_terms=data.payment_terms,
            status=initial_status,
            next_billing_date=data.start_date,
            is_paused=False
        )
        db.add(subscription)
        db.flush()

        for l_data in lines_to_add:
            product = db.query(Product).filter(Product.id == l_data["product_id"]).first()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product ID {l_data['product_id']} not found."
                )
            
            variant = None
            if l_data["variant_id"]:
                variant = db.query(Variant).filter(Variant.id == l_data["variant_id"]).first()
                if not variant:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Variant ID {l_data['variant_id']} not found."
                    )
                if variant.product_id != product.id:
                    raise HTTPException(
                        status_code=422,
                        detail="The selected variant does not belong to the selected product."
                    )
            
            if l_data["tax_id"]:
                tax = db.query(Tax).filter(Tax.id == l_data["tax_id"]).first()
                if not tax:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Tax ID {l_data['tax_id']} not found."
                    )
            
            base_price = product.sales_price
            variant_extra = variant.price_extra if variant else 0
            unit_price = l_data["unit_price_override"] if l_data.get("unit_price_override") is not None else (base_price + variant_extra)
            amount = unit_price * l_data["quantity"]

            sub_line = SubscriptionLine(
                subscription_id=subscription.id,
                product_id=product.id,
                variant_id=variant.id if variant else None,
                quantity=l_data["quantity"],
                unit_price=unit_price,
                tax_id=l_data.get("tax_id"),
                amount=amount
            )
            db.add(sub_line)

        audit = SubscriptionAudit(
            subscription_id=subscription.id,
            from_status="none",
            to_status=initial_status,
            user_id=current_user_id,
            at=utcnow()
        )
        db.add(audit)

        if initial_status == "quotation":
            NotificationService.notify_user(
                db=db,
                user_id=subscription.customer_id,
                title="New Quotation Available",
                message=f"A new quotation {subscription.number} has been created for your review.",
                category="quotation",
                priority="normal",
                related_entity_type="subscription",
                related_entity_id=subscription.id,
                action_url="/portal/subscriptions",
                event_key=f"subscription:{subscription.id}:quotation_created"
            )
            NotificationService.notify_roles(
                db=db,
                roles=["admin", "staff"],
                title="New Quotation Created",
                message=f"Quotation {subscription.number} created for customer {customer.name}.",
                category="quotation",
                priority="normal",
                related_entity_type="subscription",
                related_entity_id=subscription.id,
                action_url=f"/subscriptions/{subscription.id}",
                event_key_prefix=f"subscription:{subscription.id}:admin_quote_created"
            )
        else:
            NotificationService.notify_roles(
                db=db,
                roles=["admin", "staff"],
                title="New Subscription Draft",
                message=f"Draft subscription {subscription.number} created for customer {customer.name}.",
                category="subscription",
                priority="low",
                related_entity_type="subscription",
                related_entity_id=subscription.id,
                action_url=f"/subscriptions/{subscription.id}",
                event_key_prefix=f"subscription:{subscription.id}:draft_created"
            )

        db.commit()
        db.refresh(subscription)
        return subscription

    @staticmethod
    def transition_status(
        db: Session,
        subscription_id: int,
        target_status: str,
        current_user_id: Optional[int] = None
    ) -> Subscription:
        subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found."
            )

        current = subscription.status
        target = target_status.lower().strip()

        # Enforce linear lifecycle: draft -> quotation -> confirmed -> active -> closed
        allowed_transitions = {
            "draft": ["quotation"],
            "quotation": ["confirmed"],
            "confirmed": ["active"],
            "active": ["closed"]
        }

        if target not in allowed_transitions.get(current, []):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Illegal status transition from '{current}' to '{target}'."
            )

        subscription.status = target
        if target == "active" and not subscription.next_billing_date:
            subscription.next_billing_date = subscription.start_date or date.today()

        audit = SubscriptionAudit(
            subscription_id=subscription.id,
            from_status=current,
            to_status=target,
            user_id=current_user_id,
            at=utcnow()
        )
        db.add(audit)

        if target == "quotation":
            NotificationService.notify_user(
                db=db,
                user_id=subscription.customer_id,
                title="New Quotation Available",
                message=f"Quotation {subscription.number} is now ready for your review.",
                category="quotation",
                priority="normal",
                related_entity_type="subscription",
                related_entity_id=subscription.id,
                action_url="/portal/subscriptions",
                event_key=f"subscription:{subscription.id}:quotation_transition"
            )
            NotificationService.notify_roles(
                db=db,
                roles=["admin", "staff"],
                title="Quotation Generated",
                message=f"Quotation {subscription.number} generated for {subscription.customer.name}.",
                category="quotation",
                priority="normal",
                related_entity_type="subscription",
                related_entity_id=subscription.id,
                action_url=f"/subscriptions/{subscription.id}",
                event_key_prefix=f"subscription:{subscription.id}:admin_quote_transition"
            )
        elif target == "confirmed":
            NotificationService.notify_user(
                db=db,
                user_id=subscription.customer_id,
                title="Subscription Confirmed",
                message=f"Your subscription {subscription.number} has been confirmed.",
                category="subscription",
                priority="normal",
                related_entity_type="subscription",
                related_entity_id=subscription.id,
                action_url="/portal/subscriptions",
                event_key=f"subscription:{subscription.id}:confirmed"
            )
            NotificationService.notify_roles(
                db=db,
                roles=["admin", "staff"],
                title="Subscription Confirmed",
                message=f"Subscription {subscription.number} for customer {subscription.customer.name} has been confirmed.",
                category="subscription",
                priority="normal",
                related_entity_type="subscription",
                related_entity_id=subscription.id,
                action_url=f"/subscriptions/{subscription.id}",
                event_key_prefix=f"subscription:{subscription.id}:admin_confirmed"
            )
        elif target == "active":
            NotificationService.notify_user(
                db=db,
                user_id=subscription.customer_id,
                title="Subscription Activated",
                message=f"Your subscription {subscription.number} is now active.",
                category="subscription",
                priority="normal",
                related_entity_type="subscription",
                related_entity_id=subscription.id,
                action_url="/portal/subscriptions",
                event_key=f"subscription:{subscription.id}:activated"
            )
            NotificationService.notify_roles(
                db=db,
                roles=["admin", "staff"],
                title="Subscription Activated",
                message=f"Subscription {subscription.number} for customer {subscription.customer.name} has been activated.",
                category="subscription",
                priority="normal",
                related_entity_type="subscription",
                related_entity_id=subscription.id,
                action_url=f"/subscriptions/{subscription.id}",
                event_key_prefix=f"subscription:{subscription.id}:admin_activated"
            )
        elif target == "closed":
            NotificationService.notify_user(
                db=db,
                user_id=subscription.customer_id,
                title="Subscription Closed",
                message=f"Your subscription {subscription.number} has been closed.",
                category="subscription",
                priority="normal",
                related_entity_type="subscription",
                related_entity_id=subscription.id,
                action_url="/portal/subscriptions",
                event_key=f"subscription:{subscription.id}:closed"
            )
            NotificationService.notify_roles(
                db=db,
                roles=["admin", "staff"],
                title="Subscription Closed",
                message=f"Subscription {subscription.number} for customer {subscription.customer.name} has been closed.",
                category="subscription",
                priority="normal",
                related_entity_type="subscription",
                related_entity_id=subscription.id,
                action_url=f"/subscriptions/{subscription.id}",
                event_key_prefix=f"subscription:{subscription.id}:admin_closed"
            )

        db.commit()
        db.refresh(subscription)
        return subscription

    @staticmethod
    def pause_subscription(
        db: Session,
        subscription_id: int,
        current_user_id: Optional[int] = None
    ) -> Subscription:
        subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found."
            )

        if not subscription.plan.pausable:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The subscription cannot be paused because the plan does not permit pausing."
            )

        if subscription.is_paused:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Subscription is already paused."
            )

        if subscription.status != "active":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Only active subscriptions can be paused. Current status: '{subscription.status}'."
            )

        subscription.is_paused = True
        subscription.paused_at = utcnow()

        NotificationService.notify_user(
            db=db,
            user_id=subscription.customer_id,
            title="Subscription Paused",
            message=f"Your subscription {subscription.number} has been paused.",
            category="subscription",
            priority="normal",
            related_entity_type="subscription",
            related_entity_id=subscription.id,
            action_url="/portal/subscriptions",
            event_key=f"subscription:{subscription.id}:paused:{int(subscription.paused_at.timestamp())}"
        )
        NotificationService.notify_roles(
            db=db,
            roles=["admin", "staff"],
            title="Subscription Paused",
            message=f"Subscription {subscription.number} for customer {subscription.customer.name} has been paused.",
            category="subscription",
            priority="normal",
            related_entity_type="subscription",
            related_entity_id=subscription.id,
            action_url=f"/subscriptions/{subscription.id}",
            event_key_prefix=f"subscription:{subscription.id}:admin_paused:{int(subscription.paused_at.timestamp())}"
        )

        db.commit()
        db.refresh(subscription)
        return subscription

    @staticmethod
    def close_subscription(
        db: Session,
        subscription_id: int,
        reason: Optional[str] = None,
        current_user_id: Optional[int] = None
    ) -> Subscription:
        subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found."
            )

        if not subscription.plan.closable:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The subscription cannot be closed because the plan does not permit early closure."
            )

        if subscription.status == "closed":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Subscription is already closed."
            )

        # Transition directly to closed
        current = subscription.status
        subscription.status = "closed"
        audit = SubscriptionAudit(
            subscription_id=subscription.id,
            from_status=current,
            to_status="closed",
            user_id=current_user_id,
            at=utcnow()
        )
        db.add(audit)

        NotificationService.notify_user(
            db=db,
            user_id=subscription.customer_id,
            title="Subscription Closed",
            message=f"Your subscription {subscription.number} has been closed.",
            category="subscription",
            priority="normal",
            related_entity_type="subscription",
            related_entity_id=subscription.id,
            action_url="/portal/subscriptions",
            event_key=f"subscription:{subscription.id}:closed"
        )
        NotificationService.notify_roles(
            db=db,
            roles=["admin", "staff"],
            title="Subscription Closed",
            message=f"Subscription {subscription.number} for customer {subscription.customer.name} has been closed.",
            category="subscription",
            priority="normal",
            related_entity_type="subscription",
            related_entity_id=subscription.id,
            action_url=f"/subscriptions/{subscription.id}",
            event_key_prefix=f"subscription:{subscription.id}:admin_closed"
        )

        db.commit()
        db.refresh(subscription)
        return subscription

    @staticmethod
    def renew_subscription(
        db: Session,
        subscription_id: int,
        current_user_id: Optional[int] = None
    ) -> Subscription:
        old_sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
        if not old_sub:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found."
            )

        if not old_sub.plan.renewable:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The plan does not permit renewals."
            )

        # Calculate new dates
        today = date.today()
        new_start = old_sub.expiry_date if (old_sub.expiry_date and old_sub.expiry_date >= today) else today
        
        # New expiry based on plan period or duration
        new_expiry = None
        if old_sub.plan.period == "yearly":
            new_expiry = new_start + timedelta(days=365)
        elif old_sub.plan.period == "monthly":
            new_expiry = new_start + timedelta(days=30)
        elif old_sub.plan.period == "weekly":
            new_expiry = new_start + timedelta(days=7)
        elif old_sub.plan.period == "daily":
            new_expiry = new_start + timedelta(days=1)

        new_number = SubscriptionService.generate_subscription_number(db)
        new_sub = Subscription(
            number=new_number,
            customer_id=old_sub.customer_id,
            plan_id=old_sub.plan_id,
            start_date=new_start,
            expiry_date=new_expiry,
            payment_terms=old_sub.payment_terms,
            status="quotation",
            next_billing_date=new_start,
            is_paused=False
        )
        db.add(new_sub)
        db.flush()

        for old_line in old_sub.lines:
            new_line = SubscriptionLine(
                subscription_id=new_sub.id,
                product_id=old_line.product_id,
                variant_id=old_line.variant_id,
                quantity=old_line.quantity,
                unit_price=old_line.unit_price,
                tax_id=old_line.tax_id,
                amount=old_line.amount
            )
            db.add(new_line)

        audit = SubscriptionAudit(
            subscription_id=new_sub.id,
            from_status="none",
            to_status="quotation",
            user_id=current_user_id,
            at=utcnow()
        )
        db.add(audit)

        NotificationService.notify_user(
            db=db,
            user_id=new_sub.customer_id,
            title="Subscription Renewal Created",
            message=f"A renewal quotation {new_sub.number} for your subscription has been created.",
            category="subscription",
            priority="normal",
            related_entity_type="subscription",
            related_entity_id=new_sub.id,
            action_url="/portal/subscriptions",
            event_key=f"subscription:{new_sub.id}:renewed"
        )
        NotificationService.notify_roles(
            db=db,
            roles=["admin", "staff"],
            title="Subscription Renewal Created",
            message=f"Renewal quotation {new_sub.number} created for customer {old_sub.customer.name}.",
            category="subscription",
            priority="normal",
            related_entity_type="subscription",
            related_entity_id=new_sub.id,
            action_url=f"/subscriptions/{new_sub.id}",
            event_key_prefix=f"subscription:{new_sub.id}:admin_renewed"
        )

        db.commit()
        db.refresh(new_sub)
        return new_sub

    @staticmethod
    def update_subscription(
        db: Session,
        subscription_id: int,
        data: SubscriptionUpdate
    ) -> Subscription:
        subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found."
            )

        if subscription.status not in ("draft", "quotation"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot edit subscription in '{subscription.status}' status. Only Draft or Quotation can be edited."
            )

        if data.payment_terms:
            subscription.payment_terms = data.payment_terms

        if data.lines is not None:
            total_qty = sum(l.quantity for l in data.lines)
            if total_qty < subscription.plan.min_qty:
                raise HTTPException(
                    status_code=422,
                    detail=f"Total quantity ({total_qty}) does not meet the plan minimum ({subscription.plan.min_qty})."
                )

            # Clear old lines
            db.query(SubscriptionLine).filter(SubscriptionLine.subscription_id == subscription.id).delete()
            db.flush()

            for line_in in data.lines:
                product = db.query(Product).filter(Product.id == line_in.product_id).first()
                if not product:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Product {line_in.product_id} not found."
                    )
                variant = None
                if line_in.variant_id:
                    variant = db.query(Variant).filter(Variant.id == line_in.variant_id).first()
                    if not variant or variant.product_id != product.id:
                        raise HTTPException(
                            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="The selected variant does not belong to the selected product."
                        )
                
                base_price = product.sales_price
                variant_extra = variant.price_extra if variant else 0
                unit_price = base_price + variant_extra
                amount = unit_price * line_in.quantity

                sub_line = SubscriptionLine(
                    subscription_id=subscription.id,
                    product_id=product.id,
                    variant_id=variant.id if variant else None,
                    quantity=line_in.quantity,
                    unit_price=unit_price,
                    tax_id=line_in.tax_id,
                    amount=amount
                )
                db.add(sub_line)

        db.commit()
        db.refresh(subscription)
        return subscription
