from fastapi import FastAPI
from .routes.user import user_router
from .routes.list import list_router
from .routes.task import task_router
from .database import create_tables

app = FastAPI()

# Register the startup event to create tables
@app.on_event("startup")
def on_startup():
    create_tables()

# Include routers from routes
app.include_router(user_router, tags=["User"])
app.include_router(list_router, tags=["List"])
app.include_router(task_router, tags=["Task"])
