// Mock Data Generator per DBSee - 137 record CIG con tema neon futuristico

export type CIGRecord = {
  campo: string;
  valore: string;
  fonte: string;
  categoria: 'identificativo' | 'azienda' | 'importo' | 'data' | 'ente' | 'location' | 'procedura';
  icon: string;
};

// Dati realistici per generazione italiana
const companies = [
  "CP S.R.L.", "EDILCOSTRUZIONI S.R.L.", "IMPRESA VERDE S.P.A.", "COSTRUZIONI ALBA S.R.L.",
  "EDIL TECH S.P.A.", "MURATORI UNITI S.R.L.", "PROGETTI FUTURO S.P.A.", "WORK ITALIA S.R.L.",
  "CONSORZIO EDILE MERIDIONALE", "IMPRESA MODERNA S.P.A.", "TECNO BUILD S.R.L.", "EURO COSTRUZIONI S.P.A.",
  "RISTRUTTURAZIONI ELITE S.R.L.", "GLOBAL WORKS S.P.A.", "SVILUPPO TERRITORIALE S.R.L.",
  "INFRASTRUTTURE SUD S.P.A.", "COSTRUZIONI RAPIDE S.R.L.", "EDILIZIA VERDE S.P.A.",
  "PROGETTO CASA S.R.L.", "MILLENNIUM BUILD S.P.A.", "TECNO STRUTTURE S.R.L.",
  "LAVORI PUBBLICI S.P.A.", "OPERE CIVILI S.R.L.", "CANTIERE MODERNO S.P.A."
];

const cities = [
  "POTENZA", "MATERA", "BARI", "NAPOLI", "PALERMO", "CATANIA", "MESSINA", "REGGIO CALABRIA",
  "COSENZA", "CATANZARO", "LECCE", "BRINDISI", "TARANTO", "FOGGIA", "BENEVENTO", "SALERNO",
  "CASERTA", "AVELLINO", "TRAPANI", "AGRIGENTO", "CALTANISSETTA", "ENNA", "RAGUSA", "SIRACUSA"
];

const enti = [
  "COMUNE DI POTENZA", "REGIONE BASILICATA", "PROVINCIA DI POTENZA", "ASP BASILICATA",
  "COMUNE DI MATERA", "PROVINCIA DI MATERA", "UFFICIO SCOLASTICO REGIONALE",
  "AZIENDA OSPEDALIERA S. CARLO", "UNIVERSITA' DELLA BASILICATA", "COMUNE DI MELFI",
  "COMUNE DI POLICORO", "COMUNE DI LAVELLO", "COMUNE DI VENOSA", "ACQUEDOTTO LUCANO",
  "ANAS S.P.A.", "MINISTERO DELL'INTERNO", "PREFETTURA DI POTENZA", "QUESTURA DI POTENZA",
  "COMANDO PROVINCIALE CARABINIERI", "VIGILI DEL FUOCO"
];

const procedures = [
  "PROCEDURA NEGOZIATA SOTTO SOGLIA", "PROCEDURA APERTA", "PROCEDURA RISTRETTA",
  "AFFIDAMENTO DIRETTO", "ACCORDO QUADRO", "DIALOGO COMPETITIVO", "PARTENARIATO PER L'INNOVAZIONE",
  "PROCEDURA COMPETITIVA CON NEGOZIAZIONE", "SISTEMA DINAMICO DI ACQUISIZIONE"
];

const oggetti = [
  "LAVORI DI MANUTENZIONE STRADALE", "RISTRUTTURAZIONE EDIFICIO SCOLASTICO", 
  "REALIZZAZIONE OPERE IDRAULICHE", "MANUTENZIONE IMPIANTI ELETTRICI",
  "SERVIZI DI PULIZIA", "FORNITURA ARREDI UFFICIO", "SERVIZI INFORMATICI",
  "LAVORI DI RESTAURO", "MANUTENZIONE VERDE PUBBLICO", "SERVIZI DI VIGILANZA",
  "FORNITURA MATERIALE SANITARIO", "LAVORI DI ASFALTATURA", "RIPARAZIONE EDIFICI PUBBLICI",
  "SERVIZI DI TRASPORTO", "FORNITURA COMBUSTIBILI", "MANUTENZIONE IMPIANTI TERMICI",
  "SERVIZI DI CONSULENZA", "LAVORI DI IMPERMEABILIZZAZIONE", "FORNITURA VEICOLI",
  "SERVIZI DI CATERING", "LAVORI DI PAVIMENTAZIONE", "MANUTENZIONE ASCENSORI"
];

// Genera CIG realistici
const generateCIG = (index: number): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let cig = '';
  // 2 lettere iniziali
  cig += letters[Math.floor(Math.random() * letters.length)];
  cig += letters[Math.floor(Math.random() * letters.length)];
  
  // 8 cifre
  for (let i = 0; i < 8; i++) {
    cig += numbers[Math.floor(Math.random() * numbers.length)];
  }
  
  return cig;
};

