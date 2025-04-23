from sqlmodel import create_engine, SQLModel, Session
from dotenv import load_dotenv
import os

from .models import user, list, list_access, task

# Load environment variables from .env
load_dotenv()

# Get the database URL
DATABASE_URL = os.getenv("DATABASE_URL")

# Create the database engine
engine = create_engine(DATABASE_URL, echo=True)

def create_tables():
    """Create all database tables based on SQLModel metadata."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependency to provide a database session."""
    with Session(engine) as session:
        yield session
