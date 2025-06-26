import axios, { AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';
import {
  User,
  Token,
  LoginRequest,
  TableSchema,
  QueryFilters,
  QueryResult,
  HealthCheck,
  CIGSearchResult,
  CompanyResult,
  CompanySearchStreamEvent,
  DirectCompanySearchStreamEvent,
  StreamFinalSummary,
  StreamError,
} from '@/types/api';

// Dynamic API URL detection
const getApiBaseUrl = (): string => {
  // Check for environment variable first
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Auto-detect based on current window location
  const currentHost = window.location.hostname;
  const currentProtocol = window.location.protocol;
  
  // Default API port
  const apiPort = 8000;
  
  // Build API URL based on current location
  const apiBaseUrl = `${currentProtocol}//${currentHost}:${apiPort}/api/v1`;
  
  console.log('🔧 Auto-detected API URL:', apiBaseUrl);
  return apiBaseUrl;
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let authChangeCallbacks: (() => void)[] = [];

const getToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const setToken = (token: string): void => {
  localStorage.setItem('access_token', token);
  // Notify all registered callbacks
  authChangeCallbacks.forEach(callback => callback());
};

const removeToken = (): void => {
  localStorage.removeItem('access_token');
  // Notify all registered callbacks
  authChangeCallbacks.forEach(callback => callback());
};

const onAuthChange = (callback: () => void): (() => void) => {
  authChangeCallbacks.push(callback);
  // Return cleanup function
  return () => {
    authChangeCallbacks = authChangeCallbacks.filter(cb => cb !== callback);
  };
};

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add logging for debugging
    if (config.url?.includes('/search/company')) {
      console.log('Request interceptor - Company search request:', {
        url: config.url,
        method: config.method,
        hasAuth: !!config.headers.Authorization,
        timeout: config.timeout
      });
    }
    
    return config;
  },
  error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses for debugging
    if (response.config.url?.includes('/search/')) {
      console.log('Response interceptor - Successful response:', {
        status: response.status,
        url: response.config.url,
        dataKeys: Object.keys(response.data || {})
      });
    }
    return response;
  },
  (error: AxiosError) => {
    console.error('Axios response interceptor caught error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.error('Request timeout detected');
      toast.error('Request timeout. The search is taking too long. Please try again.');
    } else if (error.response?.status === 403) {
      console.error('403 Forbidden - Authentication/Authorization failed');
      toast.error('Access denied. Please check your permissions or login again.');
      // Don't redirect on 403, just show error
    } else if (error.response?.status === 401) {
      removeToken();
      toast.error('Session expired. Please login again.');
      // Redirect to login page
      window.location.href = '/login';
    } else if (error.response && error.response.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.data) {
      const errorData = error.response.data as { detail?: string };
      toast.error(errorData.detail || 'An error occurred');
    } else if (error.request) {
      toast.error('Network error. Please check your connection and ensure the backend is running.');
    } else {
      toast.error('An unexpected error occurred.');
    }
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<Token> => {
    const response = await api.post<Token>('/auth/login', credentials);
    const token = response.data.access_token;
    setToken(token);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      removeToken();
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  isAuthenticated: (): boolean => {
    return !!getToken();
  },

  onAuthChange,
};

export const tablesAPI = {
  getTables: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/tables/');
    return response.data;
  },

  getTableSchema: async (tableName: string): Promise<TableSchema> => {
    const response = await api.get<TableSchema>(`/tables/${tableName}/schema`);
    return response.data;
  },

  queryTable: async (
    tableName: string,
    filters: QueryFilters
  ): Promise<QueryResult> => {
    const response = await api.post<QueryResult>(
      `/tables/${tableName}/query`,
      filters
    );
    return response.data;
  },

  getTableData: async (
    tableName: string,
    page: number = 1,
    pageSize: number = 20,
    search?: string,
    orderBy?: string,
    orderDir: 'asc' | 'desc' = 'asc'
  ): Promise<QueryResult> => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      order_dir: orderDir,
    });

    if (search) params.append('search', search);
    if (orderBy) params.append('order_by', orderBy);

    const response = await api.get<QueryResult>(
      `/tables/${tableName}/data?${params}`
    );
    return response.data;
  },
};

