from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, field_validator

from app.schemas.profile import Name

Profession = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)
]
Bio = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1500)
]

Expertise = Literal[
    "research_design",
    "lab_safety",
    "data_analysis",
    "coding",
    "engineering",
    "other",
]
Interest = Literal[
    "biology",
    "chemistry",
    "physics",
    "environmental",
    "engineering",
    "computer_science",
    "math_data",
    "earth_science",
    "other",
]


class MentorProfileIn(BaseModel):
    first_name: Name
    last_name: Name
    profession: Profession
    organization: str | None = Field(default=None, max_length=200)
    expertise: list[Expertise] = Field(min_length=1)
    other_expertise: str | None = Field(default=None, max_length=200)
    bio: Bio
    interests: list[Interest] = Field(min_length=1)
    other_interests: str | None = Field(default=None, max_length=200)

    @field_validator("expertise", "interests")
    @classmethod
    def dedupe(cls, value: list[str]) -> list[str]:
        return list(dict.fromkeys(value))

    @field_validator("organization", "other_expertise", "other_interests")
    @classmethod
    def blank_to_none(cls, value: str | None) -> str | None:
        value = (value or "").strip()
        return value or None


class MentorProfileOut(MentorProfileIn):
    model_config = {"from_attributes": True}
