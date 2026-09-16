from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def test_root_and_health_endpoints(client):
    root = client.get("/")
    assert root.status_code == 200
    assert root.json()["message"] == "Ledger API is running"

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json() == {"status": "ok"}


def test_clients_can_be_created_and_listed(client):
    payload = {"name": "Apex Studio", "email": "hello@apex.com", "phone": "+91 222", "notes": "Retainer"}
    response = client.post("/api/clients", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Apex Studio"
    assert data["email"] == "hello@apex.com"

    list_response = client.get("/api/clients")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1


def test_duplicate_category_name_is_rejected(client):
    first = client.post("/api/categories", json={"name": "Editing", "default_rate": 2500, "description": "normal edit"})
    assert first.status_code == 201

    duplicate = client.post("/api/categories", json={"name": "Editing", "default_rate": 3000})
    assert duplicate.status_code == 400
    assert "already exists" in duplicate.json()["detail"]


def test_work_entries_use_category_default_rate_when_not_provided(client):
    client_response = client.post("/api/clients", json={"name": "Client One"})
    client_id = client_response.json()["id"]

    category_response = client.post("/api/categories", json={"name": "Color Grading", "default_rate": 3200})
    category_id = category_response.json()["id"]

    work_response = client.post(
        "/api/work",
        json={
            "client_id": client_id,
            "category_id": category_id,
            "title": "Podcast edit",
            "work_date": "2026-08-02",
            "status": "completed",
        },
    )

    assert work_response.status_code == 201
    assert float(work_response.json()["rate"]) == 3200.0


def test_billing_endpoint_calculates_totals_and_balance(client):
    client_response = client.post("/api/clients", json={"name": "Billing Client"})
    client_id = client_response.json()["id"]

    category_response = client.post("/api/categories", json={"name": "Retouching", "default_rate": 1500})
    category_id = category_response.json()["id"]

    work_payloads = [
        {
            "client_id": client_id,
            "category_id": category_id,
            "title": "Scene 1",
            "work_date": "2026-08-03",
            "rate": 1800,
            "status": "completed",
        },
        {
            "client_id": client_id,
            "category_id": category_id,
            "title": "Scene 2",
            "work_date": "2026-08-11",
            "rate": 2200,
            "status": "completed",
        },
        {
            "client_id": client_id,
            "category_id": category_id,
            "title": "Cancelled clip",
            "work_date": "2026-08-12",
            "rate": 2000,
            "status": "cancelled",
        },
    ]

    for payload in work_payloads:
        response = client.post("/api/work", json=payload)
        assert response.status_code == 201

    payment_response = client.post(
        "/api/payments",
        json={
            "client_id": client_id,
            "amount": 2500,
            "payment_date": "2026-08-20",
            "for_month": 8,
            "for_year": 2026,
            "payment_method": "upi",
            "notes": "August payment",
        },
    )
    assert payment_response.status_code == 201

    billing_response = client.get(f"/api/billing/{client_id}/2026/8")
    assert billing_response.status_code == 200
    payload = billing_response.json()

    assert payload["client_name"] == "Billing Client"
    assert payload["total_entries"] == 2
    assert float(payload["total_bill"]) == 4000.0
    assert float(payload["total_paid"]) == 2500.0
    assert float(payload["balance"]) == 1500.0
    assert payload["is_overpaid"] is False


def test_payments_can_be_filtered_by_client_month_and_year(client):
    client_1 = client.post("/api/clients", json={"name": "Client A"}).json()
    client_2 = client.post("/api/clients", json={"name": "Client B"}).json()

    client.post(
        "/api/payments",
        json={
            "client_id": client_1["id"],
            "amount": 500,
            "payment_date": "2026-04-10",
            "for_month": 4,
            "for_year": 2026,
            "payment_method": "bank_transfer",
        },
    )
    client.post(
        "/api/payments",
        json={
            "client_id": client_2["id"],
            "amount": 800,
            "payment_date": "2026-05-01",
            "for_month": 5,
            "for_year": 2026,
            "payment_method": "cash",
        },
    )

    filtered = client.get("/api/payments", params={"client_id": client_1["id"], "month": 4, "year": 2026})
    assert filtered.status_code == 200
    assert len(filtered.json()) == 1
    assert float(filtered.json()[0]["amount"]) == 500.0


def test_dashboard_returns_recent_work_and_summary(client):
    client_response = client.post("/api/clients", json={"name": "Dashboard Client"})
    client_id = client_response.json()["id"]

    category_response = client.post("/api/categories", json={"name": "Motion Graphics", "default_rate": 4000})
    category_id = category_response.json()["id"]

    client.post(
        "/api/work",
        json={
            "client_id": client_id,
            "category_id": category_id,
            "title": "Intro animation",
            "work_date": "2026-09-14",
            "rate": 4500,
            "status": "completed",
        },
    )
    client.post(
        "/api/payments",
        json={
            "client_id": client_id,
            "amount": 1000,
            "payment_date": "2026-09-15",
            "for_month": 9,
            "for_year": 2026,
            "payment_method": "upi",
        },
    )

    dashboard = client.get(f"/api/dashboard/{client_id}/2026/9")
    assert dashboard.status_code == 200
    payload = dashboard.json()
    assert payload["client_name"] == "Dashboard Client"
    assert payload["total_videos"] == 1
    assert float(payload["total_bill"]) == 4500.0
    assert float(payload["amount_paid"]) == 1000.0
    assert payload["recent_work"][0]["title"] == "Intro animation"


def test_invalid_client_payload_is_rejected(client):
    response = client.post("/api/clients", json={})
    assert response.status_code == 422


def test_invalid_payment_amount_is_rejected(client):
    response = client.post(
        "/api/payments",
        json={
            "client_id": 1,
            "amount": 0,
            "payment_date": "2026-08-12",
            "payment_method": "upi",
        },
    )
    assert response.status_code == 422


def test_invalid_work_status_is_rejected(client):
    client_id = client.post("/api/clients", json={"name": "Status Client"}).json()["id"]
    category_id = client.post("/api/categories", json={"name": "Audio Cleanup", "default_rate": 1500}).json()["id"]

    response = client.post(
        "/api/work",
        json={
            "client_id": client_id,
            "category_id": category_id,
            "title": "Bad status entry",
            "work_date": "2026-10-01",
            "status": "archived",
        },
    )
    assert response.status_code == 422


def test_invalid_billing_month_is_rejected(client):
    client_id = client.post("/api/clients", json={"name": "Month Test Client"}).json()["id"]
    response = client.get(f"/api/billing/{client_id}/2026/13")
    assert response.status_code == 400
    assert "Month must be between 1 and 12" in response.json()["detail"]
