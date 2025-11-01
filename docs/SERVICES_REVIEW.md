# Services Review - DuoQ Tracker

**Date**: 2025-10-31
**Status**: ✅ Review Complete - 382 tests passing

Documentation complète des services après revue exhaustive du projet.

---

## 📊 Vue d'ensemble

Le projet DuoQ Tracker est organisé en 3 couches de services principales:

1. **Riot API Services** (5 fichiers) - Communication avec l'API Riot Games
2. **Game Tracker Services** (5 fichiers) - Détection et suivi des parties en temps réel
3. **Scoring Engine Services** (10 fichiers) - Calcul des scores selon les spécifications

---

## 🎮 Riot API Services

### Architecture (4 couches)

```
RiotService (Facade)
    ├── AccountService → RiotClient
    └── MatchService → RiotClient
```

### 1. RiotClient ([src/services/riot/client.ts](../src/services/riot/client.ts))

**Responsabilité**: HTTP client avec retry automatique sur rate limit

**Configuration**:
```typescript
interface RiotClientConfig {
  apiKey: string       // RGAPI-xxx (required)
  timeout?: number     // Default: 10000ms
  maxRetries?: number  // Default: 3
}
```

**Features clés**:
- ✅ Retry automatique sur 429 (rate limit)
- ✅ Respect header `Retry-After`
- ✅ Timeout 10s par requête
- ✅ Error handling structuré (RiotApiError, RateLimitError)

