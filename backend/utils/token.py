import json
import os
import jwt
from uuid import UUID
from datetime import timedelta, datetime, timezone
from jose import jwe
from ..models.user import User

def generate_registration_token(email: str, password: str, first_name: str, last_name: str) -> str:
    """Generate and encrypt a registration token."""
    reg_token = {
        "email": email,
        "password": password,
        "first_name": first_name,
        "last_name": last_name,
    }
    reg_token_json = json.dumps(reg_token).encode("utf-8")
    secret_key = os.environ["SECRET_KEY"]
    reg_token_ciphertext = jwe.encrypt(reg_token_json, secret_key, algorithm="dir", encryption="A256GCM").decode("utf-8")
    return reg_token_ciphertext

def decrypt_registration_token(reg_token_ciphertext: str) -> dict:
    """Decrypt a registration token and return its contents."""
    secret_key = os.environ["SECRET_KEY"]
    reg_token_plaintext = jwe.decrypt(reg_token_ciphertext, secret_key)
    return json.loads(reg_token_plaintext)

def generate_jwt_token(user: User, expires_delta: timedelta, token_type: str) -> str:
    data = dict()
    data['token_type'] = token_type
    data['uuid'] = str(user.uuid)
    data['email'] = user.email
    data['first_name'] = user.first_name
    data['last_name'] = user.last_name

    # Add expiry time
    data['exp'] = datetime.now(timezone.utc) + expires_delta

    secret_key = os.getenv("SECRET_KEY")
    encoded_jwt = jwt.encode(data, secret_key, algorithm="HS256")

    return encoded_jwt

class TokenClaims:
    token_type: str
    uuid: UUID
    email: str
    first_name: str
    last_name: str

def parse_jwt_token(raw_token: str) -> TokenClaims:
    secret_key = os.getenv("SECRET_KEY")
    token = jwt.decode(raw_token, secret_key)

    claims = TokenClaims()
    claims.token_type = token['token_type']
    claims.uuid = UUID(token['uuid'])
    claims.email = token['email']
    claims.first_name = token['first_name']
    claims.last_name = token['last_name']

    return claims