import datetime
import uuid
from ..models.user import User
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session
from pydantic import BaseModel
from sqlalchemy import case, func
from ..models.task import Task

from .middleware import get_current_user
from ..database import get_session
from ..models import list as list_model, list_access

list_router = APIRouter()

class CreateListBody(BaseModel):
    title: str
    description: str

def get_list_percent_complete(session: Session, list_uuid: uuid.UUID) -> float:
    total_tasks = session.query(func.count(Task.uuid)).filter(Task.list_uuid == list_uuid).scalar()
    done_tasks = session.query(func.coalesce(func.sum(case([(Task.done, 1)], else_=0)), 0)).filter(Task.list_uuid == list_uuid).scalar()
    return (done_tasks / total_tasks * 100) if total_tasks > 0 else 0.0

@list_router.post("/create")
def create_list(reqBody: CreateListBody, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    # Create a new list with its details
    l = list_model.List()
    l.uuid = uuid.uuid4()
    l.created_at = datetime.datetime.now()
    l.title = reqBody.title
    l.description = reqBody.description

    # Create a ListAccess entry to associate the list with the current user
    la = list_access.ListAccess()
    la.uuid = uuid.uuid4()
    la.list_uuid = l.uuid
    la.owner_uuid = uuid.UUID(current_user['uuid'])

    # Add both the list and the access entry to xAI Artifact
    session.add(l)
    session.add(la)
    session.commit()

    # Calculate percent_complete (will be 0 for a new list)
    percent_complete = get_list_percent_complete(session, l.uuid)

    # Return the details of the newly created list
    return {
        "uuid": str(l.uuid),
        "created_at": str(l.created_at),
        "title": l.title,
        "description": l.description,
        "percent_complete": percent_complete
    }

@list_router.get("/")
def get_lists(session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    
    # Get all lists for the user
    lists = session.query(list_model.List).join(list_access.ListAccess, list_model.List.uuid == list_access.ListAccess.list_uuid).filter(list_access.ListAccess.owner_uuid == user_uuid).order_by(list_model.List.created_at.desc()).all()
    
    # Get aggregates for all lists
    list_aggregates = session.query(
        list_model.List.uuid.label('list_uuid'),
        func.count(Task.uuid).label('total_tasks'),
        func.coalesce(func.sum(case([(Task.done, 1)], else_=0)), 0).label('done_tasks')
    ).join(list_access.ListAccess, list_model.List.uuid == list_access.ListAccess.list_uuid
    ).outerjoin(Task, list_model.List.uuid == Task.list_uuid
    ).filter(list_access.ListAccess.owner_uuid == user_uuid
    ).group_by(list_model.List.uuid
    ).all()
    
    # Create a dictionary for quick lookup of aggregates
    agg_dict = {row.list_uuid: {'total': row.total_tasks, 'done': row.done_tasks} for row in list_aggregates}
    
    # Build result with percent_complete
    result = []
    for l in lists:
        agg = agg_dict.get(l.uuid, {'total': 0, 'done': 0})
        total = agg['total']
        done = agg['done']
        percent_complete = (done / total * 100) if total > 0 else 0
        result.append({
            "uuid": str(l.uuid),
            "created_at": str(l.created_at),
            "title": l.title,
            "description": l.description,
            "percent_complete": percent_complete
        })
    return result

@list_router.get("/{list_uuid}")
def get_list(list_uuid: str, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    list_uuid_obj = uuid.UUID(list_uuid)
    
    # Check if the user has access to the list
    la = session.query(list_access.ListAccess).filter(list_access.ListAccess.list_uuid == list_uuid_obj, list_access.ListAccess.owner_uuid == user_uuid).first()
    if not la:
        raise HTTPException(status_code=404, detail="List not found")
    
    # Get the list
    l = session.query(list_model.List).filter(list_model.List.uuid == list_uuid_obj).first()
    if not l:
        raise HTTPException(status_code=404, detail="List not found")
    
    # Calculate percent_complete
    percent_complete = get_list_percent_complete(session, l.uuid)
    
    # Return list details with percent_complete
    return {
        "uuid": str(l.uuid),
        "created_at": str(l.created_at),
        "title": l.title,
        "description": l.description,
        "percent_complete": percent_complete
    }

@list_router.put("/{list_uuid}")
def update_list(list_uuid: str, reqBody: CreateListBody, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    list_uuid_obj = uuid.UUID(list_uuid)
    
    # Check if the user has access to the list
    la = session.query(list_access.ListAccess).filter(list_access.ListAccess.list_uuid == list_uuid_obj, list_access.ListAccess.owner_uuid == user_uuid).first()
    if not la:
        raise HTTPException(status_code=404, detail="List not found")
    
    # Get the list
    l = session.query(list_model.List).filter(list_model.List.uuid == list_uuid_obj).first()
    if not l:
        raise HTTPException(status_code=404, detail="List not found")
    
    # Update list fields
    l.title = reqBody.title
    l.description = reqBody.description
    session.add(l)
    session.commit()
    
    # Calculate percent_complete
    percent_complete = get_list_percent_complete(session, l.uuid)
    
    # Return updated list with percent_complete
    return {
        "uuid": str(l.uuid),
        "created_at": str(l.created_at),
        "title": l.title,
        "description": l.description,
        "percent_complete": percent_complete
    }

@list_router.delete("/{list_uuid}", status_code=status.HTTP_204_NO_CONTENT)
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
    l = session.query(list_model.List).filter(list_model.List.uuid == list_uuid_obj).first()
    if not l:
        raise HTTPException(status_code=404, detail="List not found")
    
    # Delete the list and its access entry
    session.delete(la)
    session.delete(l)
    session.commit()
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@list_router.put("/{list_uuid}/access/{other_user_uuid}")
def add_list_access(list_uuid: str, other_user_uuid: str, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    list_uuid_obj = uuid.UUID(list_uuid)
    other_user_uuid_obj = uuid.UUID(other_user_uuid)

    # Check if current_user has access to list_uuid
    la_current = session.query(list_access.ListAccess).filter(list_access.ListAccess.list_uuid == list_uuid_obj, list_access.ListAccess.owner_uuid == user_uuid).first()
    if not la_current:
        raise HTTPException(status_code=404, detail="List not found")

    # Check if other_user exists
    other_user = session.query(User).filter(User.uuid == other_user_uuid_obj).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if other_user already has access
    la_other = session.query(list_access.ListAccess).filter(list_access.ListAccess.list_uuid == list_uuid_obj, list_access.ListAccess.owner_uuid == other_user_uuid_obj).first()
    if la_other:
        return {"message": "User already has access"}, status.HTTP_200_OK

    # Create new ListAccess
    new_la = list_access.ListAccess()
    new_la.uuid = uuid.uuid4()
    new_la.list_uuid = list_uuid_obj
    new_la.owner_uuid = other_user_uuid_obj
    session.add(new_la)
    session.commit()

    return {"message": "Access granted"}, status.HTTP_201_CREATED

@list_router.delete("/{list_uuid}/access/{other_user_uuid}", status_code=status.HTTP_204_NO_CONTENT)
def remove_list_access(list_uuid: str, other_user_uuid: str, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    list_uuid_obj = uuid.UUID(list_uuid)
    other_user_uuid_obj = uuid.UUID(other_user_uuid)

    # Check if current_user has access to list_uuid
    la_current = session.query(list_access.ListAccess).filter(list_access.ListAccess.list_uuid == list_uuid_obj, list_access.ListAccess.owner_uuid == user_uuid).first()
    if not la_current:
        raise HTTPException(status_code=404, detail="List not found")

    # Find ListAccess for other_user
    la_other = session.query(list_access.ListAccess).filter(list_access.ListAccess.list_uuid == list_uuid_obj, list_access.ListAccess.owner_uuid == other_user_uuid_obj).first()
    if not la_other:
        raise HTTPException(status_code=404, detail="User does not have access")

    # Delete ListAccess
    session.delete(la_other)
    session.commit()

    # No return needed, will return 204
