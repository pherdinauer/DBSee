from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.models import (
    TableInfo, TableSchema, QueryResult, QueryFilters, User
)
from app.database import get_db, DatabaseService
from app.auth import get_current_active_user
from app.config import settings

router = APIRouter(prefix="/tables", tags=["database"])


@router.get("/", response_model=List[str])
def get_tables(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of all tables in the database."""
    try:
        db_service = DatabaseService(db)
        tables = db_service.get_tables()
        return tables
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving tables: {str(e)}")


@router.get("/{table_name}/schema", response_model=TableSchema)
def get_table_schema(
    table_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get schema information for a specific table."""
    try:
        db_service = DatabaseService(db)
        schema = db_service.get_table_schema(table_name)
        return schema
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving schema: {str(e)}")


@router.post("/{table_name}/query", response_model=QueryResult)
def query_table(
    table_name: str,
    query_params: QueryFilters,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Execute a parametrized query on a table with filters, search, and pagination."""
    try:
        # Validate page size limits
        if query_params.page_size > settings.max_page_size:
            query_params.page_size = settings.max_page_size
        
        db_service = DatabaseService(db)
        result = db_service.execute_query(
            table_name=table_name,
            filters=query_params.filters,
            search=query_params.search,
            page=query_params.page,
            page_size=query_params.page_size,
            order_by=query_params.order_by,
            order_dir=query_params.order_dir
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing query: {str(e)}")


@router.get("/{table_name}/data", response_model=QueryResult)
def get_table_data(
    table_name: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: str = Query(None, description="Search term"),
    order_by: str = Query(None, description="Column to order by"),
    order_dir: str = Query("asc", regex="^(asc|desc)$", description="Order direction"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get table data with optional search, sorting and pagination (GET version)."""
    try:
        # Validate page size limits
        if page_size > settings.max_page_size:
            page_size = settings.max_page_size
        
        db_service = DatabaseService(db)
        result = db_service.execute_query(
            table_name=table_name,
            filters=None,
            search=search,
            page=page,
            page_size=page_size,
            order_by=order_by,
            order_dir=order_dir
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving data: {str(e)}") 