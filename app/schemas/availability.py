from datetime import datetime

from pydantic import BaseModel, Field


class WindowIn(BaseModel):
    weekday: int = Field(ge=0, le=6)  # 0 = Monday ... 6 = Sunday
    start: int = Field(ge=0, le=1440)  # minutes after midnight
    end: int = Field(ge=0, le=1440)


class ScheduleIn(BaseModel):
    timezone: str = Field(min_length=1, max_length=64)
    windows: list[WindowIn] = Field(max_length=21)


class ScheduleOut(BaseModel):
    timezone: str | None
    windows: list[WindowIn]


class SlotOut(BaseModel):
    start: datetime
    end: datetime
