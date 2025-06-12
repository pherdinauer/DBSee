import { useState } from 'react';
import { Search, Building2, Calendar } from 'lucide-react';

interface AdvancedSearchProps {
  onSearch: (companyName: string, yearFilter?: number) => void;
  isLoading: boolean;
}

const AdvancedSearch = ({ onSearch, isLoading }: AdvancedSearchProps) => {
  const [companyName, setCompanyName] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  // Generate years from current year back to 2010
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(
    { length: currentYear - 2009 }, 
    (_, i) => currentYear - i
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName.trim().length >= 2) {
      console.log('AdvancedSearch: Starting search for company:', companyName.trim(), 'year:', selectedYear);
      onSearch(companyName.trim(), selectedYear);
    }
  };

  const handleClearYear = () => {
    setSelectedYear(undefined);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-500 shadow-lg p-6 mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <Building2 className="h-6 w-6 text-black" />
        <h2 className="text-xl font-semibold text-black">
          Ricerca per Azienda
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Company Name Input */}
          <div className="lg:col-span-2">
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Azienda
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Inserisci il nome dell'azienda..."
                className="w-full pl-10 pr-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-black"
                minLength={2}
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimo 2 caratteri. Supporta ricerca parziale.
            </p>
          </div>

          {/* Year Filter Dropdown */}
          <div>
            <label htmlFor="yearFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filtro Anno
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="yearFilter"
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full pl-10 pr-8 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-black appearance-none"
              >
                <option value="">Tutti gli anni</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {selectedYear && (
              <div className="mt-1 flex items-center space-x-2">
                <span className="text-xs text-green-600">Anno selezionato: {selectedYear}</span>
                <button
                  type="button"
                  onClick={handleClearYear}
                  className="text-xs text-red-500 hover:text-red-700 underline"
                >
                  Rimuovi
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Button */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading || companyName.trim().length < 2}
            className="inline-flex items-center px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Ricerca in corso...' : 'Cerca Azienda'}
          </button>
          
          {selectedYear && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Filtraggio per anno {selectedYear}</span>
            </div>
          )}
        </div>
      </form>

      {/* Search Tips */}
      <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-400">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          💡 Suggerimenti per la ricerca:
        </h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Puoi cercare anche solo parte del nome (es. "Consorzio" troverà "Consorzio Universitario...")</li>
          <li>• La ricerca è case-insensitive (maiuscole/minuscole non importano)</li>
          <li>• Vengono cercate colonne: denominazione, ragione_sociale, nome, ditta</li>
          <li>• 📅 Il filtro anno cerca in campi: data_pubblicazione, anno_comunicazione, data_aggiudicazione, ecc.</li>
          <li>• ⚡ Le tabelle prioritarie vengono cercate per prime per risultati più veloci</li>
        </ul>
      </div>
    </div>
  );
};

export default AdvancedSearch; 