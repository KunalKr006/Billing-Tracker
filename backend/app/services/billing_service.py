from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from decimal import Decimal
from calendar import month_name
from app.models.work_entry import WorkEntry, WorkStatus
from app.models.payment import Payment
from app.models.client import Client
from app.schemas.billing import (
    BillingResponse,
    CategoryBillingItem,
    PaymentItem,
    DashboardResponse,
    MonthSummary,
)
from collections import defaultdict


def get_month_name(month: int) -> str:
    if month < 1 or month > 12:
        raise ValueError("Month must be between 1 and 12")
    return month_name[month]


def compute_billing(db: Session, client_id: int, year: int, month: int) -> BillingResponse:
    """
    Core billing logic:
    1. Fetch completed work entries for client/year/month
    2. Group by category, using the stored historical rate (never category.default_rate)
    3. Fetch payments for client/year/month
    4. Compute totals
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        return None

    # Only COMPLETED entries count toward the bill
    entries = (
        db.query(WorkEntry)
        .filter(
            WorkEntry.client_id == client_id,
            WorkEntry.status == WorkStatus.completed,
            extract("year", WorkEntry.work_date) == year,
            extract("month", WorkEntry.work_date) == month,
        )
        .all()
    )

    # Group by category
    category_groups: dict[int, dict] = defaultdict(
        lambda: {"name": "", "titles": [], "rate": Decimal("0")}
    )
    for entry in entries:
        g = category_groups[entry.category_id]
        g["name"] = entry.category.name
        g["titles"].append(entry.title)
        g["rate"] = Decimal(str(entry.rate))  # Use snapshot rate

    categories: list[CategoryBillingItem] = []
    total_bill = Decimal("0")

    for cat_id, g in category_groups.items():
        count = len(g["titles"])
        # All entries in the same category for a month typically share one rate
        # If rates differ (edge case), we sum individually
        # Recalculate properly:
        subtotal = sum(
            Decimal(str(e.rate))
            for e in entries
            if e.category_id == cat_id
        )
        rate_per_item = subtotal / count
        total_bill += subtotal

        categories.append(
            CategoryBillingItem(
                category_id=cat_id,
                category_name=g["name"],
                entries=g["titles"],
                count=count,
                rate_per_item=rate_per_item,
                subtotal=subtotal,
            )
        )

    # Sort categories alphabetically
    categories.sort(key=lambda c: c.category_name)

    # Payments for this month (check for_year / for_month first, fallback to payment_date)
    payment_rows = (
        db.query(Payment)
        .filter(
            Payment.client_id == client_id,
            func.coalesce(Payment.for_year, extract("year", Payment.payment_date)) == year,
            func.coalesce(Payment.for_month, extract("month", Payment.payment_date)) == month,
        )
        .order_by(Payment.payment_date)
        .all()
    )

    total_paid = sum(Decimal(str(p.amount)) for p in payment_rows)
    balance = total_bill - total_paid
    is_overpaid = balance < 0

    payments = [
        PaymentItem(
            id=p.id,
            amount=Decimal(str(p.amount)),
            payment_date=p.payment_date,
            for_month=p.for_month or p.payment_date.month,
            for_year=p.for_year or p.payment_date.year,
            payment_method=p.payment_method.value,
            notes=p.notes,
        )
        for p in payment_rows
    ]

    return BillingResponse(
        client_id=client_id,
        client_name=client.name,
        year=year,
        month=month,
        month_name=get_month_name(month),
        categories=categories,
        total_entries=len(entries),
        total_bill=total_bill,
        total_paid=total_paid,
        balance=abs(balance),
        is_overpaid=is_overpaid,
        payments=payments,
    )


def get_month_history(db: Session, client_id: int) -> list[MonthSummary]:
    """Return all months that have work entries or payments for a client."""
    work_months = (
        db.query(
            extract("year", WorkEntry.work_date).label("year"),
            extract("month", WorkEntry.work_date).label("month"),
        )
        .filter(WorkEntry.client_id == client_id, WorkEntry.status == WorkStatus.completed)
        .distinct()
        .all()
    )
    payment_months = (
        db.query(
            func.coalesce(Payment.for_year, extract("year", Payment.payment_date)).label("year"),
            func.coalesce(Payment.for_month, extract("month", Payment.payment_date)).label("month"),
        )
        .filter(Payment.client_id == client_id)
        .distinct()
        .all()
    )

    month_set = set()
    for row in work_months + payment_months:
        month_set.add((int(row.year), int(row.month)))

    summaries = []
    for year, month in sorted(month_set, reverse=True):
        billing = compute_billing(db, client_id, year, month)
        if billing:
            if billing.total_bill == 0:
                status = "unpaid"
            elif billing.total_paid >= billing.total_bill:
                status = "paid"
            elif billing.total_paid > 0:
                status = "partially_paid"
            else:
                status = "unpaid"

            summaries.append(
                MonthSummary(
                    year=year,
                    month=month,
                    month_name=get_month_name(month),
                    total_entries=billing.total_entries,
                    total_bill=billing.total_bill,
                    total_paid=billing.total_paid,
                    balance=billing.balance,
                    status=status,
                )
            )

    return summaries
