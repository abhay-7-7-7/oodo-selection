from app.api.novelties.discount_guardrail import router as discount_guardrail_router
from app.api.novelties.integrity_auditor import router as integrity_auditor_router
from app.api.novelties.bank_matcher import router as bank_matcher_router
from app.api.novelties.bill_explainer import router as bill_explainer_router
from app.api.novelties.renewal_radar import router as renewal_radar_router
from app.api.novelties.reminder_centre import router as reminder_centre_router

__all__ = [
    "discount_guardrail_router",
    "integrity_auditor_router",
    "bank_matcher_router",
    "bill_explainer_router",
    "renewal_radar_router",
    "reminder_centre_router",
]
