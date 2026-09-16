from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services.billing_service import compute_billing, get_month_history
from app.schemas.billing import BillingResponse, MonthSummary

router = APIRouter(prefix="/api/billing", tags=["billing"])


@router.get("/{client_id}/{year}/{month}", response_model=BillingResponse)
def get_billing(client_id: int, year: int, month: int, db: Session = Depends(get_db)):
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
    result = compute_billing(db, client_id, year, month)
    if result is None:
        raise HTTPException(status_code=404, detail="Client not found")
    return result


@router.get("/{client_id}/history", response_model=List[MonthSummary])
def get_history(client_id: int, db: Session = Depends(get_db)):
    return get_month_history(db, client_id)
