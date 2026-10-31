import os
import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set test environment
os.environ["DATABASE_URL"] = "sqlite:///./test_brightloop.db"

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.product import Product, Variant
from app.models.plan import Plan
from app.models.tax import Tax
from app.models.discount import Discount
from app.core.security import get_password_hash, create_access_token

TEST_DB_URL = "sqlite:///./test_brightloop.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_brightloop.db"):
        try:
            os.remove("./test_brightloop.db")
        except Exception:
            pass


@pytest.fixture
def db():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db):
    user = db.query(User).filter(User.email == "test_admin@brightloop.com").first()
    if not user:
        user = User(
            name="Test Admin",
            email="test_admin@brightloop.com",
            password_hash=get_password_hash("AdminPassword@2026"),
            role="admin",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def admin_headers(admin_user):
    token = create_access_token({"sub": str(admin_user.id), "email": admin_user.email, "role": "admin", "name": admin_user.name})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def staff_user(db):
    user = db.query(User).filter(User.email == "test_staff@brightloop.com").first()
    if not user:
        user = User(
            name="Test Staff",
            email="test_staff@brightloop.com",
            password_hash=get_password_hash("StaffPassword@2026"),
            role="staff",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def staff_headers(staff_user):
    token = create_access_token({"sub": str(staff_user.id), "email": staff_user.email, "role": "staff", "name": staff_user.name})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def customer_user(db):
    user = db.query(User).filter(User.email == "test_customer@example.com").first()
    if not user:
        user = User(
            name="Test Customer",
            email="test_customer@example.com",
            password_hash=get_password_hash("CustomerPassword@2026"),
            role="customer",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def customer_headers(customer_user):
    token = create_access_token({"sub": str(customer_user.id), "email": customer_user.email, "role": "customer", "name": customer_user.name})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_customer_user(db):
    user = db.query(User).filter(User.email == "other_customer@example.com").first()
    if not user:
        user = User(
            name="Other Customer",
            email="other_customer@example.com",
            password_hash=get_password_hash("CustomerPassword@2026"),
            role="customer",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def other_customer_headers(other_customer_user):
    token = create_access_token({"sub": str(other_customer_user.id), "email": other_customer_user.email, "role": "customer", "name": other_customer_user.name})
    return {"Authorization": f"Bearer {token}"}
