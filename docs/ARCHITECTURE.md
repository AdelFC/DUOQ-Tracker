# Architecture DuoQ Tracker

Basé sur l'architecture message-passing de Le Pacte V2, avec adaptations spécifiques pour le scoring complexe du DuoQ Challenge.

---

## 🏗️ Vue d'ensemble

### Hérité de V2
- ✅ **Message-passing pattern** (handlers purs)
- ✅ **Builder pattern** pour les tests
- ✅ **FixedClock** pour tests déterministes
- ✅ **Riot API client** (account, match, spectator)
- ✅ **Game Tracker** (polling, state machine)
- ✅ **Discord formatters** (embeds visuels)
- ✅ **Drizzle ORM** + SQLite

### Nouveau pour DuoQ
- ❌ **Scoring Engine** (formules complexes avec ordre strict)
- ❌ **Duo Management** (pair fixe noob/carry)
- ❌ **Rôles avec biais** (noob vs carry dans calculs)
- ❌ **Détection hors-main** (role + champion)
- ❌ **Streaks individuelles** (win/lose par joueur)
- ❌ **Modération** (add/remove points manuellement)

---

## 📂 Structure du projet

```
DUOQ-Tracker/
├── src/
│   ├── main.ts                  # Point d'entrée (orchestrateur)
│   │
│   ├── types/                   # Types TypeScript
│   │   ├── index.ts
│   │   ├── message.ts           # Message, MessageType, Response
│   │   ├── player.ts            # Player (discordId, puuid, role, main role/champ)
│   │   ├── duo.ts               # Duo (noob + carry)
│   │   ├── game.ts              # Game (matchData, breakdown)
│   │   ├── state.ts             # State global
│   │   └── scoring.ts           # ScoreBreakdown, ScoreComponent
│   │
│   ├── handlers/                # Logique métier (TDD)
│   │   ├── router.ts           # Dispatch messages → handlers
│   │   ├── auth/
│   │   │   ├── register.handler.ts
│   │   │   ├── link.handler.ts  # Lier 2 joueurs en duo
│   │   │   └── unregister.handler.ts
│   │   │
│   │   ├── tracking/            # Game detection & scoring
│   │   │   ├── game-detected.handler.ts
│   │   │   ├── game-ended.handler.ts
│   │   │   └── game-scored.handler.ts
│   │   │
│   │   ├── stats/
│   │   │   ├── ladder.handler.ts
│   │   │   ├── stats.handler.ts
│   │   │   └── history.handler.ts
│   │   │
│   │   └── admin/
│   │       ├── add-points.handler.ts
│   │       └── remove-points.handler.ts
│   │
│   ├── services/
│   │   ├── riot/               # 🔁 Réutilisé de V2
│   │   │   ├── client.ts
│   │   │   ├── account.ts
│   │   │   ├── match.ts
│   │   │   └── spectator.ts
│   │   │
│   │   ├── tracker/            # 🔁 Réutilisé de V2
│   │   │   ├── tracker.ts      # Polling 10s
│   │   │   ├── detector.ts
│   │   │   ├── queue.ts
│   │   │   └── state-manager.ts
│   │   │
│   │   ├── scoring/            # 🆕 Nouveau
│   │   │   ├── engine.ts       # Calcul points (ordre strict)
│   │   │   ├── kda.ts          # Score KDA avec biais rôle
│   │   │   ├── streaks.ts      # Win/lose streaks
│   │   │   ├── rank-change.ts  # Bonus/malus divisions
│   │   │   ├── risk.ts         # Prise de risque (hors-main)
│   │   │   ├── bonuses.ts      # MVP, No-Death, Penta
│   │   │   └── caps.ts         # Plafonds individuels/duo
│   │   │
│   │   ├── main-detection/     # 🆕 Nouveau
│   │   │   ├── detector.ts     # Compare position + champion
│   │   │   └── auto-complete.ts # Suggest main role/champ
│   │   │
│   │   └── scheduler/          # 🔁 Adapté de V2
│   │       ├── scheduler.ts
│   │       └── tasks/
│   │           └── ladder-post.ts  # Post ladder toutes les 12h
│   │
│   ├── bot/                    # Discord bot
│   │   ├── index.ts
│   │   ├── commands/
│   │   │   ├── duoq.ts         # Commandes /duoq *
│   │   │   └── deploy.ts
│   │   │
│   │   ├── events/
│   │   │   ├── ready.ts
│   │   │   └── interactionCreate.ts
│   │   │
│   │   ├── formatters/         # 🔁 Adapté de V2
│   │   │   ├── index.ts
│   │   │   ├── auth.ts
│   │   │   ├── game-result.ts  # Embeds détaillés avec breakdown
│   │   │   ├── ladder.ts
│   │   │   └── stats.ts
│   │   │
│   │   └── router.ts           # Discord → Message
│   │
│   ├── db/                     # Database layer
│   │   ├── schema.ts           # 🆕 Schéma DuoQ
│   │   ├── client.ts           # 🔁 Réutilisé
│   │   └── migrate.ts
│   │
│   ├── constants/
│   │   ├── index.ts            # Config générale
│   │   ├── scoring.ts          # Formules, plafonds, bonus
│   │   └── roles.ts            # TOP, JGL, MID, ADC, SUP
│   │
│   └── tests/                  # 🧪 TDD strict
│       ├── helpers.ts
│       ├── fixtures/
│       │   ├── index.ts
│       │   ├── builders.ts     # player(), duo(), game(), message()
│       │   └── clock.ts        # FixedClock
│       │
│       ├── handlers/
│       │   ├── auth.test.ts
│       │   ├── game-scoring.test.ts
│       │   ├── ladder.test.ts
│       │   └── admin.test.ts
│       │
│       ├── services/
│       │   ├── scoring-engine.test.ts  # Tests exhaustifs formules
│       │   ├── main-detection.test.ts
│       │   └── tracker.test.ts
│       │
│       └── integration/
│           └── full-game-flow.test.ts
│
├── database/                   # SQLite data (gitignored)
├── drizzle/                    # Migrations SQL
├── docs/
│   ├── SPECIFICATIONS.md       # Règles complètes
│   ├── ARCHITECTURE.md         # Ce fichier
│   └── TDD_PLAN.md            # Plan de tests
│
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── drizzle.config.ts
└── README.md
```

