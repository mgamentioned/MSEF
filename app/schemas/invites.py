from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class InviteCreate(BaseModel):
    role: str | None = None
    expires_in_days: int = Field(default=7, ge=1, le=60)
    max_uses: int | None = Field(default=None, ge=1, le=500)


class InviteOut(BaseModel):
    token: str
    role: str
    expires_at: datetime
    max_uses: int | None
    use_count: int

    model_config = {"from_attributes": True}


class InviteInfo(BaseModel):
    role: str
    expires_at: datetime


class JoinIn(BaseModel):
    token: str
    email: EmailStr


class JoinOut(BaseModel):
    message: str
    role: str
