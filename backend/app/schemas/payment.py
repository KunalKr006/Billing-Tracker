from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from app.models.payment import PaymentMethod


class PaymentBase(BaseModel):
    client_id: int
    amount: Decimal
    payment_date: date
    for_month: Optional[int] = None
    for_year: Optional[int] = None
    payment_method: PaymentMethod = PaymentMethod.upi
    notes: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Amount must be greater than 0")
        return v


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    amount: Optional[Decimal] = None
    payment_date: Optional[date] = None
    for_month: Optional[int] = None
    for_year: Optional[int] = None
    payment_method: Optional[PaymentMethod] = None
    notes: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Amount must be greater than 0")
        return v


class PaymentResponse(PaymentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
