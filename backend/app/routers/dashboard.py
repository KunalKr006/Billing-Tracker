from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import extract
from app.database import get_db
from app.services.billing_service import compute_billing
from app.schemas.billing import DashboardResponse
from app.models.work_entry import WorkEntry, WorkStatus
from app.schemas.work_entry import WorkEntryResponse

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/{client_id}/{year}/{month}", response_model=DashboardResponse)
def get_dashboard(client_id: int, year: int, month: int, db: Session = Depends(get_db)):
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")

    billing = compute_billing(db, client_id, year, month)
    if billing is None:
        raise HTTPException(status_code=404, detail="Client not found")

    # Recent work (last 10 entries for this month)
    recent = (
        db.query(WorkEntry)
        .options(joinedload(WorkEntry.client), joinedload(WorkEntry.category))
        .filter(
            WorkEntry.client_id == client_id,
            extract("year", WorkEntry.work_date) == year,
            extract("month", WorkEntry.work_date) == month,
        )
        .order_by(WorkEntry.work_date.desc())
        .limit(10)
        .all()
    )

    recent_serialized = [
        {
            "id": e.id,
            "title": e.title,
            "work_date": str(e.work_date),
            "category_name": e.category.name if e.category else "",
            "rate": float(e.rate),
            "status": e.status.value,
        }
        for e in recent
    ]

    return DashboardResponse(
        client_id=billing.client_id,
        client_name=billing.client_name,
        year=year,
        month=month,
        month_name=billing.month_name,
        total_videos=billing.total_entries,
        total_bill=billing.total_bill,
        amount_paid=billing.total_paid,
        amount_remaining=billing.balance,
        is_overpaid=billing.is_overpaid,
        categories=billing.categories,
        recent_work=recent_serialized,
    )
