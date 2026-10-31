from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.config import settings
from app.database import Base, engine
# Register models for metadata creation
import app.models

from app.api.auth import auth_router, staff_router, outbox_router
from app.api.products import router as products_router
from app.api.plans import router as plans_router
from app.api.taxes import router as taxes_router
from app.api.discounts import router as discounts_router
from app.api.quotations import router as quotations_router
from app.api.subscriptions import router as subscriptions_router
from app.api.billing import router as billing_router
from app.api.invoices import router as invoices_router
from app.api.payments import payments_router, invoice_payments_router
from app.api.reports import router as reports_router
from app.api.portal import portal_router, customers_router
from app.api.notifications import router as notifications_router

# Novelty Routers
from app.api.novelties import (
    discount_guardrail_router,
    integrity_auditor_router,
    bank_matcher_router,
    bill_explainer_router,
    renewal_radar_router,
    reminder_centre_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Complete subscription management and recurring billing backend for Brightloop Software.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_messages = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error.get("loc", []))
        msg = error.get("msg", "Invalid value")
        error_messages.append(f"{field}: {msg}")
    
    first_msg = error_messages[0] if error_messages else "Request validation failed."
    # Strip Pydantic's internal "Value error, " prefix so the client gets a clean human message
    if "Value error, " in first_msg:
        first_msg = first_msg.split("Value error, ")[-1]
        
    return JSONResponse(
        status_code=422,
        content={"detail": first_msg}
    )


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME, "version": settings.VERSION}


api_prefix = settings.API_V1_STR

# Core API routes
app.include_router(auth_router, prefix=api_prefix)
app.include_router(staff_router, prefix=api_prefix)
app.include_router(outbox_router, prefix=api_prefix)
app.include_router(products_router, prefix=api_prefix)
app.include_router(plans_router, prefix=api_prefix)
app.include_router(taxes_router, prefix=api_prefix)
app.include_router(discounts_router, prefix=api_prefix)
app.include_router(quotations_router, prefix=api_prefix)
app.include_router(subscriptions_router, prefix=api_prefix)
app.include_router(billing_router, prefix=api_prefix)
app.include_router(invoices_router, prefix=api_prefix)
app.include_router(invoice_payments_router, prefix=api_prefix)
app.include_router(payments_router, prefix=api_prefix)
app.include_router(reports_router, prefix=api_prefix)
app.include_router(portal_router, prefix=api_prefix)
app.include_router(customers_router, prefix=api_prefix)
app.include_router(notifications_router, prefix=api_prefix)

# Novelty API routes (N1 - N6) under /api/novelties
novelties_prefix = "/api/novelties"
app.include_router(discount_guardrail_router, prefix=f"{novelties_prefix}/discount-guardrail", tags=["N1 Discount Guardrail"])
app.include_router(integrity_auditor_router, prefix=f"{novelties_prefix}/integrity-auditor", tags=["N2 Integrity Auditor"])
app.include_router(bank_matcher_router, prefix=f"{novelties_prefix}/bank-matcher", tags=["N3 Bank Matcher"])
app.include_router(bill_explainer_router, prefix=f"{novelties_prefix}/bill-explainer", tags=["N4 Bill Explainer"])
app.include_router(renewal_radar_router, prefix=f"{novelties_prefix}/renewal-radar", tags=["N5 Renewal Radar"])
app.include_router(reminder_centre_router, prefix=f"{novelties_prefix}/reminder-centre", tags=["N6 Reminder Centre"])

# Direct novelty route aliases
app.include_router(discount_guardrail_router, prefix=f"{api_prefix}/guardrails", tags=["N1 Discount Guardrail (Alias)"])
app.include_router(discount_guardrail_router, prefix=f"{api_prefix}/discount-guardrail", tags=["N1 Discount Guardrail (Direct)"])
app.include_router(integrity_auditor_router, prefix=f"{api_prefix}/auditor", tags=["N2 Integrity Auditor (Alias)"])
app.include_router(integrity_auditor_router, prefix=f"{api_prefix}/integrity-auditor", tags=["N2 Integrity Auditor (Direct)"])
app.include_router(bank_matcher_router, prefix=f"{api_prefix}/bank-matcher", tags=["N3 Bank Matcher (Direct)"])
app.include_router(bill_explainer_router, prefix=f"{api_prefix}/bill-explainer", tags=["N4 Bill Explainer (Direct)"])
app.include_router(renewal_radar_router, prefix=f"{api_prefix}/renewal-radar", tags=["N5 Renewal Radar (Direct)"])
app.include_router(reminder_centre_router, prefix=f"{api_prefix}/reminder-centre", tags=["N6 Reminder Centre (Direct)"])
