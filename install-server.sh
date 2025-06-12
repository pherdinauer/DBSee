#!/bin/bash

# DBSee Server Installation Script
# Usage: curl -fsSL https://raw.githubusercontent.com/TUO_USERNAME/dbsee/main/install-server.sh | bash

set -e

echo "🚀 DBSee Server Installation Script"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Please run this script as a regular user, not root${NC}"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VERSION=$VERSION_ID
else
    echo -e "${RED}❌ Cannot detect OS version${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Detected OS: $OS $VERSION${NC}"

# Install Docker
echo -e "${BLUE}🐳 Installing Docker...${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

# Start and enable Docker
echo -e "${BLUE}🔧 Configuring Docker...${NC}"
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo -e "${BLUE}📦 Installing Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Git if not present
if ! command -v git &> /dev/null; then
    echo -e "${BLUE}📥 Installing Git...${NC}"
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        sudo apt update
        sudo apt install -y git curl
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        sudo yum install -y git curl
    fi
fi

# Create application directory
echo -e "${BLUE}📁 Creating application directory...${NC}"
sudo mkdir -p /opt/dbsee
sudo chown $USER:$USER /opt/dbsee

# Configure firewall
echo -e "${BLUE}🔒 Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    sudo ufw --force enable
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-service=ssh
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --permanent --add-service=https
    sudo firewall-cmd --reload
fi

# Test Docker installation
echo -e "${BLUE}🧪 Testing Docker installation...${NC}"
newgrp docker << EOF
docker run hello-world
docker rmi hello-world
EOF

echo -e "${GREEN}✅ Installation completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "${YELLOW}1. Clone your repository: git clone https://github.com/TUO_USERNAME/dbsee.git /opt/dbsee${NC}"
echo -e "${YELLOW}2. Configure environment: cp /opt/dbsee/env.production.example /opt/dbsee/.env.production${NC}"
echo -e "${YELLOW}3. Edit configuration: nano /opt/dbsee/.env.production${NC}"
echo -e "${YELLOW}4. Deploy: cd /opt/dbsee && ./deploy.sh${NC}"
echo ""
echo -e "${GREEN}🎉 Your server is ready for DBSee deployment!${NC}"

# Show versions
echo -e "${BLUE}📋 Installed versions:${NC}"
docker --version
docker-compose --version || docker compose version
git --version 