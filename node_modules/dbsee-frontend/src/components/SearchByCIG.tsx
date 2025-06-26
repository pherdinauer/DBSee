import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface SearchByCIGProps {
  onSearch: (cig: string) => void;
  isLoading?: boolean;
}

const SearchByCIG = ({ onSearch, isLoading }: SearchByCIGProps) => {
  const [cigValue, setCigValue] = useState('');

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

    onSearch(cigValue.trim());
  };

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title mb-4">Ricerca per CIG</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label htmlFor="cig" className="label">
              <span className="label-text">Codice Identificativo Gara (CIG)</span>
            </label>
            <input
              id="cig"
              type="text"
              value={cigValue}
              onChange={(e) => setCigValue(e.target.value)}
              placeholder="Inserisci il codice CIG (es. Z1234567890)"
              className="input input-bordered w-full"
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
          
          <div className="card-actions">
            <button
              type="submit"
              disabled={isLoading || !cigValue.trim()}
              className="btn btn-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ricerca...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Cerca CIG
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchByCIG; 