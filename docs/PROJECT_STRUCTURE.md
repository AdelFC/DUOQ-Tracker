# Project Structure - DuoQ Tracker

Structure complète du projet avec description de chaque dossier/fichier.

---

## 📂 Root

```
DUOQ-Tracker/
├── README.md                   # Vue d'ensemble du projet
├── SPECIFICATIONS.md           # Règles complètes du challenge v2.1
├── PROJECT_STRUCTURE.md        # Ce fichier
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript config (strict mode)
├── vitest.config.ts            # Vitest test config
├── drizzle.config.ts           # Drizzle ORM config
├── .env.example                # Template des variables d'environnement
├── .gitignore                  # Git ignore rules
│
├── docs/                       # 📚 Documentation
│   ├── ARCHITECTURE.md         # Design technique détaillé
│   ├── TDD_PLAN.md            # Plan de tests exhaustif
│   └── SUMMARY.md             # Récapitulatif de l'analyse
│
├── src/                        # 💻 Code source
├── database/                   # 🗄️ SQLite data (gitignored)
└── drizzle/                    # 🔄 SQL migrations
```

---

## 📁 src/ - Code source

### src/types/ - Types TypeScript

Tous les types du système, organisés par domaine.

```
src/types/
├── index.ts                    # Re-export all types
├── message.ts                  # Message, MessageType, Response
├── player.ts                   # Player (discordId, puuid, role, rank, streaks)
├── duo.ts                      # Duo (noob + carry)
├── game.ts                     # Game (matchData, stats, result)
├── scoring.ts                  # ScoreBreakdown, PlayerScore, DuoScore
├── state.ts                    # State (global app state)
└── handlers.ts                 # Handler type signature
```

**À créer** :
- [ ] `message.ts` - MessageType enum + Message/Response interfaces
- [ ] `player.ts` - Player interface avec rôle, main role/champ, streaks
- [ ] `duo.ts` - Duo interface (pair noob+carry)
- [ ] `game.ts` - GameData, PlayerStats interfaces
- [ ] `scoring.ts` - ScoreBreakdown (détail des points)
- [ ] `state.ts` - State global + createEmptyState()
- [ ] `handlers.ts` - Handler type (message, state, responses) => void

---

### src/handlers/ - Logique métier (Handlers purs)

Handlers = fonctions pures qui transforment (Message, State) → Response[]

```
src/handlers/
├── router.ts                   # Dispatch central (Message → Handler)
│
├── auth/
│   ├── index.ts
│   ├── register.handler.ts     # /duoq register [riotId] [role] [mainRole] [mainChamp]
│   ├── link.handler.ts         # /duoq link [@partner] - Créer le duo
│   └── unregister.handler.ts   # /duoq unregister
│
├── tracking/
│   ├── index.ts
│   ├── game-detected.handler.ts   # GAME_DETECTED - Marquer duo "in game"
│   ├── game-ended.handler.ts      # GAME_ENDED - Extraire stats
│   └── game-scored.handler.ts     # GAME_SCORE - Calcul points + update DB
│
├── stats/
│   ├── index.ts
│   ├── ladder.handler.ts       # /duoq ladder - Classement par duo
│   ├── stats.handler.ts        # /duoq stats [@duo] - Stats détaillées
│   └── history.handler.ts      # /duoq history [@duo] - Historique games
│
└── admin/
    ├── index.ts
    ├── add-points.handler.ts   # /duoq admin add-points [@duo] [pts] [reason]
    └── remove-points.handler.ts # /duoq admin remove-points [@duo] [pts] [reason]
```

**Ordre d'implémentation TDD** :
1. Auth (register, link, unregister)
2. Tracking (game-scored = cœur du système)
3. Stats (ladder, stats, history)
4. Admin (add/remove points)

---

### src/services/ - Services externes

Services = code avec side effects (API, DB, polling, etc.)

