from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.auth import utcnow


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    school: Mapped[str] = mapped_column(String(200))
    grade: Mapped[int] = mapped_column(Integer)
    project_title: Mapped[str] = mapped_column(String(200))
    project_description: Mapped[str] = mapped_column(Text)
    project_stage: Mapped[str] = mapped_column(String(20))
    support_needs: Mapped[list[str]] = mapped_column(JSON)
    support_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )
