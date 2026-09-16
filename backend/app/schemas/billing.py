from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import date


class CategoryBillingItem(BaseModel):
    category_id: int
    category_name: str
    entries: List[str]  # list of work titles
    count: int
    rate_per_item: Decimal
    subtotal: Decimal


class PaymentItem(BaseModel):
    id: int
    amount: Decimal
    payment_date: date
    for_month: Optional[int] = None
    for_year: Optional[int] = None
    payment_method: str
    notes: Optional[str] = None


class BillingResponse(BaseModel):
    client_id: int
    client_name: str
    year: int
    month: int
    month_name: str
    categories: List[CategoryBillingItem]
    total_entries: int
    total_bill: Decimal
    total_paid: Decimal
    balance: Decimal
    is_overpaid: bool
    payments: List[PaymentItem]


class MonthSummary(BaseModel):
    year: int
    month: int
    month_name: str
    total_entries: int
    total_bill: Decimal
    total_paid: Decimal
    balance: Decimal
    status: str  # "paid", "partially_paid", "unpaid"


class DashboardResponse(BaseModel):
    client_id: int
    client_name: str
    year: int
    month: int
    month_name: str
    total_videos: int
    total_bill: Decimal
    amount_paid: Decimal
    amount_remaining: Decimal
    is_overpaid: bool
    categories: List[CategoryBillingItem]
    recent_work: list