---

## 🔄 Message Flow

### 1. Discord Interaction → Handler

```
User: /duoq register Faker KR1 noob MID Ahri
  ↓
Discord InteractionCreate Event
  ↓
bot/router.ts: Interaction → Message
  {
    type: 'DUOQ_REGISTER',
    sourceId: 'discord_123',
    payload: {
      riotId: 'Faker#KR1',
      role: 'noob',
      mainRole: 'MID',
      mainChampion: 'Ahri'
    }
  }
  ↓
handlers/router.ts: Dispatch to registerHandler
  ↓
handlers/auth/register.handler.ts
  - Validate format
  - Call Riot API
  - Create Player
  - Push Response
  ↓
Response: { type: 'DUOQ_REGISTER_SUCCESS', ... }
  ↓
bot/formatters/auth.ts: Response → Embed
  ↓
Discord Reply with Embed
```

### 2. Game Detection → Scoring

```
Tracker detects game (polling 10s)
  ↓
Message: { type: 'GAME_DETECTED', payload: { gameId, participants } }
  ↓
handlers/tracking/game-detected.handler.ts
  - Check if duo is playing
  - Mark duo as "in game"
  ↓
Game ends (Riot API)
  ↓
Message: { type: 'GAME_ENDED', payload: { matchData } }
  ↓
handlers/tracking/game-ended.handler.ts
  - Extract KDA, win/loss, duration, etc.
  ↓
Message: { type: 'GAME_SCORE', payload: { ... } }
  ↓
handlers/tracking/game-scored.handler.ts
  - Call services/scoring/engine.ts
  - Calculate points (ordre strict)
  - Update DB
  - Push Response with breakdown
  ↓
Response: { type: 'GAME_SCORED', payload: { breakdown } }
  ↓
bot/formatters/game-result.ts: Create detailed embed
  ↓
Discord notification in channel
```

