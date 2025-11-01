# Channels & Setup - Implementation Document

**Date**: 2025-11-01
**Status**: ✅ Implemented (505 tests passing)

Documentation pour la gestion des channels Discord et la commande `/setup`.

---

## 🎯 Objectifs

1. **Gestion des channels Discord** : Séparer les interactions et les notifications
2. **Commande `/setup`** : Configuration flexible des événements (dates, channels)

---

## 📺 Architecture des Channels

### Channels Discord

Le bot utilisera **2 channels distincts** :

#### 1. `#duoq-challenge-general` (Channel d'interaction)

**Usage** :
- Commandes utilisateurs (`/register`, `/link`, `/profile`, `/ladder`, `/history`, etc.)
- Interactions avec le bot
- Discussions générales sur le challenge

**Messages postés** :
- ✅ Réponses aux commandes
- ✅ Confirmations d'inscription/lien
- ✅ Profils joueurs
- ✅ Historiques
- ✅ Erreurs utilisateur

**Permissions** :
- Lecture : `@everyone`
- Écriture : `@everyone`
- Slash commands : `@everyone`

---

#### 2. `#duoq-challenge-tracker` (Channel de notifications)

**Usage** :
- Notifications automatiques du bot uniquement
- Tracking en temps réel des games
- Ladder quotidien

**Messages postés** :
- 🎮 **Game détectée** : "Game en cours pour [Duo Name]"
- 🏁 **Game terminée + score** : Embed détaillé avec breakdown
- 📊 **Ladder quotidien** : Classement complet (automatique à 19h00 Europe/Paris)

**Permissions** :
- Lecture : `@everyone`
- Écriture : **Bot uniquement** (via permissions Discord)
- Slash commands : Désactivés

**Comportement** :
- Messages automatiques uniquement
- Pas d'interaction humaine
- Feed en temps réel

---

### Configuration des Channels

**Stockage en DB** :

```typescript
// Table: config
{
  generalChannelId: string    // ID du channel #duoq-challenge-general
  trackerChannelId: string    // ID du channel #duoq-challenge-tracker
}
```

**Définition via `/setup`** :
```
/setup channels general:#duoq-challenge-general tracker:#duoq-challenge-tracker
```

**Validation** :
- ✅ Le bot doit avoir accès aux deux channels
- ✅ Le bot doit avoir permission `SEND_MESSAGES` sur les deux
- ✅ Le bot doit avoir permission `EMBED_LINKS` sur les deux
- ❌ Erreur si channels inexistants ou permissions manquantes

---

## ⚙️ Commande `/setup`

### Concept

Commande **admin uniquement** pour configurer l'événement du challenge.

**Permissions** :
- Réservée aux utilisateurs avec rôle `ADMINISTRATOR` ou ID dans `MODERATOR_IDS` (.env)

### Sous-commandes

#### 1. `/setup event`

**Description** : Configure les dates de début et fin de l'événement (timezone: Europe/Paris)

**Syntaxe** :
```
/setup event start:<ISO_8601> end:<ISO_8601>
```

**Exemples** :
```
/setup event start:2025-11-05T00:00:00Z end:2025-11-10T23:59:59Z
```

**Paramètres** :
- `start` (required) : Date/heure de début (format ISO 8601)
- `end` (required) : Date/heure de fin (format ISO 8601)

**Note importante** : La timezone est **hardcodée à Europe/Paris** et n'est pas configurable par l'utilisateur.

**Validation** :
- ✅ Date de début < Date de fin
- ✅ Date de début >= maintenant (ou dans le passé si event déjà commencé)
- ✅ Durée min : 1 jour
- ✅ Durée max : 90 jours
- ❌ Erreur si format invalide

**Effet** :
- Stocke les dates dans la DB (table `config`)
- Affiche confirmation avec récapitulatif
- Si event déjà en cours : demande confirmation pour override

