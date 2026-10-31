"""N3 — Bank Matcher service with subset-sum algorithm."""
import io
import csv
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text

from app.models.bank_matcher import BankTransaction, ReconciliationRecord


MAIN_DB_URL = "sqlite:///./brightloop.db"


def _get_open_invoices() -> List[Dict[str, Any]]:
    """Fetch unpaid/partial invoices from main DB."""
    try:
        eng = create_engine(MAIN_DB_URL, connect_args={"check_same_thread": False, "timeout": 5})
        with eng.connect() as conn:
            result = conn.execute(text("""
                SELECT i.id, i.invoice_number, i.total_amount_paise,
                       i.amount_paid_paise,
                       (i.total_amount_paise - i.amount_paid_paise) as outstanding_paise,
                       COALESCE(u.name, u.email, 'Unknown') as customer_name
                FROM invoices i
                LEFT JOIN subscriptions s ON s.id = i.subscription_id
                LEFT JOIN users u ON u.id = s.customer_id
                WHERE i.total_amount_paise > i.amount_paid_paise
                  AND i.status IN ('pending', 'partial', 'overdue')
                LIMIT 200
            """))
            rows = [dict(zip(result.keys(), r)) for r in result.fetchall()]
        eng.dispose()
        return rows
    except Exception:
        # Demo data when main DB not available
        return [
            {"id": "inv-001", "invoice_number": "BL-2026-0101", "total_amount_paise": 23600,
             "amount_paid_paise": 0, "outstanding_paise": 23600, "customer_name": "TechCorp India"},
            {"id": "inv-002", "invoice_number": "BL-2026-0102", "total_amount_paise": 18000,
             "amount_paid_paise": 0, "outstanding_paise": 18000, "customer_name": "Ravi Patel"},
            {"id": "inv-003", "invoice_number": "BL-2026-0103", "total_amount_paise": 27000,
             "amount_paid_paise": 0, "outstanding_paise": 27000, "customer_name": "Ravi Patel"},
        ]


def _exact_match(amount: int, invoices: List[Dict]) -> Optional[Dict]:
    for inv in invoices:
        if inv["outstanding_paise"] == amount:
            return inv
    return None


def _subset_sum_match(amount: int, invoices: List[Dict], max_invoices: int = 4) -> Optional[List[Dict]]:
    """Find a subset of invoices that sum to exactly amount."""
    n = len(invoices)
    # Limit search space
    invs = [i for i in invoices if i["outstanding_paise"] <= amount][:15]

    def backtrack(start: int, remaining: int, path: List[Dict]) -> Optional[List[Dict]]:
        if remaining == 0 and path:
            return path[:]
        if remaining < 0 or len(path) >= max_invoices or start >= len(invs):
            return None
        for i in range(start, len(invs)):
            inv = invs[i]
            path.append(inv)
            result = backtrack(i + 1, remaining - inv["outstanding_paise"], path)
            if result:
                return result
            path.pop()
        return None

    return backtrack(0, amount, [])


def _score_suggestion(tx_amount: int, inv: Dict) -> float:
    """Confidence 0.0–1.0."""
    if inv["outstanding_paise"] == tx_amount:
        return 1.0
    ratio = min(inv["outstanding_paise"], tx_amount) / max(inv["outstanding_paise"], tx_amount)
    return round(ratio * 0.85, 3)


