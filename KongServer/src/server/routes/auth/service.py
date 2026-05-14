from datetime import datetime, timedelta
from jose import JWTError, jwt
from jose.exceptions import JWKError

from fastapi.security.utils import get_authorization_scheme_param
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import pytz

from .schema import User, JWTData, UserAuthRequest
from .utils import jwt_decode
from .exceptions import DuplicateUserException
from .config import ACCESS_TOKEN_EXPIRE_DAYS

from src.server.database.db import DBConnection
from src.server.database.exceptions import MongoUnacknowledgeError

from logging import getLogger

logger = getLogger("base")
db_conn = DBConnection()

# Change this to use secrets manager at some point
SECRET_KEY = "gangster_lean_boogie"
ALGORITHM = "HS256"

def generate_token(email):
    now = datetime.utcnow()
    exp = (now + timedelta(seconds=3600000)).timestamp()
    data = {
        "exp": exp,
        "email": email,
    }
    return jwt.encode(data, SECRET_KEY, algorithm="HS256")

def extract_user_email_jwt(request: Request):
    # try:
    #     # print(request.headers)
    #     authorization: str = request.headers.get("Authorization")
    #     scheme, param = get_authorization_scheme_param(authorization)
    #     if not authorization or scheme.lower() != "bearer":
    #         print(
    #             f"Malformed authorization header. Scheme: {scheme} Param: {param} Authorization: {authorization}"
    #         )
    #         return

    #     token = authorization.split()[1]
    #     data = jwt.decode(token, SECRET_KEY)
    # except (JWKError, JWTError, IndexError, KeyError):
    #     raise HTTPException(
    #         status_code=401,
    #         detail=[{"msg": "Could not validate credentials"}],
    #     ) from None
    
    # return data["email"]
    return True

def create_user(authReq: UserAuthRequest) -> User:
    user = User(**authReq.dict())

    print("Creating user: ", user)
    
    res = db_conn.get_collection("users").insert_one(user.dict())

    # IDK about this exception
    if not res.acknowledged:
        raise MongoUnacknowledgeError("User creation Unacknowledged")

    return generate_token(authReq.email)

def delete_user(user: User) -> User:
    res = db_conn.get_collection("users").delete_one(user.dict())

    if not res.acknowledged:
        raise MongoUnacknowledgeError("User deletion Unacknowledged")

    return True
    

def get_user_by_id(authReq: UserAuthRequest) -> User | None:
    user_dict = db_conn.get_collection("users").find_one({
        "id": authReq.id
    })

    if user_dict:
        return User(**user_dict)

    return None

def get_email_from_user(request: UserAuthRequest) -> str:
    return request.email

def get_user_by_email(email: str = Depends(get_email_from_user)) -> User | None:
    user_dict = db_conn.get_collection("users").find_one({
        "email": email
    })

    if user_dict:
        return User(**user_dict)

    return None

# probably should make this depend on another dependency to retrieve the user
def get_user_from_token(email: JWTData = Depends(extract_user_email_jwt)) -> User:
    """
    Extract the username from the decoded JWT token.
    """
    # if not email:
    #     raise HTTPException(
    #         status_code=400, detail="Email not present in the token"
    #     )

    # user = get_user_by_email(email)
    # if not user:
    #     raise HTTPException(
    #         status_code=400, detail="Not a registered user"
    #     )

    return User(
        email="fake@email.com",
        password="fakepassword",
        id="fakeid",
    )
