import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ColumnInfo, PaginationInfo } from '../types/api';

interface DataTableProps {
  data: Record<string, any>[];
  columns: ColumnInfo[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

const DataTable = ({
  data,
  columns,
  pagination,
  onPageChange,
  isLoading = false,
}: DataTableProps) => {
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const getColumnType = (column: ColumnInfo): string => {
    const type = column.type.toLowerCase();
    if (type.includes('int') || type.includes('decimal') || type.includes('float')) {
      return 'number';
    }
    if (type.includes('date') || type.includes('time')) {
      return 'date';
    }
    if (type.includes('bool')) {
      return 'boolean';
    }
    return 'text';
  };

  const getCellClassName = (column: ColumnInfo): string => {
    const baseClass = 'table-cell';
    const type = getColumnType(column);
    
    switch (type) {
      case 'number':
        return `${baseClass} text-right font-mono`;
      case 'date':
        return `${baseClass} font-mono`;
      case 'boolean':
        return `${baseClass} text-center`;
      default:
        return baseClass;
    }
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              {columns.map((column) => (
                <th key={column.name} className="table-header-cell">
                  <div className="flex flex-col">
                    <span className="font-medium">{column.name}</span>
                    <span className="text-xs font-normal text-gray-400">
                      {column.type}
                      {!column.nullable && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="table-row">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
                    Loading...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={column.name} className={getCellClassName(column)}>
                      <div className="max-w-xs truncate" title={formatValue(row[column.name])}>
                        {formatValue(row[column.name])}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Showing{' '}
            <span className="font-medium">
              {(pagination.page - 1) * pagination.page_size + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium">
              {Math.min(
                pagination.page * pagination.page_size,
                pagination.total_items
              )}
            </span>{' '}
            of{' '}
            <span className="font-medium">{pagination.total_items}</span>{' '}
            results
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!pagination.has_prev}
            className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
              let pageNum: number;
              if (pagination.total_pages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.total_pages - 2) {
                pageNum = pagination.total_pages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    pageNum === pagination.page
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.has_next}
            className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable; 