**Logique retry** ([client.ts:69-95](../src/services/riot/client.ts#L69-L95)):
```typescript
private async makeRequest<T>(
  requestFn: () => Promise<AxiosResponse<T>>,
  retryCount = 0
): Promise<T> {
  try {
    const response = await requestFn()
    return response.data
  } catch (error: any) {
    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      const retryAfter = this.getRetryAfter(error.response)

      if (retryCount < this.maxRetries) {
        console.warn(
          `[RiotClient] Rate limited. Waiting ${retryAfter}s before retry ${retryCount + 1}/${this.maxRetries}`
        )
        await this.sleep(retryAfter * 1000)
        return this.makeRequest(requestFn, retryCount + 1)
      }

      throw new RateLimitError('Rate limit exceeded and max retries reached', retryAfter)
    }

    throw this.createError(error)
  }
}
```

---

### 2. AccountService ([src/services/riot/account.ts](../src/services/riot/account.ts))

**Responsabilité**: Récupération PUUID via Account-v1 API

**Endpoint utilisé**:
```
GET https://{routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}
```

**Méthode principale** ([account.ts:24-37](../src/services/riot/account.ts#L24-L37)):
```typescript
async getAccountByRiotId(
  gameName: string,    // "Risotto"
  tagLine: string,     // "CR7"
  region: RiotRegion = 'euw1'
): Promise<RiotAccount> {
  if (!gameName || !tagLine) {
    throw new Error('gameName and tagLine are required')
  }

  const routing = REGION_TO_ROUTING[region]
  const url = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`

  return this.client.get<RiotAccount>(url)
}
```

**Regional Routing** ([types.ts:17-29](../src/services/riot/types.ts#L17-L29)):
```typescript
const REGION_TO_ROUTING: Record<RiotRegion, RiotRouting> = {
  euw1: 'europe',
  eun1: 'europe',
  na1: 'americas',
  br1: 'americas',
  jp1: 'asia',
  kr: 'asia',
  la1: 'americas',
  la2: 'americas',
  oc1: 'sea',
  ru: 'europe',
  tr1: 'europe',
}
```

---

### 3. MatchService ([src/services/riot/match.ts](../src/services/riot/match.ts))

**Responsabilité**: Historique matchs et détection matchs communs

**Endpoints utilisés**:
```
GET /lol/match/v5/matches/by-puuid/{puuid}/ids
GET /lol/match/v5/matches/{matchId}
```

**Méthode clé: findCommonMatch** ([match.ts:74-111](../src/services/riot/match.ts#L74-L111)):

```typescript
async findCommonMatch(
  puuid1: string,
  puuid2: string,
  region: RiotRegion = 'euw1',
  count: number = 5
): Promise<MatchData | null> {
  // 1. Get recent matches for both players (Solo/Duo Ranked only: queue 420)
  const [matchIds1, matchIds2] = await Promise.all([
    this.getMatchIdsByPuuid(puuid1, region, count, 420),
    this.getMatchIdsByPuuid(puuid2, region, count, 420),
  ])

  // 2. Find common match IDs
  const commonMatchIds = matchIds1.filter((id) => matchIds2.includes(id))

  if (commonMatchIds.length === 0) {
    return null
  }

  // 3. Get details of the most recent common match
  const mostRecentMatchId = commonMatchIds[0]
  const matchData = await this.getMatchById(mostRecentMatchId, region)

  // 4. Verify both players are in the same team
  const participant1 = matchData.info.participants.find((p) => p.puuid === puuid1)
  const participant2 = matchData.info.participants.find((p) => p.puuid === puuid2)

  if (!participant1 || !participant2) {
    return null
  }

  // 5. Verify same team (100 = blue, 200 = red)
  if (participant1.teamId !== participant2.teamId) {
    return null // They played in different teams (soloQ)
  }

  return matchData
}
```

**Logique critique**:
- ✅ Filtre uniquement queue 420 (Solo/Duo Ranked)
- ✅ Vérifie que les deux joueurs sont dans la **même équipe** (teamId)
- ✅ Retourne null si soloQ (équipes différentes)

**Méthodes utilitaires**:
```typescript
isMatchRecent(matchData: MatchData): boolean  // < 4 hours
isRemake(matchData: MatchData): boolean       // < 5 minutes
```

---

### 4. RiotService ([src/services/riot/index.ts](../src/services/riot/index.ts))

**Responsabilité**: Facade unifiant tous les services

**Usage pattern**:
```typescript
const riot = new RiotService({ apiKey: 'RGAPI-xxx' })

// Account API
const account = await riot.getAccountByRiotId('Faker', 'KR1')

// Match API
const matchIds = await riot.getMatchIds(puuid, 'euw1', 20, 420)
const match = await riot.getMatch(matchId)
const commonMatch = await riot.findCommonMatch(puuid1, puuid2)

// Utilities
const isRecent = riot.isMatchRecent(matchData)
const isRemake = riot.isRemake(matchData)
```

---

### 5. Types ([src/services/riot/types.ts](../src/services/riot/types.ts))

**Types clés**:

```typescript
interface RiotAccount {
  puuid: string        // Universal player ID
  gameName: string
  tagLine: string
}

interface MatchData {
  metadata: {
    matchId: string           // "EUW1_7587643785"
    participants: string[]    // PUUIDs
  }
  info: {
    gameDuration: number      // Seconds
    gameEndTimestamp: number  // Unix epoch milliseconds
    queueId: number           // 420 = Solo/Duo
    participants: MatchParticipant[]
    teams: MatchTeam[]
  }
}

interface MatchParticipant {
  puuid: string
  teamId: number        // 100 (blue) or 200 (red)
  championName: string
  kills: number
  deaths: number
  assists: number
  win: boolean
  // ... (50+ fields au total)
}
```

---

## 🎯 Game Tracker Services

### Architecture (3 composants)

```
GameTracker (Orchestrateur)
    ├── GameDetector (Détection)
    │   └── RiotService
    └── GameTrackerStateManager (État)
```

### 1. GameTracker ([src/services/game-tracker/tracker.ts](../src/services/game-tracker/tracker.ts))

**Responsabilité**: Polling loop avec state machine

**Configuration par défaut** ([tracker.ts:20-26](../src/services/game-tracker/tracker.ts#L20-L26)):
```typescript
const DEFAULT_CONFIG: GameTrackerConfig = {
  pollingInterval: 10000,      // Poll every 10 seconds
  minCheckInterval: 30000,     // Min 30s between checks for same duo
  maxConcurrentChecks: 5,      // Max 5 concurrent API requests
  maxFetchAttempts: 18,        // 18 * 10s = 3 minutes timeout
  region: 'euw1',
}
```

**State Machine**:
```
idle
  ↓ (game detected)
in_game
  ↓ (game ended)
game_ended / fetching_result
  ↓ (result found OR timeout)
idle
```

**Polling Loop** ([tracker.ts:85-107](../src/services/game-tracker/tracker.ts#L85-L107)):
```typescript
private async poll(): Promise<void> {
  if (!this.isRunning) return

  try {
    // 1. Get duos ready for checking (> 30s since last check)
    const duosToCheck = this.stateManager.getDuosToCheck()

    // 2. Limit concurrent checks to maxConcurrentChecks (5)
    const duosToProcess = duosToCheck.slice(0, maxConcurrentChecks)

    // 3. Process all duos in parallel
    await Promise.all(duosToProcess.map(t => this.processDuo(t)))
  } catch (error) {
    console.error('[GameTracker] Poll error:', error)
  }

  // 4. Schedule next poll
  this.currentTimeoutId = setTimeout(() => this.poll(), pollingInterval)
}
```

**Process Duo** ([tracker.ts:113-135](../src/services/game-tracker/tracker.ts#L113-L135)):
```typescript
private async processDuo(tracking: DuoTracking): Promise<void> {
  try {
    switch (tracking.state) {
      case 'idle':
        await this.checkForGameStart(tracking)
        break
      case 'in_game':
        await this.checkForGameEnd(tracking)
        break
      case 'game_ended':
      case 'fetching_result':
        await this.fetchGameResult(tracking)
        break
    }

    this.stateManager.updateLastChecked(tracking.duoId)
  } catch (error) {
    this.emit({ type: 'ERROR', duoId: tracking.duoId, error })
  }
}
```

---

### 2. GameDetector ([src/services/game-tracker/detector.ts](../src/services/game-tracker/detector.ts))

**Responsabilité**: Détection game start/end/completion

**Méthode: isInGame** ([detector.ts:22-62](../src/services/game-tracker/detector.ts#L22-L62)):
```typescript
async isInGame(tracking: DuoTracking): Promise<string | null> {
  // 1. Get most recent match ID for both players
  const [matchIds1, matchIds2] = await Promise.all([
    this.riotService.getMatchIds(noobPuuid, region, 1, 420),
    this.riotService.getMatchIds(carryPuuid, region, 1, 420),
  ])

  // 2. Check if both players have same most recent match
  if (matchIds1[0] !== matchIds2[0]) return null

  // 3. Fetch match details
  const matchData = await this.riotService.getMatch(matchIds1[0], region)

  // 4. Check if match has already ended (recent = ended)
  if (this.riotService.isMatchRecent(matchData)) {
    return null // Already ended, not in-game
  }

  // 5. Game is ongoing
  return matchIds1[0]
}
```

**Méthode: findCompletedMatch** ([detector.ts:88-122](../src/services/game-tracker/detector.ts#L88-L122)):
```typescript
async findCompletedMatch(tracking: DuoTracking): Promise<MatchData | null> {
  // 1. Find common match on same team
  const matchData = await this.riotService.findCommonMatch(
    noobPuuid,
    carryPuuid,
    region,
    5 // Check last 5 games
  )

  if (!matchData) return null

  // 2. Verify match is recent (< 4 hours)
  if (!this.riotService.isMatchRecent(matchData)) {
    return null
  }

  // 3. Verify match is not a remake (< 5 minutes)
  if (this.riotService.isRemake(matchData)) {
    return null
  }

  return matchData
}
```

**Validation Chain**:
1. ✅ Both players in match
2. ✅ Same team (teamId)
3. ✅ Recent (< 4 hours)
4. ✅ Not remake (> 5 minutes)

---

### 3. GameTrackerStateManager ([src/services/game-tracker/state-manager.ts](../src/services/game-tracker/state-manager.ts))

**Responsabilité**: Gestion état en mémoire (pas de DB)

**Méthode: getDuosToCheck** ([state-manager.ts:62-77](../src/services/game-tracker/state-manager.ts#L62-L77)):
```typescript
getDuosToCheck(): DuoTracking[] {
  const now = Date.now()

  return this.getAllTrackings().filter((tracking) => {
    const timeSinceLastCheck = now - tracking.lastCheckedAt
    return timeSinceLastCheck >= this.minCheckInterval
  })
}
```

**Méthodes de transition d'état**:
```typescript
addDuo(duoId, noobPuuid, carryPuuid, ...): void
setInGame(duoId, gameId): void
setGameEnded(duoId): void
resetToIdle(duoId): void
incrementFetchAttempts(duoId): boolean  // Returns true if max reached
```

**État stocké**:
```typescript
interface DuoTracking {
  duoId: string
  state: 'idle' | 'in_game' | 'game_ended' | 'fetching_result'
  noobPuuid: string
  carryPuuid: string
  noobUserId: string
  carryUserId: string
  lastCheckedAt: number
  currentGameId?: string
  fetchAttempts: number
  maxFetchAttempts: number
}
```

---

### 4. Event System ([src/services/game-tracker/types.ts](../src/services/game-tracker/types.ts))

**Events émis**:
```typescript
type GameTrackerEvent =
  | { type: 'GAME_STARTED'; duoId: string; matchId: string }
  | { type: 'GAME_ENDED'; duoId: string; matchId: string }
  | { type: 'GAME_RESULT_FOUND'; duoId: string; matchData: MatchData }
  | { type: 'GAME_RESULT_TIMEOUT'; duoId: string; matchId: string }
  | { type: 'ERROR'; duoId: string; error: Error }
```

**Usage pattern**:
```typescript
const tracker = new GameTracker(riotService, config, (event) => {
  switch (event.type) {
    case 'GAME_STARTED':
      console.log(`🎮 Game started: ${event.matchId}`)
      break
    case 'GAME_RESULT_FOUND':
      // Calculate score, update DB
      break
    case 'GAME_RESULT_TIMEOUT':
      console.log(`⏱️ Timeout fetching result`)
      break
  }
})

tracker.start()
tracker.addDuo('duo-123', 'noob-puuid', 'carry-puuid', ...)
```

---

## 🧮 Scoring Engine Services

### Architecture (10 modules orchestrés)

```
ScoringEngine
    ├── KDA (base + roleAdjustment)
    ├── GameResult (win/loss/FF/quick win)
    ├── Streaks (win/lose streaks)
    ├── RankChange (bonus/malus montée/descente)
    ├── RankMultiplier (équilibrage duos)
    ├── RankUtils (conversion ranks)
    ├── Risk (prise de risque)
    ├── Bonuses (No Death)
    └── Caps (plafonds)
```

### Ordre d'Exécution Strict ([engine.ts:29-185](../src/services/scoring/engine.ts#L29-L185))

```typescript
export function calculateGameScore(input: ScoringInput): ScoreBreakdown {
  // ┌─── PHASE 1: CALCUL INDIVIDUEL - NOOB ───┐

  // 1. P_KDA
  const noobKDA = calculateKDA({ kills, deaths, assists }, 'noob')

  // 2. Résultat de game
  const noobGameResult = calculateGameResult({ win, duration, surrender, remake })

  // 3. Streak
  const noobStreakBonus = calculateStreakBonus(win, noobStreak)

  // 4. Rank change
  const noobRankChange = calculateRankChange(previousRank, newRank)

  // 5. Bonus spéciaux individuels
  const noobSpecialBonus = 0

  // 6. Sous-total
  const noobSubtotal = noobKDA.final + noobGameResult.final +
                       noobStreakBonus + noobRankChange.final + noobSpecialBonus

  // 7. Plafond individuel
  const noobCapped = applyPlayerCap(noobSubtotal)

  // 7.5. Multiplicateur de rank
  const noobRankMultiplier = calculatePlayerRankMultiplier(noobRank, carryRank)
  const noobAfterMultiplier = noobCapped * noobRankMultiplier

  // 8. Arrondi à l'entier
  const noobFinal = Math.round(noobAfterMultiplier)

  // ┌─── PHASE 2: CALCUL INDIVIDUEL - CARRY (même process) ───┐

  // ┌─── PHASE 3: CALCUL DUO ───┐

  // 9. Somme duo
  const duoSum = noobFinal + carryFinal

  // 10. Prise de risque
  const riskBonus = calculateRiskBonus({ noobOffRole, noobOffChampion, ... })

  // 11. Bonus spéciaux duo
  const noDeathBonus = calculateNoDeathBonus(noobDeaths, carryDeaths)

  // 12. Sous-total duo
  const duoSubtotal = duoSum + riskBonus.final + noDeathBonus

  // 13. Plafond duo
  const duoCapped = applyDuoCap(duoSubtotal)

  // 14. Arrondi final
  const duoFinal = Math.round(duoCapped)

  return { noob, carry, duo, total: duoFinal }
}
```

---

### Module 1: KDA ([src/services/scoring/kda.ts](../src/services/scoring/kda.ts))

**Formules**:
```
P_base = 1.0*K + 0.5*A - 1.0*D

Noob (bonus):
  P_KDA = P_base + (0.5*K + 0.25*A)

Carry (malus):
  P_KDA = P_base - 0.5*D
```

**Exemples**:
- Noob: 5K/3D/8A → base = 6, bonus = 4.5 → **10.5**
- Carry: 10K/1D/5A → base = 11.5, malus = -0.5 → **11**

---

### Module 2: GameResult ([src/services/scoring/game-result.ts](../src/services/scoring/game-result.ts))

**Formules (priorité stricte)**:
1. Remake: 0 points
2. FF/Surrender (défaite): -10 points
3. Victoire rapide (< 25 min): +8 points
4. Victoire standard: +5 points
5. Défaite standard: -5 points

---

### Module 3: Streaks ([src/services/scoring/streaks.ts](../src/services/scoring/streaks.ts))

**Win Streaks**: 3 wins → +10, 5 wins → +25, 7 wins → +50
**Loss Streaks**: 3 losses → -10, 5 losses → -25

**Exemples**:
- Streak actuel = +2, game = Win → newStreak = +3 → **Bonus = +10**
- Streak actuel = +3, game = Loss → newStreak = -1 → **Bonus = 0** (reset)

---

### Module 4: RankChange ([src/services/scoring/rank-change.ts](../src/services/scoring/rank-change.ts))

**Formules**:
- **Montée**: +1 division → +50 pts, +1 tier → +100 pts
- **Descente (double malus)**: -1 division → -100 pts, -1 tier → -200 pts

**Exemples**:
- GOLD IV → GOLD III: **+50 points**
- GOLD I → PLATINUM IV: **+100 points**
- PLATINUM IV → GOLD I: **-200 points**

---

### Module 5: RankMultiplier ([src/services/scoring/rank-multiplier.ts](../src/services/scoring/rank-multiplier.ts))

**Système**:
- Le joueur avec le **rank le plus élevé n'est JAMAIS pénalisé** (multiplier = 1.0)
- Le joueur avec le rank le plus bas peut être pénalisé si > 1 tier sous la moyenne
- Réduction: 5% par division sous le seuil
- Minimum: 0.5 (50%)

**Conversion Rank → Valeur** ([rank-utils.ts](../src/services/scoring/rank-utils.ts)):
```
IRON: 0, BRONZE: 4, SILVER: 8, GOLD: 12
PLATINUM: 16, EMERALD: 20, DIAMOND: 24
MASTER: 28, GRANDMASTER: 32, CHALLENGER: 36

Division: IV=0, III=1, II=2, I=3

Ex: GOLD II = 12 + 2 = 14
Ex: MASTER = 28 (pas de division)
```

**Exemples**:

| Noob | Carry | Noob Value | Carry Value | Moyenne | Seuil | Noob Distance | Noob Multiplier | Carry Multiplier |
|------|-------|------------|-------------|---------|-------|---------------|-----------------|------------------|
| GOLD IV | GOLD IV | 12 | 12 | 12 | 8 | 0 | **1.0** | **1.0** |
| IRON IV | GOLD IV | 0 | 12 | 6 | 2 | 2 | **0.9** | **1.0** |
| IRON IV | DIAMOND IV | 0 | 24 | 12 | 8 | 8 | **0.6** | **1.0** |
| IRON IV | MASTER | 0 | 28 | 14 | 10 | 10 | **0.5** | **1.0** |

---

### Module 6: Risk ([src/services/scoring/risk.ts](../src/services/scoring/risk.ts))

**Système**: Évalue 4 conditions:
1. Noob hors rôle principal?
2. Noob hors champion principal?
3. Carry hors rôle principal?
4. Carry hors champion principal?

**Formule**:
```
H = nombre de conditions vraies

H = 4 → +25 points
H = 3 → +15 points
H = 2 → +5 points
H ≤ 1 → 0 points
```

---

### Module 7: Bonuses ([src/services/scoring/bonuses.ts](../src/services/scoring/bonuses.ts))

**Bonus "No Death" (Duo)**:
- Condition: Les **deux joueurs** ont 0 mort
- Bonus: **+20 points** au duo

---

### Module 8: Caps ([src/services/scoring/caps.ts](../src/services/scoring/caps.ts))

**Plafonds**:
- **Par joueur**: -25 à +70 points
- **Par duo**: -50 à +120 points

---

## 📊 Statistiques Finales

### Fichiers analysés

| Catégorie | Fichiers | Lignes de code |
|-----------|----------|----------------|
| **Riot API** | 5 | ~450 |
| **Game Tracker** | 5 | ~550 |
| **Scoring Engine** | 10 | ~800 |
| **Total** | **20 fichiers** | **~1800 lignes** |

### Tests

- ✅ **382 tests passent**
- ✅ Coverage handlers: Excellente
- ✅ Coverage services: Excellente
- ✅ Aucune erreur TypeScript

---

## 🎯 Conclusions

### Points forts

✅ **Architecture modulaire** : Séparation claire des responsabilités

✅ **Type Safety** : TypeScript strict mode + types exhaustifs

✅ **Error Handling** : Retry logic, validation, error classes

✅ **Testabilité** : 382 tests, fixtures, builders

✅ **Documentation inline** : Commentaires clairs dans le code

### Améliorations futures

⏳ **Database Layer** : Schéma Drizzle à créer

⏳ **Main Detection** : Détection hors-main role/champion

⏳ **Scheduler** : Tâches cron (ladder auto)

⏳ **Integration Tests** : Tests E2E complets

---

**Maintenu par**: DuoQ Tracker Team
**Date de revue**: 2025-10-31
**Status**: ✅ Review Complete
