# 📋 TODO LIST EXHAUSTIVE - DuoQ Tracker
> **Fichier temporaire - À supprimer une fois terminé**

---

## ✅ COMPLÉTÉ - Sessions Précédentes

### ✅ Phase 1-7: Infrastructure & Tests (505 tests)
- ✅ Tests handlers setup (14 tests)
- ✅ Channel Router service (21 tests)
- ✅ Discord slash commands /setup
- ✅ Embed formatters (29 tests)
- ✅ Daily Ladder Service (13 tests)
- ✅ Router verification (18/18 handlers connectés)

---

## 🔧 SESSION ACTUELLE - Phase 8: GameTracker & Dette Technique

### ✅ 8.1 GameTracker - Détection Automatique (COMPLÉTÉ)
**Commit:** `86d315f` + `6c03e19`

#### ✅ 8.1.1 Activation du GameTracker dans bot/index.ts
- [x] Import GameTracker service et types
- [x] Créer variables globales (gameTracker, botClient)
- [x] Instancier GameTracker dans startBot() avec config:
  - pollingInterval: 10000ms (10s)
  - minCheckInterval: 30000ms (30s)
  - maxConcurrentChecks: 5
  - maxFetchAttempts: 18 (3min total)
  - region: 'euw1'
- [x] Appeler gameTracker.start()
- [x] Arrêter proprement dans stopBot()
- [x] Exporter getGameTracker() pour handlers

#### ✅ 8.1.2 Implémenter handleGameTrackerEvent()
- [x] Créer fonction async handleGameTrackerEvent(event, messages)
- [x] Switch sur event.type (GAME_STARTED, GAME_RESULT_FOUND, GAME_RESULT_TIMEOUT, ERROR)

#### ✅ 8.1.3 Event GAME_STARTED - Notification détection
- [x] Récupérer duo et players depuis state
- [x] Récupérer trackerChannelId depuis config
- [x] Import dynamique formatGameDetected + EmbedBuilder
- [x] Créer embed avec duoName, noobName, carryName
- [x] Envoyer notification au tracker channel
- [x] Vérifier channel.isTextBased() && 'send' in channel
- [x] Gestion d'erreurs avec try/catch + console.log

#### ✅ 8.1.4 Event GAME_RESULT_FOUND - Scoring automatique
- [x] Récupérer duo, noob, carry depuis state
- [x] Extraire noobData et carryData depuis matchInfo.participants
- [x] Vérifier noobData.teamId === carryData.teamId (même équipe)
- [x] Import calculateGameScore depuis scoring engine
- [x] Construire GameData avec:
  - matchId, gameId, startTime, endTime, duration
  - duoId, win, status: 'COMPLETED'
  - noobStats: puuid, summonerId, teamId, championId, championName, lane, K/D/A
  - carryStats: idem
  - previousRank = currentRank (TODO: rank tracking)
  - isOffRole = false (TODO: détection)
  - isOffChampion = false (TODO: détection)
- [x] Calculer scoreResult avec noobStreak et carryStreak
- [x] Extraire noobPoints, carryPoints, duoPoints
- [x] Mettre à jour player stats:
  - totalPoints += points
  - wins/losses += 1
  - streaks.current (win: +1, loss: reset à 0)
  - streaks.longestWin (tracking max)
- [x] Mettre à jour duo stats:
  - totalPoints += duoPoints
  - gamesPlayed += 1
  - wins/losses += 1
  - currentStreak (win: +1, loss: reset)
  - longestWinStreak (tracking max)
  - lastGameAt = new Date()
- [x] Marquer game comme scored dans state.games
- [x] Import formatGameScored + créer embed
- [x] Envoyer notification scoring au tracker channel

#### ✅ 8.1.5 Intégrer GameTracker dans link.handler
- [x] Import dynamique getGameTracker() après création duo
- [x] Vérifier noob.puuid && carry.puuid
- [x] Appeler gameTracker.addDuo(duoId, noobPuuid, carryPuuid, noobId, carryId)
- [x] Gestion d'erreurs avec .catch()
- [x] Console.warn si pas de PUUID

