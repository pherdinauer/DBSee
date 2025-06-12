import { useState } from 'react';
import { ChevronDown, ChevronRight, Building2, Calendar } from 'lucide-react';

interface CompanySearchResultsProps {
  results: any;
  getTableDisplayName: (tableName: string) => string;
  getTableIcon: (tableName: string) => JSX.Element;
}

const CompanySearchResults = ({ 
  results, 
  getTableDisplayName, 
  getTableIcon 
}: CompanySearchResultsProps) => {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  
  // Debug logging
  console.log('CompanySearchResults received:', results);

  // Temporarily disable the "not found" condition for debugging
  if (false && !results.found) {
    return (
      <div className="text-center py-8">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-500 text-lg">
          Nessuna azienda trovata per "{results.company_name}"
          {results.year_filter && ` nell'anno ${results.year_filter}`}
        </div>
        <div className="text-gray-400 text-sm mt-2">
          Prova con un nome diverso o rimuovi il filtro anno
        </div>
      </div>
    );
  }

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined || value === '' || value === 'null') {
      return '(vuoto)';
    }
    if (typeof value === 'boolean') {
      return value ? 'Sì' : 'No';
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '' || trimmed === '-' || trimmed === 'null') {
        return '(vuoto)';
      }
      return trimmed;
    }
    return String(value);
  };

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  // Check if results and results_by_table exist
  if (!results || !results.results_by_table || !Array.isArray(results.results_by_table)) {
    return (
      <div className="text-center py-8">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-500 text-lg">
          Dati non validi ricevuti dal backend
        </div>
        <div className="text-gray-400 text-sm mt-2">
          Controlla la console per maggiori dettagli
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <div className="bg-white rounded-lg border border-gray-500 shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Building2 className="h-6 w-6 text-black" />
          <h2 className="text-xl font-semibold text-black">
            Risultati Ricerca Azienda
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Azienda Cercata:</span>
            <span className="ml-2 text-black font-mono">"{results.company_name}"</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Anno Filtro:</span>
            <span className="ml-2 text-black">
              {results.year_filter || 'Tutti gli anni'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Risultati Totali:</span>
            <span className="ml-2 text-black font-bold">{results.total_matches || 0}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Tabelle con Risultati:</span>
            <span className="ml-2 text-black">{results.results_by_table ? results.results_by_table.length : 0}</span>
          </div>
        </div>
      </div>

      {/* Results by Table */}
      {results.results_by_table && results.results_by_table.length > 0 ? (
        results.results_by_table.map((tableResult: any) => (
          <div key={tableResult.table_name} className="bg-white rounded-lg border border-gray-500 shadow-lg overflow-hidden">
            <div 
              className="bg-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-300 transition-colors"
              onClick={() => toggleTable(tableResult.table_name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-black">
                    {getTableIcon(tableResult.table_name)}
                  </div>
                  <h3 className="text-lg font-semibold text-black">
                    {getTableDisplayName(tableResult.table_name)}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-200">
                    {tableResult.matches} risultati
                  </span>
                </div>
                <div className="text-gray-400">
                  {expandedTables.has(tableResult.table_name) ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </div>
              </div>
            </div>

            {expandedTables.has(tableResult.table_name) && (
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-200">
                      <tr>
                        {tableResult.data[0] && Object.keys(tableResult.data[0]).map((column: string) => (
                          <th key={column} className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            {column.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tableResult.data.map((row: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {Object.entries(row).map(([column, value]) => {
                            const isCompanyColumn = tableResult.company_columns.includes(column);
                            const isDateColumn = tableResult.date_columns.includes(column);
                            
                            return (
                              <td 
                                key={column} 
                                className={`px-3 py-2 text-sm text-black ${
                                  isCompanyColumn ? 'font-medium bg-yellow-50' : ''
                                }`}
                              >
                                <div 
                                  className={`${
                                    isCompanyColumn 
                                      ? 'max-w-lg break-words' 
                                      : 'max-w-xs truncate'
                                  }`}
                                  title={formatCellValue(value)}
                                >
                                  {isDateColumn && value ? (
                                    <span className="flex items-center">
                                      <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                      {formatCellValue(value)}
                                    </span>
                                  ) : (
                                    formatCellValue(value)
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Table info */}
                <div className="mt-3 p-2 bg-gray-100 rounded text-xs text-gray-600">
                  <span className="font-medium">Colonne azienda:</span> {tableResult.company_columns.join(', ')}
                  {tableResult.date_columns.length > 0 && (
                    <>
                      <span className="ml-4 font-medium">Colonne data:</span> {tableResult.date_columns.join(', ')}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500 text-lg">
            Nessuna azienda trovata per "{results.company_name}"
          </div>
          <div className="text-gray-400 text-sm mt-2">
            Prova con un nome diverso
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySearchResults; 