**Embed de réponse** :
```
✅ Événement configuré

📅 Début : 2025-11-05 00:00 (Europe/Paris)
📅 Fin : 2025-11-10 23:59 (Europe/Paris)
🌍 Fuseau horaire : Europe/Paris
⏱️ Durée : 5 jours

Le challenge démarrera automatiquement à la date de début.
Le classement quotidien sera posté à 19h00 Europe/Paris.
```

---

#### 2. `/setup channels`

**Description** : Configure les channels Discord utilisés par le bot

**Syntaxe** :
```
/setup channels general:<#channel> tracker:<#channel>
```

**Exemple** :
```
/setup channels general:#duoq-challenge-general tracker:#duoq-challenge-tracker
```

**Paramètres** :
- `general` (required) : Channel pour les interactions (mention Discord)
- `tracker` (required) : Channel pour les notifications (mention Discord)

**Validation** :
- ✅ Les deux channels doivent exister
- ✅ Le bot doit avoir accès aux deux channels
- ✅ Le bot doit avoir permissions `SEND_MESSAGES` + `EMBED_LINKS`
- ✅ Les deux channels doivent être différents
- ❌ Erreur si permissions manquantes

**Effet** :
- Stocke les IDs dans la DB (table `config`)
- Poste un message de test dans chaque channel
- Affiche confirmation

**Embed de réponse** :
```
✅ Channels configurés

💬 General : #duoq-challenge-general
📊 Tracker : #duoq-challenge-tracker

Messages de test envoyés dans les deux channels.
```

**Messages de test** :
- Dans `#duoq-challenge-general` : "✅ Channel configuré pour les interactions"
- Dans `#duoq-challenge-tracker` : "✅ Channel configuré pour les notifications automatiques"

---

#### 3. `/setup status`

**Description** : Affiche la configuration actuelle de l'événement

**Syntaxe** :
```
/setup status
```

**Embed de réponse** :
```
⚙️ Configuration du Challenge

📅 ÉVÉNEMENT
├ Début : 2025-11-05 00:00 (Europe/Paris)
├ Fin : 2025-11-10 23:59 (Europe/Paris)
├ Durée : 5 jours
└ Status : En cours / Pas commencé / Terminé

📺 CHANNELS
├ General : #duoq-challenge-general
└ Tracker : #duoq-challenge-tracker

👥 STATISTIQUES
├ Duos inscrits : 8
├ Games jouées : 42
└ Total points : 3240

🔑 RIOT API
├ Clé active : RGAPI-...f8e2
└ Expire dans : 23h 45min
```

---

#### 4. `/setup reset`

**Description** : Réinitialise l'événement (données + config)

**Syntaxe** :
```
/setup reset [confirm:true]
```

**Paramètres** :
- `confirm` (required) : Doit être `true` pour confirmer

**Effet** :
- ⚠️ **DANGEREUX** : Supprime TOUTES les données
- Supprime tous les duos
- Supprime tous les joueurs
- Supprime toutes les games
- Réinitialise la configuration
- Garde uniquement les channels configurés

**Validation** :
- Demande double confirmation via bouton Discord
- Affiche avertissement clair

**Embed d'avertissement** :
```
⚠️ ATTENTION - Réinitialisation Totale

Cette action va SUPPRIMER :
❌ Tous les duos
❌ Tous les joueurs
❌ Toutes les games
❌ Tous les scores
❌ Configuration de l'événement

✅ Les channels configurés seront conservés

Cette action est IRRÉVERSIBLE.
```

**Boutons** :
- `Confirmer la réinitialisation` (rouge, danger)
- `Annuler` (gris)

---

## 🗄️ Schema Database

### Table `config`

```typescript
export const config = sqliteTable('config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})
```

**Clés stockées** :

| key | value | Description |
|-----|-------|-------------|
| `eventStartDate` | `2025-11-05T00:00:00Z` | ISO timestamp |
| `eventEndDate` | `2025-11-10T23:59:59Z` | ISO timestamp |
| `eventTimezone` | `Europe/Paris` | Timezone (hardcodée) |
| `generalChannelId` | `1234567890` | Discord channel ID |
| `trackerChannelId` | `0987654321` | Discord channel ID |
| `riotApiKey` | `RGAPI-...` | Clé API Riot |