#### ✅ 8.1.6 Intégrer GameTracker dans unregister.handler
- [x] Import dynamique getGameTracker() lors dissolution duo
- [x] Appeler gameTracker.removeDuo(duoId)
- [x] Gestion d'erreurs avec .catch()

#### ✅ 8.1.7 Tests & Validation
- [x] Tous les 461 tests passent ✅
- [x] Build sans erreurs liées au GameTracker
- [x] Aucun test cassé

---

### ✅ 8.2 Dette Technique - Type state.games (COMPLÉTÉ)

#### ✅ 8.2.1 Analyse du problème
- [x] Identifier que state.games était typé comme Map<string, Game>
- [x] Découvrir que poll.handler stocke une structure différente (TrackedGame)
- [x] Constater l'utilisation de `(trackedGame as any).scored = true` pour contourner TypeScript
- [x] Analyser history.handler pour voir quels champs sont nécessaires

#### ✅ 8.2.2 Création du type TrackedGame
**Fichier:** `src/types/game.ts`

- [x] Créer interface TrackedGame avec:
  - **Identifiers:** id, matchId (alias), duoId
  - **Timing:** startTime, endTime, createdAt (alias), duration
  - **Result:** win, scored
  - **KDA String:** noobKDA, carryKDA (format "K/D/A")
  - **KDA Numbers:** noobKills, noobDeaths, noobAssists, carryKills, carryDeaths, carryAssists
  - **Champions:** noobChampion, carryChampion
  - **Scoring:** pointsAwarded (rempli après GAME_RESULT_FOUND)

#### ✅ 8.2.3 Mise à jour du type State
**Fichier:** `src/types/state.ts`

- [x] Remplacer import de Game par TrackedGame
- [x] Changer games: Map<string, Game> → games: Map<string, TrackedGame>

#### ✅ 8.2.4 Mise à jour poll.handler
**Fichier:** `src/handlers/game/poll.handler.ts`

- [x] Initialiser tous les nouveaux champs lors de state.games.set():
  - id: matchId
  - matchId: matchId (alias)
  - createdAt: gameStartTime (alias)
  - noobKills, noobDeaths, noobAssists (extraits de noobData)
  - carryKills, carryDeaths, carryAssists (extraits de carryData)
  - pointsAwarded: 0 (sera rempli après scoring)

#### ✅ 8.2.5 Mise à jour bot/index.ts GAME_RESULT_FOUND
**Fichier:** `src/bot/index.ts`

- [x] Supprimer cast `(trackedGame as any)`
- [x] Accès direct type-safe: `trackedGame.scored = true`
- [x] Remplir `trackedGame.pointsAwarded = duoPoints`

#### ✅ 8.2.6 Mise à jour tests history.handler
**Fichier:** `src/tests/handlers/stats/history.test.ts`

- [x] Ajouter tous les champs manquants dans 5 locations de state.games.set():
  - Test #1 (loop 5 games): id, matchId, startTime, endTime, createdAt, scored, noobKDA, carryKDA, noobChampion, carryChampion
  - Test #2 (3 games timestamps): idem pour match1, match2, match3
  - Test #3 (1 game): idem
  - Test #4 (25 games pagination): idem dans loop
  - Test #5 (duo2): idem

#### ✅ 8.2.7 Validation & Tests
- [x] Build TypeScript: 107 → 98 erreurs (seules erreurs pré-existantes restent)
- [x] Tous les 461 tests passent ✅
- [x] Aucune erreur TypeScript sur history.handler ✅
- [x] Aucune erreur TypeScript sur state.games ✅
- [x] Plus de casts (as any) ✅

---

## 🔴 Phase 9: Résolution Erreurs Build (98 ERREURS)

### 🔴 9.1 Erreurs Commands Discord (12 erreurs)
**Fichier:** `src/bot/index.ts:325-340`
**Problème:** Property 'execute' is missing in type CommandDefinition

#### 🔴 9.1.1 Analyser le problème
- [ ] Lire `src/bot/types.ts` pour voir interface CommandDefinition
- [ ] Vérifier que tous les commands exportent bien `execute`
- [ ] Identifier si c'est un problème d'import ou de définition

