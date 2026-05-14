from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends, Body

from .exceptions import DuplicateUserException, MissingUserException
from .schema import User, RegisterUserResponse, UserAuthRequest
from .service import (
    get_user_by_id,
    create_user,
    delete_user,
    get_user_by_email,
)

from src.server.routes.common.schema import RequestSuccess

router = APIRouter()


@router.post("/register")
def register_user_route(
    request: UserAuthRequest, user: Optional[User] = Depends(get_user_by_email)
):
    if user:
        raise DuplicateUserException

    token = create_user(request)

    return {"token": token}


@router.get("/delete/{user_id}", response_model=RegisterUserResponse)
def delete_user_route(user_id: str, user: bool = Depends(get_user_by_id)):
    if not user:
        raise MissingUserException

    delete_user(user_id)

    return {"message": "success"}


# TODO: authenticate endpoint