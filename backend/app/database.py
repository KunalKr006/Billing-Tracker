from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv(override=True)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured. Add it to backend/.env.")

database_url = make_url(DATABASE_URL)
connect_args = {}

# Aiven documents `ssl-mode=REQUIRED`, while PyMySQL expects SSL options
# through connect_args rather than as a URL query parameter.
if database_url.query.get("ssl-mode", "").upper() == "REQUIRED":
    database_url = database_url.difference_update_query(["ssl-mode"])
    connect_args["ssl"] = {}

engine = create_engine(database_url, echo=False, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