---

## 🧮 Scoring Engine (Core Logic)

### Architecture du scoring

```typescript
// services/scoring/engine.ts

export interface ScoreBreakdown {
  noob: PlayerScore
  carry: PlayerScore
  duo: DuoScore
  total: number
}

export interface PlayerScore {
  kda: number              // P_KDA avec biais
  gameResult: number       // Win/Loss/FF/WinFast
  streak: number           // Win/lose streak
  rankChange: number       // Bonus/malus division
  bonuses: number          // MVP, Penta
  subtotal: number         // Avant plafond
  capped: number           // Après plafond
  final: number            // Arrondi
}

export interface DuoScore {
  sum: number              // noob + carry
  risk: number             // Prise de risque (H)
  noDeath: number          // Bonus No-Death
  total: number            // Avant plafond duo
  capped: number           // Après plafond duo
  final: number            // Arrondi final
}

/**
 * Calcul des points - ORDRE STRICT (specs §8)
 */
export function calculateGameScore(
  gameData: GameData,
  noobPlayer: Player,
  carryPlayer: Player,
  duo: Duo
): ScoreBreakdown {
  // CALCUL INDIVIDUEL (pour chaque joueur)
  const noobScore = calculatePlayerScore(gameData.noobStats, noobPlayer, 'noob')
  const carryScore = calculatePlayerScore(gameData.carryStats, carryPlayer, 'carry')

  // CALCUL DUO
  const duoSum = noobScore.final + carryScore.final
  const riskBonus = calculateRiskBonus(gameData, noobPlayer, carryPlayer)
  const noDeathBonus = calculateNoDeathBonus(gameData)

  let duoTotal = duoSum + riskBonus + noDeathBonus

  // Plafond duo
  const duoCapped = Math.max(-50, Math.min(120, duoTotal))
  const duoFinal = Math.round(duoCapped)

  return {
    noob: noobScore,
    carry: carryScore,
    duo: {
      sum: duoSum,
      risk: riskBonus,
      noDeath: noDeathBonus,
      total: duoTotal,
      capped: duoCapped,
      final: duoFinal
    },
    total: duoFinal
  }
}

function calculatePlayerScore(
  stats: PlayerStats,
  player: Player,
  role: 'noob' | 'carry'
): PlayerScore {
  // 1. P_KDA avec biais de rôle
  const kda = calculateKDA(stats, role)

  // 2. Résultat game
  const gameResult = calculateGameResult(stats)

  // 3. Streak
  const streak = calculateStreak(player, stats.isWin)

  // 4. Rank change
  const rankChange = calculateRankChange(player, stats.newRank)

  // 5. Bonus spéciaux
  const bonuses = calculateBonuses(stats, player)

  // Subtotal
  const subtotal = kda + gameResult + streak + rankChange + bonuses

  // 6. Plafond individuel
  const capped = Math.max(-25, Math.min(70, subtotal))

  // 7. Arrondi
  const final = Math.round(capped)

  return { kda, gameResult, streak, rankChange, bonuses, subtotal, capped, final }
}
```

### Modules de calcul spécialisés

Chaque composant du score est dans un fichier dédié :

- **`kda.ts`** : `P_base + biais(role)`
- **`streaks.ts`** : Track win/lose streaks par joueur
- **`rank-change.ts`** : Détection +/- divisions/tiers
- **`risk.ts`** : Évalue H (4 conditions)
- **`bonuses.ts`** : MVP, No-Death, Penta
- **`caps.ts`** : Apply plafonds

➡️ **Chaque module est testé indépendamment** avec des cas exhaustifs.

---

## 🗄️ Database Schema

