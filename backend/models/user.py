from datetime import datetime
from uuid import UUID

from sqlmodel import Field, Session, SQLModel, create_engine, select

class User(SQLModel, table=True):
    uuid: UUID = Field(primary_key=True)
    email: str = Field(index=True, unique=True)
    password: str = Field()
    first_name: str = Field()
    last_name: str = Field()
    created_at: datetime = Field()
