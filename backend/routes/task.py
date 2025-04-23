from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
from ..database import get_session
from ..models.task import Task
from ..models.list_access import ListAccess
from .middleware import get_current_user

# Pydantic models for request bodies
class CreateTaskBody(BaseModel):
    title: str
    description: str
    due_date: datetime
    done: bool = False  # Default to False

class UpdateTaskBody(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    done: Optional[bool] = None

# Define the router with prefix
task_router = APIRouter()

# Create a new task
@task_router.post("/")
def create_task(list_uuid: uuid.UUID, reqBody: CreateTaskBody, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    
    # Check if current user has access to the list
    la = session.query(ListAccess).filter(ListAccess.list_uuid == list_uuid, ListAccess.owner_uuid == user_uuid).first()
    if not la:
        raise HTTPException(status_code=404, detail="List not found")
    
    # Create a new task
    new_task = Task()
    new_task.uuid = uuid.uuid4()
    new_task.list_uuid = list_uuid
    new_task.created_at = datetime.now()
    new_task.title = reqBody.title
    new_task.description = reqBody.description
    new_task.due_date = reqBody.due_date
    new_task.done = reqBody.done
    
    session.add(new_task)
    session.commit()
    session.refresh(new_task)
    
    # Return the created task
    return {
        "uuid": str(new_task.uuid),
        "list_uuid": str(new_task.list_uuid),
        "created_at": new_task.created_at.isoformat(),
        "title": new_task.title,
        "description": new_task.description,
        "due_date": new_task.due_date.isoformat(),
        "done": new_task.done
    }

# Get all tasks for a list
@task_router.get("/")
def get_tasks(list_uuid: uuid.UUID, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    
    # Check if current user has access to the list
    la = session.query(ListAccess).filter(ListAccess.list_uuid == list_uuid, ListAccess.owner_uuid == user_uuid).first()
    if not la:
        raise HTTPException(status_code=404, detail="List not found")
    
    # Get all tasks for this list
    tasks = session.query(Task).filter(Task.list_uuid == list_uuid).order_by(Task.due_date.desc()).all()
    
    # Return list of tasks
    return [{
        "uuid": str(t.uuid),
        "list_uuid": str(t.list_uuid),
        "created_at": t.created_at.isoformat(),
        "title": t.title,
        "description": t.description,
        "due_date": t.due_date.isoformat(),
        "done": t.done
    } for t in tasks]

# Get a single task
@task_router.get("/{task_uuid}")
def get_task(list_uuid: uuid.UUID, task_uuid: uuid.UUID, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    
    # Check if current user has access to the list
    la = session.query(ListAccess).filter(ListAccess.list_uuid == list_uuid, ListAccess.owner_uuid == user_uuid).first()
    if not la:
        raise HTTPException(status_code=404, detail="List not found")
    
    # Get the task
    task = session.query(Task).filter(Task.uuid == task_uuid, Task.list_uuid == list_uuid).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {
        "uuid": str(task.uuid),
        "list_uuid": str(task.list_uuid),
        "created_at": task.created_at.isoformat(),
        "title": task.title,
        "description": task.description,
        "due_date": task.due_date.isoformat(),
        "done": task.done
    }

# Update a task
@task_router.put("/{task_uuid}")
def update_task(list_uuid: uuid.UUID, task_uuid: uuid.UUID, reqBody: UpdateTaskBody, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    
    # Check if current user has access to the list
    la = session.query(ListAccess).filter(ListAccess.list_uuid == list_uuid, ListAccess.owner_uuid == user_uuid).first()
    if not la:
        raise HTTPException(status_code=404, detail="List not found")
    
    # Get the task
    task = session.query(Task).filter(Task.uuid == task_uuid, Task.list_uuid == list_uuid).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update fields if provided
    if reqBody.title is not None:
        task.title = reqBody.title
    if reqBody.description is not None:
        task.description = reqBody.description
    if reqBody.due_date is not None:
        task.due_date = reqBody.due_date
    if reqBody.done is not None:
        task.done = reqBody.done
    
    session.add(task)
    session.commit()
    session.refresh(task)
    
    return {
        "uuid": str(task.uuid),
        "list_uuid": str(task.list_uuid),
        "created_at": task.created_at.isoformat(),
        "title": task.title,
        "description": task.description,
        "due_date": task.due_date.isoformat(),
        "done": task.done
    }

# Delete a task
@task_router.delete("/{task_uuid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(list_uuid: uuid.UUID, task_uuid: uuid.UUID, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    user_uuid = uuid.UUID(current_user['uuid'])
    
    # Check if current user has access to the list
    la = session.query(ListAccess).filter(ListAccess.list_uuid == list_uuid, ListAccess.owner_uuid == user_uuid).first()
    if not la:
        raise HTTPException(status_code=404, detail="List not found")
    
    # Get the task
    task = session.query(Task).filter(Task.uuid == task_uuid, Task.list_uuid == list_uuid).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Delete the task
    session.delete(task)
    session.commit()
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)
