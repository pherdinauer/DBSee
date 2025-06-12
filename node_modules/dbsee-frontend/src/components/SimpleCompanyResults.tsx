import { useState } from 'react';
import { Building2, Search, Calendar, FileText, Eye, ChevronDown, ChevronUp } from 'lucide-react';

interface SimpleCompanyResultsProps {
  results: any;
  onCigSearch?: (cig: string) => void;
}

const SimpleCompanyResults = ({ results, onCigSearch }: SimpleCompanyResultsProps) => {
  const [expandedTables, setExpandedTables] = useState<Set<number>>(new Set());
  
  console.log('SimpleCompanyResults props:', results);
  
  if (!results) {
    return null;
  }

  // Handle different result formats
  const isDirectSearch = results.search_method === 'direct_streaming';
  const hasResults = isDirectSearch 
    ? (results.found && results.aggiudicatari_matches > 0)
    : (results.found && results.results_by_table && results.results_by_table.length > 0);

  if (!hasResults) {
    return (
      <div className="bg-white rounded-lg border border-gray-500 shadow-lg p-6">
        <div className="text-center py-8">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun risultato trovato</h3>
          <p className="mt-1 text-sm text-gray-500">
            Nessuna azienda trovata con il nome "{results.company_name}"
          </p>
        </div>
      </div>
    );
  }

  const toggleTableExpansion = (tableIndex: number) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableIndex)) {
      newExpanded.delete(tableIndex);
    } else {
      newExpanded.add(tableIndex);
    }
    setExpandedTables(newExpanded);
  };

  const handleCigClick = (cig: string) => {
    if (onCigSearch) {
      console.log('Starting CIG search for:', cig);
      onCigSearch(cig);
    }
  };

  const isCigColumn = (columnName: string) => {
    const cigColumns = ['cig', 'numero_gara', 'codice_gara'];
    return cigColumns.some(col => columnName.toLowerCase().includes(col));
  };

  // Render direct search results
  if (isDirectSearch) {
    return (
      <div className="space-y-6">
        {/* Header with summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-green-900">
                🎯 Ricerca Diretta per "{results.company_name}"
              </h3>
              <p className="text-sm text-green-700">
                Trovati <strong>{results.aggiudicatari_matches}</strong> risultati in aggiudicatari_data
                {results.cig_details && (
                  <span className="ml-2">
                    + <strong>{results.cig_details.length}</strong> dettagli CIG caricati
                  </span>
                )}
                {results.streaming && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    🔄 Caricamento in corso...
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Aggiudicatari Results */}
        {results.aggiudicatari_summary && results.aggiudicatari_summary.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <h5 className="text-md font-semibold text-gray-900">
                    🏆 Aggiudicatari Data (Tabella Principale)
                  </h5>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {results.aggiudicatari_matches} risultati
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Tempo: {results.search_time}s
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {results.aggiudicatari_summary[0] && Object.keys(results.aggiudicatari_summary[0]).slice(0, 6).map((column) => (
                      <th 
                        key={column}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column.replace(/_/g, ' ')}
                      </th>
                    ))}
                    {results.aggiudicatari_summary[0] && Object.keys(results.aggiudicatari_summary[0]).length > 6 && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ...
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.aggiudicatari_summary.slice(0, 10).map((row: any, rowIndex: number) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {Object.entries(row).slice(0, 6).map(([columnName, value]: [string, any], colIndex: number) => (
                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="max-w-xs truncate">
                            {isCigColumn(columnName) && value && onCigSearch ? (
                              <button
                                onClick={() => handleCigClick(String(value))}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                                title={`Cerca per CIG: ${value}`}
                              >
                                {value !== null && value !== undefined ? String(value) : '-'}
                              </button>
                            ) : (
                              <span>
                                {value !== null && value !== undefined ? String(value) : '-'}
                              </span>
                            )}
                          </div>
                        </td>
                      ))}
                      {Object.values(row).length > 6 && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ...
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {onCigSearch && (
                          (() => {
                            const cigEntry = Object.entries(row).find(([key]) => isCigColumn(key));
                            const cigValue = cigEntry ? cigEntry[1] : null;
                            
                            return cigValue ? (
                              <button
                                onClick={() => handleCigClick(String(cigValue))}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                title={`Cerca per CIG: ${cigValue}`}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            ) : (
                              <span className="text-gray-300">
                                <Eye className="h-4 w-4" />
                              </span>
                            );
                          })()
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {results.aggiudicatari_summary.length > 10 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600 text-center">
                Mostrando primi 10 risultati su {results.aggiudicatari_summary.length} totali
              </div>
            )}
          </div>
        )}

        {/* CIG Details */}
        {results.cig_details && results.cig_details.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h5 className="text-md font-semibold text-blue-900">
                    📋 Dettagli CIG Correlati
                  </h5>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {results.cig_details.length} CIG
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {results.cig_details.map((cigDetail: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-medium text-blue-600">
                      CIG: {cigDetail.cig || 'N/A'}
                    </span>
                    {onCigSearch && cigDetail.cig && (
                      <button
                        onClick={() => handleCigClick(cigDetail.cig)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100"
                        title={`Cerca per CIG: ${cigDetail.cig}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                    {Object.entries(cigDetail).slice(0, 6).map(([key, value]: [string, any]) => (
                      <div key={key}>
                        <span className="font-medium">{key.replace(/_/g, ' ')}:</span>
                        <span className="ml-1">{value !== null && value !== undefined ? String(value) : '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Original logic for complete search results
  return (
    <div className="space-y-6">
      {/* Header with summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Building2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-green-900">
              Risultati per "{results.company_name}"
            </h3>
            <p className="text-sm text-green-700">
              Trovati <strong>{results.total_matches}</strong> risultati in <strong>{results.results_by_table.length}</strong> tabelle 
              su {results.tables_searched} cercate
            </p>
          </div>
        </div>
      </div>

      {/* Results by table */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900">Risultati per Tabella</h4>
        
        {results.results_by_table.map((tableResult: any, tableIndex: number) => {
          const isExpanded = expandedTables.has(tableIndex);
          const showExpansionButton = tableResult.data && tableResult.data.length > 3;
          const visibleRows = isExpanded ? tableResult.data : tableResult.data?.slice(0, 3) || [];
          
          return (
            <div key={tableIndex} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Table header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <h5 className="text-md font-semibold text-gray-900">
                      {tableResult.table_name}
                    </h5>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {tableResult.matches} risultati
                    </span>
                    {tableResult.is_main_company_table && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        🏆 TABELLA PRINCIPALE
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Tempo: {tableResult.search_time}s
                  </div>
                </div>
                
                {tableResult.company_columns && tableResult.company_columns.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-600">Colonne azienda: </span>
                    <span className="text-xs font-mono text-gray-800">
                      {tableResult.company_columns.join(', ')}
                    </span>
                    {tableResult.is_main_company_table && (
                      <span className="ml-2 text-xs text-green-600 font-medium">
                        (denominazione prioritizzata)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Table data */}
              {tableResult.data && tableResult.data.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(tableResult.data[0]).slice(0, 6).map((column) => (
                          <th 
                            key={column}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {column.replace(/_/g, ' ')}
                          </th>
                        ))}
                        {Object.keys(tableResult.data[0]).length > 6 && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ...
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Azioni
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {visibleRows.map((row: any, rowIndex: number) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {Object.entries(row).slice(0, 6).map(([columnName, value]: [string, any], colIndex: number) => (
                            <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="max-w-xs truncate">
                                {isCigColumn(columnName) && value && onCigSearch ? (
                                  <button
                                    onClick={() => handleCigClick(String(value))}
                                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                                    title={`Cerca per CIG: ${value}`}
                                  >
                                    {value !== null && value !== undefined ? String(value) : '-'}
                                  </button>
                                ) : (
                                  <span>
                                    {value !== null && value !== undefined ? String(value) : '-'}
                                  </span>
                                )}
                              </div>
                            </td>
                          ))}
                          {Object.values(row).length > 6 && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ...
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {onCigSearch && (
                              (() => {
                                const cigEntry = Object.entries(row).find(([key]) => isCigColumn(key));
                                const cigValue = cigEntry ? cigEntry[1] : null;
                                
                                return cigValue ? (
                                  <button
                                    onClick={() => handleCigClick(String(cigValue))}
                                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                    title={`Cerca per CIG: ${cigValue}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <span className="text-gray-300">
                                    <Eye className="h-4 w-4" />
                                  </span>
                                );
                              })()
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Show more/less button */}
              {showExpansionButton && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={() => toggleTableExpansion(tableIndex)}
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        <span>Mostra meno</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        <span>Mostra tutti ({tableResult.data.length} risultati)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <Calendar className="h-4 w-4" />
            <span>Ricerca completata: {new Date(results.search_timestamp).toLocaleString()}</span>
          </div>
          <div>
            Totale tabelle: {results.tables_searched}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleCompanyResults; 