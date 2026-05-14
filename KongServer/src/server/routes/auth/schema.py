import re
from datetime import datetime
from typing import List
from pydantic import Field, validator, BaseModel, root_validator
from pydantic import EmailStr

from typing import Optional
from uuid import uuid4

import string
import secrets
from jose import jwt
from typing import Optional
from pydantic import validator, Field, BaseModel
from typing import List
from datetime import datetime, timedelta

STRONG_PASSWORD_PATTERN = re.compile(r"^(?=.*[\d])(?=.*[!@#$%^&*])[\w!@#$%^&*]{6,128}$")



class WeakPasswordError(Exception):
    def __init__(self):
        super().__init__(
            message="""
                Password must contain at least
                one lower character, 
                one upper character, digit or special symbol
            """
        )


class InvalidEmailError(Exception):
    def __init__(self):
        super().__init__(message="Invalid email format")


class UserAuthRequest(BaseModel):
    # change at your own risk
    email: Optional[str] = ""
    password: Optional[str] = Field(max_length=128, default="")

    @root_validator(pre=True)
    def validate_or_anon_auth(cls, values):
        email = values.get("email", None)
        values["email"] = f"testemail{str(uuid4())[:8]}@hotmail.com"
        
        password = values.get("password", None)
        if not password:
            password = f"{str(uuid4())[:8]}"
        
        values["password"] = password

        return values
    
class User(BaseModel):
    email: str
    password: str = Field(max_length=128)
    graphs: List[str] = Field(default_factory=list)
    id: str = Field(default_factory=lambda: str(uuid4()))

class RegisterUserResponse(BaseModel):
    email: str


class JWTData(BaseModel):
    email: str
    exp: datetime
