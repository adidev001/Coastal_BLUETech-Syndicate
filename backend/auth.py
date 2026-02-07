"""
Authentication utilities for Coastal Pollution Monitor
Handles JWT token creation/verification and password hashing
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "coastal-pollution-monitor-secret-key-change-in-production-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash using bcrypt"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Dictionary containing user data (sub, role, etc.)
        expires_delta: Optional custom expiration time
    
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and verify a JWT token
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


async def get_current_user_optional(token: str = Depends(oauth2_scheme)) -> Optional[dict]:
    """
    Get current user from token (optional - returns None if no token)
    Use this for routes that work for both authenticated and unauthenticated users
    """
    if not token:
        return None
    
    payload = decode_token(token)
    if payload is None:
        return None
    
    user_id = payload.get("sub")
    if user_id is None:
        return None
    
    # Import here to avoid circular imports
    from database import get_user_by_id
    user = get_user_by_id(int(user_id))
    
    return user


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Get current user from token (required)
    Raises HTTPException if not authenticated
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Import here to avoid circular imports
    from database import get_user_by_id
    user = get_user_by_id(int(user_id))
    
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Get current user and verify they are an admin
    Raises HTTPException if not admin
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def get_user_tier(points: int) -> dict:
    """Calculate user tier based on points"""
    points = points or 0
    if points >= 200:
        return {"name": "Super Hero", "icon": "🦸", "color": "#7c3aed"} # Violet
    elif points >= 100:
        return {"name": "Platinum", "icon": "💎", "color": "#e2e8f0"} # Slate
    elif points >= 50:
        return {"name": "Gold", "icon": "🥇", "color": "#fbbf24"} # Amber
    elif points >= 20:
        return {"name": "Silver", "icon": "🥈", "color": "#94a3b8"} # Slate-400
    elif points >= 10:
        return {"name": "Bronze", "icon": "🥉", "color": "#d97706"} # Amber-600
    else:
        return {"name": "Rookie", "icon": "🌱", "color": "#10b981"} # Emerald


def create_user_token_response(user: dict) -> dict:
    """
    Create a token response for a user
    
    Args:
        user: User dictionary from database
    
    Returns:
        Dictionary with access_token, token_type, and user info
    """
    access_token = create_access_token(
        data={
            "sub": str(user["id"]),
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "points": user.get("points", 0),
            "tier": get_user_tier(user.get("points", 0))
        }
    }
