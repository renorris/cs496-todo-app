import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session
from pydantic import BaseModel

from .middleware import get_current_user
from ..database import get_session
from ..models import list, list_access

list_router = APIRouter()

class CreateListBody(BaseModel):
    title: str
    description: str

@list_router.post("/list/create")
def create_list(reqBody: CreateListBody, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    l = list.List()
    l.uuid = uuid.uuid4()
    l.created_at = datetime.datetime.now()
    l.title = reqBody.title
    l.description = reqBody.description

    print(current_user)

    session.add(l)
    session.commit()

    return {
        "uuid": str(l.uuid),
        "created_at": str(l.created_at),
        "title": l.title,
        "description": l.description,
    }
