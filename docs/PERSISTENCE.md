# Persistence System

## 📋 Vue d'ensemble

Le système de persistence sauvegarde automatiquement l'état du bot dans un fichier JSON pour éviter toute perte de données en cas de redémarrage ou crash.

## 🎯 Objectif

**Prévenir la perte de données** lors des redémarrages, mises à jour ou crashes du bot.

## ⚙️ Fonctionnement

### Sauvegarde Automatique

- **Fréquence** : Toutes les 5 minutes
- **Format** : JSON
- **Localisation** : `./data/state.json`
- **Backup** : `./data/state.json.backup`

### Données Sauvegardées

```json
{
  "version": "1.0.0",
  "savedAt": "2025-01-15T14:30:00.000Z",
  "players": [...],   // Tous les joueurs inscrits
  "duos": [...],      // Tous les duos formés
  "games": [...],     // Toutes les games trackées
  "devs": [...],      // Tous les devs enregistrés
  "config": {...}     // Configuration (channels, dates, API key)
}
```

### Cycle de Vie

```mermaid
graph LR
    A[Bot Start] --> B[Load state.json]
    B --> C[Start auto-save<br/>every 5min]
    C --> D[Bot Running]
    D --> E[SIGINT/SIGTERM]
    E --> F[Force Save]
    F --> G[Stop Bot]
```

## 🚀 Utilisation

### Automatique

Le système fonctionne **automatiquement**, aucune configuration requise :

1. **Au démarrage** : Charge `./data/state.json` s'il existe
2. **En cours d'exécution** : Sauvegarde toutes les 5 minutes
3. **À l'arrêt** : Sauvegarde finale avant de quitter

### Logs

```bash
[Persistence] Loaded - 10 players, 5 duos, 23 games (saved 2m ago)
[Persistence] Started (auto-save every 300s)
[Persistence] Saved - 10 players, 5 duos, 24 games
[Bot] Saving state before shutdown...
[Persistence] Force save requested
[Persistence] Saved - 10 players, 5 duos, 24 games
```

## 📂 Structure du Fichier

### Exemple Complet

```json
{
  "version": "1.0.0",
  "savedAt": "2025-01-15T14:30:00.000Z",
  "players": [
    {
      "discordId": "123456789",
      "puuid": "abc-def-ghi",
      "gameName": "Player1",
      "tagLine": "EUW",
      "role": "noob",
      "duoId": 1,
      "peakElo": "G4",
      "initialRank": {
        "tier": "GOLD",
        "division": "IV",
        "lp": 50
      },
      "currentRank": {
        "tier": "GOLD",
        "division": "III",
        "lp": 75
      },
      "mainRoleString": "MID",
      "mainChampion": "Yasuo",
      "detectedMainRole": null,
      "totalPoints": 150,
      "gamesPlayed": 10,
      "wins": 6,
      "losses": 4,
      "streaks": {
        "current": 2,
        "longestWin": 3,
        "longestLoss": 2
      },
      "registeredAt": "2025-01-10T10:00:00.000Z",
      "lastGameAt": "2025-01-15T14:00:00.000Z"
    }
  ],
  "duos": [
    {
      "id": 1,
      "name": "Team Rocket",
      "noobId": "123456789",
      "carryId": "987654321",
      "totalPoints": 250,
      "gamesPlayed": 10,
      "wins": 6,
      "losses": 4,
      "currentStreak": 2,
      "longestWinStreak": 3,
      "longestLossStreak": 2,
      "createdAt": "2025-01-10T10:30:00.000Z",
      "lastGameAt": "2025-01-15T14:00:00.000Z"
    }
  ],
  "games": [
    {
      "id": "EUW1_1234567890",
      "matchId": "EUW1_1234567890",
      "duoId": 1,
      "startTime": "2025-01-15T13:00:00.000Z",
      "endTime": "2025-01-15T13:30:00.000Z",
      "createdAt": "2025-01-15T13:00:00.000Z",
      "win": true,
      "noobKDA": "5/2/8",
      "carryKDA": "10/1/5",
      "noobKills": 5,
      "noobDeaths": 2,
      "noobAssists": 8,
      "carryKills": 10,
      "carryDeaths": 1,
      "carryAssists": 5,
      "noobChampion": "Yasuo",
      "carryChampion": "Jinx",
      "duration": 1800,
      "scored": true,
      "pointsAwarded": 35
    }
  ],
  "devs": [
    {
      "userId": "111222333",
      "username": "admin",
      "registeredAt": "2025-01-10T09:00:00.000Z"
    }
  ],
  "config": {
    "generalChannelId": "channel123",
    "trackerChannelId": "channel456",
    "devChannelId": "channel789",
    "eventStartDate": "2025-01-01T00:00:00.000Z",
    "eventEndDate": "2025-01-31T23:59:59.000Z",
    "riotApiKey": "RGAPI-xxx-yyy-zzz",
    "riotApiKeyUpdatedAt": "2025-01-10T08:00:00.000Z",
    "eventTimezone": "Europe/Paris"
  }
}
```

