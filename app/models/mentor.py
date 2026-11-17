from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, LargeBinary, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.auth import utcnow


class MentorProfile(Base):
    __tablename__ = "mentor_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), unique=True, index=True
    )
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    profession: Mapped[str] = mapped_column(String(150))
    organization: Mapped[str | None] = mapped_column(String(200), nullable=True)
    expertise: Mapped[list[str]] = mapped_column(JSON)
    other_expertise: Mapped[str | None] = mapped_column(String(200), nullable=True)
    bio: Mapped[str] = mapped_column(Text)
    interests: Mapped[list[str]] = mapped_column(JSON)
    other_interests: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class MentorPhoto(Base):
    __tablename__ = "mentor_photos"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), unique=True, index=True
    )
    # random, unguessable id used in the photo's web address; changes on every upload
    key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    data: Mapped[bytes] = mapped_column(LargeBinary)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
