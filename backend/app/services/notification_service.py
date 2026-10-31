from datetime import date, datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.notification import Notification, NotificationPreference
from app.models.user import User
from app.models.subscription import Subscription
from app.models.invoice import Invoice


def utcnow():
    return datetime.now(timezone.utc)


ALL_CATEGORIES = ["invoice", "payment", "subscription", "quotation", "account", "system"]
ESSENTIAL_CATEGORIES = ["account", "system"]


class NotificationService:
    @staticmethod
    def is_category_enabled(db: Session, user_id: int, category: str) -> bool:
        """
        Account security and system integrity notifications must remain enabled.
        Other categories respect user preferences.
        """
        if category in ESSENTIAL_CATEGORIES:
            return True

        pref = db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id,
            NotificationPreference.category == category
        ).first()

        if pref is not None:
            return pref.enabled
        return True  # Default enabled

    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        category: str,
        priority: str = "normal",
        related_entity_type: Optional[str] = None,
        related_entity_id: Optional[int] = None,
        action_url: Optional[str] = None,
        event_key: Optional[str] = None
    ) -> Optional[Notification]:
        """
        Creates an in-app notification for a user, respecting preferences and ensuring deduplication.
        """
        if not NotificationService.is_category_enabled(db, user_id, category):
            return None

        if not event_key:
            event_key = f"{category}:{related_entity_type or 'gen'}:{related_entity_id or '0'}:{utcnow().isoformat()}"

        existing = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.event_key == event_key
        ).first()
        if existing:
            return existing

        notification = Notification(
            user_id=user_id,
            title=title.strip(),
            message=message.strip(),
            category=category.strip().lower(),
            priority=priority.strip().lower(),
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            action_url=action_url,
            event_key=event_key,
            is_read=False,
            created_at=utcnow()
        )
        try:
            db.add(notification)
            db.flush()
            return notification
        except IntegrityError:
            # Handle concurrent race conditions gracefully by catching unique constraint violation
            db.rollback()
            return db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.event_key == event_key
            ).first()

    @staticmethod
    def notify_user(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        category: str,
        priority: str = "normal",
        related_entity_type: Optional[str] = None,
        related_entity_id: Optional[int] = None,
        action_url: Optional[str] = None,
        event_key: Optional[str] = None
    ) -> Optional[Notification]:
        return NotificationService.create_notification(
            db=db,
            user_id=user_id,
            title=title,
            message=message,
            category=category,
            priority=priority,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            action_url=action_url,
            event_key=event_key
        )

    @staticmethod
    def notify_roles(
        db: Session,
        roles: List[str],
        title: str,
        message: str,
        category: str,
        priority: str = "normal",
        related_entity_type: Optional[str] = None,
        related_entity_id: Optional[int] = None,
        action_url: Optional[str] = None,
        event_key_prefix: Optional[str] = None
    ) -> List[Notification]:
        """
        Notifies all active users matching the specified roles.
        """
        users = db.query(User).filter(
            User.role.in_(roles),
            User.is_active.is_(True)
        ).all()

        notifications = []
        for u in users:
            ek = f"{event_key_prefix}:{u.id}" if event_key_prefix else None
            notif = NotificationService.create_notification(
                db=db,
                user_id=u.id,
                title=title,
                message=message,
                category=category,
                priority=priority,
                related_entity_type=related_entity_type,
                related_entity_id=related_entity_id,
                action_url=action_url,
                event_key=ek
            )
            if notif:
                notifications.append(notif)
        return notifications

    @staticmethod
    def notify_assigned_staff_or_team(
        db: Session,
        assigned_user_id: Optional[int],
        title: str,
        message: str,
        category: str,
        priority: str = "normal",
        related_entity_type: Optional[str] = None,
        related_entity_id: Optional[int] = None,
        action_url: Optional[str] = None,
        event_key_prefix: Optional[str] = None
    ) -> List[Notification]:
        """
        Notifies assigned staff member if present, otherwise notifies active staff team.
        """
        if assigned_user_id:
            assigned_staff = db.query(User).filter(
                User.id == assigned_user_id,
                User.role.in_(["staff", "admin"]),
                User.is_active.is_(True)
            ).first()
            if assigned_staff:
                ek = f"{event_key_prefix}:{assigned_staff.id}" if event_key_prefix else None
                notif = NotificationService.create_notification(
                    db=db,
                    user_id=assigned_staff.id,
                    title=title,
                    message=message,
                    category=category,
                    priority=priority,
                    related_entity_type=related_entity_type,
                    related_entity_id=related_entity_id,
                    action_url=action_url,
                    event_key=ek
                )
                return [notif] if notif else []

        # If no assigned staff, notify all active staff members
        return NotificationService.notify_roles(
            db=db,
            roles=["staff"],
            title=title,
            message=message,
            category=category,
            priority=priority,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            action_url=action_url,
            event_key_prefix=event_key_prefix
        )

    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: int,
        category: Optional[str] = None,
        is_read: Optional[bool] = None,
        priority: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        query = db.query(Notification).filter(Notification.user_id == user_id)

        if category:
            query = query.filter(Notification.category == category.strip().lower())
        if is_read is not None:
            query = query.filter(Notification.is_read.is_(is_read))
        if priority:
            query = query.filter(Notification.priority == priority.strip().lower())

        total = query.count()
        unread_count = db.query(func.count(Notification.id)).filter(
            Notification.user_id == user_id,
            Notification.is_read.is_(False)
        ).scalar() or 0

        items = query.order_by(desc(Notification.created_at)).offset((page - 1) * page_size).limit(page_size).all()

        return {
            "items": items,
            "page": page,
            "page_size": page_size,
            "total": total,
            "unread_count": unread_count
        }

    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        return db.query(func.count(Notification.id)).filter(
            Notification.user_id == user_id,
            Notification.is_read.is_(False)
        ).scalar() or 0

    @staticmethod
    def mark_as_read(db: Session, user_id: int, notification_id: int) -> Notification:
        notif = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notif:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found."
            )
        if notif.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you do not own this notification."
            )

        notif.is_read = True
        notif.read_at = utcnow()
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        count = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read.is_(False)
        ).update({"is_read": True, "read_at": utcnow()})
        db.commit()
        return count

    @staticmethod
    def delete_notification(db: Session, user_id: int, notification_id: int) -> None:
        notif = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notif:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found."
            )
        if notif.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you do not own this notification."
            )

        db.delete(notif)
        db.commit()

    @staticmethod
    def get_user_preferences(db: Session, user_id: int) -> List[Dict[str, Any]]:
        existing_prefs = db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id
        ).all()
        pref_map = {p.category: p.enabled for p in existing_prefs}

        result = []
        for cat in ALL_CATEGORIES:
            result.append({
                "category": cat,
                "enabled": pref_map.get(cat, True)
            })
        return result

    @staticmethod
    def update_user_preferences(
        db: Session,
        user_id: int,
        preferences_list: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        for item in preferences_list:
            cat = item.get("category", "").strip().lower()
            if cat not in ALL_CATEGORIES:
                continue
            # Security and account notifications must remain enabled
            if cat in ESSENTIAL_CATEGORIES:
                enabled_val = True
            else:
                enabled_val = bool(item.get("enabled", True))

            pref = db.query(NotificationPreference).filter(
                NotificationPreference.user_id == user_id,
                NotificationPreference.category == cat
            ).first()

            if pref:
                pref.enabled = enabled_val
                pref.updated_at = utcnow()
            else:
                pref = NotificationPreference(
                    user_id=user_id,
                    category=cat,
                    enabled=enabled_val
                )
                db.add(pref)

        db.commit()
        return NotificationService.get_user_preferences(db, user_id)

    @staticmethod
    def run_scheduled_checks(
        db: Session,
        as_of_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Executes daily date-based checks for invoices, subscriptions, and quotations.
        Idempotent and concurrency-safe via database event_key unique constraints.
        """
        today = as_of_date or date.today()
        created_count = 0
        details = []

        # 1. Invoice reminders: 3 days before due date, and 1, 7, 15 days overdue
        active_invoices = db.query(Invoice).filter(
            Invoice.status.in_(["draft", "confirmed"]),
            (Invoice.total - Invoice.paid_total) > 0
        ).all()

        for inv in active_invoices:
            outstanding = inv.total - inv.paid_total
            days_until_due = (inv.due_date - today).days

            if days_until_due == 3:
                notif = NotificationService.notify_user(
                    db=db,
                    user_id=inv.customer_id,
                    title="Invoice Due Soon",
                    message=f"Invoice {inv.number} for ₹{inv.total/100:.2f} is due in 3 days on {inv.due_date}.",
                    category="invoice",
                    priority="normal",
                    related_entity_type="invoice",
                    related_entity_id=inv.id,
                    action_url="/portal/invoices",
                    event_key=f"invoice:{inv.id}:due_soon:3d"
                )
                if notif:
                    created_count += 1
                    details.append(f"Due soon (3d) notification sent to customer {inv.customer_id} for invoice {inv.number}")

            days_overdue = (today - inv.due_date).days
            if days_overdue in (1, 7, 15):
                priority_map = {1: "high", 7: "high", 15: "critical"}
                prio = priority_map[days_overdue]

                cust_msg = f"Invoice {inv.number} was due on {inv.due_date} and is now {days_overdue} day(s) overdue (₹{outstanding/100:.2f} outstanding)."
                c_notif = NotificationService.notify_user(
                    db=db,
                    user_id=inv.customer_id,
                    title=f"Invoice Overdue ({days_overdue}d)",
                    message=cust_msg,
                    category="invoice",
                    priority=prio,
                    related_entity_type="invoice",
                    related_entity_id=inv.id,
                    action_url="/portal/invoices",
                    event_key=f"invoice:{inv.id}:overdue:{days_overdue}d"
                )
                if c_notif:
                    created_count += 1
                    details.append(f"Overdue ({days_overdue}d) notification sent to customer {inv.customer_id} for invoice {inv.number}")

                admin_msg = f"Invoice {inv.number} for customer {inv.customer.name} is {days_overdue} day(s) overdue (₹{outstanding/100:.2f} outstanding)."
                admin_notifs = NotificationService.notify_roles(
                    db=db,
                    roles=["admin", "staff"],
                    title=f"Invoice Overdue Alert ({days_overdue}d)",
                    message=admin_msg,
                    category="invoice",
                    priority=prio,
                    related_entity_type="invoice",
                    related_entity_id=inv.id,
                    action_url=f"/invoices/{inv.id}",
                    event_key_prefix=f"invoice:{inv.id}:admin_overdue:{days_overdue}d"
                )
                created_count += len(admin_notifs)

        # 2. Subscription expiry reminders: 30, 7, and 1 days before expiration
        active_subs = db.query(Subscription).filter(
            Subscription.status == "active",
            Subscription.is_paused.is_(False),
            Subscription.expiry_date.is_not(None)
        ).all()

        for sub in active_subs:
            days_until_exp = (sub.expiry_date - today).days
            if days_until_exp in (30, 7, 1):
                priority_map = {30: "normal", 7: "high", 1: "critical"}
                prio = priority_map[days_until_exp]

                c_msg = f"Your subscription {sub.number} ({sub.plan.name}) will expire in {days_until_exp} day(s) on {sub.expiry_date}."
                c_notif = NotificationService.notify_user(
                    db=db,
                    user_id=sub.customer_id,
                    title=f"Subscription Expiring ({days_until_exp}d)",
                    message=c_msg,
                    category="subscription",
                    priority=prio,
                    related_entity_type="subscription",
                    related_entity_id=sub.id,
                    action_url="/portal/subscriptions",
                    event_key=f"subscription:{sub.id}:expiring:{days_until_exp}d"
                )
                if c_notif:
                    created_count += 1
                    details.append(f"Subscription expiring ({days_until_exp}d) sent to customer {sub.customer_id} for {sub.number}")

                adm_msg = f"Subscription {sub.number} for customer {sub.customer.name} will expire in {days_until_exp} day(s) on {sub.expiry_date}."
                adm_notifs = NotificationService.notify_roles(
                    db=db,
                    roles=["admin", "staff"],
                    title=f"Subscription Approaching Expiry ({days_until_exp}d)",
                    message=adm_msg,
                    category="subscription",
                    priority=prio,
                    related_entity_type="subscription",
                    related_entity_id=sub.id,
                    action_url=f"/subscriptions/{sub.id}",
                    event_key_prefix=f"subscription:{sub.id}:admin_expiring:{days_until_exp}d"
                )
                created_count += len(adm_notifs)

        # 3. Quotation expiry checks: 3 and 1 days before expiry, and past expiry
        quotations = db.query(Subscription).filter(
            Subscription.status == "quotation",
            Subscription.expiry_date.is_not(None)
        ).all()

        for quote in quotations:
            days_until_quote_exp = (quote.expiry_date - today).days
            if days_until_quote_exp in (3, 1):
                c_msg = f"Your quotation {quote.number} will expire in {days_until_quote_exp} day(s) on {quote.expiry_date}."
                c_notif = NotificationService.notify_user(
                    db=db,
                    user_id=quote.customer_id,
                    title=f"Quotation Expiring ({days_until_quote_exp}d)",
                    message=c_msg,
                    category="quotation",
                    priority="normal",
                    related_entity_type="subscription",
                    related_entity_id=quote.id,
                    action_url="/portal/subscriptions",
                    event_key=f"quotation:{quote.id}:expiring:{days_until_quote_exp}d"
                )
                if c_notif:
                    created_count += 1

                adm_msg = f"Quotation {quote.number} for customer {quote.customer.name} expires in {days_until_quote_exp} day(s)."
                adm_notifs = NotificationService.notify_roles(
                    db=db,
                    roles=["admin", "staff"],
                    title="Quotation Approaching Expiry",
                    message=adm_msg,
                    category="quotation",
                    priority="normal",
                    related_entity_type="subscription",
                    related_entity_id=quote.id,
                    action_url=f"/subscriptions/{quote.id}",
                    event_key_prefix=f"quotation:{quote.id}:admin_expiring:{days_until_quote_exp}d"
                )
                created_count += len(adm_notifs)

            elif days_until_quote_exp < 0:
                c_msg = f"Your quotation {quote.number} expired on {quote.expiry_date}."
                c_notif = NotificationService.notify_user(
                    db=db,
                    user_id=quote.customer_id,
                    title="Quotation Expired",
                    message=c_msg,
                    category="quotation",
                    priority="normal",
                    related_entity_type="subscription",
                    related_entity_id=quote.id,
                    action_url="/portal/subscriptions",
                    event_key=f"quotation:{quote.id}:expired"
                )
                if c_notif:
                    created_count += 1

                adm_msg = f"Quotation {quote.number} for customer {quote.customer.name} has expired on {quote.expiry_date}."
                adm_notifs = NotificationService.notify_roles(
                    db=db,
                    roles=["admin", "staff"],
                    title="Quotation Expired",
                    message=adm_msg,
                    category="quotation",
                    priority="normal",
                    related_entity_type="subscription",
                    related_entity_id=quote.id,
                    action_url=f"/subscriptions/{quote.id}",
                    event_key_prefix=f"quotation:{quote.id}:admin_expired"
                )
                created_count += len(adm_notifs)

        db.commit()
        return {
            "notifications_created": created_count,
            "as_of_date": today,
            "details": details
        }
