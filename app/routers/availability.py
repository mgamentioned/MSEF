from datetime import datetime, timedelta, timezone
from typing import Annotated
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser
from app.models import MentorSchedule, User
from app.schemas.availability import ScheduleIn, ScheduleOut, SlotOut

router = APIRouter(prefix="/availability", tags=["availability"])

DbSession = Annotated[Session, Depends(get_db)]

# the rules, in one place
SESSION_MINUTES = 30
BUFFER_MINUTES = 15
MIN_NOTICE_HOURS = 24
BOOKING_WINDOW_DAYS = 7
MAX_WINDOWS_PER_DAY = 3


def validate_schedule(data: ScheduleIn) -> None:
    try:
        ZoneInfo(data.timezone)
    except (ZoneInfoNotFoundError, ValueError, OSError):
        raise HTTPException(status_code=400, detail="Unknown timezone")

    by_day: dict[int, list] = {}
    for w in data.windows:
        if w.start % 15 or w.end % 15:
            raise HTTPException(
                status_code=400, detail="Times must be on the quarter hour"
            )
        if w.end - w.start < SESSION_MINUTES:
            raise HTTPException(
                status_code=400,
                detail=f"Each time window must be at least {SESSION_MINUTES} minutes long",
            )
        by_day.setdefault(w.weekday, []).append(w)

    for windows in by_day.values():
        if len(windows) > MAX_WINDOWS_PER_DAY:
            raise HTTPException(
                status_code=400,
                detail=f"Use at most {MAX_WINDOWS_PER_DAY} time windows per day",
            )
        windows.sort(key=lambda w: w.start)
        for a, b in zip(windows, windows[1:]):
            if b.start < a.end:
                raise HTTPException(
                    status_code=400,
                    detail="Time windows on the same day can't overlap",
                )


def bookable_slots(timezone_name: str, windows: list[dict], now: datetime):
    """Turns weekly hours into the exact times a student could request.

    Only times at least MIN_NOTICE_HOURS away and less than
    BOOKING_WINDOW_DAYS away are included.
    """
    tz = ZoneInfo(timezone_name)
    earliest = now + timedelta(hours=MIN_NOTICE_HOURS)
    latest = now + timedelta(days=BOOKING_WINDOW_DAYS)
    step = SESSION_MINUTES + BUFFER_MINUTES

    slots = []
    first_day = now.astimezone(tz).date()
    for offset in range(BOOKING_WINDOW_DAYS + 2):
        day = first_day + timedelta(days=offset)
        for w in windows:
            if w["weekday"] != day.weekday():
                continue
            t = w["start"]
            while t + SESSION_MINUTES <= w["end"]:
                local = datetime(
                    day.year, day.month, day.day, t // 60, t % 60, tzinfo=tz
                )
                start = local.astimezone(timezone.utc)
                if earliest <= start < latest:
                    slots.append((start, start + timedelta(minutes=SESSION_MINUTES)))
                t += step
    slots.sort()
    return slots


def require_mentor(user: User) -> None:
    if user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors set availability")


@router.get("/me", response_model=ScheduleOut)
def get_my_schedule(user: CurrentUser, db: DbSession):
    require_mentor(user)
    schedule = (
        db.query(MentorSchedule).filter(MentorSchedule.user_id == user.id).first()
    )
    if schedule is None:
        return ScheduleOut(timezone=None, windows=[])
    return ScheduleOut(timezone=schedule.timezone, windows=schedule.windows)


@router.put("/me", response_model=ScheduleOut)
def save_my_schedule(data: ScheduleIn, user: CurrentUser, db: DbSession):
    require_mentor(user)
    validate_schedule(data)
    windows = sorted(
        (w.model_dump() for w in data.windows), key=lambda w: (w["weekday"], w["start"])
    )
    schedule = (
        db.query(MentorSchedule).filter(MentorSchedule.user_id == user.id).first()
    )
    if schedule is None:
        schedule = MentorSchedule(user_id=user.id)
        db.add(schedule)
    schedule.timezone = data.timezone
    schedule.windows = windows
    db.commit()
    return ScheduleOut(timezone=schedule.timezone, windows=schedule.windows)


@router.get("/mentors/{mentor_id}/slots", response_model=list[SlotOut])
def mentor_slots(mentor_id: int, user: CurrentUser, db: DbSession):
    """The times a student can currently request with this mentor."""
    mentor = db.get(User, mentor_id)
    if mentor is None or mentor.role != "mentor":
        raise HTTPException(status_code=404, detail="Mentor not found")
    schedule = (
        db.query(MentorSchedule).filter(MentorSchedule.user_id == mentor_id).first()
    )
    if schedule is None:
        return []
    now = datetime.now(timezone.utc)
    # later: also remove times that already have a confirmed meeting
    return [
        SlotOut(start=start, end=end)
        for start, end in bookable_slots(schedule.timezone, schedule.windows, now)
    ]
