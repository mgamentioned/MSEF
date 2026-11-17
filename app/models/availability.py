from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.auth import utcnow


class MentorSchedule(Base):
    """A mentor's usual weekly hours, kept as one row.

    windows is a list like {"weekday": 0, "start": 930, "end": 1050}, where
    weekday 0 is Monday and start/end are minutes after midnight in the
    mentor's own timezone (930 = 3:30 PM).
    """

    __tablename__ = "mentor_schedules"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), unique=True, index=True
    )
    timezone: Mapped[str] = mapped_column(String(64))
    windows: Mapped[list[dict]] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )
