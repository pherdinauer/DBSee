import { 
  Database, 
  Search, 
  Building2, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X,
  Plus,
  Download,
  Settings
} from 'lucide-react';

const DesignSystemDemo = () => {
  return (
    <div className="space-y-12 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gradient mb-4">
          DBSee Design System
        </h1>
        <p className="text-lg text-neutral-600">
          Componenti moderni, accessibili e coerenti
        </p>
      </div>

      {/* Colors */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900">Palette Colori</h2>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900">Primary</h3>
            <div className="space-y-2">
              <div className="h-12 bg-primary-50 rounded-lg flex items-center justify-center text-primary-900 text-sm">50</div>
              <div className="h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-900 text-sm">100</div>
              <div className="h-12 bg-primary-500 rounded-lg flex items-center justify-center text-white text-sm">500</div>
              <div className="h-12 bg-primary-600 rounded-lg flex items-center justify-center text-white text-sm">600</div>
              <div className="h-12 bg-primary-900 rounded-lg flex items-center justify-center text-white text-sm">900</div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900">Accent</h3>
            <div className="space-y-2">
              <div className="h-12 bg-accent-50 rounded-lg flex items-center justify-center text-accent-900 text-sm">50</div>
              <div className="h-12 bg-accent-100 rounded-lg flex items-center justify-center text-accent-900 text-sm">100</div>
              <div className="h-12 bg-accent-500 rounded-lg flex items-center justify-center text-white text-sm">500</div>
              <div className="h-12 bg-accent-600 rounded-lg flex items-center justify-center text-white text-sm">600</div>
              <div className="h-12 bg-accent-900 rounded-lg flex items-center justify-center text-white text-sm">900</div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900">Success</h3>
            <div className="space-y-2">
              <div className="h-12 bg-success-50 rounded-lg flex items-center justify-center text-success-900 text-sm">50</div>
              <div className="h-12 bg-success-100 rounded-lg flex items-center justify-center text-success-900 text-sm">100</div>
              <div className="h-12 bg-success-500 rounded-lg flex items-center justify-center text-white text-sm">500</div>
              <div className="h-12 bg-success-600 rounded-lg flex items-center justify-center text-white text-sm">600</div>
              <div className="h-12 bg-success-900 rounded-lg flex items-center justify-center text-white text-sm">900</div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900">Warning</h3>
            <div className="space-y-2">
              <div className="h-12 bg-warning-50 rounded-lg flex items-center justify-center text-warning-900 text-sm">50</div>
              <div className="h-12 bg-warning-100 rounded-lg flex items-center justify-center text-warning-900 text-sm">100</div>
              <div className="h-12 bg-warning-500 rounded-lg flex items-center justify-center text-white text-sm">500</div>
              <div className="h-12 bg-warning-600 rounded-lg flex items-center justify-center text-white text-sm">600</div>
              <div className="h-12 bg-warning-900 rounded-lg flex items-center justify-center text-white text-sm">900</div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900">Danger</h3>
            <div className="space-y-2">
              <div className="h-12 bg-danger-50 rounded-lg flex items-center justify-center text-danger-900 text-sm">50</div>
              <div className="h-12 bg-danger-100 rounded-lg flex items-center justify-center text-danger-900 text-sm">100</div>
              <div className="h-12 bg-danger-500 rounded-lg flex items-center justify-center text-white text-sm">500</div>
              <div className="h-12 bg-danger-600 rounded-lg flex items-center justify-center text-white text-sm">600</div>
              <div className="h-12 bg-danger-900 rounded-lg flex items-center justify-center text-white text-sm">900</div>
            </div>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900">Bottoni</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">
              <Database className="h-4 w-4" />
              Primary
            </button>
            <button className="btn-secondary">
              <Search className="h-4 w-4" />
              Secondary
            </button>
            <button className="btn-accent">
              <Building2 className="h-4 w-4" />
              Accent
            </button>
            <button className="btn-success">
              <CheckCircle className="h-4 w-4" />
              Success
            </button>
            <button className="btn-warning">
              <AlertTriangle className="h-4 w-4" />
              Warning
            </button>
            <button className="btn-danger">
              <X className="h-4 w-4" />
              Danger
            </button>
          </div>
          <div className="flex flex-wrap gap-4">
            <button className="btn-ghost">
              <Settings className="h-4 w-4" />
              Ghost
            </button>
            <button className="btn-outline">
              <Download className="h-4 w-4" />
              Outline
            </button>
          </div>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary btn-sm">Small</button>
            <button className="btn-primary">Regular</button>
            <button className="btn-primary btn-lg">Large</button>
          </div>
        </div>
      </section>

      {/* Form Elements */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900">Form Elements</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Input Regular</label>
              <input className="input" placeholder="Inserisci testo..." />
              <div className="form-help">Testo di aiuto</div>
            </div>
            <div className="form-group">
              <label className="form-label">Input Small</label>
              <input className="input input-sm" placeholder="Small input..." />
            </div>
            <div className="form-group">
              <label className="form-label">Input Large</label>
              <input className="input input-lg" placeholder="Large input..." />
            </div>
            <div className="form-group">
              <label className="form-label">Input Error</label>
              <input className="input input-error" placeholder="Input con errore..." />
              <div className="form-error">Questo campo è obbligatorio</div>
            </div>
            <div className="form-group">
              <label className="form-label">Input Success</label>
              <input className="input input-success" placeholder="Input valido..." />
            </div>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900">Cards</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-neutral-900">Card Base</h3>
            </div>
            <div className="card-body">
              <p className="text-neutral-600">Contenuto della card base.</p>
            </div>
          </div>
          
          <div className="card-hover">
            <div className="card-header">
              <h3 className="font-semibold text-neutral-900">Card Hover</h3>
            </div>
            <div className="card-body">
              <p className="text-neutral-600">Card con effetto hover.</p>
            </div>
          </div>
          
          <div className="card-interactive">
            <div className="card-header">
              <h3 className="font-semibold text-neutral-900">Card Interactive</h3>
            </div>
            <div className="card-body">
              <p className="text-neutral-600">Card interattiva con effetti.</p>
            </div>
            <div className="card-footer">
              <button className="btn-primary btn-sm">Azione</button>
            </div>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900">Badges</h2>
        <div className="flex flex-wrap gap-3">
          <span className="badge-primary">Primary</span>
          <span className="badge-secondary">Secondary</span>
          <span className="badge-success">
            <CheckCircle className="h-3 w-3" />
            Success
          </span>
          <span className="badge-warning">
            <AlertTriangle className="h-3 w-3" />
            Warning
          </span>
          <span className="badge-danger">
            <X className="h-3 w-3" />
            Danger
          </span>
        </div>
      </section>

      {/* Alerts */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900">Alerts</h2>
        <div className="space-y-4">
          <div className="alert-info">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-1">Informazione</h4>
                <p className="text-sm">Questo è un messaggio informativo.</p>
              </div>
            </div>
          </div>
          
          <div className="alert-success">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-1">Successo</h4>
                <p className="text-sm">Operazione completata con successo!</p>
              </div>
            </div>
          </div>
          
          <div className="alert-warning">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-1">Attenzione</h4>
                <p className="text-sm">Prestare attenzione a questa informazione.</p>
              </div>
            </div>
          </div>
          
          <div className="alert-danger">
            <div className="flex items-start gap-3">
              <X className="h-5 w-5 text-danger-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-1">Errore</h4>
                <p className="text-sm">Si è verificato un errore.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Loading States */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900">Loading States</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="spinner w-6 h-6 text-primary-600"></div>
            <span className="text-neutral-600">Spinner</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="loading-dots text-primary-600">
              <div></div>
              <div></div>
              <div></div>
            </div>
            <span className="text-neutral-600">Loading Dots</span>
          </div>
          
          <button className="btn-primary" disabled>
            <div className="spinner w-4 h-4 text-white"></div>
            Loading...
          </button>
        </div>
      </section>

      {/* Animations */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900">Animazioni</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-6 animate-fade-in">
            <h3 className="font-semibold mb-2">Fade In</h3>
            <p className="text-neutral-600 text-sm">Animazione fade in</p>
          </div>
          
          <div className="card p-6 animate-slide-up">
            <h3 className="font-semibold mb-2">Slide Up</h3>
            <p className="text-neutral-600 text-sm">Animazione slide up</p>
          </div>
          
          <div className="card p-6 animate-scale-in">
            <h3 className="font-semibold mb-2">Scale In</h3>
            <p className="text-neutral-600 text-sm">Animazione scale in</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DesignSystemDemo; 