from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.config import settings
from app.database import Base, engine
import app.models  # Ensure all models are registered with Base.metadata

# Import API Routers
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
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

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Consistent error format handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_messages = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error.get("loc", []))
        msg = error.get("msg", "Invalid value")
        error_messages.append(f"{field}: {msg}")
    
    first_msg = error_messages[0] if error_messages else "Request validation failed."
    # If the message contains a clean value error, use it directly
    if "Value error, " in first_msg:
        first_msg = first_msg.split("Value error, ")[-1]
        
    return JSONResponse(
        status_code=422,
        content={"detail": first_msg}
    )


# Health check
@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME, "version": settings.VERSION}


# Mount all 42 Core API Endpoints under /api
api_prefix = settings.API_V1_STR

# Authentication & Access
app.include_router(auth_router, prefix=api_prefix)
app.include_router(staff_router, prefix=api_prefix)
app.include_router(outbox_router, prefix=api_prefix)

# Catalog
app.include_router(products_router, prefix=api_prefix)
app.include_router(plans_router, prefix=api_prefix)
app.include_router(taxes_router, prefix=api_prefix)
app.include_router(discounts_router, prefix=api_prefix)

# Quotations & Subscriptions
app.include_router(quotations_router, prefix=api_prefix)
app.include_router(subscriptions_router, prefix=api_prefix)

# Invoicing & Billing
app.include_router(billing_router, prefix=api_prefix)
app.include_router(invoices_router, prefix=api_prefix)

# Payments
app.include_router(invoice_payments_router, prefix=api_prefix)
app.include_router(payments_router, prefix=api_prefix)

# Finance Reporting
app.include_router(reports_router, prefix=api_prefix)

# Customer Portal & Customer Listing
app.include_router(portal_router, prefix=api_prefix)
app.include_router(customers_router, prefix=api_prefix)
