# DBSee - Database Explorer & CIG Search Application

Una web application moderna per la navigazione di database MySQL e ricerca CIG (Codice Identificativo Gara) con interfaccia intuitiva e sicura.

## 🎯 Funzionalità Principali

### 📊 Navigazione Database
- **Esplorazione Tabelle**: Naviga e esplora tutte le tabelle del database
- **Interfaccia Interattiva**: Clicca su qualsiasi tabella per visualizzare dati e struttura
- **Schema Dinamico**: Rileva automaticamente e visualizza gli schemi delle tabelle

### 🔍 Sistema di Ricerca CIG
- **Vista Unificata**: Visualizza tutti i risultati CIG in una tabella consolidata con informazioni chiave
- **Vista per Tabelle**: Mostra i risultati organizzati per tabella di origine con dettagli specifici
- **Ricerca Intelligente**: Cerca "Codice Identificativo Gara" in tutte le tabelle del database
- **Scoperta Dinamica**: Trova automaticamente tutte le tabelle contenenti campi CIG
- **Risultati Aggregati**: Risultati organizzati per tipo di tabella con categorizzazione chiara
- **Query Sicure**: Query SQL parametrizzate prevengono attacchi di injection
- **Audit Logging**: Tutte le query di ricerca vengono registrate per sicurezza e conformità

## 🏗️ Architettura

```
DBSee/
├── backend/          # FastAPI application
├── frontend/         # React + TypeScript
├── infra/           # Docker & CI/CD configurations
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Prerequisiti

- Docker & Docker Compose
- Git

### Avvio rapido

```bash
# Clona il repository
git clone <repository-url>
cd DBSee

# Copia e configura le variabili d'ambiente
cp .env.example .env
# Modifica .env con le tue credenziali database

# Avvia l'applicazione
docker-compose up --build
```

L'applicazione sarà disponibile su:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Documentazione API: http://localhost:8000/docs

## 🔧 Configurazione

### Variabili d'ambiente

Crea un file `.env` basato su `.env.example`:

```bash
# Database
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=your-database

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# App
DEBUG=true
LOG_LEVEL=info
```

## 🛠️ Sviluppo

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (React + TypeScript)

```bash
cd frontend
npm install
npm start
```

### Test

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# Integration tests
docker-compose -f docker-compose.test.yml up --build
```

### Linting e Formatting

```bash
# Backend
cd backend
black .
flake8 .

# Frontend
cd frontend
npm run lint
npm run format
```

## 📚 API Endpoints

### Autenticazione
- `POST /api/v1/auth/login` - Login utente
- `POST /api/v1/auth/logout` - Logout utente
- `GET /api/v1/auth/me` - Profilo utente corrente

### Database
- `GET /api/v1/tables` - Lista tabelle database
- `GET /api/v1/tables/{table_name}` - Schema tabella specifica
- `POST /api/v1/tables/{table_name}/query` - Query parametrizzata con filtri

### Ricerca CIG
- `GET /api/v1/search/cig?cig=<valore>` - Ricerca globale per CIG
- `GET /api/v1/search/tables-with-cig` - Lista tabelle con campo CIG

### Sistema
- `GET /health` - Health check

## 🔒 Sicurezza

- Autenticazione JWT
- Protezione SQL injection con query parametrizzate
- Validazione input con Pydantic
- CORS configurato per origini fidate
- Rate limiting su endpoint sensibili

## 🏗️ Deployment

### Sviluppo
```bash
docker-compose up --build
```

### Produzione
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD

Il progetto include pipeline GitHub Actions per:
- Build e test automatici
- Security scan dei container
- Deploy automatizzato

## 📖 Documentazione

- [API Documentation](http://localhost:8000/docs) - Swagger UI
- [Backend Architecture](./backend/README.md)
- [Frontend Components](./frontend/README.md)

## 🤝 Contribuzione

1. Fork il progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

## 🛟 Supporto

Per problemi o domande, apri una issue su GitHub o contatta il team di sviluppo. 