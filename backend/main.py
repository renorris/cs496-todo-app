import base64
import json
import os
from typing import Union, Annotated
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import SQLModel, create_engine, Session
from pydantic import BaseModel
from jose import jwe

import resend

from models.user import User

# Define engine
engine = create_engine("postgresql://localhost:5432/todoapp", echo=True)

# Create default tables
SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

# Configure resend
resend.api_key = os.environ["RESEND_API_KEY"]
app = FastAPI()


@app.get("/")
def read_root():
    return {"hello": "world"}

class CreateUserBody(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str

@app.post("/user/")
def create_user(reqBody: CreateUserBody, session: SessionDep):
    # Check if the email is already in use
    email: str = reqBody.email
    rows = session.query(User).filter(getattr(User, "email") == email)
    u = rows.first()
    if u is not None:
        raise HTTPException(status_code=409, detail="email already in use")

    # Generate registration token
    regToken = {}

    secretKey = os.environ["JWE_SECRET_KEY"]
    regTokenBytes = jwe.encrypt(json.dumps(regToken).encode(), secretKey, algorithm='dir', encryption='A256GCM')
    regTokenBase64 = base64.b64encode(regTokenBytes)

    # Send confirmation email
    params: resend.Emails.SendParams = {
        "from": "noreply@resend.reesenorr.is",
        "to": [email],
        "subject": "Confirm your email",
        "html": f"<a href=\"localhost:8000/user/confirm/{regTokenBase64}\">Click here to confirm</a>",
    }
    email: resend.Email = resend.Emails.send(params)

    return