// Genera importi realistici
const generateImporto = (): string => {
  const base = Math.floor(Math.random() * 900000) + 10000; // 10k - 900k
  return `€ ${base.toLocaleString('it-IT')},00`;
};

// Genera date realistiche
const generateDate = (): string => {
  const start = new Date(2020, 0, 1);
  const end = new Date(2024, 11, 31);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toLocaleDateString('it-IT');
};

// Mapping categorie con icone emoji
const categoryMappings = {
  identificativo: { icon: '🆔', fields: ['CIG', 'CODICE GARA', 'ID BANDO', 'NUMERO PRATICA', 'CODICE LOTTO'] },
  azienda: { icon: '🏢', fields: ['RAGIONE SOCIALE', 'DENOMINAZIONE', 'PARTITA IVA', 'CODICE FISCALE', 'NOME DITTA'] },
  importo: { icon: '💰', fields: ['IMPORTO AGGIUDICAZIONE', 'BASE ASTA', 'VALORE CONTRATTO', 'PREZZO UNITARIO', 'COSTO TOTALE'] },
  data: { icon: '📅', fields: ['DATA PUBBLICAZIONE', 'DATA AGGIUDICAZIONE', 'DATA SCADENZA', 'DATA COMUNICAZIONE', 'TERMINE CONSEGNA'] },
  ente: { icon: '🏛️', fields: ['ENTE APPALTANTE', 'STAZIONE APPALTANTE', 'DENOMINAZIONE ENTE', 'ORGANISMO DI DIRITTO PUBBLICO', 'AMMINISTRAZIONE'] },
  location: { icon: '📍', fields: ['COMUNE ESECUZIONE', 'PROVINCIA', 'REGIONE', 'INDIRIZZO LAVORI', 'LUOGO CONSEGNA'] },
  procedura: { icon: '⚖️', fields: ['TIPO PROCEDURA', 'CRITERIO AGGIUDICAZIONE', 'MODALITA SCELTA', 'OGGETTO APPALTO', 'SETTORE MERCEOLOGICO'] }
};

// Enhanced categorization based on actual data patterns
export const categorizeField = (key: string, value: string): CIGRecord['categoria'] => {
  const field = key.toLowerCase().replace(/\s+/g, '_');
  const val = value?.toLowerCase() || '';
  
  // Identificativo - IDs, codes, numbers
  if (
    field.includes('cig') || 
    field.includes('id') || 
    field.includes('codice') || 
    field.includes('numero') ||
    field.includes('batch') ||
    field.includes('cf') ||
    field.includes('partita_iva') ||
    field.includes('ausa') ||
    field.includes('cpv') ||
    /^[0-9A-Z]+$/.test(value) // Alphanumeric codes
  ) {
    return 'identificativo';
  }
  
  // Azienda - Companies, organizations
  if (
    field.includes('azienda') || 
    field.includes('ditta') || 
    field.includes('ragione') || 
    field.includes('denominazione') ||
    field.includes('aggiudicatar') ||
    field.includes('partecipant') ||
    field.includes('soggetto') ||
    (val.includes('s.r.l') || val.includes('srl') || val.includes('spa') || val.includes('s.p.a'))
  ) {
    return 'azienda';
  }
  
  // Importo - Money, financial values
  if (
    field.includes('importo') || 
    field.includes('prezzo') || 
    field.includes('costo') || 
    field.includes('valore') ||
    field.includes('finanziamento') ||
    field.includes('economico') ||
    field.includes('mutuo') ||
    field.includes('ribasso') ||
    val.includes('€') || 
    val.includes('euro') ||
    /^\d+\.?\d*$/.test(value) && parseFloat(value) > 1000 // Large numbers likely money
  ) {
    return 'importo';
  }
  
  // Data - Dates, times, temporal info
  if (
    field.includes('data') || 
    field.includes('scadenza') || 
    field.includes('termine') ||
    field.includes('created') ||
    field.includes('pubblicazione') ||
    field.includes('comunicazione') ||
    field.includes('aggiudicazione') ||
    field.includes('consegna') ||
    field.includes('inizio') ||
    field.includes('anno') ||
    field.includes('mese') ||
    /\d{4}-\d{2}-\d{2}/.test(val) ||
    /\d{2}[/-]\d{2}[/-]\d{4}/.test(val) ||
    /\d{4}T\d{2}:\d{2}:\d{2}/.test(val) // ISO datetime
  ) {
    return 'data';
  }
  
  // Ente - Government, public entities
  if (
    field.includes('ente') || 
    field.includes('comune') || 
    field.includes('regione') || 
    field.includes('provincia') || 
    field.includes('amministrazione') ||
    field.includes('stazione_appaltante') ||
    field.includes('centro_costo') ||
    field.includes('settore') ||
    val.includes('comune') ||
    val.includes('regione') ||
    val.includes('provincia') ||
    val.includes('ministero')
  ) {
    return 'ente';
  }
  
  // Location - Geographic information
  if (
    field.includes('luogo') || 
    field.includes('indirizzo') || 
    field.includes('istat') ||
    field.includes('sezione_regionale') ||
    field.includes('basilicata') ||
    field.includes('potenza') ||
    field.includes('genzano') ||
    // Italian regions and provinces
    /(basilicata|puglia|calabria|sicilia|sardegna|campania|lazio|toscana|emilia|veneto|lombardia|piemonte)/.test(val)
  ) {
    return 'location';
  }
  
  // Procedura - Legal, procedural info
  if (
    field.includes('procedura') || 
    field.includes('tipo') || 
    field.includes('oggetto') || 
    field.includes('criterio') || 
    field.includes('modalita') ||
    field.includes('esito') ||
    field.includes('ruolo') ||
    field.includes('categoria') ||
    field.includes('lavorazione') ||
    field.includes('contratto') ||
    field.includes('appalto') ||
    field.includes('gara') ||
    field.includes('offerta') ||
    field.includes('flag') ||
    field.includes('cod_') ||
    val.includes('aggiudicata') ||
    val.includes('mandante') ||
    val.includes('prevalente') ||
    val.includes('ati') ||
    val.includes('lavori') ||
    val.includes('contratto')
  ) {
    return 'procedura';
  }
  
  return 'identificativo'; // Default fallback
};

