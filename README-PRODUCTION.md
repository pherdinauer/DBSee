# 🚀 DBSee Production Quick Start

Guida rapida per deployare DBSee in produzione con Docker.

## ⚡ Setup Rapido (5 minuti)

### 1. Prerequisiti Server
```bash
# Installa Docker e Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose -y
sudo usermod -aG docker $USER
```

### 2. Clone e Configurazione
```bash
# Clone repository
git clone https://github.com/TUO_USERNAME/dbsee.git
cd dbsee

# Copia configurazione
cp env.production.example .env.production

# Modifica configurazione (IMPORTANTE!)
nano .env.production
```

### 3. Deploy
```bash
# Rendere eseguibile (su Linux/Mac)
chmod +x deploy.sh

# Deploy semplice (HTTP)
./deploy.sh

# Deploy con SSL automatico
./deploy.sh --ssl
```

## 📱 Accesso

- **HTTP**: `http://your-server-ip`
- **HTTPS**: `https://your-domain.com` (se hai configurato SSL)

## 🔄 Aggiornamenti Automatici

### Metodo 1: GitHub Actions (Raccomandato)

1. **Configura secrets in GitHub:**
   - `PROD_HOST`: IP del server
   - `PROD_USER`: Username SSH
   - `PROD_SSH_KEY`: Chiave privata SSH
   - `PROD_ENV`: Contenuto di `.env.production`

2. **Push su main branch = deployment automatico!**

### Metodo 2: Script Manuale
```bash
cd /path/to/dbsee
git pull origin main
./deploy.sh
```

## 🔧 Comandi Utili

```bash
# Stato servizi
docker-compose -f docker-compose.prod.yml ps

# Logs
docker-compose -f docker-compose.prod.yml logs -f

# Riavvio
docker-compose -f docker-compose.prod.yml restart

# Stop
docker-compose -f docker-compose.prod.yml down
```

## 🆘 Risoluzione Problemi

```bash
# Verifica health
curl http://localhost/health

# Logs errori
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Rebuild completo
./deploy.sh --force-rebuild
```

---

## 📋 Checklist Deployment

- [ ] Server con Docker installato
- [ ] Repository clonato
- [ ] File `.env.production` configurato
- [ ] Deploy script eseguito
- [ ] Applicazione accessibile
- [ ] GitHub Actions configurato (opzionale)
- [ ] SSL configurato (raccomandato)
- [ ] Backup automatico configurato
- [ ] Monitoring configurato

**Tutto fatto? Ottimo! 🎉**

Per la guida completa: [DEPLOYMENT.md](./DEPLOYMENT.md) 