```
src/services/
├── riot/                       # 🔁 Réutilisé de V2
│   ├── index.ts
│   ├── client.ts               # HTTP client + rate limiting
│   ├── account.ts              # Riot Account API
│   ├── match.ts                # Match history API
│   ├── spectator.ts            # Spectator API (live games)
│   └── types.ts                # Riot API response types
│
├── tracker/                    # 🔁 Réutilisé de V2
│   ├── index.ts
│   ├── tracker.ts              # Main tracker (polling 10s)
│   ├── detector.ts             # Game detection logic
│   ├── queue.ts                # Request queue
│   ├── state-manager.ts        # Track game states
│   └── types.ts
│
├── scoring/                    # 🆕 NOUVEAU - Cœur du système
│   ├── index.ts
│   ├── engine.ts               # Orchestrateur (calcul complet)
│   ├── kda.ts                  # Calcul KDA avec biais rôle
│   ├── game-result.ts          # Win/Loss/FF/WinFast points
│   ├── streaks.ts              # Win/lose streaks
│   ├── rank-change.ts          # Bonus/malus divisions
│   ├── risk.ts                 # Prise de risque (H)
│   ├── bonuses.ts              # MVP, No-Death, Pentakill
│   └── caps.ts                 # Plafonds individuels/duo
│
├── main-detection/             # 🆕 NOUVEAU
│   ├── index.ts
│   ├── detector.ts             # Compare position + champion
│   └── auto-complete.ts        # Suggest main role/champ from history
│
└── scheduler/                  # 🔁 Adapté de V2
    ├── index.ts
    ├── scheduler.ts            # Node-cron wrapper
    └── tasks/
        └── ladder-post.ts      # Post ladder toutes les 12h
```

**Priorité #1** : `services/scoring/` (TDD exhaustif)

---

### src/bot/ - Discord Bot

Interface entre Discord et les handlers

```
src/bot/
├── index.ts                    # Bot entry point
├── deploy-commands.ts          # Deploy slash commands to Discord
│
├── commands/
│   └── duoq.ts                 # /duoq [subcommand] - Toutes les commandes
│
├── events/
│   ├── ready.ts                # Bot ready event
│   └── interactionCreate.ts   # Handle slash commands
│
├── formatters/
│   ├── index.ts                # Export all formatters
│   ├── auth.ts                 # Format register/link responses
│   ├── game-result.ts          # Format game score avec breakdown
│   ├── ladder.ts               # Format ladder embeds
│   └── stats.ts                # Format stats embeds
│
├── utils/
│   └── logger.ts               # Winston logger (🔁 copié de V2)
│
└── router.ts                   # Discord Interaction → Message
```

---

### src/db/ - Database Layer

Drizzle ORM + SQLite

```
src/db/
├── schema.ts                   # Tables: players, duos, games, adjustments
├── client.ts                   # SQLite client (WAL mode)
└── migrate.ts                  # Migration runner
```

**Schema** :
- `players` : discordId, puuid, role, mainRole, mainChampion, rank, streaks
- `duos` : noob + carry, totalPoints, games played
- `games` : matchId, stats, points, breakdown (JSON)
- `point_adjustments` : modération (add/remove points)

---

### src/constants/

Constantes du système

```
src/constants/
├── index.ts                    # General config
├── scoring.ts                  # Formules, plafonds, bonus
└── roles.ts                    # TOP, JGL, MID, ADC, SUP
```

---

### src/tests/ - Tests (TDD)

Tests organisés en miroir de src/

```
src/tests/
├── helpers.ts                  # assertResponseType, findResponse, etc.
│
├── fixtures/
│   ├── index.ts                # Re-export all fixtures
│   ├── builders.ts             # player(), duo(), game(), message()
│   ├── clock.ts                # FixedClock (🔁 copié de V2)
│   └── rng.ts                  # SeededRNG (si besoin)
│
├── handlers/
│   ├── auth.test.ts            # Tests register/link/unregister
│   ├── game-scoring.test.ts   # Tests game-scored handler
│   ├── ladder.test.ts          # Tests ladder handler
│   ├── stats.test.ts           # Tests stats handler
│   └── admin.test.ts           # Tests admin handlers
│
├── services/
│   ├── scoring/
│   │   ├── kda.test.ts         # Tests KDA avec biais
│   │   ├── game-result.test.ts # Tests Win/Loss/FF
│   │   ├── streaks.test.ts     # Tests win/lose streaks
│   │   ├── rank-change.test.ts # Tests rank up/down
│   │   ├── risk.test.ts        # Tests prise de risque
│   │   ├── bonuses.test.ts     # Tests MVP/No-Death/Penta
│   │   ├── caps.test.ts        # Tests plafonds
│   │   └── engine.test.ts      # Tests intégration complète
│   │
│   ├── main-detection.test.ts  # Tests détection hors-main
│   └── tracker.test.ts         # Tests tracker (🔁 adapt V2)
│
└── integration/
    └── full-game-flow.test.ts  # Tests E2E complets
```