// Enhanced value formatting
export const formatDisplayValue = (value: string, categoria: CIGRecord['categoria']): string => {
  if (!value || value === 'N/A' || value === 'null' || value === 'undefined') return 'N/A';
  
  const cleanValue = String(value).trim();
  
  switch (categoria) {
    case 'importo':
      // Handle numeric values for currency
      const numMatch = cleanValue.match(/[\d.,]+/);
      if (numMatch) {
        const num = parseFloat(numMatch[0].replace(/,/g, ''));
        if (!isNaN(num)) {
          return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
          }).format(num);
        }
      }
      
      // Handle percentage values
      if (cleanValue.includes('%') || /^\d+\.?\d*$/.test(cleanValue)) {
        const percentNum = parseFloat(cleanValue.replace('%', ''));
        if (!isNaN(percentNum) && percentNum < 100) {
          return `${percentNum.toFixed(2)}%`;
        }
      }
      
      return cleanValue;
      
    case 'data':
      // Handle ISO date format
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
        const date = new Date(cleanValue);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('it-IT');
        }
      }
      
      // Handle ISO datetime format
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(cleanValue)) {
        const date = new Date(cleanValue);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('it-IT') + ' ' + date.toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }
      
      return cleanValue;
      
    case 'identificativo':
      // Keep IDs and codes as-is but handle long ones
      if (cleanValue.length > 30) {
        return cleanValue.substring(0, 27) + '...';
      }
      return cleanValue;
      
    case 'azienda':
      // Capitalize company names properly
      return cleanValue
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
        
    default:
      return cleanValue;
  }
};

