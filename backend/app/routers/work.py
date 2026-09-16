from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import extract
from typing import List, Optional
from app.database import get_db
from app.models.work_entry import WorkEntry, WorkStatus
from app.models.category import Category
from app.schemas.work_entry import WorkEntryCreate, WorkEntryUpdate, WorkEntryResponse
from decimal import Decimal

router = APIRouter(prefix="/api/work", tags=["work"])


@router.get("", response_model=List[WorkEntryResponse])
def list_work(
    client_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    status: Optional[WorkStatus] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(WorkEntry).options(
        joinedload(WorkEntry.client),
        joinedload(WorkEntry.category),
    )
    if client_id:
        q = q.filter(WorkEntry.client_id == client_id)
    if category_id:
        q = q.filter(WorkEntry.category_id == category_id)
    if status:
        q = q.filter(WorkEntry.status == status)
    if year:
        q = q.filter(extract("year", WorkEntry.work_date) == year)
    if month:
        q = q.filter(extract("month", WorkEntry.work_date) == month)
    if search:
        q = q.filter(WorkEntry.title.ilike(f"%{search}%"))

    return q.order_by(WorkEntry.work_date.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=WorkEntryResponse, status_code=201)
def create_work(payload: WorkEntryCreate, db: Session = Depends(get_db)):
    # Auto-fill rate from category's current default_rate if not provided
    rate = payload.rate
    if rate is None:
        category = db.query(Category).filter(Category.id == payload.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        rate = Decimal(str(category.default_rate))

    entry_data = payload.model_dump()
    entry_data["rate"] = rate

    entry = WorkEntry(**entry_data)
    db.add(entry)
    db.commit()
    db.refresh(entry)

    # Reload with relationships
    return (
        db.query(WorkEntry)
        .options(joinedload(WorkEntry.client), joinedload(WorkEntry.category))
        .filter(WorkEntry.id == entry.id)
        .first()
    )


@router.get("/{work_id}", response_model=WorkEntryResponse)
def get_work(work_id: int, db: Session = Depends(get_db)):
    entry = (
        db.query(WorkEntry)
        .options(joinedload(WorkEntry.client), joinedload(WorkEntry.category))
        .filter(WorkEntry.id == work_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Work entry not found")
    return entry


@router.put("/{work_id}", response_model=WorkEntryResponse)
def update_work(work_id: int, payload: WorkEntryUpdate, db: Session = Depends(get_db)):
    entry = db.query(WorkEntry).filter(WorkEntry.id == work_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Work entry not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return (
        db.query(WorkEntry)
        .options(joinedload(WorkEntry.client), joinedload(WorkEntry.category))
        .filter(WorkEntry.id == work_id)
        .first()
    )


@router.delete("/{work_id}", status_code=204)
def delete_work(work_id: int, db: Session = Depends(get_db)):
    entry = db.query(WorkEntry).filter(WorkEntry.id == work_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Work entry not found")
    db.delete(entry)
    db.commit()
