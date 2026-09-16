from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal


class CategoryBase(BaseModel):
    name: str
    default_rate: Decimal
    description: Optional[str] = None
    is_active: bool = True

    @field_validator("default_rate")
    @classmethod
    def rate_must_be_non_negative(cls, v):
        if v < 0:
            raise ValueError("Rate must be >= 0")
        return v


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    default_rate: Optional[Decimal] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("default_rate")
    @classmethod
    def rate_must_be_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError("Rate must be >= 0")
        return v


class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
