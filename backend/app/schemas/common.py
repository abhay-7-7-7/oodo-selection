from typing import TypeVar, Generic, List
from pydantic import BaseModel

T = TypeVar("T")


class MessageResponse(BaseModel):
    detail: str


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    page: int
    page_size: int
    total: int
