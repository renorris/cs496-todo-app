from datetime import datetime
import uuid
from ..models.user import User
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session
from pydantic import BaseModel
from sqlalchemy import func, case

from .middleware import get_current_user
from ..database import get_session
from ..models import list, list_access
from ..models.task import Task

list_router = APIRouter()

class CreateListBody(BaseModel):
    title: str
    description: str

@list_router.post("/create")
def create_list(reqBody: CreateListBody, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    # Create a new list with its details
    l = list.List()
    l.uuid = uuid.uuid4()
    l.created_at = datetime.now()
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
        "created_at": l.created_at.isoformat(),
        "title": l.title,
        "description": l.description,
    }

@list_router.get("/")
def get_lists(session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    
    # Fetch all lists with task counts and earliest due date
    lists_with_counts = session.query(
        list.List,
        func.count(Task.uuid).label('total_tasks'),
        func.sum(case((Task.done == True, 1), else_=0)).label('tasks_completed'),
        func.min(Task.due_date).label('earliest_due_date')
    ).join(
        list_access.ListAccess, list.List.uuid == list_access.ListAccess.list_uuid
    ).outerjoin(
        Task, list.List.uuid == Task.list_uuid
    ).filter(
        list_access.ListAccess.owner_uuid == user_uuid
    ).group_by(
        list.List.uuid
    ).order_by(
        list.List.created_at.desc()
    ).all()
    
    # Return lists with details, task counts, and earliest due date
    return [{
        "uuid": str(row.List.uuid),
        "created_at": row.List.created_at.isoformat(),
        "title": row.List.title,
        "description": row.List.description,
        "total_tasks": row.total_tasks,
        "tasks_completed": row.tasks_completed,
        "earliest_due_date": row.earliest_due_date.isoformat() if row.earliest_due_date else None
    } for row in lists_with_counts]

@list_router.get("/{list_uuid}")
def get_list(list_uuid: str, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    list_uuid_obj = uuid.UUID(list_uuid)
    
    # Fetch single list with task counts and earliest due date
    result = session.query(
        list.List,
        func.count(Task.uuid).label('total_tasks'),
        func.sum(case((Task.done == True, 1), else_=0)).label('tasks_completed'),
        func.min(Task.due_date).label('earliest_due_date')
    ).join(
        list_access.ListAccess, list.List.uuid == list_access.ListAccess.list_uuid
    ).outerjoin(
        Task, list.List.uuid == Task.list_uuid
    ).filter(
        list.List.uuid == list_uuid_obj,
        list_access.ListAccess.owner_uuid == user_uuid
    ).group_by(
        list.List.uuid
    ).first()
    
    # If list not found, raise 404
    if result is None:
        raise HTTPException(status_code=404, detail="List not found")
    
    # Return list with details, task counts, and earliest due date
    return {
        "uuid": str(result.List.uuid),
        "created_at": result.List.created_at.isoformat(),
        "title": result.List.title,
        "description": result.List.description,
        "total_tasks": result.total_tasks,
        "tasks_completed": result.tasks_completed,
        "earliest_due_date": result.earliest_due_date.isoformat() if result.earliest_due_date else None
    }

@list_router.put("/{list_uuid}")
def update_list(list_uuid: str, reqBody: CreateListBody, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    list_uuid_obj = uuid.UUID(list_uuid)
    la = session.query(list_access.ListAccess).filter(list_access.ListAccess.list_uuid == list_uuid_obj, list_access.ListAccess.owner_uuid == user_uuid).first()
    if not la:
        raise HTTPException(status_code=404, detail="List not found")
    l = session.query(list.List).filter(list.List.uuid == list_uuid_obj).first()
    if not l:
        raise HTTPException(status_code=404, detail="List not found")
    l.title = reqBody.title
    l.description = reqBody.description
    session.add(l)
    session.commit()
    return {
        "uuid": str(l.uuid),
        "created_at": l.created_at.isoformat(),
        "title": l.title,
        "description": l.description,
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
    l = session.query(list.List).filter(list.List.uuid == list_uuid_obj).first()
    if not l:
        raise HTTPException(status_code=404, detail="List not found")
    
    # Delete the list and its access entry
    session.delete(la)
    session.delete(l)
    session.commit()
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@list_router.get("/{list_uuid}/access")
def get_list_access(list_uuid: str, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    list_uuid_obj = uuid.UUID(list_uuid)

    la_current = session.query(list_access.ListAccess).filter(list_access.ListAccess.list_uuid == list_uuid_obj, list_access.ListAccess.owner_uuid == user_uuid).first()
    if not la_current:
        raise HTTPException(status_code=404, detail="List not found")

    access_list = session.query(list_access.ListAccess).filter(list_access.ListAccess.list_uuid == list_uuid_obj).all()

    users_access = []
    for access in access_list:
        user = session.query(User).filter(User.uuid == access.owner_uuid).first()
        if user:
            users_access.append({
                "uuid": str(user.uuid),
                "name": user.first_name + " " + user.last_name,
                "email": user.email,
            })

    return users_access

@list_router.put("/{list_uuid}/access/{email}")
def add_list_access(list_uuid: str, email: str, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    list_uuid_obj = uuid.UUID(list_uuid)

    # Find user by email
    other_user = session.query(User).filter(User.email.ilike(email)).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    other_user_uuid_obj = other_user.uuid

    # Check if current_user has access to list_uuid
    la_current = session.query(list_access.ListAccess).filter(
        list_access.ListAccess.list_uuid == list_uuid_obj,
        list_access.ListAccess.owner_uuid == user_uuid
    ).first()
    if not la_current:
        raise HTTPException(status_code=404, detail="List not found")

    # Check if other_user already has access
    la_other = session.query(list_access.ListAccess).filter(
        list_access.ListAccess.list_uuid == list_uuid_obj,
        list_access.ListAccess.owner_uuid == other_user_uuid_obj
    ).first()
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
    