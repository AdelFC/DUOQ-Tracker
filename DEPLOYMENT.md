# 🚀 Guide de Déploiement - Digital Ocean avec PM2

**Date**: 2025-11-01
**Serveur**: Digital Ocean
**Process Manager**: PM2
**Node Version**: 18+

---

## 📋 Prérequis Serveur

### 1. Serveur Digital Ocean
- Ubuntu 22.04 LTS recommandé
- Minimum 1GB RAM (2GB recommandé)
- 25GB SSD minimum
- Node.js 18+ installé
- PM2 installé globalement

### 2. Accès SSH
```bash
ssh root@your_droplet_ip
# ou
ssh your_user@your_droplet_ip
```

---

## 🛠️ Installation Initiale sur le Serveur

### 1. Installer Node.js 18+
```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js 18.x via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier l'installation
node --version  # v18.x.x
npm --version   # 9.x.x
```

### 2. Installer PM2 globalement
```bash
sudo npm install -g pm2

# Vérifier l'installation
pm2 --version

# Setup PM2 startup script (pour redémarrage auto)
pm2 startup
# Suivre les instructions affichées
```

### 3. Créer le répertoire de l'application
```bash
# Créer le dossier pour l'app
sudo mkdir -p /var/www/duoq-tracker
sudo chown -R $USER:$USER /var/www/duoq-tracker
cd /var/www/duoq-tracker
```

---

## 📦 Déploiement de l'Application

### Méthode 1: Git Clone (Recommandé)

```bash
cd /var/www/duoq-tracker

# Cloner le repo (remplacer par votre repo)
git clone https://github.com/YOUR_USERNAME/DUOQ-Tracker.git .

# Installer les dépendances
npm install --production

# Build TypeScript
npm run build

# Créer les dossiers nécessaires
mkdir -p logs database
```

### Méthode 2: Upload manuel (via SCP)

Sur votre machine locale:
```bash
# Build local
npm run build

# Upload vers le serveur
scp -r dist/ package.json package-lock.json ecosystem.config.js your_user@your_droplet_ip:/var/www/duoq-tracker/

# SSH sur le serveur
ssh your_user@your_droplet_ip

# Installer les dépendances
cd /var/www/duoq-tracker
npm install --production
mkdir -p logs database
```

---

## ⚙️ Configuration

### 1. Créer le fichier .env

```bash
cd /var/www/duoq-tracker
nano .env
```

Contenu du `.env`:
```env
# Discord Bot
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_application_client_id
DISCORD_GUILD_ID=your_server_id

# Riot API
RIOT_API_KEY=RGAPI-your_api_key

# Database
DATABASE_PATH=./database/duoq.db

# Config
NODE_ENV=production
LOG_LEVEL=info
TIMEZONE=Europe/Paris

# Moderators (Discord User IDs, comma-separated)
MODERATOR_IDS=123456789012345678,987654321098765432
```

Sauvegarder: `Ctrl+X` puis `Y` puis `Enter`

### 2. Vérifier les permissions
```bash
chmod 600 .env  # Permissions restrictives
chmod +x dist/index.js
```

---

## 🚀 Démarrer l'Application avec PM2

### Démarrage initial
```bash
cd /var/www/duoq-tracker

# Démarrer en production
pm2 start ecosystem.config.js --env production

# Sauvegarder la config PM2
pm2 save

# Vérifier le statut
pm2 status
pm2 logs duoq-tracker --lines 50
```

### Commandes PM2 Utiles

```bash
# Voir les logs en temps réel
pm2 logs duoq-tracker

# Voir les logs avec filtre
pm2 logs duoq-tracker --lines 100
pm2 logs duoq-tracker --err  # Erreurs uniquement

# Redémarrer l'app
pm2 restart duoq-tracker

# Recharger (zero-downtime - ne fonctionne pas pour bot Discord)
pm2 reload duoq-tracker

# Arrêter l'app
pm2 stop duoq-tracker

# Supprimer l'app de PM2
pm2 delete duoq-tracker

# Monitoring
pm2 monit

# Informations détaillées
pm2 info duoq-tracker

# Liste des process
pm2 list
```

---

## 🔄 Mise à Jour de l'Application

### Avec Git
```bash
cd /var/www/duoq-tracker

# Arrêter le bot
pm2 stop duoq-tracker

# Pull les changements
git pull origin main

# Installer nouvelles dépendances si nécessaire
npm install --production

# Rebuild TypeScript
npm run build

# Redémarrer
pm2 restart duoq-tracker

# Vérifier les logs
pm2 logs duoq-tracker --lines 50
```

### Upload manuel
```bash
# Sur votre machine locale
npm run build
scp -r dist/ your_user@your_droplet_ip:/var/www/duoq-tracker/

# Sur le serveur
cd /var/www/duoq-tracker
pm2 restart duoq-tracker
pm2 logs duoq-tracker --lines 50
```

---

## 📊 Monitoring & Logs

### Vérifier que le bot fonctionne
```bash
# Status global
pm2 status

# Logs en temps réel
pm2 logs duoq-tracker

# Memory/CPU usage
pm2 monit

# Uptime et restarts
pm2 info duoq-tracker
```

