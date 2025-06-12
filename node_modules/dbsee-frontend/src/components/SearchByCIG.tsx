import { useState } from 'react';
import { useMutation } from 'react-query';
import { Search, AlertCircle, Database, FileText, Users, CreditCard, Loader2 } from 'lucide-react';
import { searchAPI } from '../services/api';
import { CIGSearchResult } from '../types/api';
import toast from 'react-hot-toast';
import SearchResultsDisplay from './SearchResultsDisplay';

interface SearchByCIGProps {
  onSearch?: (cig: string) => void;
  isLoading?: boolean;
}

const SearchByCIG = ({ onSearch, isLoading: externalLoading }: SearchByCIGProps) => {
  const [cigValue, setCigValue] = useState('');
  const [searchResults, setSearchResults] = useState<CIGSearchResult | null>(null);

  const searchMutation = useMutation(searchAPI.searchByCIG, {
    onSuccess: (data) => {
      setSearchResults(data);
      if (!data.found) {
        toast(`Nessun risultato trovato per CIG: ${data.cig}`, { icon: 'ℹ️' });
      } else {
        toast.success(`CIG trovato! ${data.total_fields} campi da ${data.source_tables.length} tabelle`);
      }
    },
    onError: (error: any) => {
      console.error('Search error:', error);
      const message = error.response?.data?.detail || 'Errore durante la ricerca';
      toast.error(message);
      setSearchResults(null);
    },
  });

  const isLoading = externalLoading || searchMutation.isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cigValue.trim()) {
      toast.error('Inserire un valore CIG');
      return;
    }

    if (cigValue.trim().length < 3) {
      toast.error('Il CIG deve essere di almeno 3 caratteri');
      return;
    }

    // Use external onSearch if provided, otherwise use internal mutation
    if (onSearch) {
      onSearch(cigValue.trim());
    } else {
      searchMutation.mutate(cigValue.trim());
    }
  };

  const handleReset = () => {
    setCigValue('');
    setSearchResults(null);
    searchMutation.reset();
  };

  const getTableDisplayName = (tableName: string): string => {
    // Map technical table names to user-friendly names
    const displayNames: Record<string, string> = {
      'contratti': 'Contratti',
      'fornitori': 'Fornitori', 
      'pagamenti': 'Pagamenti',
      'gare': 'Gare',
      'offerte': 'Offerte',
      'fatture': 'Fatture',
      'ordini': 'Ordini',
      // Add more mappings as needed
    };
    
    return displayNames[tableName.toLowerCase()] || 
           tableName.charAt(0).toUpperCase() + tableName.slice(1);
  };

  const getTableIcon = (tableName: string) => {
    const iconMap: Record<string, any> = {
      'contratti': FileText,
      'fornitori': Users,
      'pagamenti': CreditCard,
      'gare': Database,
      'offerte': FileText,
      'fatture': CreditCard,
      'ordini': FileText,
    };

    const IconComponent = iconMap[tableName.toLowerCase()] || Database;
    return <IconComponent className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Search className="h-8 w-8 text-black" />
        <div>
          <h1 className="text-3xl font-bold text-black">Ricerca per CIG</h1>
          <p className="text-gray-700">
            Visualizza tutte le informazioni correlate a un Codice Identificativo Gara in una tabella completa
          </p>
        </div>
      </div>

      {/* Search Form */}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="cig" className="block text-sm font-medium text-gray-700 mb-2">
                Codice Identificativo Gara (CIG)
              </label>
              <input
                id="cig"
                type="text"
                value={cigValue}
                onChange={(e) => setCigValue(e.target.value)}
                placeholder="Inserisci il codice CIG (es. Z1234567890)"
                className="input"
                disabled={isLoading}
                autoComplete="off"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading || !cigValue.trim()}
              className="btn-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ricerca in corso...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Cerca
                </>
              )}
            </button>
            
            {(searchResults || searchMutation.isError) && (
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary"
                disabled={isLoading}
              >
                Nuova ricerca
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Only show results if using internal state (not external onSearch) */}
      {!onSearch && searchResults && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-black">
              Risultati per CIG: {searchResults.cig}
            </h2>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>
                <strong>{searchResults.total_fields}</strong> campi trovati
              </span>
              <span>
                <strong>{searchResults.source_tables.length}</strong> di {searchResults.tables_searched} tabelle
              </span>
            </div>
          </div>

          {!searchResults.found ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nessun risultato trovato
              </h3>
              <p className="text-gray-600">
                Il CIG "{searchResults.cig}" non è presente nel database.
                <br />
                Verifica il codice e riprova.
              </p>
            </div>
          ) : (
            <>
              {/* Quick Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {searchResults.source_tables.map((tableName) => (
                  <div key={tableName} className="bg-gray-200 rounded-lg p-4 border border-gray-500">
                    <div className="flex items-center space-x-3">
                      <div className="text-black">
                        {getTableIcon(tableName)}
                      </div>
                      <div>
                        <h3 className="font-medium text-black">
                          {getTableDisplayName(tableName)}
                        </h3>
                        <p className="text-sm text-gray-700">
                          Dati trovati
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detailed Results */}
              <SearchResultsDisplay 
                results={searchResults}
                getTableDisplayName={getTableDisplayName}
                getTableIcon={getTableIcon}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchByCIG; 