import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { 
  Database, 
  Table, 
  ArrowRight, 
  Search, 
  Building2, 
  Zap,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  X,
  Filter,
  Expand,
  Minimize
} from 'lucide-react';
import { tablesAPI, searchAPI } from '../services/api';
import SearchByCIG from '../components/SearchByCIG';
import AdvancedSearch from '../components/AdvancedSearch';
import SearchableTable from '../components/SearchableTable';
import { 
  CIGSearchResult, 
  CompanyResult, 
  CompanySearchStreamEvent, 
  DirectCompanySearchStreamEvent,
  StreamFinalSummary,
  StreamError,
  StreamTableResult
} from '../types/api';
import { 
  getBadgeClass,
  categorizeField,
  formatDisplayValue,
  getCategoryIcon,
  generateQuickLinks,
  type CIGRecord 
} from '../utils/mockData';

interface StreamingProgress {
  currentTable: string;
  tableIndex: number;
  totalTables: number;
  is_priority: boolean;
  priority_tables: number;
}

type SearchType = 'cig' | 'company';

const DashboardPage = () => {
  const [searchType, setSearchType] = useState<SearchType>('cig');
  const [searchResults, setSearchResults] = useState<CIGSearchResult | null>(null);
  const [companyResults, setCompanyResults] = useState<CompanyResult | null>(null);
  const [activeCategory, setActiveCategory] = useState<CIGRecord['categoria'] | null>(null);
  const [sortBy, setSortBy] = useState<'campo' | 'categoria' | 'fonte'>('categoria');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [compactView, setCompactView] = useState(false);
  const [cigTableFilter, setCigTableFilter] = useState('');
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());
  
  // Streaming search state
  const [streamingProgress, setStreamingProgress] = useState<StreamingProgress | null>(null);
  const [streamingStatus, setStreamingStatus] = useState<string>('');
  const [totalMatches, setTotalMatches] = useState(0);
  
  const cigDataForTable = useMemo(() => {
    if (!searchResults?.found || !searchResults.merged_data) return [];
    
    return Object.entries(searchResults.merged_data)
      .map(([key, value]) => {
        const campo = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const rawValue = String(value ?? 'N/A');
        const fonte = searchResults.field_sources?.[key] || 'Sconosciuto';
        const categoria = categorizeField(key, rawValue);
        const icon = getCategoryIcon(categoria);
        const valore = formatDisplayValue(rawValue, categoria);
        
        return {
          campo,
          valore,
          fonte,
          categoria,
          icon
        };
      })
      .filter(item => item.valore && item.valore.toLowerCase() !== 'n/a' && item.valore.trim() !== '');

  }, [searchResults]);

  // Generate quick links for categories using the enhanced function
  const quickLinks = useMemo(() => {
    return generateQuickLinks(cigDataForTable);
  }, [cigDataForTable]);

  const filteredCigData = useMemo(() => {
    let filtered = activeCategory 
      ? cigDataForTable.filter(item => item.categoria === activeCategory)
      : cigDataForTable;
    
    // Apply text filter
    if (cigTableFilter) {
      filtered = filtered.filter(item =>
        item.campo.toLowerCase().includes(cigTableFilter.toLowerCase()) ||
        item.valore.toLowerCase().includes(cigTableFilter.toLowerCase()) ||
        item.fonte.toLowerCase().includes(cigTableFilter.toLowerCase()) ||
        item.categoria.toLowerCase().includes(cigTableFilter.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'categoria') {
        // Custom sort order for categories
        const categoryOrder = ['identificativo', 'azienda', 'importo', 'data', 'ente', 'location', 'procedura'];
        aValue = categoryOrder.indexOf(a.categoria).toString();
        bValue = categoryOrder.indexOf(b.categoria).toString();
      }
      
      const comparison = aValue.localeCompare(bValue, 'it');
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }, [cigDataForTable, activeCategory, sortBy, sortOrder, cigTableFilter]);

  const {
    data: tables,
    isLoading: tablesLoading,
  } = useQuery('tables', tablesAPI.getTables);

  const cigSearchMutation = useMutation(searchAPI.searchByCIG, {
    onSuccess: (data) => {
      setSearchResults(data);
      setCompanyResults(null);
      setActiveCategory(null); // Reset category filter
    },
  });

  const companySearchMutation = useMutation(
    async (searchParams: { companyName: string; yearFilter?: number }) => {
      return new Promise((resolve, reject) => {
        const allResults: StreamTableResult[] = [];
        let finalData: CompanyResult | null = null;

        const handleProgress = (data: CompanySearchStreamEvent) => {
          console.log('Streaming progress:', data);
          
          if (data.type === 'table_result') {
            allResults.push(data);
            setTotalMatches((prev: number) => prev + data.matches);
            
            const currentResults: CompanyResult = {
              company_name: searchParams.companyName,
              found: true,
              results_by_table: allResults.map(r => ({
                table_name: r.table_name,
                matches: r.matches,
                data: r.data,
              })),
            };
            
            setCompanyResults(currentResults);
            setSearchResults(null);
          }
          
          if (data.type === 'progress') {
            setStreamingProgress({
              currentTable: data.current_table,
              tableIndex: data.table_index,
              totalTables: data.total_tables,
              is_priority: data.is_priority,
              priority_tables: data.priority_tables ?? 0
            });
          }
          
          if (data.type === 'status') {
            setStreamingStatus(data.message);
          }
        };

        const handleComplete = (data: StreamFinalSummary) => {
          console.log('Streaming completed:', data);
          finalData = {
            ...companyResults,
            company_name: data.company_name,
            year_filter: data.year_filter,
            found: data.found,
            total_matches: data.total_matches,
            tables_searched: data.tables_searched,
          } as CompanyResult;
          
          setStreamingProgress(null);
          setStreamingStatus('');
          resolve(finalData);
        };

        const handleError = (error: StreamError) => {
          console.error('Streaming error:', error);
          setStreamingProgress(null);
          setStreamingStatus('');
          reject(new Error(error.detail || 'Errore durante la ricerca'));
        };

        // Reset state
        setTotalMatches(0);
        setStreamingProgress(null);
        setStreamingStatus('Avvio ricerca...');

        // Start the streaming search
        searchAPI.searchByCompanyStream(
          searchParams.companyName, 
          searchParams.yearFilter,
          handleProgress,
          handleComplete,
          handleError
        );
      });
    },
    {
      onSuccess: (data) => {
        console.log('Company search completed successfully:', data);
      },
      onError: (error) => {
        console.error('Company search failed:', error);
        setStreamingProgress(null);
        setStreamingStatus('');
      }
    }
  );

  const directSearchMutation = useMutation(
    async (searchParams: { companyName: string; yearFilter?: number }) => {
      return new Promise((resolve, reject) => {
        const handleProgress = (data: DirectCompanySearchStreamEvent) => {
          console.log('Direct search progress:', data);
          
          if (data.type === 'progress') {
            setStreamingStatus(data.message);
          }
          
          if (data.type === 'aggiudicatari_results') {
            setStreamingStatus(`📊 Trovati ${data.matches_found} match in aggiudicatari_data`);
            setCompanyResults({
              company_name: searchParams.companyName,
              found: data.matches_found > 0,
              aggiudicatari_matches: data.matches_found,
              aggiudicatari_summary: data.data,
              search_time: data.search_time
            } as CompanyResult);
            setSearchResults(null);
          }
        };

        const handleComplete = (data: StreamFinalSummary) => {
          console.log('Direct search completed:', data);
          setStreamingProgress(null);
          setStreamingStatus('');
          resolve(data as any);
        };

        const handleError = (error: StreamError) => {
          console.error('Direct search error:', error);
          setStreamingProgress(null);
          setStreamingStatus('');
          reject(new Error(error.message || 'Errore durante la ricerca diretta'));
        };

        // Reset state
        setStreamingProgress(null);
        setStreamingStatus('Avvio ricerca diretta...');

        searchAPI.searchByCompanyDirectStream(
          searchParams.companyName,
          searchParams.yearFilter,
          handleProgress,
          handleComplete,
          handleError
        );
      });
    }
  );

  const getTableDisplayName = (tableName: string): string => {
    const displayNames: Record<string, string> = {
      'aggiudicatari_data': 'Aggiudicatari',
      'aggiudicazioni_data': 'Aggiudicazioni',
      'cig_data': 'CIG',
      'lotti_data': 'Lotti',
      'partecipanti_data': 'Partecipanti',
      'pubblicazioni_data': 'Pubblicazioni',
      'quadro_economico_data': 'Quadro Economico',
      'categorie_opera_data': 'Categorie Opera',
      'categorie_dpcm_data': 'Categorie DPCM',
      'avvio_contratto_data': 'Avvio Contratto',
      'fonti_finanziamento_data': 'Fonti Finanziamento',
      'lavorazioni_data': 'Lavorazioni'
    };
    
    return displayNames[tableName] || tableName;
  };

  const handleCIGSearch = (cig: string) => {
    cigSearchMutation.mutate(cig);
  };

  const handleCompanySearch = (companyName: string, yearFilter?: number) => {
    companySearchMutation.mutate({ companyName, yearFilter });
  };

  const handleSort = (column: 'campo' | 'categoria' | 'fonte') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column: 'campo' | 'categoria' | 'fonte') => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
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
    return value.length > 50;
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const exportCigDataToXLSX = () => {
    const exportData = filteredCigData.map((item, index) => ({
      '#': index + 1,
      '📋 Nome Campo': item.campo,
      '📄 Parametro': item.valore,
      '🗂️ Fonte': item.fonte,
      '🏷️ Categoria': item.categoria
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    const columnWidths = [
      { wch: 5 },  // # column
      { wch: 25 }, // Nome Campo
      { wch: 30 }, // Parametro
      { wch: 20 }, // Fonte
      { wch: 15 }  // Categoria
    ];
    worksheet['!cols'] = columnWidths;

    const titleRow = [`Risultati CIG: ${searchResults?.cig || 'N/A'}`];
    const metadataRow = [`Exported on: ${new Date().toLocaleString('it-IT')}`];
    const statsRow = [`Total records: ${cigDataForTable.length} | Filtered: ${filteredCigData.length}`];
    
    XLSX.utils.sheet_add_aoa(worksheet, [titleRow, metadataRow, statsRow], { origin: 'A1' });
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CIG_Results');

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `DBSee_CIG_${searchResults?.cig || 'Results'}_${timestamp}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Zap className="h-12 w-12 text-cyan-400 animate-bounce" />
            <h1 className="text-5xl font-bold gradient-text">
              DBSee Dashboard
            </h1>
            <Zap className="h-12 w-12 text-purple-400 animate-bounce" style={{ animationDelay: '0.5s' }} />
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            🚀 Esplora il database degli appalti pubblici con tecnologie futuristiche
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-neon p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                <Database className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{tables?.length || 0}</h3>
                <p className="text-gray-400">Database Attivi</p>
              </div>
            </div>
          </div>

          <div className="card-neon-purple p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{totalMatches.toLocaleString()}</h3>
                <p className="text-gray-400">Records Trovati</p>
              </div>
            </div>
          </div>

          <div className="card-neon-green p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">AI-Powered</h3>
                <p className="text-gray-400">Smart Search</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => setSearchType('cig')}
            className={`card-neon p-6 cursor-pointer transition-all duration-300 ${
              searchType === 'cig' 
                ? 'border-cyan-500/50 shadow-cyan-500/20 bg-cyan-500/5' 
                : 'hover:border-cyan-500/30'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Ricerca CIG</h3>
                <p className="text-gray-400">Cerca per Codice Identificativo Gara</p>
              </div>
              {searchType === 'cig' && (
                <div className="ml-auto w-4 h-4 bg-cyan-400 rounded-full animate-pulse" />
              )}
            </div>
          </div>

          <div 
            onClick={() => setSearchType('company')}
            className={`card-neon p-6 cursor-pointer transition-all duration-300 ${
              searchType === 'company' 
                ? 'border-purple-500/50 shadow-purple-500/20 bg-purple-500/5' 
                : 'hover:border-purple-500/30'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Ricerca Azienda</h3>
                <p className="text-gray-400">Cerca per nome dell'azienda</p>
              </div>
              {searchType === 'company' && (
                <div className="ml-auto w-4 h-4 bg-purple-400 rounded-full animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Search Forms */}
        <div className="space-y-6">
          {searchType === 'cig' ? (
            <SearchByCIG 
              onSearch={handleCIGSearch}
              isLoading={cigSearchMutation.isLoading}
            />
          ) : (
            <AdvancedSearch
              onSearch={handleCompanySearch}
              isLoading={companySearchMutation.isLoading || directSearchMutation.isLoading}
            />
          )}
        </div>
      </div>

      {/* Streaming Progress */}
      {(companySearchMutation.isLoading || directSearchMutation.isLoading) && streamingProgress && (
        <div className="card-neon p-6 animate-slide-in relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold gradient-text">
              🔥 Ricerca in corso...
            </h3>
            <div className="flex items-center gap-2">
              <div className="spinner-neon w-4 h-4" />
              <span className="text-sm text-gray-400">
                {streamingProgress.tableIndex + 1} / {streamingProgress.totalTables}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tabella corrente:</span>
              <span className="font-medium text-cyan-300">
                {streamingProgress.currentTable}
              </span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500 animate-pulse"
                style={{ 
                  width: `${((streamingProgress.tableIndex + 1) / streamingProgress.totalTables) * 100}%` 
                }}
              />
            </div>
            
            <p className="text-sm text-gray-400">{streamingStatus}</p>
            <p className="text-sm font-medium gradient-text-green">
              💎 Matches trovati: {totalMatches.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Search Results with Smart Categorization */}
      {(searchResults || companyResults) && (
        <div className="space-y-6 animate-slide-in relative z-10">
          {/* CIG Results - Now with enhanced categorization */}
          {searchResults && cigDataForTable.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold gradient-text flex items-center gap-3">
                  🎯 Risultati CIG: {searchResults.cig}
                  <span className="text-sm text-gray-400">({cigDataForTable.length} campi trovati)</span>
                </h2>
                
                {activeCategory && (
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="btn-neon-secondary text-sm"
                  >
                    ✕ Mostra Tutti
                  </button>
                )}
              </div>
              
              {/* Enhanced Quick Category Links */}
              {quickLinks.length > 0 && (
                <div className="card-neon p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      ⚡ Quick Links per Categoria
                      <span className="text-sm text-gray-400 font-normal">
                        Filtra i dati per tipo
                      </span>
                    </h3>
                    
                    {/* Table Controls */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Export Button */}
                      <button
                        onClick={exportCigDataToXLSX}
                        className="btn-export-enhanced"
                        title="Export to Excel"
                      >
                        <FileSpreadsheet className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                        Export XLSX
                      </button>

                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Cerca nella tabella..."
                          className="search-input-enhanced text-white placeholder:text-gray-500 pl-10 w-64"
                          value={cigTableFilter}
                          onChange={(e) => setCigTableFilter(e.target.value)}
                        />
                        {cigTableFilter && (
                          <button
                            onClick={() => setCigTableFilter('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors duration-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => setCompactView(!compactView)}
                        className={`btn-neon-secondary text-xs px-3 py-1 ${compactView ? 'opacity-100' : 'opacity-70'}`}
                        title="Vista compatta"
                      >
                        {compactView ? '📋' : '📄'} {compactView ? 'Normale' : 'Compatta'}
                      </button>
                      
                      <div className="text-xs text-gray-400">
                        Ordina per: <span className="text-cyan-300 capitalize">{sortBy}</span> {getSortIcon(sortBy)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {quickLinks.map((link) => (
                      <button
                        key={link.categoria}
                        onClick={() => setActiveCategory(
                          activeCategory === link.categoria ? null : link.categoria
                        )}
                        className={`group relative p-4 rounded-lg border transition-all duration-300 hover:scale-[1.02] ${
                          activeCategory === link.categoria
                            ? 'quick-link-active'
                            : 'border-gray-600 hover:border-gray-500 bg-gray-800/50 quick-link-hover'
                        }`}
                        title={link.description}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-r ${link.color} opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-300`} />
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                              {link.icon}
                            </span>
                            <div className="flex-1 text-left">
                              <span className="font-semibold text-white block">{link.label}</span>
                              <span className="category-count">
                                {link.count} campi
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 text-left group-hover:text-gray-300 transition-colors duration-200">
                            {link.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {activeCategory && (
                    <div className="mt-4 flex items-center justify-between p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400">🔍</span>
                        <span className="text-white font-medium">
                          Mostrando solo: {quickLinks.find(l => l.categoria === activeCategory)?.label}
                        </span>
                        <span className="category-count bg-cyan-500/20 text-cyan-300">
                          {filteredCigData.length} di {cigDataForTable.length}
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveCategory(null)}
                        className="text-cyan-400 hover:text-white transition-colors duration-200 text-sm"
                      >
                        ✕ Rimuovi Filtro
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Categorized Table Display */}
              <div className="cig-data-table overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left text-cyan-300 font-semibold">
                          <button
                            onClick={() => handleSort('campo')}
                            className="flex items-center gap-2 w-full text-left hover:text-cyan-200 transition-colors duration-200"
                            title="Clicca per ordinare per nome campo"
                          >
                            📋 Nome Campo
                            <span className="text-xs opacity-70">{getSortIcon('campo')}</span>
                          </button>
                        </th>
                        <th className="text-left text-purple-300 font-semibold">
                          <div className="flex items-center gap-2">
                            📄 Parametro
                          </div>
                        </th>
                        <th className="text-left text-orange-300 font-semibold">
                          <button
                            onClick={() => handleSort('fonte')}
                            className="flex items-center gap-2 w-full text-left hover:text-orange-200 transition-colors duration-200"
                            title="Clicca per ordinare per fonte"
                          >
                            🗂️ Fonte
                            <span className="text-xs opacity-70">{getSortIcon('fonte')}</span>
                          </button>
                        </th>
                        <th className="text-center text-gray-300 font-semibold">
                          <button
                            onClick={() => handleSort('categoria')}
                            className="flex items-center justify-center gap-2 w-full hover:text-gray-200 transition-colors duration-200"
                            title="Clicca per ordinare per categoria"
                          >
                            🏷️ Categoria
                            <span className="text-xs opacity-70">{getSortIcon('categoria')}</span>
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCigData.map((item, index) => (
                        <tr 
                          key={`${item.campo}-${index}`}
                          className={`transition-all duration-200 group animate-slide-in ${compactView ? 'compact-row' : ''}`}
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td>
                            <div className="flex items-start gap-2">
                              <span className={`group-hover:scale-110 transition-transform duration-200 ${compactView ? 'text-base' : 'text-xl'}`}>
                                {item.icon}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-start gap-2">
                                  <div className="flex-1">
                                    <span 
                                      className={`font-medium text-white group-hover:text-cyan-300 transition-colors duration-200 cursor-pointer hover:bg-gray-700/20 rounded px-2 py-1 transition-colors duration-200 ${compactView ? 'text-sm' : ''} ${expandedCells.has(`${index}-campo`) ? 'expanded-cell' : ''}`}
                                      onClick={() => shouldShowExpandButton(item.campo) && toggleCellExpansion(`${index}-campo`)}
                                      title={shouldShowExpandButton(item.campo) ? (expandedCells.has(`${index}-campo`) ? 'Clicca per ridurre' : 'Clicca per espandere') : undefined}
                                    >
                                      {expandedCells.has(`${index}-campo`) || !shouldShowExpandButton(item.campo) ? item.campo : truncateText(item.campo)}
                                    </span>
                                  </div>
                                  {shouldShowExpandButton(item.campo) && (
                                    <button
                                      onClick={() => toggleCellExpansion(`${index}-campo`)}
                                      className="flex-shrink-0 p-1 text-gray-400 hover:text-cyan-400 transition-colors duration-200"
                                      title={expandedCells.has(`${index}-campo`) ? 'Riduci' : 'Espandi'}
                                    >
                                      {expandedCells.has(`${index}-campo`) ? (
                                        <Minimize className="h-3 w-3" />
                                      ) : (
                                        <Expand className="h-3 w-3" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-start gap-2">
                              <div className="flex-1">
                                <span 
                                  className={`font-mono value-${item.categoria} group-hover:scale-[1.01] transition-transform duration-200 cursor-pointer hover:bg-gray-700/20 rounded px-2 py-1 transition-colors duration-200 ${compactView ? 'text-xs' : 'text-sm'} ${expandedCells.has(`${index}-valore`) ? 'expanded-cell' : ''}`}
                                  onClick={() => shouldShowExpandButton(item.valore) && toggleCellExpansion(`${index}-valore`)}
                                  title={shouldShowExpandButton(item.valore) ? (expandedCells.has(`${index}-valore`) ? 'Clicca per ridurre' : 'Clicca per espandere') : undefined}
                                >
                                  {expandedCells.has(`${index}-valore`) || !shouldShowExpandButton(item.valore) ? item.valore : truncateText(item.valore)}
                                </span>
                              </div>
                              {shouldShowExpandButton(item.valore) && (
                                <button
                                  onClick={() => toggleCellExpansion(`${index}-valore`)}
                                  className="flex-shrink-0 p-1 text-gray-400 hover:text-cyan-400 transition-colors duration-200"
                                  title={expandedCells.has(`${index}-valore`) ? 'Riduci' : 'Espandi'}
                                >
                                  {expandedCells.has(`${index}-valore`) ? (
                                    <Minimize className="h-3 w-3" />
                                  ) : (
                                    <Expand className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className={`text-gray-400 group-hover:text-gray-300 transition-colors duration-200 ${compactView ? 'text-xs' : 'text-sm'}`}>
                              {item.fonte}
                            </div>
                          </td>
                          <td className="text-center">
                            <span className={`${getBadgeClass(item.categoria)} ${compactView ? 'text-xs px-2 py-0.5' : 'text-xs'}`}>
                              {item.categoria}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Table Footer with Statistics */}
                <div className="table-footer p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400">
                        Visualizzando <span className="text-white font-medium">{filteredCigData.length}</span> di <span className="text-white font-medium">{cigDataForTable.length}</span> campi
                      </span>
                      {activeCategory && (
                        <span className="text-cyan-400">
                          • Categoria: <span className="font-medium">{quickLinks.find(l => l.categoria === activeCategory)?.label}</span>
                        </span>
                      )}
                      {cigTableFilter && (
                        <span className="text-purple-400">
                          • Ricerca: <span className="font-medium">"{cigTableFilter}"</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">CIG:</span>
                      <span className="font-mono text-cyan-300">{searchResults.cig}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Company Results */}
          {companyResults && companyResults.results_by_table && (
            <div className="space-y-6">
              {companyResults.results_by_table.map((tableResult, index) => (
                <div
                  key={`${String(tableResult.table_name)}-${index}`}
                  className="animate-slide-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <SearchableTable
                    data={Array.isArray(tableResult.data) ? tableResult.data : []}
                    title={`🏢 ${getTableDisplayName(String(tableResult.table_name))} (${tableResult.matches} risultati)`}
                    columns={
                      Array.isArray(tableResult.data) && tableResult.data.length > 0
                        ? Object.keys(tableResult.data[0]).map((key: string) => ({
                            key,
                            label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                          }))
                        : []
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tables Grid Neon */}
      {!tablesLoading && tables && !searchResults && !companyResults && (
        <div className="space-y-6 relative z-10">
          <h2 className="text-3xl font-bold gradient-text mb-6 flex items-center gap-3">
            <Table className="h-8 w-8 text-purple-400" />
            Database Disponibili
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table, index) => (
              <Link
                key={table}
                to={`/table/${table}`}
                className="card-neon p-6 hover:scale-105 transition-all duration-300 group animate-slide-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">
                      {table.includes('aggiudicatari') ? '🏢' : 
                       table.includes('cig') ? '🆔' : 
                       table.includes('lotti') ? '📦' : 
                       table.includes('partecipanti') ? '👥' : '🗃️'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        {getTableDisplayName(table)}
                      </h3>
                      <p className="text-gray-400 text-sm">{table}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all duration-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 