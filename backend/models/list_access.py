from datetime import datetime
from uuid import UUID

from sqlmodel import Field, SQLModel

class ListAccess(SQLModel, table=True):
    __table_args__ = { 'extend_existing': True }
    uuid: UUID = Field(primary_key=True)
    list_uuid: UUID = Field(index=True)
    owner_uuid: UUID = Field(index=True)
