"""
Brightloop Novelty Modules — Standalone FastAPI Application
Runs on port 8001. Isolated from the main Brightloop backend.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine

# Import all models so SQLAlchemy creates their tables
from app.models import guardrail, auditor, bank_matcher, renewal_radar, reminder_centre  # noqa: F401

# Import routers
from app.api import (
    discount_guardrail,
    integrity_auditor,
    bank_matcher as bank_matcher_router,
    bill_explainer,
    renewal_radar as renewal_radar_router,
    reminder_centre as reminder_centre_router,
)


def create_tables():
    Base.metadata.create_all(bind=engine)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
prefix = settings.API_PREFIX

app.include_router(discount_guardrail.router, prefix=f"{prefix}/discount-guardrail", tags=["N1 Discount Guardrail"])
app.include_router(integrity_auditor.router, prefix=f"{prefix}/integrity-auditor", tags=["N2 Integrity Auditor"])
app.include_router(bank_matcher_router.router, prefix=f"{prefix}/bank-matcher", tags=["N3 Bank Matcher"])
app.include_router(bill_explainer.router, prefix=f"{prefix}/bill-explainer", tags=["N4 Bill Explainer"])
app.include_router(renewal_radar_router.router, prefix=f"{prefix}/renewal-radar", tags=["N5 Renewal Radar"])
app.include_router(reminder_centre_router.router, prefix=f"{prefix}/reminder-centre", tags=["N6 Reminder Centre"])


@app.on_event("startup")
def on_startup():
    create_tables()


@app.get("/health")
def health():
    return {"status": "ok", "service": settings.PROJECT_NAME, "version": settings.VERSION}