### Logs Discord
Vérifier dans Discord:
1. Le bot apparaît en ligne
2. Les slash commands fonctionnent (`/setup status`)
3. Le daily ladder poste à 19h00 Europe/Paris

### Logs de l'application
```bash
# Voir les logs PM2
tail -f /var/www/duoq-tracker/logs/pm2-out.log
tail -f /var/www/duoq-tracker/logs/pm2-error.log

# Rotation des logs (recommandé)
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 🔒 Sécurité

### 1. Firewall (UFW)
```bash
# Activer le firewall
sudo ufw enable

# Autoriser SSH
sudo ufw allow 22/tcp

# Optionnel: Autoriser HTTP/HTTPS si web dashboard
# sudo ufw allow 80/tcp
# sudo ufw allow 443/tcp

# Vérifier le statut
sudo ufw status
```

### 2. Fail2Ban (Protection SSH)
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Permissions fichiers
```bash
chmod 600 .env
chmod 700 database/
chmod 644 ecosystem.config.js
```

---

## 🗄️ Backup Database

### Script de backup automatique
Créer `/var/www/duoq-tracker/backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/www/duoq-tracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp database/duoq.db $BACKUP_DIR/duoq_$DATE.db

# Garder seulement les 7 derniers backups
ls -t $BACKUP_DIR/duoq_*.db | tail -n +8 | xargs rm -f

echo "Backup créé: duoq_$DATE.db"
```

Rendre exécutable:
```bash
chmod +x backup.sh
```

Ajouter un cron job (backup quotidien à 4h):
```bash
crontab -e

# Ajouter cette ligne:
0 4 * * * /var/www/duoq-tracker/backup.sh >> /var/www/duoq-tracker/logs/backup.log 2>&1
```

---

## 🔧 Troubleshooting

### Le bot ne démarre pas
```bash
# Vérifier les logs d'erreur
pm2 logs duoq-tracker --err --lines 100

# Vérifier les variables d'environnement
pm2 env 0  # 0 = ID du process (voir avec pm2 list)

# Tester manuellement
cd /var/www/duoq-tracker
node dist/index.js
```

### Le bot crash régulièrement
```bash
# Vérifier la mémoire
pm2 info duoq-tracker

# Augmenter max_memory_restart dans ecosystem.config.js
# Redémarrer PM2
pm2 delete duoq-tracker
pm2 start ecosystem.config.js --env production
pm2 save
```

### Daily Ladder ne poste pas
```bash
# Vérifier les logs à 19h00
pm2 logs duoq-tracker --lines 200 | grep -i "daily"

# Vérifier la timezone du serveur
timedatectl

# Si nécessaire, configurer la timezone
sudo timedatectl set-timezone Europe/Paris
```

### Slash commands ne fonctionnent pas
```bash
# Déployer les commands sur Discord
cd /var/www/duoq-tracker
npm run deploy

# Vérifier que DISCORD_CLIENT_ID et DISCORD_TOKEN sont corrects
cat .env | grep DISCORD
```

---

## 📝 Checklist Post-Déploiement

### Configuration
- [ ] Node.js 18+ installé
- [ ] PM2 installé et configuré avec startup script
- [ ] Application déployée dans `/var/www/duoq-tracker`
- [ ] Fichier `.env` créé avec tous les tokens
- [ ] Permissions correctes sur `.env` et `database/`
- [ ] Dossiers `logs/` et `database/` créés

### Discord
- [ ] Bot apparaît en ligne dans Discord
- [ ] Slash commands déployés (`npm run deploy`)
- [ ] `/setup status` fonctionne
- [ ] Channels configurés (`/setup channels`)
- [ ] Event configuré (`/setup event`)

### PM2
- [ ] Bot démarre avec `pm2 start`
- [ ] PM2 configuré pour auto-restart (`pm2 startup`)
- [ ] Configuration sauvegardée (`pm2 save`)
- [ ] Logs accessibles (`pm2 logs duoq-tracker`)

### Sécurité
- [ ] Firewall UFW activé et configuré
- [ ] Fail2Ban installé (optionnel)
- [ ] Backup automatique configuré (cron)

### Tests
- [ ] Tester `/register`, `/link`, `/ladder`
- [ ] Tester `/setup status`
- [ ] Vérifier que le bot poste dans `#tracker` channel
- [ ] Attendre 19h00 pour vérifier le daily ladder

---

## 📚 Ressources

### PM2
- Documentation: https://pm2.keymetrics.io/docs/usage/quick-start/
- PM2 Logrotate: https://github.com/keymetrics/pm2-logrotate

### Digital Ocean
- Node.js Droplet: https://docs.digitalocean.com/products/droplets/how-to/
- UFW Firewall: https://www.digitalocean.com/community/tutorials/ufw-essentials-common-firewall-rules-and-commands

### Discord.js
- Deploying Commands: https://discordjs.guide/interactions/slash-commands.html#registering-slash-commands

---

**Maintenu par**: DuoQ Tracker Team
**Dernière mise à jour**: 2025-11-01
**Version**: 0.4.0