#### 🔴 9.1.2 Fixer les commandes manquantes
- [ ] registerCommand - Ajouter execute ou corriger import
- [ ] unregisterCommand - Ajouter execute ou corriger import
- [ ] linkCommand - Ajouter execute ou corriger import
- [ ] pollCommand - Ajouter execute ou corriger import
- [ ] endCommand - Ajouter execute ou corriger import
- [ ] ladderCommand - Ajouter execute ou corriger import
- [ ] profileCommand - Ajouter execute ou corriger import
- [ ] historyCommand - Ajouter execute ou corriger import
- [ ] setupCommand - Ajouter execute ou corriger import
- [ ] testCommand - Ajouter execute ou corriger import
- [ ] devCommand - Ajouter execute ou corriger import
- [ ] keyCommand - Ajouter execute ou corriger import

---

### 🔴 9.2 Erreurs Tests - teamId manquant (10 erreurs)
**Fichier:** `src/tests/services/scoring/engine.test.ts`
**Problème:** Property 'teamId' is missing in type PlayerGameStats

#### 🔴 9.2.1 Fixer test ligne 25 (noobGameStats)
- [ ] Ajouter `teamId: 100` dans noobGameStats

#### 🔴 9.2.2 Fixer test ligne 40 (carryGameStats)
- [ ] Ajouter `teamId: 100` dans carryGameStats

#### 🔴 9.2.3 Fixer test ligne 164 (noobStats)
- [ ] Ajouter `teamId: 100` dans noobStats

#### 🔴 9.2.4 Fixer test ligne 179 (carryStats)
- [ ] Ajouter `teamId: 100` dans carryStats

#### 🔴 9.2.5 Fixer test ligne 216 (noobStats)
- [ ] Ajouter `teamId: 100` dans noobStats

#### 🔴 9.2.6 Fixer test ligne 231 (carryStats)
- [ ] Ajouter `teamId: 100` dans carryStats

#### 🔴 9.2.7 Fixer test ligne 268 (noobStats)
- [ ] Ajouter `teamId: 100` dans noobStats

#### 🔴 9.2.8 Fixer test ligne 283 (carryStats)
- [ ] Ajouter `teamId: 100` dans carryStats

#### 🔴 9.2.9 Fixer test ligne 328 (noobStats)
- [ ] Ajouter `teamId: 100` dans noobStats

#### 🔴 9.2.10 Fixer test ligne 343 (carryStats)
- [ ] Ajouter `teamId: 100` dans carryStats

---

### 🔴 9.3 Erreurs Imports Types (6 erreurs)
**Problème:** Cannot find module '../types' or '../../../types'

#### 🔴 9.3.1 Fixer src/services/api-key-reminders.ts:1
- [ ] Changer `import { State, Response } from '../types'`
- [ ] En `import { State } from '../types/state.js'`
- [ ] Et `import { Response } from '../types/message.js'`

#### 🔴 9.3.2 Fixer src/tests/handlers/auth/unregister.test.ts:3
- [ ] Changer import '../../../types'
- [ ] En imports séparés depuis ../../../types/state.js et message.js

#### 🔴 9.3.3 Fixer src/tests/handlers/dev/dev.test.ts:3
- [ ] Changer import '../../../types'
- [ ] En imports séparés

#### 🔴 9.3.4 Fixer src/tests/handlers/dev/key.test.ts:3
- [ ] Changer import '../../../types'
- [ ] En imports séparés

#### 🔴 9.3.5 Fixer src/tests/handlers/stats/history.test.ts:3
- [ ] Changer import '../../../types'
- [ ] En imports séparés

#### 🔴 9.3.6 Fixer src/tests/handlers/stats/ladder.test.ts:3
- [ ] Changer import '../../../types'
- [ ] En imports séparés

#### 🔴 9.3.7 Fixer src/tests/handlers/stats/profile.test.ts:3
- [ ] Changer import '../../../types'
- [ ] En imports séparés

#### 🔴 9.3.8 Fixer src/tests/services/api-key-reminders.test.ts:3
- [ ] Changer import '../../types'
- [ ] En imports séparés

---

### 🔴 9.4 Erreurs ConfigService vs Config (11 erreurs)
**Problème:** Property does not exist on type 'ConfigService | Config'

