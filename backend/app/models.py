from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional
from datetime import datetime


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class User(UserBase):
    id: int
    is_active: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


class TableInfo(BaseModel):
    name: str
    row_count: Optional[int] = None


class ColumnInfo(BaseModel):
    name: str
    type: str
    nullable: bool
    default: Optional[Any] = None
    autoincrement: bool = False


class ForeignKeyInfo(BaseModel):
    constrained_columns: List[str]
    referred_table: str
    referred_columns: List[str]


class IndexInfo(BaseModel):
    name: str
    columns: List[str]
    unique: bool


class TableSchema(BaseModel):
    table_name: str
    columns: List[ColumnInfo]
    primary_keys: List[str]
    foreign_keys: List[ForeignKeyInfo]
    indexes: List[IndexInfo]


class QueryFilters(BaseModel):
    filters: Optional[Dict[str, Any]] = None
    search: Optional[str] = Field(None, max_length=100)
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    order_by: Optional[str] = None
    order_dir: str = Field("asc", pattern="^(asc|desc)$")


class PaginationInfo(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_prev: bool


class QueryInfo(BaseModel):
    table_name: str
    filters_applied: bool
    search_applied: bool
    order_by: Optional[str]
    order_dir: str


class QueryResult(BaseModel):
    data: List[Dict[str, Any]]
    pagination: PaginationInfo
    query_info: QueryInfo


class HealthCheck(BaseModel):
    status: str
    timestamp: datetime
    database_connected: bool
    version: str = "1.0.0"


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)


class LoginRequest(BaseModel):
    username: str
    password: str 