**Daily Ladder** :
- Poste automatiquement à **19:00 Europe/Paris** chaque jour
- Utilise le service `DailyLadderService` avec node-schedule
- Affiche le classement complet de tous les duos
- Envoie dans le `trackerChannelId` configuré

---

## 🔧 Implémentation

### Fichiers Implémentés ✅

```
src/handlers/admin/
├── setup-event.handler.ts       # ✅ /setup event
├── setup-channels.handler.ts    # ✅ /setup channels
├── setup-status.handler.ts      # ✅ /setup status
└── setup-reset.handler.ts       # ✅ /setup reset

src/bot/commands/
└── setup.ts                      # ✅ Slash command /setup

src/services/
├── config/
│   ├── config.service.ts         # ✅ Get/Set config values
│   └── types.ts                  # ✅ Config interfaces
├── channel-router.ts             # ✅ Channel routing logic
└── daily-ladder.ts               # ✅ Daily ladder posting (19h)

src/formatters/
├── base-embeds.ts                # ✅ Base embed helpers
├── setup-embeds.ts               # ✅ Setup command embeds
└── game-embeds.ts                # ✅ Game notification embeds

src/tests/handlers/admin/
├── setup-event.test.ts           # ✅ 15 tests
├── setup-channels.test.ts        # ✅ 12 tests
├── setup-status.test.ts          # ✅ 5 tests
└── setup-reset.test.ts           # ✅ 9 tests

src/tests/services/
├── channel-router.test.ts        # ✅ 21 tests
└── daily-ladder.test.ts          # ✅ 13 tests

src/tests/formatters/
├── base-embeds.test.ts           # ✅ 12 tests
└── game-embeds.test.ts           # ✅ 17 tests
```

### Tests Complétés ✅

| Catégorie | Tests | Statut | Note |
|-----------|-------|--------|------|
| `setup-event` | 15 tests | ✅ Pass | Validation dates, timezone, override, erreurs |
| `setup-channels` | 12 tests | ✅ Pass | Permissions, validation, messages test |
| `setup-status` | 5 tests | ✅ Pass | Affichage config, stats, edge cases |
| `setup-reset` | 9 tests | ✅ Pass | Confirmation, suppression, conservation channels |
| `channel-router` | 21 tests | ✅ Pass | Routing messages, integration ConfigService |
| `daily-ladder` | 13 tests | ✅ Pass | Cron scheduling, posting, edge cases |
| `formatters` | 29 tests | ✅ Pass | Base embeds (12) + Game embeds (17) |
| **TOTAL** | **104 tests** | ✅ Pass | Phase complète |

---

## 🎯 Workflow Utilisateur

### Configuration initiale (Admin)

1. **Créer les channels Discord** :
   - `#duoq-challenge-general`
   - `#duoq-challenge-tracker`
   - Configurer permissions (bot SEND_MESSAGES + EMBED_LINKS)

2. **Configurer les channels** :
   ```
   /setup channels general:#duoq-challenge-general tracker:#duoq-challenge-tracker
   ```
   ✅ Bot répond : "Channels configurés"
   ✅ Messages de test apparaissent dans les 2 channels

3. **Configurer l'événement** :
   ```
   /setup event start:2025-11-05T00:00:00Z end:2025-11-10T23:59:59Z
   ```
   ✅ Bot répond : "Événement configuré - Démarrage le 2025-11-05 à 00:00"
   ✅ Le classement quotidien sera automatiquement posté à 19h00 Europe/Paris

4. **Vérifier la config** :
   ```
   /setup status
   ```
   ✅ Bot affiche : Récap complet (dates, channels, stats)

5. **Challenge prêt** 🎉
   - Les joueurs peuvent faire `/register` dans `#general`
   - Les notifications apparaîtront dans `#tracker`

---

### Utilisation pendant le challenge

