from fastapi import FastAPI
from .routes.user import router as user_router
from .database import create_tables

app = FastAPI()

# Register the startup event to create tables
@app.on_event("startup")
def on_startup():
    create_tables()

# Include the user routes
app.include_router(user_router)

# Root endpoint
@app.get("/")
def read_root():
    return {"hello": "world"}