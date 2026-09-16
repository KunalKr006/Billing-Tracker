from sqlalchemy import Column, Integer, String, Numeric, DateTime, Date, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class PaymentMethod(str, enum.Enum):
    upi = "upi"
    bank_transfer = "bank_transfer"
    cash = "cash"
    other = "other"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_date = Column(Date, nullable=False)
    for_month = Column(Integer, nullable=True)  # Target billing month (1-12)
    for_year = Column(Integer, nullable=True)   # Target billing year (e.g., 2026)
    payment_method = Column(Enum(PaymentMethod), nullable=False, default=PaymentMethod.upi)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    client = relationship("Client", back_populates="payments")
