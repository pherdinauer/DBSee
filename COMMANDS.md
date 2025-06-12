# DBSee Commands Reference

Essential commands for development, testing, and deployment.

## 🚀 Quick Start

```bash
# Setup
git clone <repository-url>
cd DBSee
cp .env.example .env

# Start development environment
docker-compose up --build

# Start in background
docker-compose up -d

# Stop services
docker-compose down
```

## 🛠️ Development Commands

### Backend Development

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=html

# Code formatting
black .
isort .

# Linting
flake8 .

# Security check
bandit -r app/
```

### Frontend Development

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage --watchAll=false

# Build for production
npm run build

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check

# Type checking
npm run type-check
```

## 🐳 Docker Commands

### Basic Docker Operations

```bash
# Build images
docker-compose build

# Build specific service
docker-compose build backend

# Pull latest images
docker-compose pull

# View running containers
docker-compose ps

# View logs
docker-compose logs
docker-compose logs -f backend
docker-compose logs --tail=100 frontend

# Execute commands in containers
docker-compose exec backend bash
docker-compose exec frontend sh

# Remove containers and volumes
docker-compose down -v

# Remove everything including images
docker-compose down --rmi all -v
```

### Production Docker Commands

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up --scale backend=3 -d

# Update production deployment
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Testing Commands

### Run All Tests

```bash
# Integration tests
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Clean up test containers
docker-compose -f docker-compose.test.yml down
```

### Backend Testing

```bash
cd backend

# Unit tests
pytest tests/

# Integration tests
pytest tests/integration/

# Specific test file
pytest tests/test_auth.py

# Test with verbose output
pytest -v

# Test with coverage report
pytest --cov=app --cov-report=term-missing

# Test specific function
pytest tests/test_auth.py::test_login_success
```

### Frontend Testing

```bash
cd frontend

# Run all tests
npm test

# Run tests once (CI mode)
npm test -- --watchAll=false

# Run specific test file
npm test -- TableDetailPage.test.tsx

# Run tests with coverage
npm test -- --coverage
```

## 📊 Database Commands

### Database Operations

```bash
# Connect to database
docker-compose exec db-dev mysql -u dbsee_user -p dbsee_dev

# Backup database
docker-compose exec db-dev mysqldump -u dbsee_user -p dbsee_dev > backup.sql

# Restore database
docker-compose exec -T db-dev mysql -u dbsee_user -p dbsee_dev < backup.sql

# View database logs
docker-compose logs db-dev

# Reset database
docker-compose down -v
docker-compose up db-dev
```

### SQL Operations

```sql
-- Show all tables
SHOW TABLES;

-- Describe table structure
DESCRIBE users;

-- Show table creation statement
SHOW CREATE TABLE products;

-- Check table indexes
SHOW INDEX FROM orders;

-- Basic queries
SELECT COUNT(*) FROM users;
SELECT * FROM products LIMIT 10;
```

## 🔍 Monitoring Commands

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:3000/health

# Database connectivity
docker-compose exec backend python -c "from app.database import check_database_connection; print(check_database_connection())"
```

### System Monitoring

```bash
# Container resource usage
docker stats

# Container processes
docker-compose top

# Disk usage
docker system df

# Clean up unused resources
docker system prune
docker system prune -a  # Remove unused images too
```

### Log Analysis

```bash
# Follow logs in real-time
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Logs since specific time
docker-compose logs --since="2024-01-01T00:00:00"

# Filter logs by service
docker-compose logs backend | grep ERROR
```

## 🚢 Deployment Commands

### Development Deployment

```bash
# Start development environment
docker-compose up --build

# Update services
docker-compose pull
docker-compose up -d
```

### Production Deployment

```bash
# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# Rolling update
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --no-deps backend

# Zero-downtime deployment
docker-compose -f docker-compose.prod.yml up -d --scale backend=2
docker-compose -f docker-compose.prod.yml stop old_backend
```

### Cloud Deployment

```bash
# AWS ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build and push to ECR
docker build -t dbsee-backend ./backend
docker tag dbsee-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/dbsee-backend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/dbsee-backend:latest

# Google Cloud Build
gcloud builds submit --tag gcr.io/PROJECT_ID/dbsee-backend ./backend

# DigitalOcean App Platform
doctl apps create --spec app.yaml
```

## 🔧 Maintenance Commands

### Code Quality

```bash
# Pre-commit hooks setup
pip install pre-commit
pre-commit install

# Run pre-commit on all files
pre-commit run --all-files

# Update dependencies
pip-compile requirements.in
npm update
```

### Performance

```bash
# Database performance
docker-compose exec db-dev mysql -u dbsee_user -p -e "SHOW PROCESSLIST;"

# Analyze slow queries
docker-compose exec db-dev mysql -u dbsee_user -p -e "SHOW VARIABLES LIKE 'slow_query_log';"

# Container performance
docker stats --no-stream
```

### Security

```bash
# Vulnerability scan
docker run --rm -v "$(pwd)":/target aquasec/trivy fs /target

# Backend security check
cd backend && bandit -r app/

# Frontend audit
cd frontend && npm audit

# Fix vulnerabilities
npm audit fix
```

## 🆘 Troubleshooting Commands

### Common Issues

```bash
# Port already in use
sudo lsof -i :8000
sudo lsof -i :3000

# Permission issues (Linux)
sudo chown -R $USER:$USER .

# Clear Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose down -v --rmi all
docker-compose build --no-cache
docker-compose up
```

### Debug Mode

```bash
# Backend debug mode
DEBUG=true docker-compose up backend

# Frontend debug mode
REACT_APP_DEBUG=true docker-compose up frontend

# Database debug mode
docker-compose up db-dev --verbose
```

### Network Debugging

```bash
# Test network connectivity
docker-compose exec backend ping db-dev
docker-compose exec frontend ping backend

# Inspect networks
docker network ls
docker network inspect dbsee_dbsee-network

# Check port binding
netstat -tlnp | grep :8000
```

## 📋 Useful Aliases

Add these to your `.bashrc` or `.zshrc`:

```bash
# Docker Compose shortcuts
alias dc="docker-compose"
alias dcu="docker-compose up"
alias dcd="docker-compose down"
alias dcb="docker-compose build"
alias dcl="docker-compose logs"

# DBSee specific
alias dbsee-dev="docker-compose up --build"
alias dbsee-prod="docker-compose -f docker-compose.prod.yml up -d"
alias dbsee-test="docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit"
alias dbsee-logs="docker-compose logs -f"
``` 