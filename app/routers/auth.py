import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import CurrentUser
from app.models import LoginCode, User
from app.schemas.auth import RequestCodeIn, TokenOut, VerifyIn

router = APIRouter(prefix="/auth", tags=["auth"])

DbSession = Annotated[Session, Depends(get_db)]

MAX_ATTEMPTS = 5


def hash_code(email: str, code: str) -> str:
    msg = f"{email}:{code}".encode()
    return hmac.new(settings.secret_key.encode(), msg, hashlib.sha256).hexdigest()


@router.post("/request-code")
def request_code(data: RequestCodeIn, db: DbSession):
    email = data.email.lower()
    user = db.query(User).filter(User.email == email).first()

    # Same response whether or not the email exists, so nobody can
    # use this endpoint to find out who has an account.
    if user:
        code = f"{secrets.randbelow(1_000_000):06d}"
        db.add(
            LoginCode(
                email=email,
                code_hash=hash_code(email, code),
                expires_at=datetime.now(timezone.utc)
                + timedelta(minutes=settings.code_expire_minutes),
            )
        )
        db.commit()
        print(f"\n*** LOGIN CODE for {email}: {code} ***\n")  # dev only: replace with real email

    return {"message": "If that email has an account, a code was sent."}


@router.post("/verify", response_model=TokenOut)
def verify(data: VerifyIn, db: DbSession):
    email = data.email.lower()
    now = datetime.now(timezone.utc)

    login = (
        db.query(LoginCode)
        .filter(
            LoginCode.email == email,
            LoginCode.used.is_(False),
            LoginCode.expires_at > now,
        )
        .order_by(LoginCode.created_at.desc())
        .first()
    )
    if not login or login.attempts >= MAX_ATTEMPTS:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    login.attempts += 1
    if not hmac.compare_digest(login.code_hash, hash_code(email, data.code.strip())):
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    login.used = True
    db.commit()

    user = db.query(User).filter(User.email == email).first()
    expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    token = jwt.encode(
        {"sub": str(user.id), "role": user.role, "exp": expire},
        settings.secret_key,
        algorithm="HS256",
    )
    return TokenOut(access_token=token)


@router.get("/me")
def me(user: CurrentUser):
    return {"id": user.id, "email": user.email, "role": user.role}
