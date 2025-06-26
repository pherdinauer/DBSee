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

export interface CompanyResult {
  company_name: string;
  found: boolean;
  results_by_table?: Array<Record<string, unknown>>;
  aggiudicatari_matches?: number;
  aggiudicatari_summary?: Array<Record<string, unknown>>;
  cig_details?: Array<Record<string, unknown>>;
  year_filter?: number;
  total_matches?: number;
  streaming?: boolean;
  current_table?: string;
  progress?: {
    current: number;
    total: number;
  };
  search_time?: number;
  [key: string]: unknown;
}

// Types for Streaming API responses
export interface StreamProgress {
  type: 'progress';
  current_table: string;
  table_index: number;
  total_tables: number;
  is_priority: boolean;
  priority_tables?: number;
}

export interface StreamTableResult {
  type: 'table_result';
  table_name: string;
  matches: number;
  data: Record<string, any>[];
}

export interface StreamStatus {
  type: 'status';
  message: string;
}

export interface StreamFinalSummary {
  type: 'final_summary';
  company_name: string;
  year_filter?: number;
  found: boolean;
  total_matches: number;
  tables_searched: number;
  search_timestamp: string;
}

export interface StreamError {
  type: 'error' | 'auth_error' | 'auth_required';
  message: string;
  detail?: string;
}

export type CompanySearchStreamEvent = 
  | StreamProgress 
  | StreamTableResult 
  | StreamStatus 
  | StreamFinalSummary
  | StreamError;

// Types for Direct Streaming API responses
export interface DirectStreamSearchStarted {
  type: 'search_started';
  company_name: string;
  year_filter?: number;
}

export interface DirectStreamProgress {
    type: 'progress';
    message: string;
}

export interface DirectStreamAggiudicatariResult {
  type: 'aggiudicatari_results';
  matches_found: number;
  search_time: number;
  data: Record<string, any>[];
}

export interface DirectStreamCigProgress {
  type: 'cig_progress';
  message: string;
  processed: number;
  total: number;
}

export interface DirectStreamCigDetail {
  type: 'cig_detail';
  data: Record<string, any>;
}

export type DirectCompanySearchStreamEvent = 
  | DirectStreamSearchStarted
  | DirectStreamProgress
  | DirectStreamAggiudicatariResult
  | DirectStreamCigProgress
  | DirectStreamCigDetail
  | StreamFinalSummary // Can also send final summary
  | StreamError;      // Can also send error 