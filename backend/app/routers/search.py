from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
import logging
from datetime import datetime
import time
import signal
from fastapi.responses import StreamingResponse
import json

from app.models import User
from app.database import get_db
from app.auth import get_current_active_user, verify_token, get_password_hash

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["search"])

# Priority tables list - aggiudicatari_data is FIRST since it contains actual company winners
PRIORITY_TABLES = [
    'aggiudicatari_data',      # MOST IMPORTANT - Companies/contractors that won contracts
    'cig_data',                # Main CIG table  
    'stazioni_appaltanti_data', # Contracting authorities
    'centri_di_costo_data',    # Cost centers
    'partecipanti_data'        # Participants
]

# Special handling for the most important company table
MAIN_COMPANY_TABLE = 'aggiudicatari_data'
MAIN_COMPANY_COLUMN = 'denominazione'

class CIGSearchService:
    """Service for searching CIG across all database tables"""
    
    def __init__(self, db: Session):
        self.db = db
        self.inspector = inspect(db.bind)
    
    def find_tables_with_cig(self) -> List[str]:
        """Find all tables that contain a CIG field"""
        tables_with_cig = []
        
        try:
            all_tables = self.inspector.get_table_names()
            
            for table_name in all_tables:
                try:
                    columns = self.inspector.get_columns(table_name)
                    for col in columns:
                        if col['name'].lower() == 'cig':
                            tables_with_cig.append(table_name)
                            break
                except Exception:
                    continue
        except Exception as e:
            logger.error(f"Error finding tables with CIG: {str(e)}")
        
        logger.info(f"Found {len(tables_with_cig)} tables with CIG field: {tables_with_cig}")
        return tables_with_cig
    
    def search_cig_in_table(self, table_name: str, cig_value: str) -> Dict[str, Any]:
        """Search for CIG in a specific table"""
        try:
            # Get table columns
            columns = self.inspector.get_columns(table_name)
            column_names = [col['name'] for col in columns]
            
            # Build safe query
            columns_str = ", ".join(column_names)
            query = text(f"SELECT {columns_str} FROM {table_name} WHERE cig = :cig_value")
            
            result = self.db.execute(query, {"cig_value": cig_value})
            rows = result.fetchall()
            
            # Convert to list of dictionaries
            data = []
            for row in rows:
                row_dict = {}
                for i, column_name in enumerate(column_names):
                    value = row[i]
                    # Convert datetime and other types to string for JSON serialization
                    if hasattr(value, 'isoformat'):
                        value = value.isoformat()
                    elif value is None:
                        value = None
                    else:
                        value = str(value)
                    row_dict[column_name] = value
                data.append(row_dict)
            
            return {
                "table_name": table_name,
                "count": len(data),
                "columns": column_names,
                "data": data
            }
            
        except Exception as e:
            logger.error(f"Error searching CIG in table {table_name}: {str(e)}")
            return {
                "table_name": table_name,
                "count": 0,
                "columns": [],
                "data": [],
                "error": str(e)
            }
    
    def search_cig_globally(self, cig_value: str) -> Dict[str, Any]:
        """Search for CIG across all tables and merge all data into a single record"""
        if not cig_value or not cig_value.strip():
            raise ValueError("CIG value is required")
        
        cig_value = cig_value.strip()
        tables_with_cig = self.find_tables_with_cig()
        
        merged_record = {'cig': cig_value}
        source_tables = []
        field_sources = {}  # Track which field came from which table
        
        for table_name in tables_with_cig:
            try:
                # Get table columns
                columns = self.inspector.get_columns(table_name)
                column_names = [col['name'] for col in columns]
                
                # Special handling for aggiudicatari_data to handle ATI
                if table_name == 'aggiudicatari_data':
                    # Check if there are ATI entries
                    ati_check_query = text("""
                        SELECT COUNT(*) FROM aggiudicatari_data 
                        WHERE cig = :cig_value 
                        AND (tipo_soggetto LIKE '%ATI%' OR tipo_soggetto LIKE '%RAGGRUPPAMENT%')
                    """)
                    ati_result = self.db.execute(ati_check_query, {"cig_value": cig_value})
                    ati_count = ati_result.fetchone()[0]
                    
                    if ati_count > 0:
                        # Get all rows for ATI
                        columns_str = ", ".join(column_names)
                        query = text(f"SELECT {columns_str} FROM {table_name} WHERE cig = :cig_value")
                        result = self.db.execute(query, {"cig_value": cig_value})
                        rows = result.fetchall()
                        
                        if rows:
                            source_tables.append(table_name)
                            
                            # Collect all denominazioni and codici_fiscali (use sets to avoid duplicates)
                            denominazioni_set = set()
                            codici_fiscali_set = set()
                            other_fields = {}
                            
                            for row in rows:
                                for i, column_name in enumerate(column_names):
                                    value = row[i]
                                    
                                    # Convert value
                                    if hasattr(value, 'isoformat'):
                                        value = value.isoformat()
                                    elif value is None:
                                        value = None
                                    else:
                                        value = str(value) if value != '' else None
                                    
                                    # Aggregate special fields (avoid duplicates)
                                    if column_name.lower() == 'denominazione' and value and value != 'null':
                                        denominazioni_set.add(value)
                                    elif column_name.lower() == 'codice_fiscale' and value and value != 'null':
                                        codici_fiscali_set.add(value)
                                    else:
                                        # For other fields, take first non-null value
                                        field_key = f"{table_name}_{column_name}" if column_name.lower() != 'cig' else column_name
                                        if field_key not in other_fields and value is not None:
                                            other_fields[field_key] = value
                                            field_sources[field_key] = table_name
                            
                            # Add aggregated denominazioni (sorted for consistency)
                            if denominazioni_set:
                                denominazioni_list = sorted(list(denominazioni_set))
                                merged_record[f"{table_name}_denominazione"] = " + ".join(denominazioni_list)
                                field_sources[f"{table_name}_denominazione"] = table_name
                            
                            # Add aggregated codici_fiscali (sorted for consistency)
                            if codici_fiscali_set:
                                codici_fiscali_list = sorted(list(codici_fiscali_set))
                                merged_record[f"{table_name}_codice_fiscale"] = " + ".join(codici_fiscali_list)
                                field_sources[f"{table_name}_codice_fiscale"] = table_name
                            
                            # Add other fields
                            merged_record.update(other_fields)
                    else:
                        # Standard single row processing for non-ATI
                        columns_str = ", ".join(column_names)
                        query = text(f"SELECT {columns_str} FROM {table_name} WHERE cig = :cig_value LIMIT 1")
                        result = self.db.execute(query, {"cig_value": cig_value})
                        row = result.fetchone()
                        
                        if row:
                            source_tables.append(table_name)
                            for i, column_name in enumerate(column_names):
                                value = row[i]
                                
                                # Convert value
                                if hasattr(value, 'isoformat'):
                                    value = value.isoformat()
                                elif value is None:
                                    value = None
                                else:
                                    value = str(value) if value != '' else None
                                
                                # Create field name
                                field_name = f"{table_name}_{column_name}" if column_name.lower() != 'cig' else column_name
                                merged_record[field_name] = value
                                field_sources[field_name] = table_name
                else:
                    # Standard processing for all other tables
                    columns_str = ", ".join(column_names)
                    query = text(f"SELECT {columns_str} FROM {table_name} WHERE cig = :cig_value LIMIT 1")
                    result = self.db.execute(query, {"cig_value": cig_value})
                    row = result.fetchone()
                    
                    if row:
                        source_tables.append(table_name)
                        for i, column_name in enumerate(column_names):
                            value = row[i]
                            
                            # Convert value
                            if hasattr(value, 'isoformat'):
                                value = value.isoformat()
                            elif value is None:
                                value = None
                            else:
                                value = str(value) if value != '' else None
                            
                            # Create field name
                            field_name = f"{table_name}_{column_name}" if column_name.lower() != 'cig' else column_name
                            merged_record[field_name] = value
                            field_sources[field_name] = table_name
                
            except Exception as e:
                logger.error(f"Error searching table {table_name}: {str(e)}")
                continue
        
        # If no data found
        if len(source_tables) == 0:
            return {
                'cig': cig_value,
                'found': False,
                'merged_data': {},
                'source_tables': [],
                'total_fields': 0,
                'tables_searched': len(tables_with_cig)
            }
        
        return {
            'cig': cig_value,
            'found': True,
            'merged_data': merged_record,
            'source_tables': source_tables,
            'field_sources': field_sources,
            'total_fields': len(merged_record),
            'tables_searched': len(tables_with_cig)
        }

    def search_by_company_name(self, company_name: str) -> Dict[str, Any]:
        """Search for companies by name across all tables"""
        if not company_name or not company_name.strip():
            raise ValueError("Company name is required")
        
        company_name = company_name.strip()
        
        # Get all tables in the database for comprehensive search
        try:
            all_tables = self.inspector.get_table_names()
        except Exception as e:
            logger.error(f"Error getting table names: {str(e)}")
            all_tables = ['aggiudicatari_data', 'cig_data']  # fallback to priority tables
        
        logger.info(f"Searching in {len(all_tables)} tables for company: {company_name}")
        
        results = []
        total_matches = 0
        
        for table_name in all_tables:
            try:
                logger.info(f"Searching in table: {table_name}")
                
                # Get table columns
                columns = self.inspector.get_columns(table_name)
                column_names = [col['name'] for col in columns]
                
                # Find company name columns with special handling for main company table
                company_columns = []
                company_terms = [
                    'denominazione', 'ragione_sociale', 'nome', 'ditta', 'azienda', 
                    'societa', 'impresa', 'company', 'denominacion', 'operatore'
                ]
                
                # Special priority for aggiudicatari_data table
                if table_name == MAIN_COMPANY_TABLE:
                    # For aggiudicatari_data, prioritize denominazione column first
                    if MAIN_COMPANY_COLUMN in column_names:
                        company_columns.append(MAIN_COMPANY_COLUMN)
                    
                    # Then add other company columns
                    for col_name in column_names:
                        lower_col = col_name.lower()
                        if col_name != MAIN_COMPANY_COLUMN and any(term in lower_col for term in company_terms):
                            company_columns.append(col_name)
                else:
                    # For other tables, use standard logic
                    for col_name in column_names:
                        lower_col = col_name.lower()
                        if any(term in lower_col for term in company_terms):
                            company_columns.append(col_name)
                
                # Find date columns for year filtering
                date_columns = []
                date_terms = [
                    'data_', 'date_', 'anno_', 'year_', 'mese_', 'month_'
                ]
                
                for col_name in column_names:
                    lower_col = col_name.lower()
                    if any(term in lower_col for term in date_terms):
                        date_columns.append(col_name)
                
                if not company_columns:
                    logger.info(f"No company columns found in {table_name}, skipping")
                    continue  # Skip tables without company name columns
                
                # Build query with year filter
                where_conditions = []
                params = {}
                
                # Company name conditions with special optimization for main company table
                company_conditions = []
                
                if table_name == MAIN_COMPANY_TABLE and MAIN_COMPANY_COLUMN in company_columns:
                    # For aggiudicatari_data, give extra weight to denominazione column
                    # Use more specific search patterns for better results
                    company_conditions.append(f"{MAIN_COMPANY_COLUMN} LIKE :company_pattern_exact")
                    company_conditions.append(f"{MAIN_COMPANY_COLUMN} LIKE :company_pattern_start")
                    company_conditions.append(f"{MAIN_COMPANY_COLUMN} LIKE :company_pattern_end")
                    params["company_pattern_exact"] = f"%{company_name.strip()}%"
                    params["company_pattern_start"] = f"{company_name.strip()}%"
                    params["company_pattern_end"] = f"%{company_name.strip()}"
                    
                    # Add other columns with standard pattern
                    for col in company_columns:
                        if col != MAIN_COMPANY_COLUMN:
                            company_conditions.append(f"{col} LIKE :company_pattern")
                    params["company_pattern"] = f"%{company_name.strip()}%"
                else:
                    # Standard search for other tables
                    for col in company_columns:
                        company_conditions.append(f"{col} LIKE :company_pattern")
                    params["company_pattern"] = f"%{company_name.strip()}%"
                
                where_conditions.append(f"({' OR '.join(company_conditions)})")
                
                # Year filter conditions
                if year_filter and date_columns:
                    year_conditions = []
                    
                    # Check for anno_ columns (direct year values)
                    anno_columns = [col for col in date_columns if 'anno_' in col.lower()]
                    for col in anno_columns:
                        year_conditions.append(f"{col} = :year_filter")
                    
                    # Check for data_ columns (date fields - extract year)
                    data_columns = [col for col in date_columns if 'data_' in col.lower() and 'anno_' not in col.lower()]
                    for col in data_columns:
                        year_conditions.append(f"YEAR({col}) = :year_filter")
                    
                    if year_conditions:
                        where_conditions.append(f"({' OR '.join(year_conditions)})")
                        params["year_filter"] = year_filter
                
                # Build final WHERE clause
                where_clause = ' AND '.join(where_conditions)
                
                # Higher limit for main company table since it's most important
                if table_name == MAIN_COMPANY_TABLE:
                    result_limit = 10  # More results from the main company table
                elif is_priority:
                    result_limit = 5   # Standard for other priority tables
                else:
                    result_limit = 3   # Fewer for non-priority tables
                columns_str = ", ".join(column_names)
                query = text(f"SELECT {columns_str} FROM {table_name} WHERE {where_clause} LIMIT {result_limit}")
                
                logger.info(f"Executing query on {table_name}: {query}")
                start_time = time.time()
                result = self.db.execute(query, params)
                rows = result.fetchall()
                end_time = time.time()
                logger.info(f"Found {len(rows)} rows in {table_name} in {end_time - start_time:.2f}s")
                
                if rows:
                    table_results = []
                    for row in rows:
                        row_data = {}
                        for i, column_name in enumerate(column_names):
                            value = row[i]
                            
                            # Convert value
                            if hasattr(value, 'isoformat'):
                                value = value.isoformat()
                            elif value is None:
                                value = None
                            else:
                                value = str(value) if value != '' else None
                            
                            row_data[column_name] = value
                        
                        table_results.append(row_data)
                    
                    results.append({
                        'table_name': table_name,
                        'matches': len(table_results),
                        'data': table_results,
                        'company_columns': company_columns,
                        'date_columns': date_columns,
                        'search_time': round(end_time - start_time, 3),
                        'is_priority': is_priority,
                        'year_filter_applied': year_filter is not None and len(date_columns) > 0
                    })
                    
                    total_matches += len(table_results)
                    logger.info(f"Added {len(table_results)} results from {table_name}")
                
            except Exception as e:
                logger.error(f"Error searching company in table {table_name}: {str(e)}")
                continue
        
        logger.info(f"Company search completed. Total matches: {total_matches}")
        
        return {
            'company_name': company_name,
            'found': total_matches > 0,
            'total_matches': total_matches,
            'tables_searched': len(all_tables),
            'results_by_table': results,
            'search_timestamp': None  # Will be set by the endpoint
        }

    def search_company_direct(self, company_name: str, year_filter: Optional[int] = None) -> Dict[str, Any]:
        """
        Direct and efficient company search:
        1. Search aggiudicatari_data for company matches
        2. Get CIGs from matches
        3. Assemble complete data for each CIG found
        """
        if not company_name or not company_name.strip():
            raise ValueError("Company name is required")
        
        company_name = company_name.strip()
        logger.info(f"🎯 Direct company search for: {company_name}")
        
        # Step 1: Direct search in aggiudicatari_data
        try:
            # Build optimized query for main company table
            where_conditions = []
            params = {}
            
            # Primary search on denominazione with multiple patterns for better matching
            company_conditions = [
                f"denominazione = :exact_match",           # Exact match (highest priority)
                f"denominazione LIKE :starts_with",        # Starts with
                f"denominazione LIKE :contains",           # Contains (most flexible)
                f"denominazione LIKE :ends_with"           # Ends with
            ]
            
            params.update({
                "exact_match": company_name,
                "starts_with": f"{company_name}%",
                "contains": f"%{company_name}%", 
                "ends_with": f"%{company_name}"
            })
            
            where_conditions.append(f"({' OR '.join(company_conditions)})")
            
            # Add year filter if specified
            if year_filter:
                # Check if table has year columns
                aggiudicatari_columns = self.inspector.get_columns('aggiudicatari_data')
                aggiudicatari_column_names = [col['name'] for col in aggiudicatari_columns]
                
                year_conditions = []
                for col_name in aggiudicatari_column_names:
                    if 'anno_' in col_name.lower():
                        year_conditions.append(f"{col_name} = :year_filter")
                    elif 'data_' in col_name.lower():
                        year_conditions.append(f"YEAR({col_name}) = :year_filter")
                
                if year_conditions:
                    where_conditions.append(f"({' OR '.join(year_conditions)})")
                    params["year_filter"] = year_filter
            
            where_clause = ' AND '.join(where_conditions)
            
            # Execute direct query on aggiudicatari_data
            query = text(f"""
                SELECT cig, denominazione, codice_fiscale, tipo_soggetto, ruolo, id_aggiudicazione 
                FROM aggiudicatari_data 
                WHERE {where_clause}
                ORDER BY 
                    CASE 
                        WHEN denominazione = :exact_match THEN 1
                        WHEN denominazione LIKE :starts_with THEN 2
                        WHEN denominazione LIKE :ends_with THEN 3
                        ELSE 4
                    END,
                    denominazione
                LIMIT 50
            """)
            
            start_time = time.time()
            result = self.db.execute(query, params)
            aggiudicatari_matches = result.fetchall()
            search_time = time.time() - start_time
            
            logger.info(f"🏆 Found {len(aggiudicatari_matches)} matches in aggiudicatari_data in {search_time:.3f}s")
            
            if not aggiudicatari_matches:
                return {
                    'company_name': company_name,
                    'year_filter': year_filter,
                    'found': False,
                    'search_method': 'direct',
                    'aggiudicatari_matches': 0,
                    'total_matches': 0,
                    'cig_details': [],
                    'search_time': search_time,
                    'search_timestamp': datetime.now().isoformat()
                }
            
            # Step 2: Get unique CIGs from matches
            unique_cigs = list(set([row[0] for row in aggiudicatari_matches if row[0]]))
            logger.info(f"🔗 Found {len(unique_cigs)} unique CIGs to detail")
            
            # Step 3: Get complete data for each CIG (reuse existing CIG search logic)
            cig_details = []
            for cig in unique_cigs[:20]:  # Limit to 20 CIGs for performance
                try:
                    cig_data = self.search_cig_globally(cig)
                    if cig_data and cig_data.get('found'):
                        cig_details.append(cig_data)
                except Exception as e:
                    logger.warning(f"Failed to get details for CIG {cig}: {str(e)}")
                    continue
            
            # Step 4: Prepare aggiudicatari summary
            aggiudicatari_summary = []
            for row in aggiudicatari_matches:
                aggiudicatari_summary.append({
                    'cig': row[0],
                    'denominazione': row[1],
                    'codice_fiscale': row[2],
                    'tipo_soggetto': row[3],
                    'ruolo': row[4],
                    'id_aggiudicazione': row[5]
                })
            
            total_search_time = time.time() - start_time
            
            return {
                'company_name': company_name,
                'year_filter': year_filter,
                'found': True,
                'search_method': 'direct',
                'aggiudicatari_matches': len(aggiudicatari_matches),
                'total_matches': len(aggiudicatari_matches),
                'unique_cigs': len(unique_cigs),
                'aggiudicatari_summary': aggiudicatari_summary,
                'cig_details': cig_details,
                'search_time': total_search_time,
                'search_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in direct company search: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Direct company search failed: {str(e)}"
            )