```typescript
// db/schema.ts

// Table Players
export const players = sqliteTable('players', {
  discordId: text('discord_id').primaryKey(),
  riotPuuid: text('riot_puuid').notNull().unique(),
  riotName: text('riot_name').notNull(),
  riotTag: text('riot_tag').notNull(),

  // Rôle dans le duo
  role: text('role', { enum: ['noob', 'carry'] }),

  // Main role/champion déclarés
  mainRole: text('main_role', { enum: ['TOP', 'JGL', 'MID', 'ADC', 'SUP'] }),
  mainChampion: text('main_champion'),

  // Rank actuel
  currentRank: text('current_rank'), // ex: "GOLD_III"
  currentTier: text('current_tier'), // ex: "GOLD"
  currentDivision: integer('current_division'), // 1-4

  // Streaks
  winStreak: integer('win_streak').default(0),
  lossStreak: integer('loss_streak').default(0),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

// Table Duos
export const duos = sqliteTable('duos', {
  duoId: integer('duo_id').primaryKey({ autoIncrement: true }),
  noobDiscordId: text('noob_discord_id').notNull().references(() => players.discordId),
  carryDiscordId: text('carry_discord_id').notNull().references(() => players.discordId),

  // Points totaux
  totalPoints: integer('total_points').default(0),

  // Stats
  gamesPlayed: integer('games_played').default(0),
  wins: integer('wins').default(0),
  losses: integer('losses').default(0),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),

  // Contrainte: un joueur ne peut être que dans 1 duo
  // Géré au niveau application + index unique
})

// Index unique: un joueur = 1 duo max
export const duoPlayerIndex = uniqueIndex('duo_player_unique')
  .on(duos.noobDiscordId, duos.carryDiscordId)

// Table Games
export const games = sqliteTable('games', {
  gameId: integer('game_id').primaryKey({ autoIncrement: true }),
  duoId: integer('duo_id').notNull().references(() => duos.duoId),

  // Riot match info
  riotMatchId: text('riot_match_id').notNull().unique(),
  queueId: integer('queue_id').notNull(), // 420 (solo/duo) ou 440 (flex)
  gameDuration: integer('game_duration').notNull(),

  // Résultat
  isWin: integer('is_win', { mode: 'boolean' }).notNull(),
  isForfeit: integer('is_forfeit', { mode: 'boolean' }).default(false),
  isRemake: integer('is_remake', { mode: 'boolean' }).default(false),

  // Stats Noob
  noobKills: integer('noob_kills').notNull(),
  noobDeaths: integer('noob_deaths').notNull(),
  noobAssists: integer('noob_assists').notNull(),
  noobChampion: text('noob_champion').notNull(),
  noobPosition: text('noob_position').notNull(),
  noobPoints: integer('noob_points').notNull(),

  // Stats Carry
  carryKills: integer('carry_kills').notNull(),
  carryDeaths: integer('carry_deaths').notNull(),
  carryAssists: integer('carry_assists').notNull(),
  carryChampion: text('carry_champion').notNull(),
  carryPosition: text('carry_position').notNull(),
  carryPoints: integer('carry_points').notNull(),

  // Score duo
  duoPoints: integer('duo_points').notNull(),

  // Breakdown détaillé (JSON)
  breakdown: text('breakdown', { mode: 'json' }).$type<ScoreBreakdown>(),

  playedAt: integer('played_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

// Table Point Adjustments (modération)
export const pointAdjustments = sqliteTable('point_adjustments', {
  adjustmentId: integer('adjustment_id').primaryKey({ autoIncrement: true }),
  duoId: integer('duo_id').notNull().references(() => duos.duoId),
  moderatorId: text('moderator_id').notNull(),

  pointsDelta: integer('points_delta').notNull(), // +/- points
  reason: text('reason').notNull(),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})
```

---

## 🧪 Stratégie TDD

### Principes (hérités de V2)

1. **Tests avant implémentation** (TDD strict)
2. **Builder pattern** pour setup rapide
3. **FixedClock** pour déterminisme
4. **Table-driven tests** pour validations
5. **Assertions claires** avec messages explicites

### Ordre d'implémentation TDD

#### Phase 1 - Foundations (Semaine 1)
```
1. Types de base
   ✓ Player, Duo, Game, Message, State
   ✓ ScoreBreakdown, ScoreComponent

2. Builders de test
   ✓ player(), duo(), game(), message()
   ✓ FixedClock, helpers

3. Scoring Engine (TDD exhaustif)
   ✓ kda.test.ts → kda.ts
   ✓ streaks.test.ts → streaks.ts
   ✓ rank-change.test.ts → rank-change.ts
   ✓ risk.test.ts → risk.ts
   ✓ bonuses.test.ts → bonuses.ts
   ✓ caps.test.ts → caps.ts
   ✓ engine.test.ts → engine.ts (intègre tout)
```

#### Phase 2 - Handlers (Semaine 2)
```
4. Auth Handlers
   ✓ auth.test.ts → register.handler.ts
   ✓ auth.test.ts → link.handler.ts
   ✓ auth.test.ts → unregister.handler.ts

5. Tracking Handlers
   ✓ game-scoring.test.ts → game-ended.handler.ts
   ✓ game-scoring.test.ts → game-scored.handler.ts
```

#### Phase 3 - Features (Semaine 3)
```
6. Stats Handlers
   ✓ ladder.test.ts → ladder.handler.ts
   ✓ stats.test.ts → stats.handler.ts
   ✓ history.test.ts → history.handler.ts

7. Admin Handlers
   ✓ admin.test.ts → add-points.handler.ts
   ✓ admin.test.ts → remove-points.handler.ts
```

### Exemple de test TDD

```typescript
// tests/services/scoring-engine.test.ts

describe('Scoring Engine', () => {
  describe('calculateKDA', () => {
    // Table-driven: cas valides
    const kdaCases = [
      { K: 10, D: 3, A: 15, role: 'noob', expected: 23.25 },
      { K: 5, D: 10, A: 8, role: 'carry', expected: -6 },
      { K: 12, D: 2, A: 15, role: 'carry', expected: 16.5 }
    ]

    it.each(kdaCases)(
      'should calculate KDA for $role: $K/$D/$A = $expected',
      ({ K, D, A, role, expected }) => {
        const result = calculateKDA({ K, D, A }, role)
        expect(result).toBeCloseTo(expected, 2)
      }
    )
  })

  describe('calculateGameScore - Full Flow', () => {
    it('should calculate complete game score with all components', () => {
      // ARRANGE
      const clock = new FixedClock()
      const noob = player('noob1')
        .withRole('noob')
        .withMainRole('TOP')
        .withMainChampion('Garen')
        .withWinStreak(2) // Will become 3
        .build()

      const carry = player('carry1')
        .withRole('carry')
        .withMainRole('ADC')
        .withMainChampion('Jinx')
        .build()

      const duo = buildDuo(noob, carry)

      const gameData: GameData = {
        isWin: true,
        duration: 22 * 60, // 22 min (win rapide)
        noobStats: {
          K: 10, D: 3, A: 15,
          champion: 'Yasuo', // Hors pick
          position: 'MID',   // Hors rôle
          isWin: true
        },
        carryStats: {
          K: 8, D: 5, A: 20,
          champion: 'Jinx', // Main pick
          position: 'ADC',  // Main rôle
          isWin: true
        }
      }

      // ACT
      const result = calculateGameScore(gameData, noob, carry, duo)

      // ASSERT
      // Noob
      expect(result.noob.kda).toBeCloseTo(23.25, 2)
      expect(result.noob.gameResult).toBe(8) // Win rapide
      expect(result.noob.streak).toBe(10) // 3ème win
      expect(result.noob.capped).toBe(70) // Plafonné
      expect(result.noob.final).toBe(70)

      // Carry
      expect(result.carry.kda).toBeCloseTo(10.5, 2)
      expect(result.carry.gameResult).toBe(8)
      expect(result.carry.streak).toBe(0)
      expect(result.carry.final).toBe(19)

      // Duo
      expect(result.duo.sum).toBe(89) // 70 + 19
      expect(result.duo.risk).toBe(5) // H=2 (noob hors rôle + hors pick)
      expect(result.duo.noDeath).toBe(0) // 3D + 5D
      expect(result.duo.final).toBe(94)

      expect(result.total).toBe(94)
    })
  })
})
```

