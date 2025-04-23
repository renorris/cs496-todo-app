from datetime import datetime
from uuid import UUID

from sqlmodel import Field, SQLModel

class User(SQLModel, table=True):
    __table_args__ = { 'extend_existing': True }
    uuid: UUID = Field(primary_key=True)
    email: str = Field(unique=True)
    password: str = Field()
    first_name: str = Field()
    last_name: str = Field()
    created_at: datetime = Field()