def parse_and_upload(
    db: Session,
    csv_content: str,
    uploaded_by_user_id: Optional[int] = None,
) -> dict:
    """Parse CSV, store transactions, compute match proposals."""
    reader = csv.DictReader(io.StringIO(csv_content))
    transactions: List[BankTransaction] = []

    for row in reader:
        # Normalise column names (case-insensitive)
        normalised = {k.strip().lower(): v.strip() for k, v in row.items()}
        date = normalised.get("date") or normalised.get("transaction date") or ""
        description = normalised.get("description") or normalised.get("narration") or ""
        ref = normalised.get("reference") or normalised.get("ref") or None
        payer = normalised.get("payer") or normalised.get("sender") or None
        amount_str = normalised.get("amount") or normalised.get("credit") or "0"
        try:
            amount_paise = int(float(amount_str.replace(",", "")) * 100)
        except ValueError:
            continue

        if amount_paise <= 0:
            continue

        tx = BankTransaction(
            id=str(uuid.uuid4()),
            date=date,
            description=description,
            amount_paise=amount_paise,
            reference=ref,
            payer=payer,
            status="pending",
            uploaded_by_user_id=uploaded_by_user_id,
        )
        db.add(tx)
        transactions.append(tx)

    db.commit()

    invoices = _get_open_invoices()
    proposals = []

    for tx in transactions:
        db.refresh(tx)
        exact = _exact_match(tx.amount_paise, invoices)
        if exact:
            proposals.append({
                "transaction_id": tx.id,
                "transaction_amount_paise": tx.amount_paise,
                "transaction_description": tx.description,
                "match_type": "exact",
                "suggestions": [{
                    "invoice_id": exact["id"],
                    "invoice_number": exact["invoice_number"],
                    "customer_name": exact["customer_name"],
                    "invoice_amount_paise": exact["total_amount_paise"],
                    "outstanding_paise": exact["outstanding_paise"],
                    "confidence": 1.0,
                    "match_reason": "Exact amount match",
                }],
                "multi_invoice_subsets": [],
            })
        else:
            subset = _subset_sum_match(tx.amount_paise, invoices)
            if subset:
                proposals.append({
                    "transaction_id": tx.id,
                    "transaction_amount_paise": tx.amount_paise,
                    "transaction_description": tx.description,
                    "match_type": "subset_sum",
                    "suggestions": [
                        {
                            "invoice_id": inv["id"],
                            "invoice_number": inv["invoice_number"],
                            "customer_name": inv["customer_name"],
                            "invoice_amount_paise": inv["total_amount_paise"],
                            "outstanding_paise": inv["outstanding_paise"],
                            "confidence": 0.95,
                            "match_reason": "Subset-sum match (N3)",
                        }
                        for inv in subset
                    ],
                    "multi_invoice_subsets": [[
                        {
                            "invoice_id": inv["id"],
                            "invoice_number": inv["invoice_number"],
                            "customer_name": inv["customer_name"],
                            "invoice_amount_paise": inv["total_amount_paise"],
                            "outstanding_paise": inv["outstanding_paise"],
                            "confidence": 0.95,
                            "match_reason": "Subset-sum match",
                        }
                        for inv in subset
                    ]],
                })
            else:
                proposals.append({
                    "transaction_id": tx.id,
                    "transaction_amount_paise": tx.amount_paise,
                    "transaction_description": tx.description,
                    "match_type": "unmatched",
                    "suggestions": [],
                    "multi_invoice_subsets": [],
                })

    return {
        "uploaded": len(transactions),
        "transactions": [tx for tx in transactions],
        "proposals": proposals,
    }


def approve_matches(db: Session, matches: List[dict], user_id: Optional[int] = None) -> List[ReconciliationRecord]:
    records = []
    for m in matches:
        rec = ReconciliationRecord(
            id=str(uuid.uuid4()),
            transaction_id=m["transaction_id"],
            invoice_ids=m.get("invoice_ids", []),
            amount_paise=m.get("amount_paise", 0),
            confidence=m.get("confidence", 1.0),
            match_type=m.get("match_type", "manual"),
            reconciled_by_user_id=user_id,
        )
        db.add(rec)
        # Update transaction status
        tx = db.query(BankTransaction).filter(BankTransaction.id == m["transaction_id"]).first()
        if tx:
            tx.status = "matched"
        records.append(rec)
    db.commit()
    return records


def list_transactions(db: Session, status: Optional[str] = None) -> dict:
    q = db.query(BankTransaction).order_by(BankTransaction.uploaded_at.desc())
    if status:
        q = q.filter(BankTransaction.status == status)
    total = q.count()
    items = q.limit(100).all()
    return {"items": items, "total": total}


def list_reconciliation_history(db: Session) -> dict:
    q = db.query(ReconciliationRecord).order_by(ReconciliationRecord.reconciled_at.desc())
    total = q.count()
    items = q.limit(100).all()
    return {"items": items, "total": total}
