export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface CIGSearchResult {
  cig: string;
  found: boolean;
  merged_data: Record<string, any>;
  source_tables: string[];
  field_sources?: Record<string, string>;
  total_fields: number;
  tables_searched: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default: any;
  autoincrement: boolean;
}

export interface ForeignKeyInfo {
  constrained_columns: string[];
  referred_table: string;
  referred_columns: string[];
}

export interface IndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface TableSchema {
  table_name: string;
  columns: ColumnInfo[];
  primary_keys: string[];
  foreign_keys: ForeignKeyInfo[];
  indexes: IndexInfo[];
}

export interface QueryFilters {
  filters?: Record<string, any>;
  search?: string;
  page: number;
  page_size: number;
  order_by?: string;
  order_dir: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface QueryInfo {
  table_name: string;
  filters_applied: boolean;
  search_applied: boolean;
  order_by?: string;
  order_dir: string;
}

export interface QueryResult {
  data: Record<string, any>[];
  pagination: PaginationInfo;
  query_info: QueryInfo;
}

export interface HealthCheck {
  status: string;
  timestamp: string;
  database_connected: boolean;
  version: string;
}

export interface ErrorResponse {
  detail: string;
  error_code?: string;
  timestamp: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ErrorResponse;
  status: number;
} 