import { useState } from 'react';
import { ChevronDown, ChevronRight, Table } from 'lucide-react';
import { CIGSearchResult } from '../types/api';

interface SearchResultsDisplayProps {
  results: CIGSearchResult;
  getTableDisplayName: (tableName: string) => string;
  getTableIcon: (tableName: string) => JSX.Element;
}

const SearchResultsDisplay = ({ 
  results, 
  getTableDisplayName, 
  getTableIcon 
}: SearchResultsDisplayProps) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!results.found) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-lg">Nessun dato trovato per questo CIG</div>
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
    if (typeof value === 'number') {
      if (value > 1000) {
        return new Intl.NumberFormat('it-IT', {
          style: 'decimal',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(value);
      }
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

  // Group fields by table source for better organization
  const groupedFields = () => {
    const grouped: Record<string, Array<{key: string, value: any}>> = {};
    
    Object.entries(results.merged_data).forEach(([key, value]) => {
      if (key === 'cig') return; // Skip CIG field for grouping
      
      // Find source table for this field
      const sourceTable = results.field_sources?.[key] || 'unknown';
      

      
      if (!grouped[sourceTable]) {
        grouped[sourceTable] = [];
      }
      
      grouped[sourceTable].push({ key, value });
    });

    return grouped;
  };

  const fieldGroups = groupedFields();

  return (
    <div className="space-y-6">
      {/* Main CIG Info */}
      <div className="border border-gray-500 rounded-lg overflow-hidden bg-white shadow-lg">
        <div className="bg-gray-900 px-4 py-3">
          <div className="flex items-center space-x-3">
            <Table className="h-6 w-6 text-white" />
            <h3 className="text-lg font-semibold text-white">
              Dati Completi per CIG: {results.cig}
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-200">
              {results.total_fields} campi da {results.source_tables.length} tabelle
            </span>
          </div>
        </div>
        
        <div className="p-4">
          {/* Unified Table showing all fields */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Campo
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Valore
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Fonte
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Show CIG first */}
                <tr className="bg-gray-900">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-white">
                    CIG
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-white">
                    {results.cig}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-white">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black text-white">
                      Ricerca
                    </span>
                  </td>
                </tr>
                
                {/* Show all other fields */}
                {Object.entries(results.merged_data)
                  .filter(([key]) => key.toLowerCase() !== 'cig')
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([fieldName, value]) => {
                    const sourceTable = results.field_sources?.[fieldName] || 'unknown';
                    
                    // Better field name display with proper capitalization
                    let displayFieldName = fieldName.replace(sourceTable + '_', '').replace(/_/g, ' ');
                    
                    // Special handling for important fields
                    if (displayFieldName.toLowerCase().includes('denominazione')) {
                      displayFieldName = 'DENOMINAZIONE';
                    } else if (displayFieldName.toLowerCase().includes('codice_fiscale')) {
                      displayFieldName = 'CODICE FISCALE';
                    } else if (displayFieldName.toLowerCase().includes('partita_iva')) {
                      displayFieldName = 'PARTITA IVA';
                    } else {
                      displayFieldName = displayFieldName.toUpperCase();
                    }
                    
                    return (
                      <tr key={fieldName} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm font-medium text-black">
                          {displayFieldName}
                        </td>
                        <td className="px-3 py-2 text-sm text-black">
                          <div 
                            className={`${
                              (displayFieldName === 'DENOMINAZIONE' || displayFieldName === 'CODICE FISCALE') 
                                ? 'max-w-lg break-words' 
                                : 'max-w-xs truncate'
                            }`} 
                            title={formatCellValue(value)}
                          >
                            {formatCellValue(value)}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-black">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                            {getTableDisplayName(sourceTable)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          
          {/* Summary info */}
          <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-400">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Totale Campi:</span>
                <span className="ml-2 text-gray-900">{results.total_fields}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Tabelle Fonte:</span>
                <span className="ml-2 text-gray-900">{results.source_tables.length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">CIG Cercato:</span>
                <span className="ml-2 text-gray-900 font-mono">{results.cig}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Ultima Ricerca:</span>
                <span className="ml-2 text-gray-900">{new Date().toLocaleString('it-IT')}</span>
              </div>
            </div>
            
            {/* Source tables list */}
            <div className="mt-3">
              <span className="font-medium text-gray-700">Tabelle consultate: </span>
              {results.source_tables.map((table, index) => (
                <span key={table} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-800 text-white mr-2 mb-1">
                  {getTableDisplayName(table)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Toggle to show grouped view */}
      <div className="border border-gray-500 rounded-lg overflow-hidden bg-white shadow-lg">
        <div 
          className="bg-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-300 transition-colors"
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black">
              Vista Raggruppata per Tabella
            </h3>
            <div className="text-gray-400">
              {showDetails ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </div>
          </div>
        </div>

        {showDetails && (
          <div className="p-4">
            <div className="space-y-4">
              {Object.entries(fieldGroups).map(([tableName, fields]) => (
                <div key={tableName} className="border border-gray-400 rounded-lg">
                  <div className="bg-gray-100 px-3 py-2 border-b border-gray-400">
                    <div className="flex items-center space-x-2">
                      <div className="text-black">
                        {getTableIcon(tableName)}
                      </div>
                      <h4 className="font-medium text-black">
                        {getTableDisplayName(tableName)}
                      </h4>
                      <span className="text-xs text-gray-500">
                        ({fields.length} campi)
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {fields.map(({ key, value }) => {
                        const displayName = key.replace(tableName + '_', '').replace(/_/g, ' ');
                        

                        
                        return (
                          <div key={key} className="border-b border-gray-200 pb-2">
                            <dt className="text-xs font-medium text-gray-600 uppercase">
                              {displayName}
                            </dt>
                            <dd className="mt-1 text-sm text-black">
                              {formatCellValue(value)}
                            </dd>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsDisplay; 