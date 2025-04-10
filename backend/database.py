from sqlmodel import create_engine, SQLModel, Session
from models.user import User

# Create the database engine
engine = create_engine("postgresql://localhost:5432/todoapp", echo=True)

def create_tables():
    """Create all database tables based on SQLModel metadata."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependency to provide a database session."""
    with Session(engine) as session:
        yield session
