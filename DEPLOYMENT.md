# DBSee Deployment Guide

Complete guide for deploying the DBSee application in different environments.

## Quick Start

```bash
git clone <repository-url>
cd DBSee
cp .env.example .env
# Edit .env with your database credentials
docker-compose up --build
```

## Environment Variables

Required variables in `.env`:

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
JWT_SECRET_KEY=your_secret_key
ALLOWED_ORIGINS=http://localhost:3000
```

## Production Deployment

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Cloud Platforms

### AWS ECS
1. Push images to ECR
2. Create ECS task definition
3. Set up load balancer
4. Configure auto-scaling

### Google Cloud Run
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/dbsee-backend ./backend
gcloud run deploy --image gcr.io/PROJECT_ID/dbsee-backend
```

### DigitalOcean App Platform
Use the included `app.yaml` specification.

## Monitoring

- Health checks: `/health`
- Logs: `docker-compose logs`
- Metrics: Prometheus + Grafana setup available

## Security

- Use HTTPS in production
- Configure CORS properly
- Regular security updates
- Database encryption 