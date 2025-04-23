from datetime import datetime
from uuid import UUID

from sqlmodel import Field, SQLModel

class List(SQLModel, table=True):
    __table_args__ = { 'extend_existing': True }
    uuid: UUID = Field(primary_key=True)
    created_at: datetime = Field()
    title: str = Field()
    description: str = Field()
