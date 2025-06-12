from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config import settings
from app.models import TokenData, User
from app.database import get_db

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token scheme
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def verify_token(token: str) -> TokenData:
    """Verify and decode a JWT token."""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Verifying token: {token[:20]}...")
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        logger.info(f"Token payload: {payload}")
        username: str = payload.get("sub")
        if username is None:
            logger.error("Username is None in token payload")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        logger.info(f"Token verified successfully for user: {username}")
        token_data = TokenData(username=username)
        return token_data
    except JWTError as e:
        logger.error(f"JWT verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user."""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info("get_current_user called")
    if not credentials:
        logger.error("No credentials provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No credentials provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    logger.info(f"Received token: {token[:20]}...")
    
    try:
        token_data = verify_token(token)
        logger.info(f"Token verified, username: {token_data.username}")
        
        # For simplicity, we'll use a hardcoded user
        # In a real app, you'd query the database
        if token_data.username == "admin":
            logger.info("Returning admin user")
            return User(
                id=1,
                username="admin",
                email="admin@example.com",
                is_active=True,
                created_at=datetime.now()
            )
        
        logger.error(f"User not found for username: {token_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except HTTPException as e:
        logger.error(f"Authentication failed: {e.detail}")
        raise


def authenticate_user(username: str, password: str) -> Optional[User]:
    """Authenticate a user with username and password."""
    # For demo purposes, we'll use hardcoded credentials
    # In a real app, you'd query the database
    if username == "admin" and password == "admin123":
        return User(
            id=1,
            username="admin",
            email="admin@example.com",
            is_active=True,
            created_at=datetime.now()
        )
    return None


# Optional dependency for protected routes
def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get the current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user 