**Dans `#duoq-challenge-general`** :
```
[Joueur1]: /register Risotto#CR7 MID Yasuo G2
[Bot]: ✅ Inscription réussie ! ...

[Joueur1]: /link @Joueur2
[Bot]: ✅ Duo créé : Risotto (Noob) + Faker (Carry) ...

[Joueur1]: /profile
[Bot]: 📊 Profil de Risotto ...

[Joueur1]: /ladder
[Bot]: 🏆 Classement DuoQ Challenge ...
```

**Dans `#duoq-challenge-tracker`** (automatique) :
```
[Bot]: 🎮 Game détectée - Bronze Bandits en partie !

[Bot]: 🏁 Game terminée - Bronze Bandits
       [Embed détaillé avec breakdown]
       Total : +94 points

[Bot - 19:00]: 📊 Classement Quotidien
       [Embed ladder complet avec tous les duos]
       Posté automatiquement par DailyLadderService
```

---

## 📋 Routing des Messages

### Service : ChannelRouter

```typescript
export class ChannelRouter {
  /**
   * Envoie un message dans le channel approprié selon le type
   */
  async sendMessage(
    type: 'INTERACTION' | 'NOTIFICATION',
    content: MessageContent
  ): Promise<void> {
    const config = await this.configService.getConfig()

    const channelId = type === 'INTERACTION'
      ? config.generalChannelId
      : config.trackerChannelId

    if (!channelId) {
      throw new Error(`Channel ${type} not configured`)
    }

    const channel = await this.client.channels.fetch(channelId)
    // Send message...
  }

  /**
   * Détermine le type de message selon la Response
   */
  getMessageType(response: Response): 'INTERACTION' | 'NOTIFICATION' {
    switch (response.type) {
      // Interactions (réponses aux commandes)
      case 'REGISTER_SUCCESS':
      case 'LINK_SUCCESS':
      case 'PROFILE':
      case 'LADDER':
      case 'HISTORY':
      case 'ERROR':
        return 'INTERACTION'

      // Notifications automatiques
      case 'GAME_STARTED':
      case 'GAME_SCORED':
      case 'DAILY_LADDER':
        return 'NOTIFICATION'

      default:
        return 'INTERACTION'
    }
  }
}
```

---

## 🔒 Sécurité & Permissions

### Permissions Discord requises pour le bot

**General channel** :
- `VIEW_CHANNEL`
- `SEND_MESSAGES`
- `EMBED_LINKS`
- `USE_APPLICATION_COMMANDS`
- `READ_MESSAGE_HISTORY`

**Tracker channel** :
- `VIEW_CHANNEL`
- `SEND_MESSAGES`
- `EMBED_LINKS`
- `READ_MESSAGE_HISTORY`

**Permissions à refuser aux utilisateurs sur #tracker** :
- `SEND_MESSAGES` : Seul le bot peut poster
- Autoriser `VIEW_CHANNEL` et `READ_MESSAGE_HISTORY`

---

### Permissions commande `/setup`

**Vérification** :
```typescript
function isAuthorized(userId: string, guildMember: GuildMember): boolean {
  // 1. Check if user is administrator
  if (guildMember.permissions.has('ADMINISTRATOR')) {
    return true
  }

  // 2. Check if user is in MODERATOR_IDS (.env)
  const moderatorIds = process.env.MODERATOR_IDS?.split(',') || []
  if (moderatorIds.includes(userId)) {
    return true
  }

  return false
}
```

**Erreur si non autorisé** :
```
❌ Permission refusée

Cette commande est réservée aux administrateurs du serveur.
```

---

## 🚀 Implémentation Complétée ✅

### Phase 1 : Configuration Service (2h) ✅
1. ✅ `src/services/config/config.service.ts`
2. ✅ Table `config` dans schema.ts
3. ✅ Tests config service (19 tests)

### Phase 2 : Setup Handlers (4h) ✅
1. ✅ `setup-channels.handler.ts` (12 tests)
2. ✅ `setup-event.handler.ts` (15 tests)
3. ✅ `setup-status.handler.ts` (5 tests)
4. ✅ `setup-reset.handler.ts` (9 tests)