@router.get("/debug-auth")
def debug_auth(
    current_user: User = Depends(get_current_active_user)
):
    """Debug endpoint to test authentication"""
    logger.info(f"Debug auth successful for user: {current_user.username}")
    return {
        "message": "Authentication successful",
        "user": {
            "username": current_user.username,
            "email": current_user.email,
            "is_active": current_user.is_active
        }
    }

@router.get("/company")
def search_by_company(
    company_name: str = Query(..., description="Company name to search for", min_length=2),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Search for companies by name across database tables.
    
    Args:
        company_name: The company name to search for (partial matches supported)
        db: Database session
        current_user: Authenticated user
    
    Returns:
        Search results for companies matching the criteria
    """
    # Start search with timeout (Windows compatible)
    logger.info(f"Starting search for company: {company_name}")
    start_time = time.time()
    
    try:
        search_service = CIGSearchService(db)
        results = search_service.search_by_company_name(company_name)
        end_time = time.time()
        
        # Check if search took too long
        search_duration = end_time - start_time
        if search_duration > 30:  # 30 second limit
            logger.warning(f"Search took {search_duration:.2f}s - longer than expected")
        
        logger.info(f"Search completed in {search_duration:.2f}s, found: {results.get('found', False)}")
        
        results['search_timestamp'] = datetime.now().isoformat()
        return results
        
    except Exception as e:
        end_time = time.time()
        search_duration = end_time - start_time
        logger.error(f"Search failed after {search_duration:.2f}s: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )


@router.get("/cig")
def search_by_cig(
    cig: str = Query(..., description="CIG code to search for", min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Search for CIG across all database tables and return aggregated results.
    
    Args:
        cig: The CIG code to search for
        db: Database session
        current_user: Authenticated user
    
    Returns:
        Aggregated search results organized by table sections
    """
    try:
        # Validate CIG format (basic validation)
        if len(cig.strip()) < 3:
            raise HTTPException(
                status_code=400, 
                detail="CIG must be at least 3 characters long"
            )
        
        search_service = CIGSearchService(db)
        results = search_service.search_cig_globally(cig)
        
        # Log search for audit
        logger.info(f"User {current_user.username} searched for CIG: {cig}")
        
        return results
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in CIG search: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="An error occurred during the search"
        )