## 🛡️ Sécurité & Fiabilité

### Écriture Atomique

1. Écrit dans `state.json.tmp`
2. Renomme en `state.json` (opération atomique)
3. Évite la corruption si crash pendant l'écriture

### Backup Automatique

- Avant chaque sauvegarde, l'ancien fichier est copié vers `state.json.backup`
- En cas de corruption du fichier principal, le backup est utilisé

### Gestion d'Erreurs

```typescript
// Tentative de chargement du fichier principal
try {
  loadState('state.json')
} catch (error) {
  // Fallback vers le backup
  try {
    loadState('state.json.backup')
  } catch (backupError) {
    // Démarrage avec état vide
    console.log('Starting with fresh state')
  }
}
```

## 📊 Scénarios Pratiques

### Redémarrage Normal

```bash
# Arrêt propre (Ctrl+C)
[Start] Received SIGINT, shutting down gracefully...
[Bot] Saving state before shutdown...
[Persistence] Force save requested
[Persistence] Saved - 10 players, 5 duos, 24 games
[Bot] Stopped successfully

# Redémarrage
[Start] Starting Discord bot...
[Persistence] Loaded - 10 players, 5 duos, 24 games (saved 10s ago)
[Persistence] Started (auto-save every 300s)
[Bot] Bot started successfully!
```

### Crash Inattendu

```bash
# Crash pendant l'exécution
[Server crashed]

# Redémarrage après crash
[Start] Starting Discord bot...
[Persistence] Loaded - 10 players, 5 duos, 23 games (saved 3m ago)
# ✅ Seules les données depuis la dernière sauvegarde (max 5min) sont perdues
```

### Corruption de Fichier

```bash
[Persistence] Error loading state: SyntaxError: Unexpected token
[Persistence] Attempting to load from backup...
[Persistence] Successfully loaded from backup
# ✅ Récupération depuis le backup
```

## 🔧 Configuration

### Changer la Fréquence de Sauvegarde

Par défaut : 5 minutes (300000ms)

```typescript
// src/bot/index.ts
persistenceService.start(60000) // Sauvegarde toutes les 1 minute
```

### Changer le Répertoire

```typescript
// src/bot/index.ts
persistenceService = new PersistenceService(
  state,
  './custom-data-dir',  // Dossier personnalisé
  'custom-name.json'    // Nom personnalisé
)
```

## 🆘 Dépannage

### Le fichier state.json n'est pas créé

**Causes possibles :**
- Permissions insuffisantes sur le dossier `./data`
- Le bot s'arrête avant la première sauvegarde (5min)

**Solutions :**
```bash
# Vérifier les permissions
chmod 755 ./data

# Forcer une sauvegarde immédiate (via /dev status ou arrêt propre)
# Ctrl+C déclenche forceSave()
```

### État non restauré au démarrage

**Vérification :**
```bash
# Vérifier que le fichier existe
ls -lh ./data/state.json

# Vérifier le contenu
cat ./data/state.json | jq .
```

**Causes possibles :**
- Fichier corrompu (JSON invalide)
- Mauvais format de version

**Solution :**
```bash
# Utiliser le backup
cp ./data/state.json.backup ./data/state.json
```

### Perte de données malgré la persistence

**Causes possibles :**
- Crash entre deux sauvegardes (max 5min de perte)
- Arrêt brutal sans SIGINT/SIGTERM (kill -9)

**Solutions :**
- Réduire l'intervalle de sauvegarde
- Toujours arrêter avec Ctrl+C (SIGINT)
- Utiliser PM2 qui gère graceful shutdown

## 📝 Notes Techniques

### Thread Safety

- Flag `isSaving` empêche les sauvegardes concurrentes
- Une seule sauvegarde à la fois, les suivantes sont skippées

### Performance

- Sérialisation JSON : O(n) où n = nombre d'objets
- Écriture disque : ~10-50ms pour 1000 objets
- Impact négligeable (toutes les 5min)

### Taille du Fichier

| Données | Taille Fichier |
|---------|----------------|
| 10 duos (20 players, 100 games) | ~100 KB |
| 20 duos (40 players, 500 games) | ~500 KB |
| 50 duos (100 players, 2000 games) | ~2 MB |

### Compatibilité Versions

Le champ `version` permet la migration future :

```typescript
if (data.version === '1.0.0') {
  // Charger format v1
} else if (data.version === '2.0.0') {
  // Migrer de v1 vers v2
}
```

## 🔗 Références

- Code source : `src/services/persistence.service.ts`
- Initialisation : `src/bot/index.ts:85-100`
- Arrêt : `src/start.ts:48-63`
- Types : `src/types/state.ts`

## 🎉 Avantages

✅ **Aucune perte de données** sur redémarrage planifié
✅ **Perte minimale** (max 5min) sur crash
✅ **Backup automatique** en cas de corruption
✅ **Pas de configuration** requise (out-of-the-box)
✅ **Logs clairs** pour le monitoring
✅ **Thread-safe** et performant
