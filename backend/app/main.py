from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.config import settings
from app.database import Base, engine
# Register all models for database table initialization
import app.models

from app.api.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Subscription management and recurring billing backend for Brightloop Software.",
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
app.include_router(auth_router, prefix=api_prefix)
