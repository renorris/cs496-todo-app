import datetime
import json
import os
import uuid
from typing import Union, Annotated
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import SQLModel, create_engine, Session
from pydantic import BaseModel
from jose import jwe
import bcrypt

import resend

import models.user
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
    if u:
        raise HTTPException(status_code=409, detail="email already in use")

    # Generate registration token
    regToken = {
        "email": reqBody.email,
        "password": reqBody.password,
        "first_name": reqBody.first_name,
        "last_name": reqBody.last_name,
    }
    regTokenJSON = json.dumps(regToken).encode('utf-8')

    secretKey = os.environ["JWE_SECRET_KEY"]
    regTokenCiphertext = jwe.encrypt(regTokenJSON, secretKey, algorithm='dir', encryption='A256GCM').decode('utf-8')

    print(regTokenCiphertext)

    emailTemplate = open('email_template.html')
    if not emailTemplate:
        raise HTTPException(status_code=500, detail="unable to open email template")

    formattedEmailStr = emailTemplate.read().format(regTokenCiphertext)

    print(regTokenCiphertext)
    print(formattedEmailStr)

    return

    # Send confirmation email
    params: resend.Emails.SendParams = {
        "from": "noreply@resend.reesenorr.is",
        "to": [email],
        "subject": "Confirm your email",
        "html": f'<a href="localhost:8000/user/confirm/{regTokenCiphertext}">Click here to confirm</a>',
    }
    resend.Emails.send(params)

    return

@app.get("/user/confirm/{regTokenCiphertext}")
def create_user(regTokenCiphertext: str, session: SessionDep):
    secretKey = os.environ["JWE_SECRET_KEY"]
    regTokenPlaintext = jwe.decrypt(regTokenCiphertext, secretKey)

    regDetails = json.loads(regTokenPlaintext)

    user = models.user.User()

    user.email = regDetails['email']
    user.last_name = regDetails['last_name']
    user.first_name = regDetails['first_name']

    plaintextPassword = regDetails['password'].encode()
    salt = bcrypt.gensalt()
    passwordHash = bcrypt.hashpw(plaintextPassword, salt).decode('utf-8')
    user.password = passwordHash

    now = datetime.datetime.now()
    user.created_at = now

    newUUID = uuid.uuid4()
    user.uuid = newUUID

    session.add(user)
    session.commit()