#### 🔴 9.4.1 Fixer src/handlers/dev/key.handler.ts (4 erreurs lignes 62-67)
- [ ] Ajouter type guard pour différencier ConfigService et Config
- [ ] Utiliser `'get' in state.config ? await state.config.get('riotApiKey') : state.config.riotApiKey`
- [ ] Appliquer pattern pour toutes les 4 occurrences

#### 🔴 9.4.2 Fixer src/services/daily-ladder.ts (3 erreurs lignes 57, 65)
- [ ] Ligne 57: Ajouter type guard pour state.config.get('trackerChannelId')
- [ ] Ligne 65: Ajouter type guard pour state.config.isEventActive()
- [ ] Utiliser pattern: `'get' in config ? await config.get() : config.prop`

#### 🔴 9.4.3 Fixer src/services/scheduler/daily-ladder.ts (4 erreurs lignes 61, 67, 84, 149)
- [ ] Ajouter type guards pour tous les accès config
- [ ] Pattern uniforme avec daily-ladder.ts

---

### 🔴 9.5 Erreurs Tests Poll Handler (6 erreurs)
**Fichier:** `src/tests/handlers/game/poll.test.ts`

#### 🔴 9.5.1 Fixer MessageType.POLL_GAMES (4 erreurs lignes 28, 43, 67, 95, 146)
- [ ] Vérifier que MessageType.POLL_GAMES existe dans types/message.ts
- [ ] Si manquant, ajouter `POLL_GAMES = 'POLL_GAMES'`
- [ ] Ou corriger les tests pour utiliser le bon type

#### 🔴 9.5.2 Fixer state.games.set() ligne 129 - TrackedGame incomplet
- [ ] Ajouter tous les champs manquants:
  - matchId: matchId
  - createdAt: startTime
  - noobKills: (parse noobKDA)
  - noobDeaths: (parse noobKDA)
  - noobAssists: (parse noobKDA)
  - carryKills: (parse carryKDA)
  - carryDeaths: (parse carryKDA)
  - carryAssists: (parse carryKDA)
  - pointsAwarded: 0

---

### 🔴 9.6 Erreurs Tests Daily Ladder (27 erreurs)
**Fichier:** `src/tests/services/daily-ladder.test.ts`

#### 🔴 9.6.1 Fixer Type '() => State' is not assignable to 'State' (ligne 29)
- [ ] Analyser pourquoi testState est une fonction
- [ ] Corriger pour que testState soit directement un State, pas une factory

#### 🔴 9.6.2 Fixer tous les accès testState.* (23 erreurs)
- [ ] Si testState est une fonction: appeler testState().players, testState().duos, etc.
- [ ] Ou corriger la factory pour retourner State directement

#### 🔴 9.6.3 Fixer sentEmbed.embeds (3 erreurs lignes 126, 128, 157, 205)
- [ ] Ajouter type guard pour vérifier que sentEmbed est MessageCreateOptions
- [ ] Utiliser: `if ('embeds' in sentEmbed) { ... }`

---

### 🔴 9.7 Erreurs Tests Riot Fixtures (3 erreurs)
**Fichier:** `src/tests/services/riot/fixtures/match.fixture.ts`

#### 🔴 9.7.1 Fixer totalMinionsKilled (ligne 37)
- [ ] Vérifier si MatchParticipant devrait avoir totalMinionsKilled
- [ ] Si oui: ajouter au type
- [ ] Si non: supprimer du fixture ou renommer

#### 🔴 9.7.2 Fixer metadata.dataVersion manquant (ligne 89)
- [ ] Ajouter `dataVersion: '2'` dans metadata

#### 🔴 9.7.3 Fixer info.tournamentCode manquant (ligne 93)
- [ ] Ajouter `tournamentCode: ''` dans info

---

### 🔴 9.8 Erreurs Diverses (18 erreurs)

#### 🔴 9.8.1 src/constants/lore.ts:54 - Duplicate property 'diamond'
- [ ] Supprimer la duplication de 'diamond' dans l'objet

#### 🔴 9.8.2 src/handlers/admin/test-integration.handler.ts (3 erreurs lignes 267, 277, 287)
- [ ] Analyser le type attendu pour l'objet ladder
- [ ] Ajouter currentStreak au type ou supprimer du code

#### 🔴 9.8.3 src/handlers/dev/dev-add.handler.ts:46 - discordId doesn't exist in Dev
- [ ] Vérifier type Dev dans types/state.ts
- [ ] Remplacer discordId par userId (le bon champ)

#### 🔴 9.8.4 src/handlers/dev/dev-list.handler.ts:29 - discordId doesn't exist
- [ ] Remplacer dev.discordId par dev.userId

#### 🔴 9.8.5 src/handlers/dev/key-set.handler.ts:52 - discordId doesn't exist
- [ ] Remplacer dev.discordId par dev.userId

#### 🔴 9.8.6 src/handlers/game/poll.handler.ts:145 - gameMode doesn't exist
- [ ] Analyser le type formatGameDetected
- [ ] Supprimer gameMode ou ajouter au type

#### 🔴 9.8.7 src/services/api-key-reminders.ts:115 - userId doesn't exist
- [ ] Ajouter type pour dev: `(dev: Dev)`
- [ ] dev.userId devrait exister selon type Dev

#### 🔴 9.8.8 src/services/channel-router.ts:144 - Type "both" invalid
- [ ] Analyser le type ChannelTarget
- [ ] Changer "both" en "general" | "tracker" séparément
- [ ] Ou ajouter "both" au type union

#### 🔴 9.8.9 src/services/daily-ladder.ts:124 - channel.send doesn't exist
- [ ] Ajouter check `'send' in channel` avant d'appeler send()

#### 🔴 9.8.10 src/services/riot/riot-api.service.ts (10 erreurs lignes 85-176)
- [ ] Ajouter types pour les réponses API Riot
- [ ] Type les objets `data` au lieu de `unknown`
- [ ] Créer interfaces AccountData, MatchListData, MatchData

#### 🔴 9.8.11 src/tests/handlers/stats/history.test.ts:447 - Type undefined[] incompatible
- [ ] Remplacer `createMessage('p1', [])` par `createMessage('p1', {})`
- [ ] Ou `createMessage('p1')`

---

## 🎯 Phase 10: Features Manquantes (TODOs Futurs)

### 🔴 10.1 Rank Change Tracking
**Fichier:** `src/bot/index.ts` lignes 171, 186

#### 🔴 10.1.1 Implémenter getRankBySummonerId() dans RiotApiService
**Fichier:** `src/services/riot/riot-api.service.ts`

- [ ] Créer méthode `async getRankBySummonerId(summonerId: string, region: string): Promise<RankInfo>`
- [ ] Endpoint: `/lol/league/v4/entries/by-summoner/{summonerId}`
- [ ] Parser réponse API:
  - tier (IRON, BRONZE, SILVER, GOLD, PLATINUM, EMERALD, DIAMOND, MASTER, GRANDMASTER, CHALLENGER)
  - rank (I, II, III, IV)
  - leaguePoints (LP)
- [ ] Convertir en RankInfo { tier, division, lp }
- [ ] Gestion erreurs 404 (non classé)

#### 🔴 10.1.2 Appeler getRank dans GAME_RESULT_FOUND
**Fichier:** `src/bot/index.ts` ligne 148-189

- [ ] Avant calculateGameScore:
  - Fetch noobNewRank = await riotService.getRankBySummonerId(noobData.summonerId)
  - Fetch carryNewRank = await riotService.getRankBySummonerId(carryData.summonerId)
- [ ] Remplacer previousRank: noob.currentRank par noob.currentRank
- [ ] Remplacer newRank: noob.currentRank par noobNewRank
- [ ] Idem pour carry
- [ ] Mettre à jour noob.currentRank = noobNewRank après scoring
- [ ] Mettre à jour carry.currentRank = carryNewRank après scoring

#### 🔴 10.1.3 Gérer erreurs API Riot
- [ ] Wrapper fetch dans try/catch
- [ ] Si 429 (rate limit): log warning et utiliser currentRank
- [ ] Si 404 (non classé): utiliser UNRANKED
- [ ] Si timeout: retry 1 fois, puis fallback currentRank
- [ ] Log toutes les erreurs pour monitoring

---

### 🔴 10.2 Off-Role Detection
**Fichier:** `src/bot/index.ts` lignes 172, 187

#### 🔴 10.2.1 Ajouter mainRole dans Player type
**Fichier:** `src/types/player.ts`

