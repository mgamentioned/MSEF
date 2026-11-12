from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, field_validator

Name = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]
Short = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)
]
Long = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)
]

Stage = Literal["exploring", "planning", "testing", "sharing"]
Support = Literal[
    "research_question",
    "experimental_design",
    "data_analysis",
    "presentation",
    "general",
    "other",
]


class StudentProfileIn(BaseModel):
    first_name: Name
    last_name: Name
    school: Short
    grade: int = Field(ge=9, le=12)
    project_title: Short
    project_description: Long
    project_stage: Stage
    support_needs: list[Support] = Field(min_length=1)
    support_notes: str | None = Field(default=None, max_length=1000)

    @field_validator("support_needs")
    @classmethod
    def dedupe_support(cls, value: list[str]) -> list[str]:
        return list(dict.fromkeys(value))

    @field_validator("support_notes")
    @classmethod
    def clean_notes(cls, value: str | None) -> str | None:
        value = (value or "").strip()
        return value or None


class StudentProfileOut(StudentProfileIn):
    model_config = {"from_attributes": True}