export const searchAPI = {
  searchByCIG: async (cig: string): Promise<CIGSearchResult> => {
    const response = await api.get<CIGSearchResult>(`/search/cig?cig=${encodeURIComponent(cig)}`);
    return response.data;
  },

  searchByCompany: async (companyName: string): Promise<CompanyResult> => {
    console.log('Starting company search API call for:', companyName);
    console.log('Auth token present:', !!getToken());
    
    try {
      const params = new URLSearchParams({ company_name: companyName });
      const url = `/search/company?${params}`;
      console.log('Making request to:', url);
      console.log('Full URL:', `${API_BASE_URL}${url}`);
      
      const startTime = Date.now();
      console.log('Request started at:', new Date().toISOString());
      
      console.log('About to send request...');
      const response = await api.get<CompanyResult>(url, {
        timeout: 30000, // 30 seconds timeout for company search (matching backend)
      });
      
      console.log('Request sent successfully, awaiting response...');
      
      const endTime = Date.now();
      console.log('Request completed in:', endTime - startTime, 'ms');
      console.log('Response status:', response.status);
      console.log('Response data keys:', Object.keys(response.data || {}));
      
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Company search API error:', axiosError);
      console.error('Error details:', {
        message: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data
      });
      throw axiosError;
    }
  },

  // Direct company search - faster and more targeted
  searchByCompanyDirect: async (companyName: string, yearFilter?: number): Promise<CompanyResult> => {
    console.log('Starting DIRECT company search API call for:', companyName, 'year:', yearFilter);
    const params = new URLSearchParams({ company_name: companyName });
    if (yearFilter) {
      params.append('year_filter', yearFilter.toString());
    }
    
    try {
      const response = await api.get<CompanyResult>(`/search/company-direct?${params}`);
      console.log('Direct company search response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Direct company search API error:', error);
      throw error;
    }
  },

  // Direct company search with streaming - combines speed of direct search with real-time progress
  searchByCompanyDirectStream: async (
    companyName: string,
    yearFilter: number | undefined,
    onProgress: (data: DirectCompanySearchStreamEvent) => void,
    onComplete: (finalData: StreamFinalSummary) => void,
    onError: (error: StreamError) => void
  ): Promise<void> => {
    console.log('Starting DIRECT STREAMING company search API call for:', companyName, 'year:', yearFilter);
    const token = getToken();
    
    if (!token) {
      onError({ type: 'auth_required', message: 'No authentication token available' });
      return;
    }
    
    try {
      const params = new URLSearchParams({ company_name: companyName });
      if (yearFilter) {
        params.append('year_filter', yearFilter.toString());
      }
      const url = `${API_BASE_URL}/search/company-direct-stream?${params}`;
      console.log('Making SSE request to:', url);
      
      const eventSource = new EventSource(url + `&authorization=${encodeURIComponent(`Bearer ${token}`)}`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as DirectCompanySearchStreamEvent;
          console.log('Received SSE data:', data);
          
          if (data.type === 'final_summary') {
            onComplete(data);
            eventSource.close();
          } else if (data.type === 'error' || data.type === 'auth_error' || data.type === 'auth_required') {
            onError(data);
            eventSource.close();
          } else {
            onProgress(data);
          }
        } catch (parseError) {
          console.error('Error parsing SSE data:', parseError);
          onError({ type: 'error', message: 'Error parsing server response' });
          eventSource.close();
        }
      };
      
      eventSource.onerror = () => {
        console.error('SSE connection error:');
        onError({ type: 'error', message: 'Connection error during direct streaming search' });
        eventSource.close();
      };
      
      // Timeout after 5 minutes (direct search should be faster but CIG assembly can take time)
      setTimeout(() => {
        if (eventSource.readyState !== EventSource.CLOSED) {
          console.warn('Direct SSE timeout - closing connection');
          eventSource.close();
          onError({ type: 'error', message: 'Direct search timeout' });
        }
      }, 300000);
      
    } catch (error) {
      console.error('Direct streaming company search error:', error);
      onError({ type: 'error', message: 'Failed to initiate direct streaming search' });
    }
  },

  getTablesWithCIG: async (): Promise<{tables: string[], count: number}> => {
    const response = await api.get<{tables: string[], count: number}>('/search/tables-with-cig');
    return response.data;
  },

  // Streaming company search using Server-Sent Events
  searchByCompanyStream: async (
    companyName: string,
    yearFilter: number | undefined,
    onProgress: (data: CompanySearchStreamEvent) => void,
    onComplete: (finalData: StreamFinalSummary) => void,
    onError: (error: StreamError) => void
  ): Promise<void> => {
    console.log('Starting STREAMING company search API call for:', companyName, 'year:', yearFilter);
    const token = getToken();
    
    if (!token) {
      onError({ type: 'auth_required', message: 'No authentication token available' });
      return;
    }
    
    try {
      const params = new URLSearchParams({ company_name: companyName });
      if (yearFilter) {
        params.append('year_filter', yearFilter.toString());
      }
      const url = `${API_BASE_URL}/search/company-stream?${params}`;
      console.log('Making SSE request to:', url);
      
      const eventSource = new EventSource(url + `&authorization=${encodeURIComponent(`Bearer ${token}`)}`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as CompanySearchStreamEvent;
          console.log('Received SSE data:', data);
          
          if (data.type === 'final_summary') {
            onComplete(data);
            eventSource.close();
          } else if (data.type === 'error') {
            onError(data);
            eventSource.close();
          } else {
            onProgress(data);
          }
        } catch (parseError) {
          console.error('Error parsing SSE data:', parseError);
          onError({ type: 'error', message: 'Error parsing server response' });
          eventSource.close();
        }
      };
      
      eventSource.onerror = () => {
        console.error('SSE connection error:');
        onError({ type: 'error', message: 'Connection error during streaming search' });
        eventSource.close();
      };
      
      // Timeout after 2 minutes
      setTimeout(() => {
        if (eventSource.readyState !== EventSource.CLOSED) {
          console.warn('SSE timeout - closing connection');
          eventSource.close();
          onError({ type: 'error', message: 'Search timeout' });
        }
      }, 120000);
      
    } catch (error) {
      console.error('Streaming company search error:', error);
      onError({ type: 'error', message: 'Failed to initiate streaming search' });
    }
  },
};

export const systemAPI = {
  getHealth: async (): Promise<HealthCheck> => {
    const response = await api.get<HealthCheck>('/health');
    return response.data;
  },
};

export default api; 