@router.get("/tables-with-cig")
def get_tables_with_cig(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of all tables that contain a CIG field"""
    try:
        search_service = CIGSearchService(db)
        tables = search_service.find_tables_with_cig()
        
        return {
            "tables": tables,
            "count": len(tables)
        }
        
    except Exception as e:
        logger.error(f"Error getting tables with CIG: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error retrieving tables information"
        )


@router.get("/company-stream")
def search_by_company_stream(
    company_name: str = Query(..., description="Company name to search for", min_length=2),
    year_filter: Optional[int] = Query(None, description="Filter by year (e.g., 2023)"),
    authorization: Optional[str] = Query(None, description="Bearer token for authentication"),
    db: Session = Depends(get_db)
):
    """
    Search for companies by name across database tables with streaming results.
    Returns Server-Sent Events with incremental results.
    """
    # Manual authentication for SSE since headers don't work well with EventSource
    if not authorization or not authorization.startswith('Bearer '):
        def error_generator():
            yield f"data: {json.dumps({'type': 'error', 'message': 'Missing or invalid authorization'})}\n\n"
        
        return StreamingResponse(
            error_generator(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )
    
    token = authorization.replace('Bearer ', '')
    try:
        from app.auth import verify_token
        token_data = verify_token(token)
        if token_data.username != "admin":  # Simple check for demo
            def error_generator():
                yield f"data: {json.dumps({'type': 'error', 'message': 'Invalid user'})}\n\n"
            
            return StreamingResponse(
                error_generator(),
                media_type="text/plain",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Content-Type": "text/event-stream"
                }
            )
        current_user_username = token_data.username
    except Exception as e:
        logger.error(f"Authentication failed: {str(e)}")
        def error_generator():
            yield f"data: {json.dumps({'type': 'error', 'message': 'Authentication failed'})}\n\n"
        
        return StreamingResponse(
            error_generator(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )
    
    def generate_search_results():
        try:
            # Validate company name
            if len(company_name.strip()) < 2:
                yield f"data: {json.dumps({'error': 'Company name must be at least 2 characters long'})}\n\n"
                return
            
            # Validate year filter
            if year_filter is not None and (year_filter < 1900 or year_filter > 2030):
                yield f"data: {json.dumps({'error': 'Year must be between 1900 and 2030'})}\n\n"
                return
            
            # Send initial status
            status_message = f'Starting search...'
            if year_filter:
                status_message += f' (anno: {year_filter})'
                
            yield f"data: {json.dumps({'type': 'status', 'message': status_message, 'company_name': company_name.strip(), 'year_filter': year_filter})}\n\n"
            
            search_service = CIGSearchService(db)
            
            # Get all tables
            try:
                all_tables = search_service.inspector.get_table_names()
            except Exception as e:
                logger.error(f"Error getting table names: {str(e)}")
                all_tables = PRIORITY_TABLES
            
            # Prioritize tables - search priority tables first
            priority_tables = [t for t in PRIORITY_TABLES if t in all_tables]
            other_tables = [t for t in all_tables if t not in PRIORITY_TABLES]
            ordered_tables = priority_tables + other_tables
            
            # Send table count
            yield f"data: {json.dumps({'type': 'tables_count', 'total_tables': len(ordered_tables), 'priority_tables': len(priority_tables), 'year_filter': year_filter})}\n\n"
            
            total_matches = 0
            tables_with_results = 0
            
            # Search in prioritized order
            for table_index, table_name in enumerate(ordered_tables):
                try:
                    # Send progress update
                    is_priority = table_name in PRIORITY_TABLES
                    yield f"data: {json.dumps({'type': 'progress', 'current_table': table_name, 'table_index': table_index + 1, 'total_tables': len(ordered_tables), 'is_priority': is_priority, 'year_filter': year_filter})}\n\n"
                    
                    # For non-priority tables, add a small timeout to prevent blocking
                    if not is_priority and table_index > 10:  # After first 10 tables
                        import time
                        time.sleep(0.1)  # Small delay to prevent DB overload
                    
                    # Get table columns (cache this for performance)
                    try:
                        columns = search_service.inspector.get_columns(table_name)
                        column_names = [col['name'] for col in columns]
                    except Exception as col_error:
                        logger.warning(f"Could not get columns for {table_name}: {col_error}")
                        yield f"data: {json.dumps({'type': 'table_error', 'table_name': table_name, 'error': f'Column introspection failed: {str(col_error)}'})}\n\n"
                        continue
                    
                    # Find company name columns with special handling for main company table
                    company_columns = []
                    company_terms = [
                        'denominazione', 'ragione_sociale', 'nome', 'ditta', 'azienda', 
                        'societa', 'impresa', 'company', 'denominacion', 'operatore'
                    ]
                    
                    # Special priority for aggiudicatari_data table
                    if table_name == MAIN_COMPANY_TABLE:
                        # For aggiudicatari_data, prioritize denominazione column first
                        if MAIN_COMPANY_COLUMN in column_names:
                            company_columns.append(MAIN_COMPANY_COLUMN)
                        
                        # Then add other company columns
                        for col_name in column_names:
                            lower_col = col_name.lower()
                            if col_name != MAIN_COMPANY_COLUMN and any(term in lower_col for term in company_terms):
                                company_columns.append(col_name)
                    else:
                        # For other tables, use standard logic
                        for col_name in column_names:
                            lower_col = col_name.lower()
                            if any(term in lower_col for term in company_terms):
                                company_columns.append(col_name)
                    
                    # Find date columns for year filtering
                    date_columns = []
                    date_terms = [
                        'data_', 'date_', 'anno_', 'year_', 'mese_', 'month_'
                    ]
                    
                    for col_name in column_names:
                        lower_col = col_name.lower()
                        if any(term in lower_col for term in date_terms):
                            date_columns.append(col_name)
                    
                    if not company_columns:
                        # Send table skipped message
                        yield f"data: {json.dumps({'type': 'table_skipped', 'table_name': table_name, 'reason': 'No company columns found'})}\n\n"
                        continue
                    
                    # Build query with year filter
                    where_conditions = []
                    params = {}
                    
                    # Company name conditions with special optimization for main company table
                    company_conditions = []
                    
                    if table_name == MAIN_COMPANY_TABLE and MAIN_COMPANY_COLUMN in company_columns:
                        # For aggiudicatari_data, give extra weight to denominazione column
                        # Use more specific search patterns for better results
                        company_conditions.append(f"{MAIN_COMPANY_COLUMN} LIKE :company_pattern_exact")
                        company_conditions.append(f"{MAIN_COMPANY_COLUMN} LIKE :company_pattern_start")
                        company_conditions.append(f"{MAIN_COMPANY_COLUMN} LIKE :company_pattern_end")
                        params["company_pattern_exact"] = f"%{company_name.strip()}%"
                        params["company_pattern_start"] = f"{company_name.strip()}%"
                        params["company_pattern_end"] = f"%{company_name.strip()}"
                        
                        # Add other columns with standard pattern
                        for col in company_columns:
                            if col != MAIN_COMPANY_COLUMN:
                                company_conditions.append(f"{col} LIKE :company_pattern")
                        params["company_pattern"] = f"%{company_name.strip()}%"
                    else:
                        # Standard search for other tables
                        for col in company_columns:
                            company_conditions.append(f"{col} LIKE :company_pattern")
                        params["company_pattern"] = f"%{company_name.strip()}%"
                    
                    where_conditions.append(f"({' OR '.join(company_conditions)})")
                    
                    # Year filter conditions
                    if year_filter and date_columns:
                        year_conditions = []
                        
                        # Check for anno_ columns (direct year values)
                        anno_columns = [col for col in date_columns if 'anno_' in col.lower()]
                        for col in anno_columns:
                            year_conditions.append(f"{col} = :year_filter")
                        
                        # Check for data_ columns (date fields - extract year)
                        data_columns = [col for col in date_columns if 'data_' in col.lower() and 'anno_' not in col.lower()]
                        for col in data_columns:
                            year_conditions.append(f"YEAR({col}) = :year_filter")
                        
                        if year_conditions:
                            where_conditions.append(f"({' OR '.join(year_conditions)})")
                            params["year_filter"] = year_filter
                    
                    # Build final WHERE clause
                    where_clause = ' AND '.join(where_conditions)
                    
                    # Higher limit for main company table since it's most important
                    if table_name == MAIN_COMPANY_TABLE:
                        result_limit = 10  # More results from the main company table
                    elif is_priority:
                        result_limit = 5   # Standard for other priority tables
                    else:
                        result_limit = 3   # Fewer for non-priority tables
                    columns_str = ", ".join(column_names)
                    query = text(f"SELECT {columns_str} FROM {table_name} WHERE {where_clause} LIMIT {result_limit}")
                    
                    start_time = time.time()
                    
                    # Set query timeout for large tables
                    result = search_service.db.execute(query, params)
                    rows = result.fetchall()
                    
                    end_time = time.time()
                    
                    if rows:
                        table_results = []
                        for row in rows:
                            row_data = {}
                            for i, column_name in enumerate(column_names):
                                value = row[i]
                                
                                # Convert value
                                if hasattr(value, 'isoformat'):
                                    value = value.isoformat()
                                elif value is None:
                                    value = None
                                else:
                                    value = str(value) if value != '' else None
                                
                                row_data[column_name] = value
                            
                            table_results.append(row_data)
                        
                        # Special logging for main company table
                        if table_name == MAIN_COMPANY_TABLE:
                            logger.info(f"🏆 MAIN COMPANY TABLE ({MAIN_COMPANY_TABLE}): Found {len(table_results)} results for '{company_name}' in {end_time - start_time:.3f}s")
                            if year_filter:
                                logger.info(f"🗓️ Year filter {year_filter} applied to {MAIN_COMPANY_TABLE}")
                        
                        # Send table results immediately
                        table_result = {
                            'type': 'table_result',
                            'table_name': table_name,
                            'matches': len(table_results),
                            'data': table_results,
                            'company_columns': company_columns,
                            'date_columns': date_columns,
                            'search_time': round(end_time - start_time, 3),
                            'is_priority': is_priority,
                            'year_filter_applied': year_filter is not None and len(date_columns) > 0,
                            'is_main_company_table': table_name == MAIN_COMPANY_TABLE
                        }
                        
                        yield f"data: {json.dumps(table_result)}\n\n"
                        
                        total_matches += len(table_results)
                        tables_with_results += 1
                    else:
                        # Send table with no results (only for priority tables to reduce noise)
                        if is_priority or table_index < 10:
                            yield f"data: {json.dumps({'type': 'table_no_results', 'table_name': table_name, 'search_time': round(end_time - start_time, 3), 'is_priority': is_priority, 'year_filter_applied': year_filter is not None and len(date_columns) > 0})}\n\n"
                
                except Exception as e:
                    logger.error(f"Error searching company in table {table_name}: {str(e)}")
                    yield f"data: {json.dumps({'type': 'table_error', 'table_name': table_name, 'error': str(e)})}\n\n"
                    continue
            
            # Send final summary
            final_result = {
                'type': 'final_summary',
                'company_name': company_name.strip(),
                'year_filter': year_filter,
                'found': total_matches > 0,
                'total_matches': total_matches,
                'tables_searched': len(ordered_tables),
                'tables_with_results': tables_with_results,
                'priority_tables_searched': len(priority_tables),
                'search_timestamp': datetime.now().isoformat()
            }
            
            yield f"data: {json.dumps(final_result)}\n\n"
            
            # Log search for audit
            logger.info(f"User {current_user_username} completed streaming search for company: {company_name} (year: {year_filter})")
            logger.info(f"Streaming search result: found={total_matches > 0}, total_matches={total_matches}, tables_with_results={tables_with_results}")
            
        except Exception as e:
            logger.error(f"Error in streaming company search: {str(e)}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_search_results(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )

@router.get("/company-direct")
def search_company_direct(
    company_name: str = Query(..., description="Company name to search for", min_length=2),
    year_filter: Optional[int] = Query(None, description="Filter by year (e.g., 2023)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Direct and efficient company search:
    1. Quick search in aggiudicatari_data (main company table)
    2. Extract CIGs from matches  
    3. Assemble complete data for each CIG found
    
    This is much faster than the streaming search across all tables.
    """
    logger.info(f"🎯 Direct company search request: {company_name} (year: {year_filter})")
    start_time = time.time()
    
    try:
        search_service = CIGSearchService(db)
        results = search_service.search_company_direct(company_name, year_filter)
        end_time = time.time()
        
        search_duration = end_time - start_time
        logger.info(f"🚀 Direct search completed in {search_duration:.2f}s, found: {results.get('found', False)}")
        
        results['api_response_time'] = search_duration
        return results
        
    except ValueError as ve:
        logger.error(f"Validation error in direct company search: {str(ve)}")
        raise HTTPException(
            status_code=400,
            detail=str(ve)
        )
    except Exception as e:
        end_time = time.time()
        search_duration = end_time - start_time
        logger.error(f"Direct company search failed after {search_duration:.2f}s: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Direct search failed: {str(e)}"
        )

@router.get("/company-direct-stream")
def search_company_direct_stream(
    company_name: str = Query(..., description="Company name to search for", min_length=2),
    year_filter: Optional[int] = Query(None, description="Filter by year (e.g., 2023)"),
    authorization: Optional[str] = Query(None, description="Bearer token for authentication"),
    db: Session = Depends(get_db)
):
    """
    Direct company search with streaming results:
    1. Quick search in aggiudicatari_data (main company table)
    2. Extract CIGs from matches  
    3. Stream complete data for each CIG as it's assembled
    
    This provides the speed of direct search with real-time progress updates.
    """
    
    # Handle authentication for SSE (EventSource doesn't support custom headers)
    if authorization:
        try:
            # Extract token from "Bearer <token>"
            if authorization.startswith("Bearer "):
                token = authorization[7:]
            else:
                token = authorization
            
            # Verify the token manually using the same method as company-stream
            from app.auth import verify_token
            token_data = verify_token(token)
            if token_data.username != "admin":  # Simple check for demo
                def error_generator():
                    yield f"data: {json.dumps({'type': 'error', 'message': 'Invalid user'})}\n\n"
                return StreamingResponse(error_generator(), media_type="text/plain")
            
            current_user_username = token_data.username
            
        except Exception as e:
            logger.error(f"Authentication error in direct streaming: {str(e)}")
            def error_generator():
                yield f"data: {json.dumps({'type': 'auth_error', 'message': 'Authentication failed'})}\n\n"
            return StreamingResponse(error_generator(), media_type="text/plain")
    else:
        def error_generator():
            yield f"data: {json.dumps({'type': 'auth_required', 'message': 'Authorization token required'})}\n\n"
        return StreamingResponse(error_generator(), media_type="text/plain")

    def generate_direct_search_results():
        try:
            # Clean company name first
            cleaned_company_name = company_name.strip()
            
            logger.info(f"🎯 Direct streaming search request: {cleaned_company_name} (year: {year_filter})")
            search_service = CIGSearchService(db)
            start_time = time.time()
            
            # Send initial status
            yield f"data: {json.dumps({'type': 'search_started', 'company_name': cleaned_company_name, 'year_filter': year_filter, 'search_method': 'direct_streaming'})}\n\n"
            
            # Step 1: Quick search in aggiudicatari_data
            yield f"data: {json.dumps({'type': 'progress', 'message': '🔍 Searching main company table...', 'step': 1})}\n\n"
            
            # Build optimized query for main company table
            where_conditions = []
            params = {}
            
            # Primary search on denominazione with multiple patterns
            # Start with simple exact match for debugging
            company_conditions = [
                f"denominazione = :exact_match",
                f"denominazione LIKE :contains"  # Simplified: only exact match and contains
            ]
            
            params.update({
                "exact_match": cleaned_company_name,
                "contains": f"%{cleaned_company_name}%"
            })
            
            # Debug: also try a simple test query
            logger.info(f"🔍 DEBUG - Searching for company: '{cleaned_company_name}'")
            logger.info(f"🔍 DEBUG - Company name length: {len(cleaned_company_name)}")
            logger.info(f"🔍 DEBUG - Company name repr: {repr(cleaned_company_name)}")
            
            where_conditions.append(f"({' OR '.join(company_conditions)})")
            
            # Add year filter if specified
            if year_filter:
                aggiudicatari_columns = search_service.inspector.get_columns('aggiudicatari_data')
                aggiudicatari_column_names = [col['name'] for col in aggiudicatari_columns]
                
                year_conditions = []
                for col_name in aggiudicatari_column_names:
                    if 'anno_' in col_name.lower():
                        year_conditions.append(f"{col_name} = :year_filter")
                    elif 'data_' in col_name.lower():
                        year_conditions.append(f"YEAR({col_name}) = :year_filter")
                
                if year_conditions:
                    where_conditions.append(f"({' OR '.join(year_conditions)})")
                    params["year_filter"] = year_filter
            
            where_clause = ' AND '.join(where_conditions)
            
            # Execute direct query on aggiudicatari_data
            query = text(f"""
                SELECT cig, denominazione, codice_fiscale, tipo_soggetto, ruolo, id_aggiudicazione 
                FROM aggiudicatari_data 
                WHERE {where_clause}
                ORDER BY 
                    CASE 
                        WHEN denominazione = :exact_match THEN 1
                        WHEN denominazione LIKE :contains THEN 2
                        ELSE 3
                    END,
                    denominazione
                LIMIT 50
            """)
            
            # Debug logging
            logger.info(f"🔍 DEBUG - Executing query: {str(query)}")
            logger.info(f"🔍 DEBUG - Query parameters: {params}")
            logger.info(f"🔍 DEBUG - WHERE clause: {where_clause}")
            
            # First, let's test a simple count query to see if there are any rows with this company name
            test_query = text("SELECT COUNT(*) FROM aggiudicatari_data WHERE denominazione = :test_name")
            test_result = search_service.db.execute(test_query, {"test_name": cleaned_company_name})
            test_count = test_result.scalar()
            logger.info(f"🔍 DEBUG - Simple count query result: {test_count} rows found")
            
            # Let's also try a LIKE query to see if there are similar names
            like_query = text("SELECT COUNT(*) FROM aggiudicatari_data WHERE denominazione LIKE :like_pattern")
            like_result = search_service.db.execute(like_query, {"like_pattern": f"%{cleaned_company_name}%"})
            like_count = like_result.scalar()
            logger.info(f"🔍 DEBUG - LIKE count query result: {like_count} rows found")
            
            result = search_service.db.execute(query, params)
            aggiudicatari_matches = result.fetchall()
            main_search_time = time.time() - start_time
            
            logger.info(f"🏆 Found {len(aggiudicatari_matches)} matches in aggiudicatari_data in {main_search_time:.3f}s")
            
            # Send aggiudicatari results
            aggiudicatari_summary = []
            for row in aggiudicatari_matches:
                aggiudicatari_summary.append({
                    'cig': row[0],
                    'denominazione': row[1],
                    'codice_fiscale': row[2],
                    'tipo_soggetto': row[3],
                    'ruolo': row[4],
                    'id_aggiudicazione': row[5]
                })
            
            aggiudicatari_result = {
                'type': 'aggiudicatari_results',
                'matches_found': len(aggiudicatari_matches),
                'data': aggiudicatari_summary,
                'search_time': round(main_search_time, 3)
            }
            
            yield f"data: {json.dumps(aggiudicatari_result)}\n\n"
            
            if not aggiudicatari_matches:
                final_result = {
                    'type': 'final_summary',
                    'company_name': cleaned_company_name,
                    'year_filter': year_filter,
                    'found': False,
                    'search_method': 'direct_streaming',
                    'aggiudicatari_matches': 0,
                    'total_cig_details': 0,
                    'search_time': main_search_time,
                    'search_timestamp': datetime.now().isoformat()
                }
                yield f"data: {json.dumps(final_result)}\n\n"
                return
            
            # Step 2: Get unique CIGs from matches
            unique_cigs = list(set([row[0] for row in aggiudicatari_matches if row[0]]))
            logger.info(f"🔗 Found {len(unique_cigs)} unique CIGs to detail")
            
            yield f"data: {json.dumps({'type': 'progress', 'message': f'📋 Assembling details for {len(unique_cigs)} CIGs...', 'step': 2, 'total_cigs': len(unique_cigs)})}\n\n"
            
            # Step 3: Stream complete data for each CIG
            cig_details_count = 0
            for i, cig in enumerate(unique_cigs[:20], 1):  # Limit to 20 CIGs for performance
                try:
                    yield f"data: {json.dumps({'type': 'cig_progress', 'message': f'Processing CIG {i}/{min(len(unique_cigs), 20)}: {cig}', 'cig': cig, 'progress': i, 'total': min(len(unique_cigs), 20)})}\n\n"
                    
                    cig_start_time = time.time()
                    cig_data = search_service.search_cig_globally(cig)
                    cig_search_time = time.time() - cig_start_time
                    
                    if cig_data and cig_data.get('found'):
                        cig_result = {
                            'type': 'cig_detail',
                            'cig': cig,
                            'data': cig_data,
                            'search_time': round(cig_search_time, 3),
                            'progress': i,
                            'total': min(len(unique_cigs), 20)
                        }
                        yield f"data: {json.dumps(cig_result)}\n\n"
                        cig_details_count += 1
                    else:
                        yield f"data: {json.dumps({'type': 'cig_no_data', 'cig': cig, 'search_time': round(cig_search_time, 3)})}\n\n"
                    
                    # Small delay to prevent overwhelming the client
                    time.sleep(0.1)
                    
                except Exception as e:
                    logger.warning(f"Failed to get details for CIG {cig}: {str(e)}")
                    yield f"data: {json.dumps({'type': 'cig_error', 'cig': cig, 'error': str(e)})}\n\n"
                    continue
            
            # Send final summary
            total_search_time = time.time() - start_time
            final_result = {
                'type': 'final_summary',
                'company_name': cleaned_company_name,
                'year_filter': year_filter,
                'found': True,
                'search_method': 'direct_streaming',
                'aggiudicatari_matches': len(aggiudicatari_matches),
                'unique_cigs': len(unique_cigs),
                'total_cig_details': cig_details_count,
                'search_time': total_search_time,
                'search_timestamp': datetime.now().isoformat()
            }
            
            yield f"data: {json.dumps(final_result)}\n\n"
            
            # Log search for audit
            logger.info(f"User {current_user_username} completed direct streaming search for company: {cleaned_company_name} (year: {year_filter})")
            logger.info(f"Direct streaming result: found=True, aggiudicatari_matches={len(aggiudicatari_matches)}, cig_details={cig_details_count}")
            
        except Exception as e:
            logger.error(f"Error in direct streaming company search: {str(e)}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_direct_search_results(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    ) 