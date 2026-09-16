"""
Seed demo data for EditLedger.

August 2026 demo:
  - Client: Influencer Client
  - Categories: Full Video (₹250), Text Add (₹1,000)
  - 5 Full Videos + 7 Text Adds = 12 entries
  - Payment: ₹3,350
  - Expected: Bill = ₹8,250, Paid = ₹3,350, Balance = ₹4,900
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(override=True)

from app.database import SessionLocal, engine, Base
from app.models.client import Client
from app.models.category import Category
from app.models.work_entry import WorkEntry, WorkStatus
from app.models.payment import Payment, PaymentMethod
from datetime import date
from decimal import Decimal

# Ensure tables exist
Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Client).count() > 0:
            print("Database already has data. Skipping seed.")
            return

        print("Seeding demo data...")

        # Client
        client = Client(
            name="Influencer Client",
            email="influencer@example.com",
            phone="+91 9999999999",
            notes="Main client - pays monthly for editing work",
            is_active=True,
        )
        db.add(client)
        db.flush()  # Get client.id

        # Categories
        full_video = Category(
            name="Full Video",
            default_rate=Decimal("250"),
            description="Full-length video editing",
            is_active=True,
        )
        text_add = Category(
            name="Text Add",
            default_rate=Decimal("1000"),
            description="Text addition / overlay editing",
            is_active=True,
        )
        db.add(full_video)
        db.add(text_add)
        db.flush()

        # August 2026 - Full Video entries
        full_video_titles = [
            "Rima's Kitchen",
            "Super Bazaar",
            "Clear Vision",
            "Aptech",
            "Peter England",
        ]
        for i, title in enumerate(full_video_titles):
            entry = WorkEntry(
                client_id=client.id,
                category_id=full_video.id,
                title=title,
                work_date=date(2026, 8, i + 1),
                rate=Decimal("250"),  # Snapshot rate
                status=WorkStatus.completed,
            )
            db.add(entry)

        # August 2026 - Text Add entries
        text_add_titles = [
            "Ronauk Catering",
            "Electronics",
            "Mina Bazaar",
            "Sohail Mobile",
            "Abua Rakhi",
            "Sri Modi Mobile",
            "Neelam Jewellers",
        ]
        for i, title in enumerate(text_add_titles):
            entry = WorkEntry(
                client_id=client.id,
                category_id=text_add.id,
                title=title,
                work_date=date(2026, 8, i + 6),
                rate=Decimal("1000"),  # Snapshot rate
                status=WorkStatus.completed,
            )
            db.add(entry)

        # August 2026 - Payment: ₹3,350
        payment = Payment(
            client_id=client.id,
            amount=Decimal("3350"),
            payment_date=date(2026, 8, 20),
            for_month=8,
            for_year=2026,
            payment_method=PaymentMethod.upi,
            notes="August partial payment via UPI",
        )
        db.add(payment)

        db.commit()
        print("\n✅ Demo data seeded successfully!")
        print("\nExpected August 2026 billing:")
        print(f"  Full Videos: 5 × ₹250 = ₹1,250")
        print(f"  Text Adds:   7 × ₹1,000 = ₹7,000")
        print(f"  Total Bill:  ₹8,250")
        print(f"  Paid:        ₹3,350")
        print(f"  Balance:     ₹4,900")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
