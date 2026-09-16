from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv(override=True)

from app.database import engine, Base
from app.models import Client, Category, WorkEntry, Payment  # noqa: F401 - register models

from app.routers import (
    clients_router,
    categories_router,
    work_router,
    payments_router,
    billing_router,
    dashboard_router,
)

# Create all tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Ledger API",
    description="Freelance video editor billing tracker",
    version="1.0.0",
)

# CORS — allow frontend dev server
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clients_router)
app.include_router(categories_router)
app.include_router(work_router)
app.include_router(payments_router)
app.include_router(billing_router)
app.include_router(dashboard_router)


@app.get("/")
def root():
    return {"message": "Ledger API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
