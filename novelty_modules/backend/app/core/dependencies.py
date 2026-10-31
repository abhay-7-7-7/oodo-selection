"""
Novelty modules auth dependencies.

These replicate the main app's JWT handling so that tokens issued by the
main Brightloop backend are accepted here during standalone testing.
When integrated, these dependencies are replaced by the main app's
app.core.dependencies module.
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_access_token
from pydantic import BaseModel


security_scheme = HTTPBearer(auto_error=False)


class TokenUser(BaseModel):
    """Lightweight user representation parsed from JWT — no DB query needed."""
    id: int
    role: str  # "admin" | "staff" | "customer"
    name: str = ""
    email: str = ""


def get_current_token_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> TokenUser:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    user_id_str = payload.get("sub")
    role = payload.get("role", "customer")
    name = payload.get("name", "")
    email = payload.get("email", "")
    if not user_id_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID in token")
    return TokenUser(id=user_id, role=role, name=name, email=email)


def require_admin(user: TokenUser = Depends(get_current_token_user)) -> TokenUser:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    return user


def require_staff_or_admin(user: TokenUser = Depends(get_current_token_user)) -> TokenUser:
    if user.role not in ("admin", "staff"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or Admin role required")
    return user


def require_any_authenticated(user: TokenUser = Depends(get_current_token_user)) -> TokenUser:
    return user