// Get category icon
export const getCategoryIcon = (categoria: CIGRecord['categoria']): string => {
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

// Get CSS class for category badges
export const getBadgeClass = (categoria: CIGRecord['categoria']): string => {
  const classes = {
    identificativo: 'badge-identificativo',
    azienda: 'badge-azienda',
    importo: 'badge-importo',
    data: 'badge-data',
    ente: 'badge-ente',
    location: 'badge-location',
    procedura: 'badge-procedura'
  };
  return classes[categoria];
};

// Enhanced quick link generator
export const generateQuickLinks = (data: CIGRecord[]) => {
  const categoryCount: Record<CIGRecord['categoria'], number> = {
    identificativo: 0,
    azienda: 0,
    importo: 0,
    data: 0,
    ente: 0,
    location: 0,
    procedura: 0
  };

  data.forEach(item => {
    categoryCount[item.categoria]++;
  });

  const colors: Record<CIGRecord['categoria'], string> = {
    identificativo: 'from-cyan-500 to-blue-600',
    azienda: 'from-purple-500 to-pink-600',
    importo: 'from-emerald-500 to-green-600',
    data: 'from-orange-500 to-yellow-600',
    ente: 'from-indigo-500 to-purple-600',
    location: 'from-red-500 to-pink-600',
    procedura: 'from-teal-500 to-cyan-600'
  };

  const descriptions: Record<CIGRecord['categoria'], string> = {
    identificativo: 'Codici, ID e identificatori unici',
    azienda: 'Nomi aziende e soggetti coinvolti',
    importo: 'Valori monetari e percentuali',
    data: 'Date, scadenze e informazioni temporali',
    ente: 'Enti pubblici e amministrazioni',
    location: 'Informazioni geografiche e luoghi',
    procedura: 'Procedure, tipi e modalità operative'
  };

  return Object.entries(categoryCount)
    .map(([categoria, count]) => ({
      categoria: categoria as CIGRecord['categoria'],
      icon: getCategoryIcon(categoria as CIGRecord['categoria']),
      label: categoria.charAt(0).toUpperCase() + categoria.slice(1),
      description: descriptions[categoria as CIGRecord['categoria']],
      count,
      color: colors[categoria as CIGRecord['categoria']]
    }))
    .filter(link => link.count > 0)
    .sort((a, b) => b.count - a.count);
};

// Genera i 137 record mock
export const generateMockCIGData = (): CIGRecord[] => {
  const records: CIGRecord[] = [];
  
  for (let i = 0; i < 137; i++) {
    // Seleziona categoria random con distribuzione equilibrata
    const categories = Object.keys(categoryMappings) as Array<keyof typeof categoryMappings>;
    const categoria = categories[i % categories.length];
    const categoryInfo = categoryMappings[categoria];
    
    // Seleziona campo random dalla categoria
    const campoOptions = categoryInfo.fields;
    const campo = campoOptions[Math.floor(Math.random() * campoOptions.length)];
    
    // Genera valore basato sulla categoria
    let valore: string;
    let fonte: string;
    
    switch (categoria) {
      case 'identificativo':
        if (campo === 'CIG') {
          valore = generateCIG(i);
        } else {
          valore = `${campo.split(' ')[0]}${(Math.floor(Math.random() * 90000) + 10000)}`;
        }
        fonte = 'ANAC';
        break;
        
      case 'azienda':
        if (campo === 'PARTITA IVA') {
          valore = `IT${Math.floor(Math.random() * 90000000000) + 10000000000}`;
        } else if (campo === 'CODICE FISCALE') {
          valore = `${Math.floor(Math.random() * 90000000000) + 10000000000}`;
        } else {
          valore = companies[Math.floor(Math.random() * companies.length)];
        }
        fonte = 'REGISTRO IMPRESE';
        break;
        
      case 'importo':
        valore = generateImporto();
        fonte = 'BANDO DI GARA';
        break;
        
      case 'data':
        valore = generateDate();
        fonte = 'GUUE';
        break;
        
      case 'ente':
        valore = enti[Math.floor(Math.random() * enti.length)];
        fonte = 'PORTALE APPALTI';
        break;
        
      case 'location':
        if (campo === 'PROVINCIA') {
          valore = cities[Math.floor(Math.random() * cities.length)].substring(0, 2);
        } else if (campo === 'REGIONE') {
          valore = Math.random() > 0.7 ? 'BASILICATA' : ['PUGLIA', 'CALABRIA', 'CAMPANIA', 'SICILIA'][Math.floor(Math.random() * 4)];
        } else {
          valore = cities[Math.floor(Math.random() * cities.length)];
        }
        fonte = 'COMUNE';
        break;
        
      case 'procedura':
        if (campo === 'TIPO PROCEDURA') {
          valore = procedures[Math.floor(Math.random() * procedures.length)];
        } else if (campo === 'OGGETTO APPALTO') {
          valore = oggetti[Math.floor(Math.random() * oggetti.length)];
        } else {
          valore = ['PREZZO PIÙ BASSO', 'OFFERTA ECONOMICAMENTE VANTAGGIOSA', 'MIGLIOR RAPPORTO QUALITÀ/PREZZO'][Math.floor(Math.random() * 3)];
        }
        fonte = 'DISCIPLINARE';
        break;
        
      default:
        valore = 'VALORE NON DISPONIBILE';
        fonte = 'SISTEMA';
    }
    
    records.push({
      campo,
      valore,
      fonte,
      categoria,
      icon: categoryInfo.icon
    });
  }
  
  return records;
};

// Export per facile utilizzo
export const mockCIGRecords = generateMockCIGData();

// Utility per filtri
export const getUniqueCategories = (): Array<{value: CIGRecord['categoria'], label: string, icon: string}> => {
  return [
    { value: 'identificativo', label: 'ID & Codici', icon: '🆔' },
    { value: 'azienda', label: 'Aziende', icon: '🏢' },
    { value: 'importo', label: 'Importi', icon: '💰' },
    { value: 'data', label: 'Date', icon: '📅' },
    { value: 'ente', label: 'Enti', icon: '🏛️' },
    { value: 'location', label: 'Luoghi', icon: '📍' },
    { value: 'procedura', label: 'Procedure', icon: '⚖️' }
  ];
};

export default {
  categorizeField,
  formatDisplayValue,
  getCategoryIcon,
  getBadgeClass,
  generateQuickLinks,
  generateMockCIGData
};