from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser
from app.models import StudentProfile, User
from app.schemas.profile import StudentProfileIn, StudentProfileOut

router = APIRouter(prefix="/profile", tags=["profile"])

DbSession = Annotated[Session, Depends(get_db)]


def require_student(user: User) -> None:
    if user.role != "student":
        raise HTTPException(status_code=403, detail="Only students have this profile")


@router.get("/me", response_model=StudentProfileOut)
def get_my_profile(user: CurrentUser, db: DbSession):
    require_student(user)
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if profile is None:
        raise HTTPException(status_code=404, detail="No profile yet")
    return profile


@router.put("/me", response_model=StudentProfileOut)
def save_my_profile(data: StudentProfileIn, user: CurrentUser, db: DbSession):
    """Creates the profile the first time, updates it afterwards."""
    require_student(user)
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if profile is None:
        profile = StudentProfile(user_id=user.id)
        db.add(profile)
    for field, value in data.model_dump().items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile
