# Checklist des Fonctionnalités - DUOQ Tracker Bot

Ce fichier liste **TOUTES** les fonctionnalités testées dans le projet, et vérifie qu'elles sont correctement implémentées et connectées au router.

---

## 📋 Légende

- ✅ **Implémenté et connecté** - La fonctionnalité est complètement opérationnelle
- ⚠️ **Implémenté mais non connecté** - Le handler existe mais n'est pas wired au router
- ❌ **Non implémenté** - Pas de handler ou implémentation manquante
- 🔍 **À vérifier** - Nécessite une vérification approfondie

---

## 1️⃣ Authentification (Auth)

### `/register` - Inscription d'un joueur
**Test file**: `src/tests/handlers/auth/register.test.ts`

**Fonctionnalités testées**:
- ✅ Enregistrer un joueur avec Riot ID, rôle principal, champion principal, peak elo
- ✅ Parser le Riot ID (format `GameName#TagLine`)
- ✅ Gérer tous les rôles: TOP, JUNGLE, MID, ADC, SUPPORT
- ✅ Gérer tous les ranks: I4, B3, S2, G1, P4, E3, D2, M, GM, C
- ✅ Initialiser les stats à zéro (points, games, wins, losses, streaks)
- ✅ Définir `registeredAt` timestamp
- ✅ Gérer les espaces dans le Riot ID
- ✅ Normaliser les entrées (uppercase, trim)
- ✅ Rejeter si déjà inscrit
- ✅ Rejeter si champs manquants (riotId, mainRole, mainChampion, peakElo)
- ✅ Rejeter format invalide de Riot ID (pas de #)
- ✅ Rejeter rôle invalide
- ✅ Rejeter champs vides (gameName, tagLine, champion, elo)
- ✅ Gérer Riot ID avec multiples `#` (rejeter)
- ✅ Valider avec Riot API et récupérer PUUID

**Status**: 🔍 **À VÉRIFIER**

---

### `/link` - Créer un duo
**Test file**: `src/tests/handlers/auth/link.test.ts`

**Fonctionnalités testées**:
- ✅ Créer un duo entre deux joueurs inscrits
- ✅ Déterminer automatiquement noob/carry selon peakElo
- ✅ Si même rank, utiliser LP pour départager
- ✅ Générer nom de duo par défaut si non fourni
- ✅ Mettre à jour `duoId` des deux joueurs
- ✅ Rejeter si sender non inscrit
- ✅ Rejeter si partner non inscrit
- ✅ Rejeter si sender déjà en duo
- ✅ Rejeter si partner déjà en duo
- ✅ Rejeter si tentative de link avec soi-même
- ✅ Rejeter si partnerId manquant

**Status**: 🔍 **À VÉRIFIER**

---

### `/unregister` - Désinscription
**Test file**: `src/tests/handlers/auth/unregister.test.ts`

**Fonctionnalités testées**:
- ✅ Supprimer un joueur seul (pas en duo)
- ✅ Dissoudre le duo si joueur en duo
- ✅ Libérer le partenaire (remettre duoId à 0)
- ✅ Notifier le partenaire
- ✅ Rejeter si joueur non inscrit

**Status**: 🔍 **À VÉRIFIER**

---

## 2️⃣ Gestion des Games

### `/poll` - Polling des games
**Test file**: `src/tests/handlers/game/poll.test.ts`

**Fonctionnalités testées**:
- ✅ Détecter un nouveau match duo dans l'historique
- ✅ Ne pas re-scorer un match déjà traité
- ✅ Ignorer les joueurs sans duo
- ✅ Traiter plusieurs duos en parallèle
- ✅ Gérer l'absence de duos gracieusement
- ✅ Gérer une erreur API Riot gracieusement

**Status**: ✅ **IMPLÉMENTÉ ET CONNECTÉ** (vient d'être connecté)

---

### `/end` - Fin de game
**Test file**: `src/tests/handlers/game/end.test.ts`

**Fonctionnalités testées**:
- ✅ Scorer une victoire et mettre à jour les stats
- ✅ Scorer une défaite et mettre à jour les stats
- ✅ Incrémenter le winStreak sur victoires consécutives
- ✅ Gérer une promotion de rank
- ✅ Calculer et appliquer les points (scoring engine)
- ✅ Mettre à jour player stats (points, wins, losses, currentRank)
- ✅ Mettre à jour duo stats (points, wins, losses)
- ✅ Rejeter si gameData manquant
- ✅ Rejeter si joueurs ne forment pas un duo
- ✅ Ignorer joueurs non inscrits
- ✅ Ignorer si deux joueurs sont dans des équipes différentes (soloQ)

**Status**: 🔍 **À VÉRIFIER**

---

## 3️⃣ Statistiques (Stats)

### `/ladder` - Classement des duos
**Test file**: `src/tests/handlers/stats/ladder.test.ts`

**Fonctionnalités testées**:
- ✅ Afficher le classement avec plusieurs duos
- ✅ Trier par totalPoints (décroissant)
- ✅ Afficher médailles (🥇 🥈 🥉) pour le top 3
- ✅ Afficher score et W/L ratio
- ✅ Afficher noms des joueurs (format: `Noob 👥 Carry`)
- ✅ Afficher "Aucun duo" si vide
- ✅ Gérer un seul duo
- ✅ Paginer l'historique (10 duos par page)
- ✅ Afficher footer avec pagination (`Page X/Y - N duos`)
- ✅ Gérer duos avec 0 points
- ✅ Gérer duos avec points négatifs

**Status**: 🔍 **À VÉRIFIER**

---

### `/profile` - Profil joueur
**Test file**: `src/tests/handlers/stats/profile.test.ts`

**Fonctionnalités testées**:
- ✅ Afficher profil complet d'un joueur avec duo
- ✅ Afficher stats: points, W/L, rank actuel
- ✅ Afficher informations du duo (nom, partenaire)
- ✅ Afficher profil d'un joueur sans duo
- ✅ Afficher profil d'un autre joueur via mention
- ✅ Calculer le winrate correctement
- ✅ Afficher progression de rank (initial → current)
- ✅ Afficher winstreak actuelle
- ✅ Rejeter si joueur non inscrit
- ✅ Rejeter si joueur mentionné n'existe pas
- ✅ Gérer joueur avec 0 games
- ✅ Gérer points négatifs
- ✅ Gérer winstreak de 0

**Status**: 🔍 **À VÉRIFIER**

---

### `/history` - Historique des games
**Test file**: `src/tests/handlers/stats/history.test.ts`

**Fonctionnalités testées**:
- ✅ Afficher historique complet d'un duo avec plusieurs games
- ✅ Afficher victoires (🏆) et défaites (💀)
- ✅ Afficher KDA de chaque game
- ✅ Afficher points gagnés/perdus par game
- ✅ Trier par date (plus récent en premier)
- ✅ Afficher "Aucune game" si duo sans games
- ✅ Paginer l'historique (10 games par page)
- ✅ Afficher footer avec pagination
- ✅ Afficher historique d'un autre duo via mention
- ✅ Rejeter si joueur non inscrit
- ✅ Rejeter si joueur mentionné n'existe pas
- ✅ Gérer duo qui vient d'être créé (0 games)

**Status**: 🔍 **À VÉRIFIER**

---

## 4️⃣ Administration (Admin)

### `/setup channels` - Configuration des channels
**Test file**: `src/tests/handlers/admin/setup-channels.handler.test.ts`

**Fonctionnalités testées**:
- ✅ Configurer general channel + tracker channel
- ✅ Envoyer messages de test dans les deux channels
- ✅ Rejeter si channels identiques
- ✅ Rejeter si generalChannelId vide
- ✅ Rejeter si trackerChannelId vide
- ✅ Rejeter si les deux channels manquent
- ✅ Override configuration précédente

**Status**: 🔍 **À VÉRIFIER**

---

### `/setup event` - Configuration de l'événement
**Test file**: `src/tests/handlers/admin/setup-event.handler.test.ts`

**Fonctionnalités testées**:
- ✅ Configurer dates de début et fin
- ✅ Accepter timezone custom (default: Europe/Paris)
- ✅ Calculer durée de l'événement (jours + heures)
- ✅ Afficher forme singulier/pluriel (1 jour vs 2 jours)
- ✅ Rejeter si startDate manquant
- ✅ Rejeter si endDate manquant
- ✅ Rejeter format de date invalide
- ✅ Rejeter si start date > end date
- ✅ Rejeter si start date = end date
- ✅ Warning si end date dans le passé
- ✅ Override configuration précédente

**Status**: 🔍 **À VÉRIFIER**

---

### `/setup status` - Afficher la configuration
**Test file**: `src/tests/handlers/admin/setup-status.handler.test.ts`

**Fonctionnalités testées**:
- ✅ Afficher configuration complète
- ✅ Afficher channels (general + tracker)
- ✅ Afficher event (dates + timezone)
- ✅ Afficher si config incomplète
- ✅ Afficher statut "Actif" (🟢) si événement en cours
- ✅ Afficher statut "Pas encore commencé" (⏳) si événement futur
- ✅ Afficher stats (players, duos, games)

**Status**: 🔍 **À VÉRIFIER**

---

### `/setup reset` - Réinitialiser les données
**Test file**: `src/tests/handlers/admin/setup-reset.handler.test.ts`

**Fonctionnalités testées**:
- ✅ Rejeter sans confirmation
- ✅ Rejeter avec confirm:false
- ✅ Réinitialiser toutes les données avec confirm:true
- ✅ Vider players, duos, games, devs Maps
- ✅ Afficher counts avant reset
- ✅ Conserver channels après reset
- ✅ Conserver event dates après reset
- ✅ Conserver API key après reset
- ✅ Gérer état vide gracieusement

**Status**: 🔍 **À VÉRIFIER**

---

### `/test` - Tests d'intégration
**Test file**: `src/tests/handlers/admin/test-integration.handler.test.ts`

**Fonctionnalités testées**:
- ✅ Générer 21 test responses (10 tests × 2 + 1 summary)
- ✅ Inclure tous les embed types
- ✅ Envoyer toutes les réponses au source
- ✅ Inclure summary finale
- ✅ Formatter tous les embeds en JSON valide

**Status**: 🔍 **À VÉRIFIER**

---

## 5️⃣ Développement (Dev)

### `/dev add` - Ajouter un développeur
**Test file**: `src/tests/handlers/dev/dev.test.ts`

**Fonctionnalités testées**:
- ✅ Enregistrer un nouveau dev
- ✅ Afficher message si dev déjà enregistré
- ✅ Lister commandes disponibles
- ✅ Mentionner rappels de clé API
- ✅ Enregistrer plusieurs devs différents
- ✅ Gérer username vide (default: "Inconnu")
- ✅ Gérer username avec espaces (trim)
- ✅ Mettre à jour timestamp si déjà enregistré
- ✅ Gérer changement de username

**Status**: 🔍 **À VÉRIFIER**

---

### `/dev remove` - Retirer un développeur
**Status**: 🔍 **À VÉRIFIER**

---

### `/dev list` - Lister les développeurs
**Status**: 🔍 **À VÉRIFIER**

---

### `/dev status` - Statut du bot
**Status**: ✅ **IMPLÉMENTÉ ET CONNECTÉ**

---

### `/dev reset` - Réinitialiser les données
**Status**: ✅ **IMPLÉMENTÉ ET CONNECTÉ**

---

### `/key set` - Définir la clé API Riot
**Test file**: `src/tests/handlers/dev/key.test.ts`

**Fonctionnalités testées**:
- ✅ Mettre à jour la clé API Riot
- ✅ Réinitialiser les rappels lors du changement de clé
- ✅ Afficher message de rappel des expirations (22h, 23h, 23h30, 24h)
- ✅ Accepter clés avec format RGAPI-
- ✅ Rejeter si aucune clé fournie
- ✅ Rejeter si clé ne commence pas par RGAPI-
- ✅ Rejeter si clé trop courte
- ✅ Ignorer champs supplémentaires
- ✅ Gérer clé avec espaces (trim)
- ✅ Warning si même clé re-soumise

**Status**: ✅ **IMPLÉMENTÉ ET CONNECTÉ**

---

### `/key show` - Afficher la clé API
**Status**: ✅ **IMPLÉMENTÉ ET CONNECTÉ**

---

## 🔧 Services

### ConfigService
**Test file**: `src/tests/services/config/config.service.test.ts`

**Fonctionnalités testées**:
- ✅ Méthode `get(key)` async
- ✅ Méthode `set(key, value)` async
- ✅ Méthode `getSync(key)` sync
- ✅ Méthode `setSync(key, value)` sync
- ✅ Stocker dans Map en mémoire

**Status**: ✅ **IMPLÉMENTÉ**

---

### RiotApiService
**Test file**: `src/tests/services/riot/integration.test.ts`

**Fonctionnalités testées**:
- ✅ `getAccountByRiotId(gameName, tagLine)` - Récupérer compte Riot
- ✅ Gérer Config | ConfigService
- ✅ Throw error si clé API non configurée

**Status**: ✅ **IMPLÉMENTÉ**

---

### ScoringEngine
**Test files**: `src/tests/services/scoring/*.test.ts`

**Fonctionnalités testées**:
- ✅ Calculer points pour victoire
- ✅ Calculer points pour défaite
- ✅ Bonus KDA
- ✅ Bonus rank change (promotion)
- ✅ Bonus streaks
- ✅ Multiplicateur de risk (rank gap)
- ✅ Caps (max/min points)

**Status**: ✅ **IMPLÉMENTÉ**

---

## ✅ RÉSUMÉ GLOBAL

### Commandes Discord

| Commande | Handler Existe | Wired au Router | Tests Passent | Statut Final |
|----------|---------------|-----------------|---------------|-------------|
| `/register` | ✅ | 🔍 | ✅ | 🔍 À VÉRIFIER |
| `/link` | ✅ | 🔍 | ✅ | 🔍 À VÉRIFIER |
| `/unregister` | ✅ | 🔍 | ✅ | 🔍 À VÉRIFIER |
| `/poll` | ✅ | ✅ | ✅ | ✅ CONNECTÉ |
| `/end` | ✅ | 🔍 | ✅ | 🔍 À VÉRIFIER |
| `/ladder` | ✅ | 🔍 | ✅ | 🔍 À VÉRIFIER |
| `/profile` | ✅ | 🔍 | ✅ | 🔍 À VÉRIFIER |
| `/history` | ✅ | 🔍 | ✅ | 🔍 À VÉRIFIER |
| `/setup channels` | ✅ | 🔍 | ✅ | 🔍 À VÉRIFIER |
| `/setup event` | ✅ | 🔍 | ✅ | 🔍 À VÉRIFIER |
| `/setup status` | ✅ | 🔍 | ✅ | 🔍 À VÉRIFIER |
| `/setup reset` | ✅ | 🔍 | ✅ | 🔍 À VÉRIFIER |
| `/test` | ✅ | 🔍 | ✅ | 🔍 À VÉRIFIER |
| `/dev add` | ✅ | 🔍 | ✅ | 🔍 À VÉRIFIER |
| `/dev remove` | ✅ | 🔍 | ✅ | 🔍 À VÉRIFIER |
| `/dev list` | ✅ | 🔍 | ✅ | 🔍 À VÉRIFIER |
| `/dev status` | ✅ | ✅ | ✅ | ✅ CONNECTÉ |
| `/dev reset` | ✅ | ✅ | ✅ | ✅ CONNECTÉ |
| `/key set` | ✅ | ✅ | ✅ | ✅ CONNECTÉ |
| `/key show` | ✅ | ✅ | ✅ | ✅ CONNECTÉ |

---

## 📝 PROCHAINES ÉTAPES

1. ✅ Créer ce fichier de checklist
2. ⏳ Vérifier chaque commande dans le router.ts
3. ⏳ Vérifier les imports des handlers
4. ⏳ Vérifier les routing cases (switch MessageType)
5. ⏳ Vérifier les interaction mappings (Discord command → MessageType)
6. ⏳ Identifier les handlers manquants ou non connectés
7. ⏳ Connecter les handlers manquants
8. ⏳ Mettre à jour cette checklist avec le statut final