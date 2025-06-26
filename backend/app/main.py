import logging
from datetime import datetime
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import time

from app.config import settings
from app.models import HealthCheck, ErrorResponse
from app.database import check_database_connection
from app.routers import auth, tables, search

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title="DBSee API",
    description="Database Explorer Web Application API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.allowed_hosts
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    
    # Log incoming request details
    logger.info(f"Incoming request: {request.method} {request.url.path}")
    logger.info(f"Headers: {dict(request.headers)}")
    
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log request
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.4f}s"
    )
    
    # Log response status details for problematic requests
    if response.status_code >= 400:
        logger.error(f"Error response {response.status_code} for {request.method} {request.url.path}")
        if hasattr(response, 'body'):
            logger.error(f"Response body: {response.body}")
    
    return response


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            detail="Validation error",
            error_code="VALIDATION_ERROR"
        ).dict()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            detail="Internal server error",
            error_code="INTERNAL_ERROR"
        ).dict()
    )


# Health check endpoint
@app.get("/health", response_model=HealthCheck, tags=["system"])
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
def health_check(request: Request):
    """Health check endpoint."""
    db_connected = check_database_connection()
    
    return HealthCheck(
        status="healthy" if db_connected else "unhealthy",
        timestamp=datetime.now(),
        database_connected=db_connected
    )

# Health check endpoint also in API path
@app.get("/api/v1/health", response_model=HealthCheck, tags=["system"])
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
def api_health_check(request: Request):
    """Health check endpoint in API path."""
    db_connected = check_database_connection()
    
    return HealthCheck(
        status="healthy" if db_connected else "unhealthy",
        timestamp=datetime.now(),
        database_connected=db_connected
    )


# Root endpoint
@app.get("/", tags=["system"])
def root():
    """Root endpoint."""
    return {
        "message": "DBSee API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(tables.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")


# Startup event
@app.on_event("startup")
async def startup_event():
    """Startup event handler."""
    logger.info("Starting DBSee API...")
    
    # Log detected configuration
    logger.info(f"🌐 Allowed hosts: {settings.allowed_hosts}")
    logger.info(f"🔗 Allowed CORS origins: {settings.allowed_origins}")
    logger.info(f"📡 Listening on: {settings.app_host}:{settings.app_port}")
    
    # Check database connection
    if check_database_connection():
        logger.info("Database connection successful")
    else:
        logger.error("Database connection failed")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler."""
    logger.info("Shutting down DBSee API...") 