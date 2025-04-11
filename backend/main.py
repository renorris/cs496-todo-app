from fastapi import FastAPI
from routes.user import user_router
from routes.list import list_router
from .database import create_tables

app = FastAPI()

# Register the startup event to create tables
@app.on_event("startup")
def on_startup():
    create_tables()

# Include routers from routes
app.include_router(user_router)
app.include_router(list_router)

# Root endpoint
@app.get("/")
def read_root():
    return {"hello": "world"}