### Phase 3 : Channel Router (2h) ✅
1. ✅ `src/services/channel-router.ts`
2. ✅ Intégration dans bot/router.ts
3. ✅ Tests router (21 tests)

### Phase 4 : Slash Command (1h) ✅
1. ✅ `src/bot/commands/setup.ts`
2. ✅ Intégration dans bot/router.ts
3. ✅ Tests intégration (inclus dans handler tests)

### Phase 5 : Formatters (2h) ✅
1. ✅ Base embeds (12 tests)
2. ✅ Setup embeds (inclus dans handler tests)
3. ✅ Game embeds (17 tests)

### Phase 6 : Daily Ladder (2h) ✅
1. ✅ `src/services/daily-ladder.ts` avec node-schedule
2. ✅ Cron job 19h00 Europe/Paris (timezone hardcodée)
3. ✅ Tests daily ladder (13 tests)
4. ✅ Intégration dans bot/index.ts (startup/shutdown)

### Phase 7 : Router Verification (1h) ✅
1. ✅ Vérification complète du router
2. ✅ Connexion de tous les handlers (18/18)
3. ✅ Documentation (FEATURES_CHECKLIST.md, ROUTER_VERIFICATION_REPORT.md)

**Total réalisé** : 14 heures
**Total tests** : 104 tests (setup + router + ladder + formatters)
**Tests globaux** : 505 tests passing (99% du projet)

---

## 📊 Exemple Complet

### Setup Initial

```bash
# Admin dans Discord
/setup channels general:#duoq-challenge-general tracker:#duoq-challenge-tracker
# ✅ Channels configurés

/setup event start:2025-11-05T00:00:00Z end:2025-11-10T23:59:59Z
# ✅ Événement configuré - 5 jours
# ✅ Daily ladder à 19h00 Europe/Paris

/setup status
# ⚙️ Configuration complète affichée
```

### Pendant le Challenge

**#duoq-challenge-general** :
```
[User]: /register Risotto#CR7 MID Yasuo G2
[Bot]: ✅ Inscrit - 0 pts - Aucun duo

[User]: /link @Partner
[Bot]: ✅ Duo créé : Bronze Bandits (Noob: Risotto, Carry: Partner)

[User]: /ladder
[Bot]: 🏆 Classement [embed]
```

**#duoq-challenge-tracker** :
```
[Bot - 14:32]: 🎮 Game en cours - Bronze Bandits
[Bot - 14:55]: 🏁 Bronze Bandits - Victoire +94 pts [embed détaillé]
[Bot - 19:00]: 📊 Classement Quotidien [ladder complet - tous les duos]
                Posté automatiquement par DailyLadderService
```

---

## ✅ Checklist Avant Production

### Configuration
- [ ] Créer `#duoq-challenge-general`
- [ ] Créer `#duoq-challenge-tracker`
- [ ] Configurer permissions bot sur les 2 channels
- [ ] Désactiver `SEND_MESSAGES` pour users sur `#tracker`
- [ ] Ajouter MODERATOR_IDS dans .env

### Setup
- [ ] `/setup channels ...` (config channels)
- [ ] `/setup event ...` (config dates - timezone Europe/Paris automatique)
- [ ] `/setup status` (vérifier config)
- [ ] Tester message dans chaque channel

### Tests
- [ ] Message interaction → `#general`
- [ ] Message notification → `#tracker`
- [ ] Permissions `/setup` (admin only)
- [ ] Reset fonctionne (avec backup DB!)
- [ ] Daily ladder poste à 19h00 Europe/Paris
- [ ] Déployer slash commands Discord (`npm run deploy`)

### Production
- [ ] Déployer le bot sur serveur
- [ ] Vérifier cron job daily ladder (19h00)
- [ ] Monitoring logs
- [ ] Backup DB quotidien

---

**Maintenu par** : DuoQ Tracker Team
**Date** : 2025-11-01
**Status** : ✅ Implemented (505 tests passing - 99% complete)
