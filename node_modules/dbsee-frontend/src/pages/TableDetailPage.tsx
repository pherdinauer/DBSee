import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ArrowLeft, Search, RefreshCw } from 'lucide-react';
import { tablesAPI } from '../services/api';
import DataTable from '../components/DataTable';

const TableDetailPage = () => {
  const { tableName } = useParams<{ tableName: string }>();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const {
    data: schema,
    isLoading: isLoadingSchema,
    error: schemaError,
  } = useQuery(
    ['tableSchema', tableName],
    () => tablesAPI.getTableSchema(tableName!),
    {
      enabled: !!tableName,
    }
  );

  const {
    data: tableData,
    isLoading: isLoadingData,
    error: dataError,
    refetch,
  } = useQuery(
    ['tableData', tableName, page, pageSize, search],
    () => tablesAPI.getTableData(tableName!, page, pageSize, search),
    {
      enabled: !!tableName,
      keepPreviousData: true,
    }
  );

  if (!tableName) {
    return <div>Table name not provided</div>;
  }

  if (isLoadingSchema || isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (schemaError || dataError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg">Error loading table data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="inline-flex items-center text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Tables
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tableName}</h1>
            <p className="text-gray-600">
              {tableData?.pagination.total_items || 0} rows
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-secondary"
          disabled={isLoadingData}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingData ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="input pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          className="input w-24"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* Data Table */}
      {tableData && schema && (
        <DataTable
          data={tableData.data}
          columns={schema.columns}
          pagination={tableData.pagination}
          onPageChange={setPage}
          isLoading={isLoadingData}
        />
      )}
    </div>
  );
};

export default TableDetailPage; 