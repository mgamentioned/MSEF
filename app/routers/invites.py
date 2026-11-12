import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser
from app.models import Invite, User
from app.schemas.invites import (
    InviteCreate,
    InviteInfo,
    InviteOut,
    JoinIn,
    JoinOut,
)

router = APIRouter(prefix="/invites", tags=["invites"])

DbSession = Annotated[Session, Depends(get_db)]

# which roles each kind of user is allowed to invite
INVITE_ROLES_FOR = {
    "admin": {"teacher", "mentor"},
    "teacher": {"student"},
}

# these links can only be used once
SINGLE_USE_ROLES = {"teacher", "mentor"}


def invite_is_usable(invite: Invite | None) -> bool:
    if invite is None:
        return False
    if invite.expires_at <= datetime.now(timezone.utc):
        return False
    if invite.max_uses is not None and invite.use_count >= invite.max_uses:
        return False
    return True


@router.post("", response_model=InviteOut)
def create_invite(data: InviteCreate, user: CurrentUser, db: DbSession):
    allowed = INVITE_ROLES_FOR.get(user.role)
    if not allowed:
        raise HTTPException(status_code=403, detail="You can't create invites")

    if data.role is None:
        # teachers only have one choice, so it's the default for them
        if len(allowed) > 1:
            raise HTTPException(
                status_code=422,
                detail="Choose a role: " + " or ".join(sorted(allowed)),
            )
        role = next(iter(allowed))
    else:
        role = data.role
        if role not in allowed:
            raise HTTPException(status_code=403, detail=f"You can't invite a {role}")

    max_uses = 1 if role in SINGLE_USE_ROLES else data.max_uses

    invite = Invite(
        token=secrets.token_urlsafe(32),
        role=role,
        created_by_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=data.expires_in_days),
        max_uses=max_uses,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite


@router.get("", response_model=list[InviteOut])
def my_invites(user: CurrentUser, db: DbSession):
    """The invites the logged-in user created, newest first."""
    return (
        db.query(Invite)
        .filter(Invite.created_by_id == user.id)
        .order_by(Invite.created_at.desc())
        .all()
    )


@router.get("/check/{token}", response_model=InviteInfo)
def check_invite(token: str, db: DbSession):
    """Lets the /join page confirm a link is valid before showing the form."""
    invite = db.query(Invite).filter(Invite.token == token).first()
    if not invite_is_usable(invite):
        raise HTTPException(status_code=404, detail="Invalid or expired invite")
    return invite


@router.post("/join", response_model=JoinOut)
def join(data: JoinIn, db: DbSession):
    email = data.email.lower()

    # lock the invite row so two people can't use the last spot at the same time
    invite = (
        db.query(Invite).filter(Invite.token == data.token).with_for_update().first()
    )
    if not invite_is_usable(invite):
        raise HTTPException(status_code=404, detail="Invalid or expired invite")

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists. Please log in.",
        )

    db.add(User(email=email, role=invite.role, invite_id=invite.id))
    invite.use_count += 1
    db.commit()

    return JoinOut(message="Account created. You can now log in.", role=invite.role)
