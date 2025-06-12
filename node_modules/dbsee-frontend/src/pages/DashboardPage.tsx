import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { 
  Database, 
  Table, 
  ArrowRight, 
  Search, 
  Building2, 
  Clock, 
  CheckCircle, 
  Zap,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { tablesAPI, searchAPI } from '../services/api';
import SearchByCIG from '../components/SearchByCIG';
import SearchResultsDisplay from '../components/SearchResultsDisplay';
import AdvancedSearch from '../components/AdvancedSearch';
import CompanySearchResults from '../components/CompanySearchResults';
import SimpleCompanyResults from '../components/SimpleCompanyResults';

const DashboardPage = () => {
  const [searchType, setSearchType] = useState<'cig' | 'company' | 'company-stream'>('cig');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [companyResults, setCompanyResults] = useState<any>(null);
  const [useDirectSearch, setUseDirectSearch] = useState<boolean>(true);
  
  // Streaming search state
  const [streamingResults, setStreamingResults] = useState<any[]>([]);
  const [streamingProgress, setStreamingProgress] = useState<{
    currentTable: string;
    tableIndex: number;
    totalTables: number;
    is_priority: boolean;
    priority_tables: number;
  } | null>(null);
  const [streamingStatus, setStreamingStatus] = useState<string>('');
  const [totalMatches, setTotalMatches] = useState(0);
  
  // Direct search streaming state
  const [directStreamingProgress, setDirectStreamingProgress] = useState<any[]>([]);

  const {
    data: tables,
    isLoading: tablesLoading,
  } = useQuery('tables', tablesAPI.getTables);

  const cigSearchMutation = useMutation(searchAPI.searchByCIG, {
    onSuccess: (data) => {
      setSearchResults(data);
      setCompanyResults(null);
    },
  });

  const companySearchMutation = useMutation(
    async (searchParams: { companyName: string; yearFilter?: number }) => {
      return new Promise((resolve, reject) => {
        const allResults: any[] = [];
        let finalData: any = null;

        const handleProgress = (data: any) => {
          console.log('Streaming progress:', data);
          
          if (data.type === 'table_result') {
            allResults.push(data);
            setTotalMatches((prev: number) => prev + data.matches);
            
            const currentResults = {
              company_name: searchParams.companyName,
              year_filter: searchParams.yearFilter,
              found: allResults.length > 0,
              total_matches: allResults.reduce((sum, result) => sum + result.matches, 0),
              tables_searched: allResults.length,
              results_by_table: allResults,
              search_timestamp: new Date().toISOString()
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
              priority_tables: data.priority_tables
            });
          }
          
          if (data.type === 'status') {
            setStreamingStatus(data.message);
          }
        };

        const handleComplete = (data: any) => {
          console.log('Streaming completed:', data);
          finalData = {
            company_name: data.company_name,
            year_filter: data.year_filter,
            found: data.found,
            total_matches: data.total_matches,
            tables_searched: data.tables_searched,
            results_by_table: allResults,
            search_timestamp: data.search_timestamp
          };
          
          setCompanyResults(finalData);
          setStreamingStatus('Ricerca completata!');
          resolve(finalData);
        };

        const handleError = (error: any) => {
          console.error('Streaming error:', error);
          reject(error);
        };

        setStreamingResults([]);
        setStreamingProgress(null);
        setStreamingStatus('Avvio ricerca...');
        setTotalMatches(0);
        setCompanyResults(null);
        setSearchResults(null);

        searchAPI.searchByCompanyStream(
          searchParams.companyName,
          searchParams.yearFilter,
          handleProgress,
          handleComplete,
          handleError
        ).catch(reject);
      });
    },
    {
      onSuccess: (data) => {
        console.log('Company search completed:', data);
        setStreamingStatus('Ricerca completata!');
      },
      onError: (error: any) => {
        console.error('Company search error:', error);
        setStreamingStatus(`Errore: ${error.message || 'Errore sconosciuto'}`);
      },
    }
  );

  const handleCIGSearch = (cig: string) => {
    cigSearchMutation.mutate(cig);
  };

  const handleCompanySearch = (companyName: string, yearFilter?: number) => {
    if (useDirectSearch) {
      directSearchMutation.mutate({ companyName, yearFilter });
    } else {
      companySearchMutation.mutate({ companyName, yearFilter });
    }
  };

  // Direct search mutation with streaming
  const directSearchMutation = useMutation(
    async (searchParams: { companyName: string; yearFilter?: number }) => {
      setDirectStreamingProgress([]);
      setStreamingStatus('Inizializzazione ricerca diretta...');
      
      return new Promise((resolve, reject) => {
        const handleProgress = (data: any) => {
          console.log('Direct streaming progress:', data);
          setDirectStreamingProgress((prev: any[]) => [...prev, data]);
          
          if (data.type === 'search_started') {
            setStreamingStatus(`🎯 Ricerca diretta avviata per: ${data.company_name}`);
          } else if (data.type === 'progress') {
            setStreamingStatus(data.message);
          } else if (data.type === 'aggiudicatari_results') {
            setStreamingStatus(`📊 Trovati ${data.matches_found} match in aggiudicatari_data`);
            setCompanyResults({
              company_name: searchParams.companyName,
              year_filter: searchParams.yearFilter,
              found: data.matches_found > 0,
              search_method: 'direct_streaming',
              aggiudicatari_matches: data.matches_found,
              aggiudicatari_summary: data.data,
              cig_details: [],
              streaming: true,
              search_time: data.search_time
            });
          } else if (data.type === 'cig_progress') {
            setStreamingStatus(data.message);
          } else if (data.type === 'cig_detail') {
            setCompanyResults((prev: any) => {
              if (!prev) return prev;
              return {
                ...prev,
                cig_details: [...(prev.cig_details || []), data.data]
              };
            });
          }
        };

        const handleComplete = (data: any) => {
          console.log('Direct search completed:', data);
          setCompanyResults((prev: any) => ({
            ...prev,
            ...data,
            streaming: false
          }));
          setStreamingStatus('Ricerca diretta completata!');
          resolve(data);
        };

        const handleError = (error: any) => {
          console.error('Direct search error:', error);
          setStreamingStatus(`Errore: ${error.message || 'Errore sconosciuto'}`);
          reject(error);
        };

        searchAPI.searchByCompanyDirectStream(
          searchParams.companyName,
          searchParams.yearFilter,
          handleProgress,
          handleComplete,
          handleError
        ).catch(reject);
      });
    },
    {
      onSuccess: (data) => {
        console.log('Direct search completed:', data);
      },
      onError: (error: any) => {
        console.error('Direct search error:', error);
      },
    }
  );

  const getTableDisplayName = (tableName: string): string => {
    return tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTableIcon = (tableName: string) => {
    return <Table className="h-4 w-4" />;
  };

  const searchTypes = [
    {
      id: 'cig',
      name: 'Ricerca CIG',
      description: 'Cerca informazioni tramite Codice Identificativo Gara',
      icon: Search,
      gradient: 'from-primary-500 to-primary-600'
    },
    {
      id: 'company',
      name: 'Ricerca Azienda',
      description: 'Cerca contratti e gare per nome azienda',
      icon: Building2,
      gradient: 'from-accent-500 to-accent-600'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">
          Benvenuto in{' '}
          <span className="text-gradient">DBSee</span>
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl">
          Esplora e analizza i dati del database in modo intuitivo e veloce. 
          Cerca per CIG o per nome azienda e accedi alle tabelle disponibili.
        </p>
      </div>

      {/* Statistics Cards */}
      {tables && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card-hover p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Tabelle Disponibili</p>
                <p className="text-2xl font-bold text-neutral-900">{tables.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Database className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </div>
          
          <div className="card-hover p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Ricerche Attive</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {(cigSearchMutation.isLoading || companySearchMutation.isLoading || directSearchMutation.isLoading) ? '1' : '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent-600" />
              </div>
            </div>
          </div>
          
          <div className="card-hover p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Risultati Trovati</p>
                <p className="text-2xl font-bold text-neutral-900">{totalMatches}</p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-success-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Type Selection */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-primary-600" />
          Modalità di Ricerca
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {searchTypes.map((type) => {
            const Icon = type.icon;
            const isActive = searchType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSearchType(type.id as any)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left group ${
                  isActive
                    ? 'border-primary-300 bg-primary-50 shadow-colored'
                    : 'border-neutral-200 hover:border-primary-200 hover:bg-primary-25'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${type.gradient} ${
                    isActive ? 'shadow-md' : 'group-hover:shadow-md'
                  } transition-all duration-200`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${
                      isActive ? 'text-primary-900' : 'text-neutral-900'
                    }`}>
                      {type.name}
                    </h3>
                    <p className={`text-sm ${
                      isActive ? 'text-primary-700' : 'text-neutral-600'
                    }`}>
                      {type.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Components */}
      {searchType === 'cig' ? (
        <SearchByCIG
          onSearch={handleCIGSearch}
          isLoading={cigSearchMutation.isLoading}
        />
      ) : (
        <div className="space-y-6">
          {/* Search Method Toggle */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                  Modalità di Ricerca Azienda
                </h3>
                <p className="text-sm text-neutral-600">
                  {useDirectSearch ? 
                    "🎯 Ricerca Diretta: veloce, focus su aggiudicatari_data" : 
                    "🌊 Ricerca Completa: più lenta, cerca in tutte le tabelle"
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUseDirectSearch(true)}
                  className={`btn-sm ${
                    useDirectSearch
                      ? 'btn-primary'
                      : 'btn-outline'
                  }`}
                >
                  🎯 Diretta
                </button>
                <button
                  onClick={() => setUseDirectSearch(false)}
                  className={`btn-sm ${
                    !useDirectSearch
                      ? 'btn-primary'
                      : 'btn-outline'
                  }`}
                >
                  🌊 Completa
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-primary-600" />
                  <span className="text-sm font-medium text-primary-900">Ricerca Diretta</span>
                </div>
                <p className="text-xs text-primary-700">
                  Più veloce, cerca principalmente nella tabella aggiudicatari_data
                </p>
              </div>
              
              <div className="p-3 bg-accent-50 rounded-lg border border-accent-200">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-accent-600" />
                  <span className="text-sm font-medium text-accent-900">Ricerca Completa</span>
                </div>
                <p className="text-xs text-accent-700">
                  Più completa, cerca in tutte le tabelle disponibili
                </p>
              </div>
            </div>
          </div>

          <AdvancedSearch
            onSearch={handleCompanySearch}
            isLoading={useDirectSearch ? directSearchMutation.isLoading : companySearchMutation.isLoading}
          />
        </div>
      )}

      {/* Streaming Progress Display */}
      {(companySearchMutation.isLoading || directSearchMutation.isLoading) && (streamingProgress || directStreamingProgress.length > 0) && (
        <div className="card p-6 border-primary-200 bg-primary-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 text-white animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-primary-900">
              {directSearchMutation.isLoading ? 'Ricerca Diretta in Corso 🎯' : 'Ricerca Completa in Corso 🌊'}
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="text-sm text-primary-700 font-medium">{streamingStatus}</div>
            
            {companyResults?.year_filter && (
              <div className="alert-info">
                🗓️ Filtro anno attivo: <strong>{companyResults.year_filter}</strong>
              </div>
            )}
            
            {streamingProgress && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-primary-800">
                  <span>
                    Tabella corrente: <strong>{streamingProgress.currentTable}</strong>
                    {streamingProgress.is_priority && (
                      <span className="ml-2 badge-warning">PRIORITÀ</span>
                    )}
                  </span>
                  <span>{streamingProgress.tableIndex} / {streamingProgress.totalTables}</span>
                </div>
                <div className="w-full bg-primary-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      streamingProgress.is_priority ? 'bg-warning-500' : 'bg-primary-600'
                    }`}
                    style={{ width: `${(streamingProgress.tableIndex / streamingProgress.totalTables) * 100}%` }}
                  ></div>
                </div>
                
                {streamingProgress.priority_tables && (
                  <div className="text-xs text-primary-600">
                    Tabelle prioritarie: {Math.min(streamingProgress.tableIndex, streamingProgress.priority_tables)} / {streamingProgress.priority_tables}
                  </div>
                )}
              </div>
            )}
            
            <div className="text-sm text-primary-800">
              Risultati trovati finora: <strong className="text-primary-900">{totalMatches}</strong>
            </div>

            {streamingResults.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-primary-900 mb-3">Tabelle con risultati:</h4>
                <div className="flex flex-wrap gap-2">
                  {streamingResults.map((result, index) => (
                    <span 
                      key={index}
                      className="badge-success flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      {result.table_name} ({result.matches})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults && (
        <SearchResultsDisplay
          results={searchResults}
          getTableDisplayName={getTableDisplayName}
          getTableIcon={getTableIcon}
        />
      )}

      {companyResults && (
        <div className="space-y-6">
          <SimpleCompanyResults 
            results={companyResults} 
            onCigSearch={handleCIGSearch}
          />
          <CompanySearchResults
            results={companyResults}
            getTableDisplayName={getTableDisplayName}
            getTableIcon={getTableIcon}
          />
        </div>
      )}

      {/* Tables Section */}
      <div className="pt-8 border-t border-neutral-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
            <Database className="h-5 w-5 text-neutral-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">Tabelle Database</h2>
        </div>
        
        {tablesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-neutral-200 rounded mb-2"></div>
                    <div className="h-3 bg-neutral-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tables && tables.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((tableName, index) => (
              <Link
                key={tableName}
                to={`/table/${tableName}`}
                className="card-interactive p-6 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center group-hover:bg-primary-100 transition-colors duration-200">
                      <Table className="h-5 w-5 text-neutral-600 group-hover:text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 group-hover:text-primary-900 transition-colors duration-200 truncate">
                        {getTableDisplayName(tableName)}
                      </h3>
                      <p className="text-sm text-neutral-600 group-hover:text-primary-700 transition-colors duration-200">
                        Esplora i dati della tabella
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-neutral-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all duration-200" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Database className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Nessuna tabella trovata
            </h3>
            <p className="text-neutral-600">
              Non sono state trovate tabelle nel database.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage; 