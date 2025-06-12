from sqlalchemy import create_engine, text, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import Dict, List, Any, Optional
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# SQLAlchemy engine with connection pooling
engine = create_engine(
    settings.database_url,
    poolclass=QueuePool,
    pool_size=settings.db_min_connections,
    max_overflow=settings.db_max_connections - settings.db_min_connections,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=settings.debug,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Session:
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class DatabaseService:
    """Service for database operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_tables(self) -> List[str]:
        """Get list of all tables in the database."""
        try:
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            logger.info(f"Found {len(tables)} tables in database")
            return sorted(tables)
        except Exception as e:
            logger.error(f"Error getting tables: {e}")
            # Return mock tables for development if database connection fails
            if "test" in str(engine.url) or "localhost" in str(engine.url):
                logger.warning("Database connection failed, returning mock tables for development")
                return ["aggiudicatari_data", "cig_data", "contratti", "fornitori"]
            raise

    def get_table_schema(self, table_name: str) -> Dict[str, Any]:
        """Get schema information for a specific table."""
        try:
            inspector = inspect(engine)
            
            # Check if table exists
            if table_name not in inspector.get_table_names():
                raise ValueError(f"Table '{table_name}' does not exist")

            columns = inspector.get_columns(table_name)
            primary_keys = inspector.get_pk_constraint(table_name)
            foreign_keys = inspector.get_foreign_keys(table_name)
            indexes = inspector.get_indexes(table_name)

            return {
                "table_name": table_name,
                "columns": [
                    {
                        "name": col["name"],
                        "type": str(col["type"]),
                        "nullable": col["nullable"],
                        "default": col["default"],
                        "autoincrement": col.get("autoincrement", False),
                    }
                    for col in columns
                ],
                "primary_keys": primary_keys["constrained_columns"],
                "foreign_keys": [
                    {
                        "constrained_columns": fk["constrained_columns"],
                        "referred_table": fk["referred_table"],
                        "referred_columns": fk["referred_columns"],
                    }
                    for fk in foreign_keys
                ],
                "indexes": [
                    {
                        "name": idx["name"],
                        "columns": idx["column_names"],
                        "unique": idx["unique"],
                    }
                    for idx in indexes
                ],
            }
        except Exception as e:
            logger.error(f"Error getting schema for table {table_name}: {e}")
            raise

    def execute_query(
        self,
        table_name: str,
        filters: Optional[Dict[str, Any]] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        order_by: Optional[str] = None,
        order_dir: str = "asc",
    ) -> Dict[str, Any]:
        """Execute a parametrized query on a table."""
        try:
            # Validate table exists
            if table_name not in self.get_tables():
                raise ValueError(f"Table '{table_name}' does not exist")

            # Get table schema for validation
            schema = self.get_table_schema(table_name)
            column_names = [col["name"] for col in schema["columns"]]

            # Build base query
            query_parts = [f"SELECT * FROM `{table_name}`"]
            params = {}
            
            # WHERE conditions
            where_conditions = []
            
            # Apply filters
            if filters:
                for column, value in filters.items():
                    if column not in column_names:
                        raise ValueError(f"Column '{column}' does not exist in table '{table_name}'")
                    
                    if value is not None:
                        param_name = f"filter_{column}"
                        where_conditions.append(f"`{column}` = :{param_name}")
                        params[param_name] = value

            # Apply search (full-text search on string columns)
            if search:
                search_conditions = []
                text_columns = [
                    col["name"] for col in schema["columns"]
                    if "varchar" in str(col["type"]).lower() or "text" in str(col["type"]).lower()
                ]
                
                for col in text_columns:
                    search_conditions.append(f"`{col}` LIKE :search_term")
                
                if search_conditions:
                    where_conditions.append(f"({' OR '.join(search_conditions)})")
                    params["search_term"] = f"%{search}%"

            # Add WHERE clause if conditions exist
            if where_conditions:
                query_parts.append(f"WHERE {' AND '.join(where_conditions)}")

            # ORDER BY
            if order_by and order_by in column_names:
                direction = "DESC" if order_dir.lower() == "desc" else "ASC"
                query_parts.append(f"ORDER BY `{order_by}` {direction}")

            # Count query for pagination
            count_query = " ".join(query_parts).replace("SELECT *", "SELECT COUNT(*)")
            count_result = self.db.execute(text(count_query), params).scalar()

            # Add pagination
            offset = (page - 1) * page_size
            query_parts.append(f"LIMIT :limit OFFSET :offset")
            params["limit"] = page_size
            params["offset"] = offset

            # Execute main query
            final_query = " ".join(query_parts)
            logger.info(f"Executing query: {final_query}")
            logger.info(f"Parameters: {params}")
            
            result = self.db.execute(text(final_query), params)
            rows = result.fetchall()
            
            # Convert rows to dictionaries
            data = [dict(row._mapping) for row in rows]
            
            # Calculate pagination info
            total_pages = (count_result + page_size - 1) // page_size
            
            return {
                "data": data,
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total_items": count_result,
                    "total_pages": total_pages,
                    "has_next": page < total_pages,
                    "has_prev": page > 1,
                },
                "query_info": {
                    "table_name": table_name,
                    "filters_applied": bool(filters),
                    "search_applied": bool(search),
                    "order_by": order_by,
                    "order_dir": order_dir,
                }
            }

        except Exception as e:
            logger.error(f"Error executing query on table {table_name}: {e}")
            raise


def check_database_connection() -> bool:
    """Check if database connection is working."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False 