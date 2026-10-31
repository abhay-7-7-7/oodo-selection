import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.core.security import get_password_hash


def create_initial_admin(
    email: str = "admin@brightloop.com",
    name: str = "System Admin",
    password: str = "AdminPassword@2026"
):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email.lower()).first()
        if user:
            print(f"Admin account already exists: {email}")
            user.role = "admin"
            user.password_hash = get_password_hash(password)
            user.is_active = True
            db.commit()
            print(f"Admin password updated successfully.")
        else:
            admin_user = User(
                name=name,
                email=email.lower(),
                password_hash=get_password_hash(password),
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print(f"Successfully created admin account: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else "admin@brightloop.com"
    password = sys.argv[2] if len(sys.argv) > 2 else "AdminPassword@2026"
    create_initial_admin(email=email, password=password)
