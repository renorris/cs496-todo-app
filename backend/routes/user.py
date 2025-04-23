from datetime import timedelta
import urllib.parse

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlmodel import Session
from ..models.user import User
from ..database import get_session

from ..utils.token import generate_registration_token, decrypt_registration_token, parse_jwt_token, generate_jwt_token
from ..utils.email import send_confirmation_email
from pydantic import BaseModel
import bcrypt
import datetime
import uuid
import urllib

user_router = APIRouter()

class CreateUserBody(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str

@user_router.post("/create")
def create_user(reqBody: CreateUserBody, session: Session = Depends(get_session)):
    # Check if the email is already in use
    email: str = reqBody.email
    rows = session.query(User).filter(User.email == email)
    u = rows.first()
    if u:
        raise HTTPException(status_code=409, detail="email already in use")

    # Generate encrypted registration token
    regTokenCiphertext = generate_registration_token(
        email=reqBody.email,
        password=reqBody.password,
        first_name=reqBody.first_name,
        last_name=reqBody.last_name
    )

    # Send confirmation email
    send_confirmation_email(email, regTokenCiphertext)

    return {"message": "Confirmation email sent"}

@user_router.get("/confirm/{regTokenCiphertext}")
def confirm_user(regTokenCiphertext: str, session: Session = Depends(get_session)):
    # Decrypt the registration token
    try:
        regDetails = decrypt_registration_token(regTokenCiphertext)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid token")

    # Create the user
    user = User()
    user.email = regDetails["email"]
    user.first_name = regDetails["first_name"]
    user.last_name = regDetails["last_name"]

    # Hash the password
    plaintext_password = regDetails["password"].encode()
    salt = bcrypt.gensalt()
    user.password = bcrypt.hashpw(plaintext_password, salt).decode("utf-8")

    # Set additional fields
    user.created_at = datetime.datetime.now()
    user.uuid = uuid.uuid4()

    # Save to database
    session.add(user)
    session.commit()

    access_token = generate_jwt_token(user, timedelta(0, 60 * 15), "access")
    refresh_token = generate_jwt_token(user, timedelta(1), "refresh")

    response = RedirectResponse(url=f"https://todoapp.reesenorr.is/postsignup?access_token={access_token}&refresh_token={refresh_token}", status_code=302)
    return response

class LoginUserBody(BaseModel):
    email: str
    password: str

@user_router.post("/login")
def login_user(req_body: LoginUserBody, session: Session = Depends(get_session)):
    email: str = req_body.email
    rows = session.query(User).filter(User.email == email)
    user = rows.first()
    if not user:
        raise HTTPException(status_code=401, detail="bad credentials")

    print(user)

    if not bcrypt.checkpw(req_body.password.encode(), user.password.encode()):
        raise HTTPException(status_code=401, detail="bad credentials")

    access_token = generate_jwt_token(user, timedelta(0, 60 * 15), "access")
    refresh_token = generate_jwt_token(user, timedelta(1), "refresh")

    return {
        'access_token': access_token,
        'refresh_token': refresh_token
    }

class RefreshAccessTokenBody(BaseModel):
    refresh_token: str

@user_router.post("/refresh")
def refresh(req_body: RefreshAccessTokenBody, session: Session = Depends(get_session)):
    refresh_token_str = req_body.refresh_token
    refresh_token = parse_jwt_token(refresh_token_str)
    
    if refresh_token.token_type != "refresh":
        raise HTTPException(status_code=400, detail="bad token")
    
    rows = session.query(User).filter(User.email == refresh_token.email)
    user = rows.first()
    if not user:
        raise HTTPException(status_code=401, detail="unauthorized")

    access_token_str = generate_jwt_token(user, timedelta(days=0, minutes=15), "access")

    return {
        'access_token': access_token_str
    }