---

## 📊 Formatters (Discord Embeds)

### Embed de résultat de game

```typescript
// bot/formatters/game-result.ts

export function formatGameResult(
  response: Response,
  embed: EmbedBuilder
): EmbedBuilder {
  const { breakdown, duo, gameData } = response.payload

  // Header
  embed.setTitle(`🎮 Game #${breakdown.gameNumber} - ${gameData.isWin ? 'Victoire' : 'Défaite'}`)
  embed.setColor(gameData.isWin ? COLORS.success : COLORS.danger)

  // Noob section
  embed.addFields({
    name: `🧠 ${duo.noob.summonerName} (Noob)`,
    value: formatPlayerBreakdown(breakdown.noob, gameData.noobStats),
    inline: false
  })

  // Carry section
  embed.addFields({
    name: `⚔️ ${duo.carry.summonerName} (Carry)`,
    value: formatPlayerBreakdown(breakdown.carry, gameData.carryStats),
    inline: false
  })

  // Duo section
  embed.addFields({
    name: '🏆 DUO TOTAL',
    value: formatDuoBreakdown(breakdown.duo),
    inline: false
  })

  // Footer avec position ladder
  embed.setFooter({
    text: `Position: #${duo.ladderPosition} • Total: ${duo.totalPoints} pts`
  })

  return embed
}

function formatPlayerBreakdown(score: PlayerScore, stats: PlayerStats): string {
  return [
    `**${stats.champion}** ${stats.position} - ${stats.K}/${stats.D}/${stats.A}`,
    `├ KDA: ${formatPoints(score.kda)}`,
    `├ Résultat: ${formatPoints(score.gameResult)}`,
    score.streak !== 0 ? `├ Streak: ${formatPoints(score.streak)}` : null,
    score.rankChange !== 0 ? `├ Rank: ${formatPoints(score.rankChange)}` : null,
    score.bonuses !== 0 ? `├ Bonus: ${formatPoints(score.bonuses)}` : null,
    `└ **Total: ${formatPoints(score.final)}**`
  ].filter(Boolean).join('\n')
}

function formatDuoBreakdown(duo: DuoScore): string {
  return [
    `Somme: ${duo.sum}`,
    duo.risk !== 0 ? `+ Prise de risque: ${formatPoints(duo.risk)}` : null,
    duo.noDeath !== 0 ? `+ No Death: ${formatPoints(duo.noDeath)}` : null,
    `= **${duo.final} POINTS**`
  ].filter(Boolean).join('\n')
}

function formatPoints(points: number): string {
  return points >= 0 ? `+${points}` : `${points}`
}
```

---

## 🎯 Points clés d'implémentation

### 1. Scoring Engine = Pure Functions
- **Pas de side effects**
- **Testable unitairement**
- **Ordre strict** respecté
- **Décimaux** jusqu'à l'arrondi final

### 2. Handlers = Pure Logic
- **Input** : Message + State
- **Output** : Responses[]
- **Pas d'IO** direct
- **État immutable** (Map/Set modifiés en place mais conceptuellement immutable)

### 3. Builders = DRY Tests
- **Fluent API**
- **Defaults sensibles**
- **Chainable**
- **Type-safe**

### 4. Fixtures = Déterminisme
- **FixedClock** : temps contrôlé
- **No randomness** : tout prévisible
- **Repeatable** : tests stables

---

**Date** : 30 octobre 2025
**Version** : 1.0
**Basé sur** : Le Pacte V2 Architecture
