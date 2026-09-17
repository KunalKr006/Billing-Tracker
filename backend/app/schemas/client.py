from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ClientBase(BaseModel):
    name: str
    phone: str = Field(min_length=3, max_length=50)
    is_active: bool = True


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = Field(default=None, min_length=3, max_length=50)
    is_active: Optional[bool] = None


class ClientResponse(ClientBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
