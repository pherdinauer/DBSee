# DBSee Setup Guide

## Prerequisites

- Docker & Docker Compose
- Git

## Quick Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd DBSee
```

2. Configure environment:
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your database credentials
# Required fields:
# - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
# - JWT_SECRET_KEY
```

3. Start the application:
```bash
docker-compose up --build
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Default Login

- Username: admin
- Password: admin123

## Development Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Testing

```bash
# All tests
docker-compose -f docker-compose.test.yml up --build

# Backend only
cd backend && pytest

# Frontend only
cd frontend && npm test
``` 