**Ordre TDD** :
1. Fixtures (builders + clock)
2. services/scoring/ (8 modules)
3. handlers/auth
4. handlers/tracking
5. handlers/stats
6. handlers/admin
7. integration

---

## 🗂️ database/ - SQLite Data

```
database/
└── duoq.db                     # SQLite database (gitignored)
```

**Créé automatiquement** par Drizzle au premier lancement.

---

## 🔄 drizzle/ - SQL Migrations

```
drizzle/
├── 0000_initial_schema.sql     # Création tables
├── 0001_add_indexes.sql        # Indexes
└── meta/                       # Drizzle metadata
```

**Généré automatiquement** avec `npm run db:generate`

---

## 📊 Fichiers de config

### package.json

Scripts disponibles :
```bash
npm run dev              # Dev mode avec hot reload
npm run bot              # Lancer le bot
npm run deploy           # Deploy Discord commands
npm test                 # Run tous les tests
npm run test:watch       # Tests en watch mode
npm run test:coverage    # Coverage report
npm run build            # Build TypeScript
npm run type-check       # Vérifier types sans build
npm run db:generate      # Générer migration
npm run db:migrate       # Appliquer migrations
npm run db:studio        # Drizzle Studio UI
```

### tsconfig.json

- **strict mode** activé (comme V2)
- **noUnusedLocals**, **noImplicitReturns**
- ESNext modules
- Outdir: `./dist`

### vitest.config.ts

- Globals activé
- Coverage: v8 provider
- Test timeout: 10s
- Include: `src/tests/**/*.test.ts`

---

## 🎯 Checklist de création

### Configuration ✅
- [x] package.json
- [x] tsconfig.json
- [x] vitest.config.ts
- [x] drizzle.config.ts
- [x] .env.example
- [x] .gitignore

### Structure ✅
- [x] Tous les dossiers créés
- [x] Documentation complète

### À créer (Phase 1 - Foundations)
- [ ] src/types/*.ts (7 fichiers)
- [ ] src/tests/fixtures/ (builders, clock)
- [ ] src/services/scoring/*.ts (8 modules)
- [ ] Tests exhaustifs scoring

### À créer (Phase 2 - Handlers)
- [ ] src/handlers/auth/*.ts
- [ ] src/handlers/tracking/*.ts
- [ ] src/handlers/stats/*.ts
- [ ] src/handlers/admin/*.ts
- [ ] Tests handlers

### À créer (Phase 3 - Integration)
- [ ] src/bot/*
- [ ] src/db/schema.ts
- [ ] Tests E2E

---

## 🔄 Réutilisation V2

### Copier tel quel (🔁)
- `src/services/riot/` → Complet
- `src/services/tracker/` → Complet
- `src/tests/fixtures/clock.ts` → FixedClock
- `src/bot/utils/logger.ts` → Winston logger

### Adapter (🔄)
- `src/handlers/auth/register.handler.ts` → Ajouter role + mainRole/Champ
- `src/handlers/stats/ladder.handler.ts` → Classement par duo
- `src/tests/fixtures/builders.ts` → PlayerBuilder, DuoBuilder, GameBuilder

### Créer nouveau (🆕)
- `src/services/scoring/` → Tout
- `src/handlers/tracking/game-scored.handler.ts`
- `src/handlers/auth/link.handler.ts`
- `src/handlers/admin/`

---

**Date** : 30 octobre 2025
**Version** : 1.0
**Status** : Structure créée, prêt pour implémentation
