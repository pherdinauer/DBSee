import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ArrowLeft, RefreshCw, Table } from 'lucide-react';
import { tablesAPI } from '../services/api';
import SearchableTable from '../components/SearchableTable';
import { ColumnInfo } from '../types/api';

const TableDetailPage = () => {
  const { tableName } = useParams<{ tableName: string }>();

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
    // Note: SearchableTable handles filtering client-side for now.
    // For server-side search, we would pass the search term here.
    ['tableData', tableName],
    () => tablesAPI.getTableData(tableName!, 1, 1000, ''), // Fetching up to 1000 rows for client-side search/pagination
    {
      enabled: !!tableName,
      keepPreviousData: true,
    }
  );
  
  const columns = useMemo(() => {
    if (!schema?.columns) return [];
    return schema.columns.map((col: ColumnInfo) => ({
      key: col.name,
      label: col.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    }));
  }, [schema]);

  if (!tableName) {
    return (
       <div className="alert alert-error">
        <div className="flex-1">
          <label>Table name not provided in URL.</label>
        </div>
      </div>
    );
  }

  if (isLoadingSchema) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (schemaError || dataError) {
    const error = schemaError || dataError;
    return (
      <div className="alert alert-error">
        <div className="flex-1">
          <label>Error loading table data:</label>
          <pre className="text-sm whitespace-pre-wrap">{String(error)}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
           <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <Table className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tableName}</h1>
            <p className="text-gray-600">
              Visualizzazione di {tableData?.data.length || 0} di {tableData?.pagination.total_items || 0} righe
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Link
                to="/"
                className="btn btn-outline"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna al Dashboard
            </Link>
            <button
            onClick={() => refetch()}
            className="btn btn-primary"
            disabled={isLoadingData}
            >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingData ? 'animate-spin' : ''}`} />
            Refresh
            </button>
        </div>
      </div>

      {/* Data Table */}
      {tableData && schema ? (
        <SearchableTable 
          title={`Dati da ${tableName}`}
          data={tableData.data}
          columns={columns}
          // The pagination logic needs to be connected if we want server-side pagination
          // For now, SearchableTable handles pagination client-side based on the data it receives.
        />
      ) : (
        <div className="text-center py-12 text-gray-500">
            Caricamento dati...
        </div>
      )}
    </div>
  );
};

export default TableDetailPage; 