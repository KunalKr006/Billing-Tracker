from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from app.models.work_entry import WorkStatus


class WorkEntryBase(BaseModel):
    client_id: int
    category_id: int
    title: str
    work_date: date
    rate: Optional[Decimal] = None
    notes: Optional[str] = None
    status: WorkStatus = WorkStatus.completed

    @field_validator("rate")
    @classmethod
    def rate_must_be_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError("Rate must be >= 0")
        return v


class WorkEntryCreate(WorkEntryBase):
    pass


class WorkEntryUpdate(BaseModel):
    client_id: Optional[int] = None
    category_id: Optional[int] = None
    title: Optional[str] = None
    work_date: Optional[date] = None
    rate: Optional[Decimal] = None
    notes: Optional[str] = None
    status: Optional[WorkStatus] = None

    @field_validator("rate")
    @classmethod
    def rate_must_be_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError("Rate must be >= 0")
        return v


class CategoryInfo(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


class ClientInfo(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


class WorkEntryResponse(BaseModel):
    id: int
    client_id: int
    category_id: int
    title: str
    work_date: date
    rate: Decimal
    notes: Optional[str] = None
    status: WorkStatus
    created_at: datetime
    updated_at: datetime
    client: Optional[ClientInfo] = None
    category: Optional[CategoryInfo] = None

    model_config = {"from_attributes": True}
