from app.routers.clients import router as clients_router
from app.routers.categories import router as categories_router
from app.routers.work import router as work_router
from app.routers.payments import router as payments_router
from app.routers.billing import router as billing_router
from app.routers.dashboard import router as dashboard_router

clients = clients_router
categories = categories_router
work = work_router
payments = payments_router
billing = billing_router
dashboard = dashboard_router
