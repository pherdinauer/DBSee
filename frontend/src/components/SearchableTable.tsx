import { useState, useMemo } from 'react';
import { Search, Filter, X, FileSpreadsheet, Expand, Minimize } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getBadgeClass, type CIGRecord } from '../utils/mockData';

interface SearchableTableProps<T> {
  title: string;
  data: T[];
  columns?: { key: keyof T; label: string }[];
  maxHeight?: string;
  enableCategoryFilter?: boolean;
}

const getColumnsFromData = <T extends Record<string, unknown>>(data: T[]): { key: keyof T; label: string }[] => {
  if (!data || data.length === 0) return [];
  const keyBlacklist = ['geom']; // Don't show geometry columns
  const keys = Object.keys(data[0]).filter(key => !keyBlacklist.includes(key));
  return keys.map(key => ({
    key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  }));
};

// Enhanced data formatting functions with CSS class detection
const formatValue = (value: unknown, key: string): { formatted: string; cssClass: string } => {
  if (value === null || value === undefined || value === '') {
    return { formatted: 'N/A', cssClass: 'text-gray-400' };
  }

  const stringValue = String(value).trim();
  if (!stringValue) return { formatted: 'N/A', cssClass: 'text-gray-400' };

  const field = key.toLowerCase();
  
  // Format percentages
  if (field.includes('percent') || field.includes('ribasso') || stringValue.includes('%')) {
    const numericValue = parseFloat(stringValue.replace('%', '').replace(',', '.'));
    if (!isNaN(numericValue)) {
      return { 
        formatted: `${numericValue.toFixed(2)}%`, 
        cssClass: 'table-cell-percentage data-formatted' 
      };
    }
  }
  
  // Format currency
  if (field.includes('importo') || field.includes('prezzo') || field.includes('costo') || 
      field.includes('valore') || stringValue.includes('€')) {
    const numericValue = parseFloat(stringValue.replace(/[€\s.,]/g, '').replace(',', '.'));
    if (!isNaN(numericValue)) {
      return { 
        formatted: `€ ${numericValue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
        cssClass: 'table-cell-currency data-formatted' 
      };
    }
  }
  
  // Format dates
  if (field.includes('data') || field.includes('date') || /\d{2}[/-]\d{2}[/-]\d{4}/.test(stringValue)) {
    try {
      const date = new Date(stringValue);
      if (!isNaN(date.getTime())) {
        return { 
          formatted: date.toLocaleDateString('it-IT'), 
          cssClass: 'table-cell-date data-formatted' 
        };
      }
    } catch {
      // Return original if can't parse
    }
  }
  
  // Format numbers
  if (/^\d+([.,]\d+)?$/.test(stringValue)) {
    const numericValue = parseFloat(stringValue.replace(',', '.'));
    if (!isNaN(numericValue)) {
      return { 
        formatted: numericValue.toLocaleString('it-IT'), 
        cssClass: 'text-cyan-400 font-mono data-formatted' 
      };
    }
  }
  
  // Detect category and apply appropriate class
  const category = detectFieldCategory(key, stringValue);
  const cssClass = getCategoryCSSClass(category);
  
  // Capitalize first letter for text
  let formatted = stringValue;
  if (stringValue.length > 1 && !stringValue.includes('_')) {
    formatted = stringValue.charAt(0).toUpperCase() + stringValue.slice(1).toLowerCase();
  }
  
  return { formatted, cssClass: `${cssClass} data-formatted` };
};

const getCategoryCSSClass = (categoria: CIGRecord['categoria']): string => {
  const classes = {
    identificativo: 'table-cell-identifier',
    azienda: 'table-cell-company',
    importo: 'table-cell-currency',
    data: 'table-cell-date',
    ente: 'table-cell-entity',
    location: 'table-cell-location',
    procedura: 'table-cell-procedure'
  };
  return classes[categoria] || 'table-cell-value';
};

// Detect category of field based on content
const detectFieldCategory = (key: string, value: string): CIGRecord['categoria'] => {
  const field = key.toLowerCase();
  const val = value?.toLowerCase() || '';
  
  // Identificativo
  if (field.includes('cig') || field.includes('id') || field.includes('codice') || field.includes('numero')) {
    return 'identificativo';
  }
  
  // Azienda
  if (field.includes('azienda') || field.includes('ditta') || field.includes('ragione') || 
      field.includes('denominazione') || field.includes('partita') || field.includes('fiscale')) {
    return 'azienda';
  }
  
  // Importo
  if (field.includes('importo') || field.includes('prezzo') || field.includes('costo') || 
      field.includes('valore') || val.includes('€') || val.includes('euro') || 
      field.includes('ribasso') || /^\d+[.,]?\d*$/.test(val.replace(/[€\s]/g, ''))) {
    return 'importo';
  }
  
  // Data
  if (field.includes('data') || field.includes('scadenza') || field.includes('termine') ||
      /\d{2}[/-]\d{2}[/-]\d{4}/.test(val)) {
    return 'data';
  }
  
  // Ente
  if (field.includes('ente') || field.includes('comune') || field.includes('regione') || 
      field.includes('provincia') || field.includes('amministrazione')) {
    return 'ente';
  }
  
  // Location
  if (field.includes('luogo') || field.includes('indirizzo') || field.includes('comune') || 
      field.includes('provincia') || field.includes('regione')) {
    return 'location';
  }
  
  // Procedura
  if (field.includes('procedura') || field.includes('tipo') || field.includes('oggetto') || 
      field.includes('criterio') || field.includes('modalita')) {
    return 'procedura';
  }
  
  return 'identificativo'; // Default
};

const getCategoryIcon = (categoria: CIGRecord['categoria']): string => {
  const icons = {
    identificativo: '🆔',
    azienda: '🏢',
    importo: '💰',
    data: '📅',
    ente: '🏛️',
    location: '📍',
    procedura: '⚖️'
  };
  return icons[categoria];
};

const SearchableTable = <T extends Record<string, unknown>>({ 
  title, 
  data, 
  columns, 
  maxHeight = '70vh',
  enableCategoryFilter = true 
}: SearchableTableProps<T>) => {
  const [filter, setFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CIGRecord['categoria'] | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());

  const tableColumns = useMemo(() => columns || getColumnsFromData(data), [columns, data]);

  // Detect categories present in the data
  const availableCategories = useMemo(() => {
    if (!enableCategoryFilter || !data.length) return [];
    
    const categories = new Set<CIGRecord['categoria']>();
    data.forEach(row => {
      Object.entries(row).forEach(([key, value]) => {
        const category = detectFieldCategory(key, String(value || ''));
        categories.add(category);
      });
    });
    
    return Array.from(categories).map(cat => ({
      value: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      icon: getCategoryIcon(cat),
      count: data.filter(row => 
        Object.entries(row).some(([key, value]) => 
          detectFieldCategory(key, String(value || '')) === cat
        )
      ).length
    })).sort((a, b) => b.count - a.count); // Sort by count descending
  }, [data, enableCategoryFilter]);

  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply text filter
    if (filter) {
      filtered = filtered.filter(row =>
        tableColumns.some(({ key }) => {
          const value = formatValue(row[key], String(key));
          return value.formatted.toLowerCase().includes(filter.toLowerCase());
        })
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all' && enableCategoryFilter) {
      filtered = filtered.filter(row =>
        Object.entries(row).some(([key, value]) => 
          detectFieldCategory(key, String(value || '')) === selectedCategory
        )
      );
    }

    return filtered;
  }, [data, filter, selectedCategory, tableColumns, enableCategoryFilter]);

  const exportToXLSX = () => {
    // Prepare data for export with categories
    const exportData = filteredData.map((row, index) => {
      const exportRow: Record<string, unknown> = { '#': index + 1 };
      
      tableColumns.forEach(col => {
        const value = row[col.key];
        const formattedValue = formatValue(value, String(col.key));
        const category = detectFieldCategory(String(col.key), String(value || ''));
        const categoryIcon = getCategoryIcon(category);
        
        exportRow[`${categoryIcon} ${col.label}`] = formattedValue.formatted;
      });
      
      return exportRow;
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    // Set column widths
    const columnWidths = [
      { wch: 5 }, // # column
      ...tableColumns.map(col => ({
        wch: Math.max(col.label.length + 5, 15) // minimum 15 characters width + icon space
      }))
    ];
    worksheet['!cols'] = columnWidths;

    // Add title and metadata
    const titleRow = [title];
    const metadataRow = [`Exported on: ${new Date().toLocaleString('it-IT')}`];
    const statsRow = [`Total records: ${data.length} | Filtered: ${filteredData.length}`];
    
    XLSX.utils.sheet_add_aoa(worksheet, [titleRow, metadataRow, statsRow], { origin: 'A1' });

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, title.slice(0, 30));

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `DBSee_${title.replace(/[^\w\s]/g, '').replace(/\s+/g, '_')}_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
  };

  const clearFilters = () => {
    setFilter('');
    setSelectedCategory('all');
  };

  const toggleCellExpansion = (cellId: string) => {
    const newExpandedCells = new Set(expandedCells);
    if (newExpandedCells.has(cellId)) {
      newExpandedCells.delete(cellId);
    } else {
      newExpandedCells.add(cellId);
    }
    setExpandedCells(newExpandedCells);
  };

  const shouldShowExpandButton = (value: string) => {
    return value.length > 50; // Show expand button for text longer than 50 characters
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (!data || data.length === 0) {
    return (
      <div className="card-neon p-8 text-center animate-slide-in">
        <h3 className="text-xl font-semibold gradient-text mb-2">Nessun Dato Disponibile</h3>
        <p className="text-gray-400">Non ci sono risultati da visualizzare per questa ricerca.</p>
      </div>
    );
  }

  return (
    <div className="card-neon backdrop-blur-xl animate-slide-in">
      {/* Header */}
      <div className="p-6 border-b border-cyan-500/20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold gradient-text">{title}</h2>
            <span className="badge-neon-cyan text-xs">
              {filteredData.length} / {data.length} records
            </span>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* Export Button */}
            <button
              onClick={exportToXLSX}
              className="btn-export-enhanced"
              title="Export to Excel"
            >
              <FileSpreadsheet className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              Export XLSX
            </button>

            {/* Filter Toggle */}
            {enableCategoryFilter && availableCategories.length > 0 && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-neon-secondary ${showFilters ? 'opacity-100' : 'opacity-70'}`}
                title="Toggle filters"
              >
                <Filter className="h-4 w-4" />
                Filtri ({availableCategories.length})
              </button>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Cerca in ${title}...`}
                className="search-input-enhanced text-white placeholder:text-gray-500 pl-10 w-64"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              {filter && (
                <button
                  onClick={() => setFilter('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors duration-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && enableCategoryFilter && availableCategories.length > 0 && (
          <div className="mt-6 p-4 bg-gray-800/30 rounded-xl border border-cyan-500/20 animate-slide-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Filter className="h-5 w-5 text-cyan-400" />
                Filtri per Categoria
              </h3>
              {(selectedCategory !== 'all' || filter) && (
                <button
                  onClick={clearFilters}
                  className="btn-neon text-xs"
                >
                  <X className="h-3 w-3" />
                  Pulisci Filtri
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`category-filter ${selectedCategory === 'all' ? 'active' : ''}`}
              >
                🔍 Tutte
                <span className="count">{data.length}</span>
              </button>
              
              {availableCategories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`category-filter ${selectedCategory === cat.value ? 'active' : ''}`}
                >
                  {cat.icon} {cat.label}
                  <span className="count">{cat.count}</span>
                </button>
              ))}
            </div>

            {/* Active Filters Summary */}
            {(selectedCategory !== 'all' || filter) && (
              <div className="mt-4 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                <p className="text-sm text-cyan-300 font-medium mb-2">Filtri Attivi:</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedCategory !== 'all' && (
                    <span className={`${getBadgeClass(selectedCategory)} text-xs`}>
                      {getCategoryIcon(selectedCategory)} {selectedCategory}
                    </span>
                  )}
                  {filter && (
                    <span className="badge-neon-purple text-xs">
                      🔍 "{filter}"
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full">
          <thead className="bg-gray-800/50 sticky top-0 z-10 backdrop-blur-sm">
            <tr className="border-b border-cyan-500/30">
              {tableColumns.map(col => {
                const sampleValue = data.find(row => row[col.key])?.[col.key];
                const category = detectFieldCategory(String(col.key), String(sampleValue || ''));
                const icon = getCategoryIcon(category);
                
                return (
                  <th key={String(col.key)} className="p-4 text-left column-header">
                    <div className="flex items-center gap-2">
                      <span className="column-header-icon">{icon}</span>
                      <div>
                        <div className="font-semibold text-white text-sm">{col.label}</div>
                        <div className={`${getBadgeClass(category)} text-xs`}>
                          {category}
                        </div>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className="border-b border-gray-700/30 table-row"
              >
                {tableColumns.map(col => {
                  const value = row[col.key];
                  const formattedData = formatValue(value, String(col.key));
                  const cellId = `${rowIndex}-${String(col.key)}`;
                  const isExpanded = expandedCells.has(cellId);
                  const displayValue = typeof value === 'boolean' 
                    ? (value ? '✅ Sì' : '❌ No')
                    : formattedData.formatted;
                  const showExpandButton = shouldShowExpandButton(displayValue);
                  
                  return (
                    <td key={cellId} className="p-4">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <span 
                            className={`${formattedData.cssClass} table-cell-value cursor-pointer hover:bg-gray-700/20 rounded px-2 py-1 transition-colors duration-200 ${isExpanded ? 'expanded-cell' : ''}`}
                            onClick={() => showExpandButton && toggleCellExpansion(cellId)}
                            title={showExpandButton ? (isExpanded ? 'Clicca per ridurre' : 'Clicca per espandere') : undefined}
                          >
                            {isExpanded || !showExpandButton ? displayValue : truncateText(displayValue)}
                          </span>
                        </div>
                        {showExpandButton && (
                          <button
                            onClick={() => toggleCellExpansion(cellId)}
                            className="flex-shrink-0 p-1 text-gray-400 hover:text-cyan-400 transition-colors duration-200"
                            title={isExpanded ? 'Riduci' : 'Espandi'}
                          >
                            {isExpanded ? (
                              <Minimize className="h-3 w-3" />
                            ) : (
                              <Expand className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={tableColumns.length} className="text-center p-12">
                  <div className="no-data-state">
                    <div className="no-data-icon">🔍</div>
                    <h3 className="no-data-title">Nessun Risultato</h3>
                    <p className="no-data-description">
                      {filter ? `Nessun risultato trovato per "${filter}"` : 'Nessun dato corrisponde ai filtri selezionati'}
                    </p>
                    {(selectedCategory !== 'all' || filter) && (
                      <button
                        onClick={clearFilters}
                        className="btn-neon mt-4"
                      >
                        Pulisci Filtri
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SearchableTable; 