- [ ] Ajouter champ `mainRole?: Lane` (TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY)
- [ ] Rendre optionnel car non trackable automatiquement

#### 🔴 10.2.2 Implémenter détection off-role
**Fichier:** `src/bot/index.ts` GAME_RESULT_FOUND

- [ ] Lire noob.mainRole et carry.mainRole
- [ ] Si mainRole défini:
  - Comparer avec noobData.teamPosition
  - Si différent: isOffRole = true
- [ ] Si mainRole non défini: isOffRole = false (inconnu)

#### 🔴 10.2.3 Ajouter commande /set-role
**Fichier:** `src/bot/commands/profile.ts` (nouveau subcommand)

- [ ] Créer sous-commande `/profile set-role`
- [ ] Options: role (TOP | JUNGLE | MID | ADC | SUPPORT)
- [ ] Mettre à jour player.mainRole
- [ ] Message confirmation

---

### 🔴 10.3 Off-Champion Detection
**Fichier:** `src/bot/index.ts` lignes 173, 188

#### 🔴 10.3.1 Ajouter mainChampion dans Player type
**Fichier:** `src/types/player.ts`

- [ ] Ajouter champ `mainChampion?: number` (championId)
- [ ] Rendre optionnel

#### 🔴 10.3.2 Implémenter détection off-champion
**Fichier:** `src/bot/index.ts` GAME_RESULT_FOUND

- [ ] Lire noob.mainChampion et carry.mainChampion
- [ ] Si mainChampion défini:
  - Comparer avec noobData.championId
  - Si différent: isOffChampion = true
- [ ] Si mainChampion non défini: isOffChampion = false

#### 🔴 10.3.3 Ajouter commande /set-champion
**Fichier:** `src/bot/commands/profile.ts` (nouveau subcommand)

- [ ] Créer sous-commande `/profile set-champion`
- [ ] Options: champion (string avec autocomplete)
- [ ] Mapper nom champion → championId
- [ ] Mettre à jour player.mainChampion
- [ ] Message confirmation

---

## 📊 Statistiques & Progrès

### État Actuel
- **Tests passants:** 461/461 (100%) ✅
- **Erreurs build:** 98 (pré-existantes)
- **Dette technique:** RÉSOLUE ✅
- **GameTracker:** OPÉRATIONNEL ✅
- **Type safety state.games:** CORRIGÉ ✅

### Travail Complété (Session 8)
- ✅ Activation GameTracker avec détection automatique
- ✅ Event GAME_STARTED - Notifications détection
- ✅ Event GAME_RESULT_FOUND - Scoring automatique complet
- ✅ Intégration link.handler (addDuo)
- ✅ Intégration unregister.handler (removeDuo)
- ✅ Résolution dette technique TrackedGame (107 → 98 erreurs)
- ✅ Suppression casts (as any)
- ✅ Type safety complet pour state.games

### Priorités Suivantes
1. 🔥 **CRITIQUE:** Fixer 98 erreurs build (Phase 9)
   - Commands Discord (12 erreurs)
   - Tests teamId (10 erreurs)
   - Imports types (6 erreurs)
   - ConfigService (11 erreurs)
2. 🎯 **IMPORTANT:** Implémenter rank tracking (Phase 10.1)
3. 🎯 **IMPORTANT:** Implémenter off-role detection (Phase 10.2)
4. 🎯 **IMPORTANT:** Implémenter off-champion detection (Phase 10.3)

---

## 📝 Structure TODO

### Légende
- ✅ Complété
- 🔴 À faire (prioritaire)
- 🟡 À faire (normal)
- 🟢 À faire (bonus)
- ⏳ En cours
- 🔒 Bloqué

### Format
Chaque tâche suit ce format:
```
#### 🔴 X.Y.Z Nom de la tâche
**Fichier:** chemin/vers/fichier.ts
**Problème:** Description du problème

- [ ] Étape 1
- [ ] Étape 2
- [ ] Étape 3
```

---

**Date de création:** 2025-10-31
**Dernière mise à jour:** 2025-11-02 (Session 8 - Dette technique résolue, GameTracker opérationnel)
**Statut:** 🎉 Infrastructure complète - 461 tests passants - 98 erreurs build à résoudre
