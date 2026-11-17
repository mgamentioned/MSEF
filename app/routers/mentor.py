import io
import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser
from app.models import MentorPhoto, MentorProfile, User
from app.schemas.mentor import MentorProfileIn, MentorProfileOut

router = APIRouter(prefix="/mentor-profile", tags=["mentor profile"])

DbSession = Annotated[Session, Depends(get_db)]

MAX_PHOTO_BYTES = 5 * 1024 * 1024
MAX_PHOTO_PIXELS = 25_000_000


def require_mentor(user: User) -> None:
    if user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors have this profile")


@router.get("/me", response_model=MentorProfileOut)
def get_my_profile(user: CurrentUser, db: DbSession):
    require_mentor(user)
    profile = db.query(MentorProfile).filter(MentorProfile.user_id == user.id).first()
    if profile is None:
        raise HTTPException(status_code=404, detail="No profile yet")
    return profile


@router.put("/me", response_model=MentorProfileOut)
def save_my_profile(data: MentorProfileIn, user: CurrentUser, db: DbSession):
    """Creates the profile the first time, updates it afterwards."""
    require_mentor(user)
    profile = db.query(MentorProfile).filter(MentorProfile.user_id == user.id).first()
    if profile is None:
        profile = MentorProfile(user_id=user.id)
        db.add(profile)
    for field, value in data.model_dump().items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


# ---- profile photo ----


def photo_path(photo: MentorPhoto | None) -> str | None:
    return f"/mentor-profile/photo/{photo.key}" if photo else None


def clean_photo(data: bytes) -> bytes:
    """Checks it's really a JPG or PNG, shrinks it, and re-saves it as a JPEG.

    Re-saving also strips hidden metadata such as the location a phone
    records inside photos.
    """
    bad = HTTPException(status_code=400, detail="Please upload a JPG or PNG image")
    try:
        img = Image.open(io.BytesIO(data))
        if img.format not in ("JPEG", "PNG"):
            raise bad
        if img.width * img.height > MAX_PHOTO_PIXELS:
            raise HTTPException(status_code=400, detail="That image is too large")
        img = ImageOps.exif_transpose(img)
        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGBA")
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.getchannel("A"))
            img = background
        else:
            img = img.convert("RGB")
        img.thumbnail((800, 800))
        out = io.BytesIO()
        img.save(out, "JPEG", quality=85)
        return out.getvalue()
    except (UnidentifiedImageError, OSError, ValueError):
        raise bad


@router.get("/me/photo")
def get_my_photo(user: CurrentUser, db: DbSession):
    require_mentor(user)
    photo = db.query(MentorPhoto).filter(MentorPhoto.user_id == user.id).first()
    return {"photo_url": photo_path(photo)}


@router.put("/me/photo")
def upload_my_photo(
    user: CurrentUser, db: DbSession, file: Annotated[UploadFile, File()]
):
    require_mentor(user)
    data = file.file.read(MAX_PHOTO_BYTES + 1)
    if len(data) > MAX_PHOTO_BYTES:
        raise HTTPException(status_code=413, detail="Photo must be 5 MB or smaller")
    jpeg = clean_photo(data)

    photo = db.query(MentorPhoto).filter(MentorPhoto.user_id == user.id).first()
    if photo is None:
        photo = MentorPhoto(user_id=user.id)
        db.add(photo)
    photo.key = secrets.token_urlsafe(16)
    photo.data = jpeg
    db.commit()
    return {"photo_url": photo_path(photo)}


@router.delete("/me/photo")
def delete_my_photo(user: CurrentUser, db: DbSession):
    require_mentor(user)
    photo = db.query(MentorPhoto).filter(MentorPhoto.user_id == user.id).first()
    if photo:
        db.delete(photo)
        db.commit()
    return {"photo_url": None}


@router.get("/photo/{key}")
def serve_photo(key: str, db: DbSession):
    """Public, but only reachable by someone who has the random key."""
    photo = db.query(MentorPhoto).filter(MentorPhoto.key == key).first()
    if photo is None:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(
        content=bytes(photo.data),
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
