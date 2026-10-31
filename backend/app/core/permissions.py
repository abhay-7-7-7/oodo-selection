from typing import List
from fastapi import Depends, HTTPException, status
from app.core.dependencies import get_current_user
from app.models.user import User


class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of the following roles: {', '.join(self.allowed_roles)}."
            )
        return current_user


require_admin = RoleChecker(["admin"])
require_staff_or_admin = RoleChecker(["admin", "staff"])
require_customer = RoleChecker(["customer"])
require_any_authenticated = RoleChecker(["admin", "staff", "customer"])
