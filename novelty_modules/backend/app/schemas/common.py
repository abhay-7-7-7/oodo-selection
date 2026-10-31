from pydantic import BaseModel
from typing import Optional


class MessageResponse(BaseModel):
    message: str
    success: bool = True


class PaginatedMeta(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int
