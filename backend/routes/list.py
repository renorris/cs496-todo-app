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
    # Create a new list with its details
    l = list.List()
    l.uuid = uuid.uuid4()
    l.created_at = datetime.datetime.now()
    l.title = reqBody.title
    l.description = reqBody.description

    # Create a ListAccess entry to associate the list with the current user
    la = list_access.ListAccess()
    la.uuid = uuid.uuid4()
    la.list_uuid = l.uuid  # Link to the list's UUID
    la.owner_uuid = uuid.UUID(current_user['uuid'])  # Convert user's UUID string to UUID object

    # Add both the list and the access entry to the session
    session.add(l)
    session.add(la)
    session.commit()

    # Return the details of the newly created list
    return {
        "uuid": str(l.uuid),
        "created_at": str(l.created_at),
        "title": l.title,
        "description": l.description,
    }

# Get all lists
@list_router.get("/list")
def get_lists(session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    list_accesses = session.query(ListAccess).filter(ListAccess.owner_uuid == user_uuid).all()
    lists = []
    for la in list_accesses:
        l = session.query(List).filter(List.uuid == la.list_uuid).first()
        if l:
            lists.append({
                "uuid": str(l.uuid),
                "created_at": str(l.created_at),
                "title": l.title,
                "description": l.description,
            })
    return lists

# Get single list by UUID
@list_router.get("/list/{list_uuid}")
def get_list(list_uuid: str, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    list_uuid_obj = uuid.UUID(list_uuid)
    la = session.query(ListAccess).filter(ListAccess.list_uuid == list_uuid_obj, ListAccess.owner_uuid == user_uuid).first()
    if not la:
        raise HTTPException(status_code=404, detail="List not found")
    l = session.query(List).filter(List.uuid == list_uuid_obj).first()
    if not l:
        raise HTTPException(status_code=404, detail="List not found")
    return {
        "uuid": str(l.uuid),
        "created_at": str(l.created_at),
        "title": l.title,
        "description": l.description,
    }

# Update list
@list_router.put("/list/{list_uuid}")
def update_list(list_uuid: str, reqBody: CreateListBody, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    list_uuid_obj = uuid.UUID(list_uuid)
    la = session.query(ListAccess).filter(ListAccess.list_uuid == list_uuid_obj, ListAccess.owner_uuid == user_uuid).first()
    if not la:
        raise HTTPException(status_code=404, detail="List not found")
    l = session.query(List).filter(List.uuid == list_uuid_obj).first()
    if not l:
        raise HTTPException(status_code=404, detail="List not found")
    l.title = reqBody.title
    l.description = reqBody.description
    session.add(l)
    session.commit()
    return {
        "uuid": str(l.uuid),
        "created_at": str(l.created_at),
        "title": l.title,
        "description": l.description,
    }

# Delete list
@list_router.delete("/list/{list_uuid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_list(list_uuid: str, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    list_uuid_obj = uuid.UUID(list_uuid)
    
    # Check if the user has access to the list
    la = session.query(list_access.ListAccess).filter(
        list_access.ListAccess.list_uuid == list_uuid_obj,
        list_access.ListAccess.owner_uuid == user_uuid
    ).first()
    if not la:
        raise HTTPException(status_code=404, detail="List not found or access denied")
    
    # Get the list
    l = session.query(list.List).filter(list.List.uuid == list_uuid_obj).first()
    if not l:
        raise HTTPException(status_code=404, detail="List not found")
    
    # Delete the list and its access entry
    session.delete(la)
    session.delete(l)
    session.commit()
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)
