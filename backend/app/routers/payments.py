from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from typing import List, Optional
from app.database import get_db
from app.models.payment import Payment
from app.models.client import Client
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentResponse

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.get("", response_model=List[PaymentResponse])
def list_payments(
    client_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Payment)
    if client_id:
        q = q.filter(Payment.client_id == client_id)
    if year:
        q = q.filter(func.coalesce(Payment.for_year, extract("year", Payment.payment_date)) == year)
    if month:
        q = q.filter(func.coalesce(Payment.for_month, extract("month", Payment.payment_date)) == month)
    return q.order_by(Payment.payment_date.desc()).all()


@router.post("", response_model=PaymentResponse, status_code=201)
def create_payment(payload: PaymentCreate, db: Session = Depends(get_db)):
    if not db.query(Client).filter(Client.id == payload.client_id).first():
        raise HTTPException(status_code=404, detail="Client not found")
    data = payload.model_dump()
    if not data.get("for_month") and data.get("payment_date"):
        data["for_month"] = data["payment_date"].month
    if not data.get("for_year") and data.get("payment_date"):
        data["for_year"] = data["payment_date"].year
    payment = Payment(**data)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(payment_id: int, payload: PaymentUpdate, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    changes = payload.model_dump(exclude_unset=True)
    if "payment_date" in changes:
        if "for_month" not in changes:
            changes["for_month"] = changes["payment_date"].month
        if "for_year" not in changes:
            changes["for_year"] = changes["payment_date"].year
    for field, value in changes.items():
        setattr(payment, field, value)
    db.commit()
    db.refresh(payment)
    return payment


@router.delete("/{payment_id}", status_code=204)
def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    db.delete(payment)
    db.commit()
