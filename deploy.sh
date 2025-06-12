#!/bin/bash

# DBSee Production Deployment Script
# Usage: ./deploy.sh [--ssl] [--force-rebuild]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="dbsee"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"

# Parse command line arguments
USE_SSL=false
FORCE_REBUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --ssl)
            USE_SSL=true
            shift
            ;;
        --force-rebuild)
            FORCE_REBUILD=true
            shift
            ;;
        *)
            echo "Unknown option $1"
            echo "Usage: $0 [--ssl] [--force-rebuild]"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🚀 Starting DBSee Production Deployment${NC}"
echo "================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  Environment file not found. Creating from template...${NC}"
    if [ -f "env.production.example" ]; then
        cp env.production.example "$ENV_FILE"
        echo -e "${YELLOW}📝 Please edit $ENV_FILE with your production values before continuing.${NC}"
        read -p "Press Enter to continue after editing the file..."
    else
        echo -e "${RED}❌ No environment template found. Please create $ENV_FILE manually.${NC}"
        exit 1
    fi
fi

# Load environment variables
set -a
source "$ENV_FILE"
set +a

echo -e "${BLUE}📦 Pulling latest changes from repository...${NC}"
git pull origin main

echo -e "${BLUE}🛑 Stopping existing containers...${NC}"
docker-compose -f "$COMPOSE_FILE" down

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup current images (optional)
if [ "$FORCE_REBUILD" = true ]; then
    echo -e "${BLUE}🗑️  Removing old images for complete rebuild...${NC}"
    docker system prune -f
    docker image prune -f
fi

# Build and start services
echo -e "${BLUE}🔨 Building and starting services...${NC}"

if [ "$USE_SSL" = true ]; then
    echo -e "${BLUE}🔒 Deploying with SSL support...${NC}"
    docker-compose -f "$COMPOSE_FILE" --profile ssl up -d --build
else
    echo -e "${BLUE}🌐 Deploying without SSL...${NC}"
    docker-compose -f "$COMPOSE_FILE" up -d --build
fi

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"
timeout=300  # 5 minutes
elapsed=0
interval=10

while [ $elapsed -lt $timeout ]; do
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "healthy"; then
        echo -e "${GREEN}✅ Services are healthy!${NC}"
        break
    fi
    
    echo "Waiting for services... ($elapsed/$timeout seconds)"
    sleep $interval
    elapsed=$((elapsed + interval))
done

if [ $elapsed -ge $timeout ]; then
    echo -e "${RED}❌ Services failed to become healthy within $timeout seconds${NC}"
    echo "Checking logs..."
    docker-compose -f "$COMPOSE_FILE" logs --tail=50
    exit 1
fi

# Show running containers
echo -e "${BLUE}📋 Current service status:${NC}"
docker-compose -f "$COMPOSE_FILE" ps

# Show logs
echo -e "${BLUE}📜 Recent logs:${NC}"
docker-compose -f "$COMPOSE_FILE" logs --tail=20

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "================================================"

if [ "$USE_SSL" = true ]; then
    echo -e "${GREEN}🌐 Application available at: https://$DOMAIN_NAME${NC}"
else
    echo -e "${GREEN}🌐 Application available at: http://localhost${NC}"
fi

echo -e "${BLUE}💡 Useful commands:${NC}"
echo "  - View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "  - Stop services: docker-compose -f $COMPOSE_FILE down"
echo "  - Restart: docker-compose -f $COMPOSE_FILE restart"
echo "  - Update: ./deploy.sh" 