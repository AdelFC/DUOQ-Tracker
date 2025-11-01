# Plan TDD - DuoQ Tracker

Plan d'implémentation Test-Driven Development inspiré de la méthodologie de Le Pacte V2.

**Dernière mise à jour** : 31 octobre 2025
**Statut** : Phase 1, 1.5, 2, 3, 4 & 5 complètes ✅ (317 tests passent, 80% de l'objectif MVP)

---

## 🎯 Philosophie

### Règles d'or
1. **Red → Green → Refactor**
2. **Test d'abord, code ensuite**
3. **Un test = un concept**
4. **Builders pour DRY**
5. **Table-driven pour validations**
6. **FixedClock pour déterminisme**
7. **Tests exhaustifs pour éviter les surprises**

### Couverture attendue
- **Scoring Engine** : 100% ✅ (135 tests)
- **Handlers** : 95%+ (à faire)
- **Services** : 90%+ (à faire)
- **Formatters** : 80%+ (à faire)

---

## 📋 Phase 1 - Foundations (TERMINÉE ✅)

### ✅ Jour 1 : Types & Builders

#### Types créés (7 fichiers)
- ✅ `src/types/message.ts` - MessageType, Message, Response
- ✅ `src/types/player.ts` - Player, Role, Rank, Streaks, MainRole
- ✅ `src/types/duo.ts` - Duo, DuoRanking
- ✅ `src/types/game.ts` - GameData, PlayerGameStats, GameStatus
- ✅ `src/types/scoring.ts` - ScoreBreakdown, KDAScore, GameResultScore, etc.
- ✅ `src/types/state.ts` - State, Config, Clock, SystemClock
- ✅ `src/types/handlers.ts` - Handler type signature

#### Builders créés
✅ **Fichier** : `src/tests/fixtures/builders.ts`
- ✅ `PlayerBuilder` - 9 méthodes fluides
- ✅ `DuoBuilder` - Création de paires noob/carry
- ✅ `PlayerGameStatsBuilder` - Stats de game avec KDA
- ✅ `GameDataBuilder` - Game complète avec duration, win/loss
- ✅ `MessageBuilder` - Message-passing
- ✅ `StateBuilder` - State complet avec clock injectable
- ✅ Fonctions helper : `player()`, `duo()`, `gameData()`, `message()`, `state()`

#### FixedClock créé
✅ **Fichier** : `src/tests/fixtures/clock.ts`
- ✅ `Clock` interface
- ✅ `FixedClock` avec méthodes `advance*()`
- ✅ Helpers : `isSameDay()`

---

### ✅ Jours 2-3 : Scoring Engine (135 tests ✅)

Le **cœur du système** est maintenant complet et suit strictement SPECIFICATIONS.md v2.1.

#### ✅ 2.1 KDA avec biais de rôle (19 tests)

**Fichier** : `src/tests/services/scoring/kda.test.ts`

**Tests couverts** :
- ✅ Noob avec bonus (8 cas + breakdown détaillé)
- ✅ Carry avec malus (4 cas + breakdown détaillé)
- ✅ Edge cases (0/0/0, valeurs négatives, valeurs très élevées)
- ✅ Comparaisons noob vs carry (différences de scoring)

**Implémentation** : `src/services/scoring/kda.ts` (35 lignes)

**Formules validées** :
```typescript
P_base = 1.0*K + 0.5*A - 1.0*D
Noob: P_KDA = P_base + 0.5*K + 0.25*A
Carry: P_KDA = P_base - 0.5*D
```

---

#### ✅ 2.2 Game Result (15 tests)

**Fichier** : `src/tests/services/scoring/game-result.test.ts`

**Tests couverts** :
- ✅ Victoire standard (+5 pts)
- ✅ Victoire rapide < 25 min (+8 pts)
- ✅ Défaite standard (-5 pts)
- ✅ FF/Surrender (-10 pts)
- ✅ Remake (0 pts)
- ✅ Priorités (Remake > FF > Win<25min > Win > Loss)
- ✅ Edge cases (games très courtes/longues)

**Implémentation** : `src/services/scoring/game-result.ts` (62 lignes)

---

#### ✅ 2.3 Streaks (35 tests)

**Fichier** : `src/tests/services/scoring/streaks.test.ts`

**Tests couverts** :
- ✅ Win streaks (3→+10, 5→+25, 7→+50)
- ✅ Loss streaks (3→-10, 5→-25)
- ✅ Streak resets (changement win/loss)
- ✅ Seuils exacts (le bonus s'applique sur la game qui atteint le seuil)
- ✅ Edge cases (streaks très élevés)

**Implémentation** : `src/services/scoring/streaks.ts` (42 lignes)

---

#### ✅ 2.4 Rank Change (19 tests)

**Fichier** : `src/tests/services/scoring/rank-change.test.ts`

**Tests couverts** :
- ✅ Montées de division (+50 pts)
- ✅ Montées de tier (+100 pts)
- ✅ Descentes de division (-100 pts, double malus)
- ✅ Descentes de tier (-200 pts, double malus)
- ✅ Master+ (pas de divisions)
- ✅ Ordre des divisions (IV → III → II → I)
- ✅ Edge cases (IRON → BRONZE, multiples divisions)

**Implémentation** : `src/services/scoring/rank-change.ts` (78 lignes)

---

#### ✅ 2.5 Prise de risque (17 tests)

**Fichier** : `src/tests/services/scoring/risk.test.ts`

**Tests couverts** :
- ✅ H=0 (full comfort, 0 pts)
- ✅ H=1 (1 condition off, 0 pts)
- ✅ H=2 (2 conditions off, +5 pts)
- ✅ H=3 (3 conditions off, +15 pts)
- ✅ H=4 (4 conditions off, +25 pts)
- ✅ Toutes combinaisons possibles
- ✅ Exemple de la spec validé

**Implémentation** : `src/services/scoring/risk.ts` (57 lignes)

**Conditions** :
1. Noob hors rôle principal ?
2. Noob hors champion principal ?
3. Carry hors rôle principal ?
4. Carry hors champion principal ?

---

#### ✅ 2.6 Bonus spéciaux (11 tests)

**Fichier** : `src/tests/services/scoring/bonuses.test.ts`

**Tests couverts** :
- ✅ No-Death bonus (0 deaths pour les 2 → +20 pts)
- ✅ Un joueur avec death → 0 pts
- ✅ Edge cases (deaths négatifs, très hauts)

**Implémentation** : `src/services/scoring/bonuses.ts` (21 lignes)

**Note** : MVP et Pentakill optionnels, pas implémentés en v1

---

#### ✅ 2.7 Plafonds (14 tests)

**Fichier** : `src/tests/services/scoring/caps.test.ts`

**Tests couverts** :
- ✅ Plafond joueur : -25 à +70
- ✅ Plafond duo : -50 à +120
- ✅ Valeurs dans range (pas de modification)
- ✅ Valeurs au-dessus (cappé au max)
- ✅ Valeurs en-dessous (cappé au min)
- ✅ Valeurs décimales (avant arrondi)

**Implémentation** : `src/services/scoring/caps.ts` (35 lignes)

---

#### ✅ 2.8 Scoring Engine - Intégration (5 tests)

**Fichier** : `src/tests/services/scoring/engine.test.ts`

**Tests couverts** :
- ✅ **Exemple complet de la spec** (SPECIFICATIONS.md Section 8)
  - Noob : 10K/3D/15A, off-role+champion, 3rd win, Bronze I → Silver IV
  - Carry : 8K/5D/20A, on-role+champion, no streak, Gold III stable
  - Résultat : **94 points** (validé à 100%)
- ✅ Perfect game (both no deaths → +20 bonus)
- ✅ High risk game (H=4 → +25 bonus)
- ✅ Duo feeding hard (caps appliqués)
- ✅ Edge cases

**Implémentation** : `src/services/scoring/engine.ts` (186 lignes)

**Ordre de calcul strict (12 étapes)** :
1. P_KDA individuel
2. Résultat de game
3. Streak
4. Rank change
5. Bonus spéciaux individuels
6. Plafond individuel
7. Arrondi joueur
8. Somme duo
9. Prise de risque
10. Bonus duo
11. Plafond duo
12. Arrondi final

---

## 🆕 Phase 1.5 - Rank Multiplier (TERMINÉE ✅)

### ✅ Nouvelle feature : Équilibrage des duos déséquilibrés

**Problème** : Un duo D4 + P2 (moyenne E3) devrait avoir des gains réduits tant qu'ils ne sont pas proches de leur moyenne.

**Solution** : Multiplicateur basé sur la moyenne de rank du duo.

#### Système de multiplicateur

**Règle** :
- Calculer la moyenne de rank du duo (tier + division)
- Si un joueur est sous `moyenne - 1 tier` → multiplicateur réduit
- Si un joueur est à `moyenne - 1 tier` ou au-dessus → multiplicateur normal (1.0)

**Exemples** :
1. **Duo E4 + B2** :
   - Moyenne ≈ S2
   - Seuil = S2 - 1 tier = B2
   - B2 est au seuil → multiplier = 1.0
   - E4 est au-dessus → multiplier = 1.0

2. **Duo D4 + P2** :
   - Moyenne ≈ E3
   - Seuil = E3 - 1 tier = P3
   - P2 est au-dessus du seuil → multiplier = 1.0
   - D4 est au-dessus → multiplier = 1.0

3. **Duo D1 + G4** :
   - Moyenne ≈ P2
   - Seuil = P2 - 1 tier = G2
   - G4 est en dessous du seuil → multiplier = 0.7 (par exemple)
   - D1 est au-dessus → multiplier = 1.0

#### Tests à créer

**Fichier** : `src/tests/services/scoring/rank-multiplier.test.ts`

```typescript
describe('calculateRankMultiplier', () => {
  describe('Balanced duos (proche moyenne)', () => {
    it('should give 1.0 multiplier when both near average', () => {
      const noobRank = { tier: 'GOLD', division: 'II' }
      const carryRank = { tier: 'GOLD', division: 'IV' }

      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')
      const carryMultiplier = calculateRankMultiplier(noobRank, carryRank, 'carry')

      expect(noobMultiplier).toBe(1.0)
      expect(carryMultiplier).toBe(1.0)
    })
  })

  describe('Unbalanced duos (grande différence)', () => {
    it('should reduce multiplier for player far below average', () => {
      const noobRank = { tier: 'GOLD', division: 'IV' } // G4
      const carryRank = { tier: 'DIAMOND', division: 'I' } // D1
      // Moyenne ≈ P2-P3
      // Seuil = moyenne - 1 tier ≈ G2-G3
      // G4 est sous le seuil → reduction

      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')
      const carryMultiplier = calculateRankMultiplier(noobRank, carryRank, 'carry')

      expect(noobMultiplier).toBeLessThan(1.0) // Réduction (0.7 ou 0.8)
      expect(carryMultiplier).toBe(1.0) // Pas de réduction
    })

    it('should remove reduction once player reaches threshold', () => {
      const noobRank = { tier: 'GOLD', division: 'II' } // G2 (at threshold)
      const carryRank = { tier: 'DIAMOND', division: 'I' } // D1

      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')

      expect(noobMultiplier).toBe(1.0) // Plus de réduction
    })
  })

  describe('Edge cases', () => {
    it('should handle same rank duo', () => {
      const rank = { tier: 'GOLD', division: 'IV' }

      const multiplier = calculateRankMultiplier(rank, rank, 'noob')

      expect(multiplier).toBe(1.0)
    })

    it('should handle Master+ (no divisions)', () => {
      const noobRank = { tier: 'DIAMOND', division: 'I' }
      const carryRank = { tier: 'MASTER', division: null }

      // Devrait calculer la moyenne quand même
      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')

      expect(noobMultiplier).toBeGreaterThan(0)
      expect(noobMultiplier).toBeLessThanOrEqual(1.0)
    })

    it('should handle very large gap (Bronze + Diamond)', () => {
      const noobRank = { tier: 'BRONZE', division: 'IV' }
      const carryRank = { tier: 'DIAMOND', division: 'II' }
      // Moyenne ≈ G3-P4
      // Seuil ≈ S3-G4
      // Bronze IV est TRES loin → forte réduction

      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')

      expect(noobMultiplier).toBeLessThan(0.8) // Forte réduction
    })
  })

  describe('Multiplier curve', () => {
    // Test de la courbe de multiplicateur selon la distance à la moyenne
    const testCases = [
      { distance: 0, expectedMin: 1.0, expectedMax: 1.0 }, // À la moyenne
      { distance: -1, expectedMin: 0.9, expectedMax: 1.0 }, // 1 div sous moyenne
      { distance: -2, expectedMin: 0.85, expectedMax: 0.95 }, // 2 div sous moyenne
      { distance: -4, expectedMin: 0.7, expectedMax: 0.85 }, // 1 tier sous (seuil)
      { distance: -5, expectedMin: 0.6, expectedMax: 0.75 }, // > 1 tier sous
      { distance: -8, expectedMin: 0.5, expectedMax: 0.65 }, // 2 tiers sous
    ]

    it.each(testCases)(
      'should apply appropriate multiplier at distance $distance',
      ({ distance, expectedMin, expectedMax }) => {
        // Créer ranks avec distance contrôlée
        const baseValue = 10 // GOLD IV = 10 (exemple)
        const noobValue = baseValue + distance
        const carryValue = baseValue

        const noobRank = valueToRank(noobValue)
        const carryRank = valueToRank(carryValue)

        const multiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')

        expect(multiplier).toBeGreaterThanOrEqual(expectedMin)
        expect(multiplier).toBeLessThanOrEqual(expectedMax)
      }
    )
  })
})
```

**Implémentation** : `src/services/scoring/rank-multiplier.ts`

**Algorithme proposé** :
1. Convertir ranks en valeurs numériques (IRON IV = 0, CHALLENGER = 36)
2. Calculer moyenne = (noobValue + carryValue) / 2
3. Calculer threshold = moyenne - 4 (1 tier = 4 divisions)
4. Si playerValue < threshold :
   - distance = threshold - playerValue
   - multiplier = max(0.5, 1.0 - distance * 0.05)
5. Sinon : multiplier = 1.0

**Intégration dans l'engine** :
- ✅ Appliqué APRÈS le plafond individuel
- ✅ AVANT l'arrondi final du joueur

```typescript
// Dans engine.ts (lignes 71-76, 125-130)
const noobCapped = applyPlayerCap(noobSubtotal)
const noobRankMultiplier = calculatePlayerRankMultiplier(noobStats.newRank, carryStats.newRank)
const noobAfterMultiplier = noobCapped * noobRankMultiplier
const noobFinal = Math.round(noobAfterMultiplier)
```

#### ✅ Récapitulatif Phase 1.5

**Tests créés** : 77 tests (54 rank-utils + 23 rank-multiplier)
**Fichiers créés** :
- ✅ `src/services/scoring/rank-utils.ts` - Conversions rank ↔ valeur numérique
- ✅ `src/services/scoring/rank-multiplier.ts` - Calcul multiplicateur
- ✅ `src/tests/services/scoring/rank-utils.test.ts` - 54 tests ✅
- ✅ `src/tests/services/scoring/rank-multiplier.test.ts` - 23 tests ✅

**Fichiers modifiés** :
- ✅ `src/services/scoring/engine.ts` - Intégration du multiplicateur
- ✅ `src/types/player.ts` - Ajout champ `initialRank: string` (format "B3", "G2", etc.)

**Total tests** : **212 tests passent** ✅

**Couverture** :
- Duos équilibrés (même rank, écart 1-2 divisions)
- Duos déséquilibrés (grands écarts)
- Courbe progressive de réduction
- Master/GM/Challenger
- Cas limites (minimum 50%, carry jamais pénalisé)
- Scénarios réalistes

---

## 📋 Phase 2 - Handlers (Jours 4-7)

### Jour 4 : Auth Handlers

**À créer** :
- `src/handlers/auth/register.handler.ts`
- `src/handlers/auth/link.handler.ts`
- `src/handlers/auth/unregister.handler.ts`

**Tests** : `src/tests/handlers/auth.test.ts`

#### Test plan exhaustif pour register

```typescript
describe('registerHandler', () => {
  let state: State
  let responses: Response[]

  beforeEach(() => {
    state = state().build()
    responses = []
  })

  describe('Success cases', () => {
    it('should register player with valid Riot ID', async () => {
      const msg = message('REGISTER')
        .withPayload({ riotId: 'Player#EUW' })
        .fromSource('discord123')
        .build()

      await registerHandler(msg, state, responses)

      expect(state.players.has('discord123')).toBe(true)
      const player = state.players.get('discord123')
      expect(player.gameName).toBe('Player')
      expect(player.tagLine).toBe('EUW')
      assertResponseType(responses, 'SUCCESS')
    })

    it('should auto-detect main role from match history', async () => {
      // Mock Riot API avec 10 games en MID
      const msg = message('REGISTER')
        .withPayload({ riotId: 'MidMain#EUW' })
        .fromSource('discord123')
        .build()

      await registerHandler(msg, state, responses)

      const player = state.players.get('discord123')
      expect(player.mainRole.lane).toBe('MIDDLE')
    })

    it('should auto-detect main champion from match history', async () => {
      // Mock Riot API avec 8/10 games sur Yasuo
      const msg = message('REGISTER')
        .withPayload({ riotId: 'YasuoOTP#EUW' })
        .fromSource('discord123')
        .build()

      await registerHandler(msg, state, responses)

      const player = state.players.get('discord123')
      expect(player.mainRole.championName).toBe('Yasuo')
    })
  })

  describe('Validation errors', () => {
    it('should reject if already registered', async () => {
      state.players.set('discord123', player('discord123').build())

      const msg = message('REGISTER')
        .withPayload({ riotId: 'Player#EUW' })
        .fromSource('discord123')
        .build()

      await registerHandler(msg, state, responses)

      assertResponseType(responses, 'ERROR')
      expect(responses[0].content).toContain('déjà inscrit')
    })

    it('should reject if Riot ID format invalid', async () => {
      const msg = message('REGISTER')
        .withPayload({ riotId: 'InvalidFormat' })
        .fromSource('discord123')
        .build()

      await registerHandler(msg, state, responses)

      assertResponseType(responses, 'ERROR')
      expect(responses[0].content).toContain('format invalide')
    })

    it('should reject if Riot account not found', async () => {
      // Mock Riot API 404
      const msg = message('REGISTER')
        .withPayload({ riotId: 'NotExists#EUW' })
        .fromSource('discord123')
        .build()

      await registerHandler(msg, state, responses)

      assertResponseType(responses, 'ERROR')
      expect(responses[0].content).toContain('compte introuvable')
    })

    it('should reject if Riot API error', async () => {
      // Mock Riot API 500
      const msg = message('REGISTER')
        .withPayload({ riotId: 'Player#EUW' })
        .fromSource('discord123')
        .build()

      await registerHandler(msg, state, responses)

      assertResponseType(responses, 'ERROR')
      expect(responses[0].content).toContain('API Riot')
    })

    it('should reject if no ranked games this season', async () => {
      // Mock Riot API avec 0 ranked games
      const msg = message('REGISTER')
        .withPayload({ riotId: 'NoRanked#EUW' })
        .fromSource('discord123')
        .build()

      await registerHandler(msg, state, responses)

      assertResponseType(responses, 'ERROR')
      expect(responses[0].content).toContain('aucune partie ranked')
    })
  })

  describe('Edge cases', () => {
    it('should handle special characters in Riot ID', async () => {
      const msg = message('REGISTER')
        .withPayload({ riotId: 'Plâyér#EUW' })
        .fromSource('discord123')
        .build()

      await registerHandler(msg, state, responses)

      assertResponseType(responses, 'SUCCESS')
    })

    it('should handle very long summoner names', async () => {
      const longName = 'A'.repeat(16) + '#EUW'
      const msg = message('REGISTER')
        .withPayload({ riotId: longName })
        .fromSource('discord123')
        .build()

      await registerHandler(msg, state, responses)

      // Should succeed or reject gracefully
      expect(responses.length).toBeGreaterThan(0)
    })

    it('should handle player with no clear main role', async () => {
      // Mock API avec spread uniforme sur tous les rôles
      const msg = message('REGISTER')
        .withPayload({ riotId: 'FillPlayer#EUW' })
        .fromSource('discord123')
        .build()

      await registerHandler(msg, state, responses)

      const player = state.players.get('discord123')
      // Devrait choisir le rôle le plus joué ou null
      expect(player.mainRole).toBeDefined()
    })
  })
})
```

#### Test plan pour link (créer duo)

```typescript
describe('linkHandler', () => {
  describe('Success cases', () => {
    it('should link two players as duo (noob + carry)', async () => {
      // Setup
      state.players.set('player1', player('player1')
        .withRank('GOLD', 'IV', 50)
        .build()
      )
      state.players.set('player2', player('player2')
        .withRank('PLATINUM', 'II', 30)
        .build()
      )

      const msg = message('LINK_DUO')
        .withPayload({ partnerId: 'player2', duoName: 'Les Zinzins' })
        .fromSource('player1')
        .build()

      await linkHandler(msg, state, responses)

      expect(state.duos.size).toBe(1)
      const duo = Array.from(state.duos.values())[0]
      expect(duo.noobId).toBe('player1') // Gold < Plat → noob
      expect(duo.carryId).toBe('player2')
      expect(duo.name).toBe('Les Zinzins')
      assertResponseType(responses, 'SUCCESS')
    })

    it('should auto-determine noob/carry from rank', async () => {
      state.players.set('plat', player('plat').withRank('PLATINUM', 'IV', 0).build())
      state.players.set('gold', player('gold').withRank('GOLD', 'I', 80).build())

      const msg = message('LINK_DUO')
        .withPayload({ partnerId: 'gold' })
        .fromSource('plat')
        .build()

      await linkHandler(msg, state, responses)

      const duo = Array.from(state.duos.values())[0]
      expect(duo.noobId).toBe('gold') // Rank plus bas
      expect(duo.carryId).toBe('plat')
    })

    it('should generate default duo name if not provided', async () => {
      state.players.set('p1', player('p1').build())
      state.players.set('p2', player('p2').build())

      const msg = message('LINK_DUO')
        .withPayload({ partnerId: 'p2' })
        .fromSource('p1')
        .build()

      await linkHandler(msg, state, responses)

      const duo = Array.from(state.duos.values())[0]
      expect(duo.name).toMatch(/Duo #\d+/)
    })
  })

  describe('Validation errors', () => {
    it('should reject if sender not registered', async () => {
      const msg = message('LINK_DUO')
        .withPayload({ partnerId: 'player2' })
        .fromSource('unregistered')
        .build()

      await linkHandler(msg, state, responses)

      assertResponseType(responses, 'ERROR')
      expect(responses[0].content).toContain('pas inscrit')
    })

    it('should reject if partner not registered', async () => {
      state.players.set('player1', player('player1').build())

      const msg = message('LINK_DUO')
        .withPayload({ partnerId: 'unknown' })
        .fromSource('player1')
        .build()

      await linkHandler(msg, state, responses)

      assertResponseType(responses, 'ERROR')
      expect(responses[0].content).toContain('partenaire introuvable')
    })

    it('should reject if sender already in a duo', async () => {
      state.players.set('p1', player('p1').withDuo(1).build())
      state.players.set('p2', player('p2').build())
      state.duos.set(1, duo('p1', 'p3').build())

      const msg = message('LINK_DUO')
        .withPayload({ partnerId: 'p2' })
        .fromSource('p1')
        .build()

      await linkHandler(msg, state, responses)

      assertResponseType(responses, 'ERROR')
      expect(responses[0].content).toContain('déjà dans un duo')
    })

    it('should reject if partner already in a duo', async () => {
      state.players.set('p1', player('p1').build())
      state.players.set('p2', player('p2').withDuo(1).build())
      state.duos.set(1, duo('p2', 'p3').build())

      const msg = message('LINK_DUO')
        .withPayload({ partnerId: 'p2' })
        .fromSource('p1')
        .build()

      await linkHandler(msg, state, responses)

      assertResponseType(responses, 'ERROR')
      expect(responses[0].content).toContain('partenaire déjà en duo')
    })

    it('should reject if trying to link with self', async () => {
      state.players.set('p1', player('p1').build())

      const msg = message('LINK_DUO')
        .withPayload({ partnerId: 'p1' })
        .fromSource('p1')
        .build()

      await linkHandler(msg, state, responses)

      assertResponseType(responses, 'ERROR')
      expect(responses[0].content).toContain('avec soi-même')
    })
  })

  describe('Edge cases', () => {
    it('should handle same rank players (determine noob/carry by LP)', async () => {
      state.players.set('p1', player('p1').withRank('GOLD', 'IV', 30).build())
      state.players.set('p2', player('p2').withRank('GOLD', 'IV', 70).build())

      const msg = message('LINK_DUO')
        .withPayload({ partnerId: 'p2' })
        .fromSource('p1')
        .build()

      await linkHandler(msg, state, responses)

      const duo = Array.from(state.duos.values())[0]
      expect(duo.noobId).toBe('p1') // 30 LP < 70 LP
      expect(duo.carryId).toBe('p2')
    })

    it('should handle Master+ players (no divisions)', async () => {
      state.players.set('master', player('master').withRank('MASTER', null, 100).build())
      state.players.set('dia', player('dia').withRank('DIAMOND', 'I', 80).build())

      const msg = message('LINK_DUO')
        .withPayload({ partnerId: 'dia' })
        .fromSource('master')
        .build()

      await linkHandler(msg, state, responses)

      const duo = Array.from(state.duos.values())[0]
      expect(duo.noobId).toBe('dia')
      expect(duo.carryId).toBe('master')
    })
  })
})
```

---

### Jours 5-6 : Game Tracking & Scoring

**À créer** :
- `src/services/tracker/game-tracker.ts`
- `src/handlers/tracking/game-detected.handler.ts`
- `src/handlers/tracking/game-ended.handler.ts`
- `src/handlers/tracking/game-scored.handler.ts`

**Tests exhaustifs** :
- Détection de game en cours
- Détection de fin de game
- Application du scoring
- Mise à jour des streaks
- Mise à jour des ranks

---

### Jour 7 : Stats Handlers

**À créer** :
- `src/handlers/stats/ladder.handler.ts`
- `src/handlers/stats/stats.handler.ts`
- `src/handlers/stats/history.handler.ts`
- `src/handlers/stats/duo-stats.handler.ts`

---

## 📋 Phase 3 - Features & Polish (Jours 8-10)

### Jour 8 : Admin Handlers
- `add-points.handler.ts`
- `remove-points.handler.ts`
- `adjust-points.handler.ts`

### Jour 9 : Discord Bot & Formatters
- Slash commands
- Embeds visuels
- Breakdown détaillés
- Auto-completion

### Jour 10 : E2E Tests
- Full game flow (10+ scenarios)
- Multiple games dans une journée
- Rank changes multiples
- Edge cases extrêmes

---

## ✅ Checklist globale

### Phase 1 - Foundations ✅
- [x] Types (7 fichiers)
- [x] Builders (8 builders)
- [x] FixedClock
- [x] KDA (19 tests)
- [x] Game Result (15 tests)
- [x] Streaks (35 tests)
- [x] Rank Change (19 tests)
- [x] Risk (17 tests)
- [x] Bonuses (11 tests)
- [x] Caps (14 tests)
- [x] Engine (5 tests)

**Total Phase 1 : 135 tests ✅**

### Phase 1.5 - Rank Multiplier
- [ ] Rank Multiplier (20+ tests)
- [ ] Intégration dans Engine (5 tests)

### Phase 2 - Handlers
- [ ] Register handler (25+ tests)
- [ ] Link handler (15+ tests)
- [ ] Unregister handler (10 tests)
- [ ] Game tracking (30+ tests)
- [ ] Game scoring (20+ tests)
- [ ] Ladder handler (15 tests)
- [ ] Stats handler (20 tests)
- [ ] History handler (15 tests)

**Objectif Phase 2 : 150+ tests**

### Phase 3 - Integration
- [ ] Admin handlers (15 tests)
- [ ] Discord bot (25 tests)
- [ ] Formatters (20 tests)
- [ ] E2E tests (30+ tests)

**Objectif Phase 3 : 90+ tests**

---

## 🎯 Objectif Final

**Total tests attendus : 395+**
**Couverture : 100% du code critique**
**Date limite MVP : 1er novembre 2025**

**Statut actuel : 232/395 tests (59%) ✅**

---

## 📋 Phase 2 (début) - Handlers Auth (EN COURS)

### ✅ Handler Register (TERMINÉ)

**Fichiers créés** :
- ✅ `src/handlers/auth/register.handler.ts` - Handler d'enregistrement
- ✅ `src/tests/handlers/auth/register.test.ts` - 20 tests ✅

**Fonctionnalités** :
- ✅ Validation format Riot ID (gameName#tagLine)
- ✅ Validation rank initial (format "B3", "G2", etc.)
- ✅ Validation rôle (noob/carry)
- ✅ Détection déjà inscrit
- ✅ Normalisation données (trim, uppercase rank)
- ✅ Initialisation stats à zéro
- ✅ Timestamp registeredAt

**Couverture tests** :
- ✅ Success cases (6 tests) - Inscription standard, roles, formats rank, init stats
- ✅ Validation errors (12 tests) - Champs manquants, formats invalides
- ✅ Edge cases (2 tests) - Whitespace, case-insensitive

---

## ✅ Phase 2 - Handlers d'authentification (TERMINÉE)

### 📝 Récapitulatif complet

**Total** : 33 tests passent ✅

**Fichiers créés** :
1. ✅ `src/handlers/auth/register.handler.ts` - Inscription joueur
2. ✅ `src/handlers/auth/link.handler.ts` - Création duo
3. ✅ `src/handlers/auth/unregister.handler.ts` - Désinscription joueur
4. ✅ `src/tests/handlers/auth/register.test.ts` - 20 tests
5. ✅ `src/tests/handlers/auth/link.test.ts` - 9 tests
6. ✅ `src/tests/handlers/auth/unregister.test.ts` - 4 tests

---

### ✅ 2.1 Handler Register (20 tests)

**Fichier** : `src/handlers/auth/register.handler.ts`
**Tests** : `src/tests/handlers/auth/register.test.ts`

**Fonctionnalités** :
- Valide Riot ID (format `gameName#tagLine`)
- Valide initialRank (format "B3", "G2", "P4", etc.)
- Valide role ('noob' ou 'carry')
- Crée Player avec stats initialisées à zéro
- Gère whitespace et case-insensitive

**Tests couverts** :
- ✅ 6 success cases (inscription standard, roles, formats rank, init stats)
- ✅ 12 validation errors (champs manquants, formats invalides)
- ✅ 2 edge cases (whitespace, case-insensitive)

---

### ✅ 2.2 Handler Link (9 tests)

**Fichier** : `src/handlers/auth/link.handler.ts`
**Tests** : `src/tests/handlers/auth/link.test.ts`

**Fonctionnalités** :
- Crée duo entre deux joueurs inscrits
- Auto-détermine noob/carry via `rankToValue()` et LP
- Génère `duoId` unique
- Génère nom par défaut ou personnalisé
- Met à jour les deux joueurs avec `duoId`

**Tests couverts** :
- ✅ 4 success cases (création duo, auto-detect rôles, nom par défaut, même rank)
- ✅ 5 validation errors (pas inscrit, partenaire introuvable, déjà en duo, self-link, partnerId manquant)

**Algorithme de détection rôles** :
```typescript
function determineRoles(player1, player2) {
  const rank1 = rankToValue(player1.currentRank)
  const rank2 = rankToValue(player2.currentRank)

  if (rank1 < rank2) return { noobId: player1, carryId: player2 }
  if (rank2 < rank1) return { noobId: player2, carryId: player1 }

  // Même rank → comparer LP
  return player1.lp < player2.lp
    ? { noobId: player1, carryId: player2 }
    : { noobId: player2, carryId: player1 }
}
```

---

### ✅ 2.3 Handler Unregister (4 tests)

**Fichier** : `src/handlers/auth/unregister.handler.ts`
**Tests** : `src/tests/handlers/auth/unregister.test.ts`

**Fonctionnalités** :
- Supprime le joueur du state
- Si en duo : dissout le duo
- Libère le partenaire (retire `duoId`)
- Notifie le partenaire de la dissolution

**Tests couverts** :
- ✅ 3 success cases (suppression joueur seul, dissolution duo, notification partenaire)
- ✅ 1 validation error (joueur non inscrit)

**Comportement** :
1. Vérifier que le joueur existe
2. Si `duoId` présent :
   - Récupérer le duo
   - Trouver le partenaire (noobId vs carryId)
   - Libérer le partenaire (`duoId = undefined`)
   - Notifier le partenaire
   - Supprimer le duo du state
3. Supprimer le joueur
4. Confirmer la désinscription

---

## ✅ Phase 3 - Game Tracking (TERMINÉE)

### 📝 Récapitulatif complet

**Total** : 13 tests passent ✅

**Fichiers créés** :
1. ✅ `src/handlers/game/poll.handler.ts` - Polling des matchs terminés
2. ✅ `src/handlers/game/end.handler.ts` - Fin de game et scoring
3. ✅ `src/tests/handlers/game/poll.test.ts` - 6 tests
4. ✅ `src/tests/handlers/game/end.test.ts` - 7 tests

**Note importante** : L'endpoint Riot API `/lol/spectator/v5/active-games` a été restreint récemment. Il n'est plus possible de tracker des games en cours. On utilise donc uniquement `/lol/match/v5/matches` pour récupérer les matchs terminés via polling.

---

### ✅ 3.1 Handler Game Poll (6 tests)

**Fichier** : `src/handlers/game/poll.handler.ts`
**Tests** : `src/tests/handlers/game/poll.test.ts`

**Fonctionnalités** :
- Parcourt tous les duos actifs
- Pour chaque duo, récupère les derniers matchs via Riot API
- Détecte si les 2 joueurs ont joué ensemble (matchId commun)
- Vérifie si le match n'a pas déjà été scoré
- Si nouveau match duo → déclenche le scoring

**Tests couverts** :
- ✅ 4 success cases (nouveau match détecté, pas de re-scoring, ignore solo, multiple duos)
- ✅ 2 validation errors (aucun duo, erreur API gracieuse)

**Algorithme** :
```typescript
1. Récupérer tous les duos actifs
2. Pour chaque duo :
   a. Récupérer PUUID via /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}
   b. Récupérer matchIds via /lol/match/v5/matches/by-puuid/{puuid}/ids?count=5
   c. Trouver les matchIds communs aux deux joueurs
   d. Pour chaque match commun :
      - Vérifier si déjà scoré (state.games.has(matchId))
      - Si non, récupérer détails via /lol/match/v5/matches/{matchId}
      - Vérifier que c'est un ranked solo/duo
      - Déclencher endGameHandler
```

**Fonctions utilitaires** :
- `isMatchAlreadyScored()` - Vérifie si un match est déjà dans state.games
- `findCommonMatches()` - Trouve les matchIds communs entre deux joueurs

---

### ✅ 3.2 Handler Game End (7 tests)

**Fichier** : `src/handlers/game/end.handler.ts`
**Tests** : `src/tests/handlers/game/end.test.ts`

**Fonctionnalités** :
- Récupère les stats complètes du game (KDA, rank change)
- Applique le scoring engine complet
- Met à jour les stats des joueurs (points, wins/losses, winStreak, currentRank)
- Met à jour les stats du duo
- Notifie avec résultat formaté

**Tests couverts** :
- ✅ 4 success cases (victoire, défaite, win streak, promotion)
- ✅ 3 validation errors (gameData manquant, pas en duo, joueurs non inscrits)

**Algorithme** :
```typescript
1. Parser gameData
2. Extraire noobStats et carryStats
3. Récupérer noob et carry depuis state
4. Valider qu'ils sont en duo
5. Appeler calculateGameScore({
     gameData,
     noobStreak: noob.winStreak,
     carryStreak: carry.winStreak
   })
6. Extraire points : noob.final, carry.final, total
7. Mettre à jour :
   - noob.totalPoints += noobPoints
   - noob.currentRank = noobStats.newRank
   - noob.wins++ ou losses++
   - noob.winStreak++ ou = 0
   - Pareil pour carry
   - duo.totalPoints += duoPoints
   - duo.wins++ ou losses++
8. Notifier avec emoji et points
```

**Exemple de notification** :
```
🏆 Les Zinzins - victoire ! | Noob: +45 pts | Carry: +38 pts | Total: +83 pts
```

---

## ✅ Phase 4 - Système de gestion API Key Riot (TERMINÉE)

### 📝 Récapitulatif complet

**Total** : 31 tests passent ✅

**Fichiers créés** :
1. ✅ `src/types/state.ts` - Ajout interface `Dev` et champs config API
2. ✅ `src/handlers/dev/dev.handler.ts` - Authentification développeurs
3. ✅ `src/handlers/dev/key.handler.ts` - Changement clé API
4. ✅ `src/services/api-key-reminders.ts` - Service de rappels automatiques
5. ✅ `src/tests/handlers/dev/dev.test.ts` - 9 tests
6. ✅ `src/tests/handlers/dev/key.test.ts` - 10 tests
7. ✅ `src/tests/services/api-key-reminders.test.ts` - 12 tests

---

### ✅ 4.1 Interface Dev & Config (Type)

**Fichier** : `src/types/state.ts`

**Ajouts** :
```typescript
export interface Dev {
  userId: string // Discord user ID
  username: string // Discord username
  registeredAt: Date
}

export interface Config {
  // ... existant
  devChannelId?: string // Channel pour les messages /dev
  riotApiKeyUpdatedAt?: Date // Quand la clé a été changée
  riotApiKeyReminders?: Date[] // Timestamps des rappels envoyés
}

export interface State {
  // ... existant
  devs: Map<string, Dev> // Devs authentifiés pour recevoir les rappels
}
```

---

### ✅ 4.2 Handler /dev (9 tests)

**Fichier** : `src/handlers/dev/dev.handler.ts`
**Tests** : `src/tests/handlers/dev/dev.test.ts`

**Fonctionnalités** :
- Enregistre un développeur dans `state.devs`
- Les devs recevront les rappels de clé API
- Affiche un message de bienvenue avec commandes disponibles
- Gère les devs déjà enregistrés (mise à jour timestamp)

**Tests couverts** :
- ✅ 5 success cases (enregistrement, déjà enregistré, liste commandes, mentions rappels, multiple devs)
- ✅ 4 edge cases (username vide, espaces, update timestamp, changement username)

**Exemple de réponse** :
```
🎉 Bienvenue DevUsername !

✅ Tu es maintenant authentifié en tant que développeur.

🔔 Rappels automatiques : Tu recevras des notifications quand la clé API Riot approche de son expiration :
   • 22h après le dernier changement
   • 23h après le dernier changement
   • 23h30 après le dernier changement (warning)
   • 24h après le dernier changement (expiration)

📋 Commandes disponibles :
   • `/key <api_key>` - Changer la clé API Riot
   • `/devlist` - Lister les devs authentifiés
```

---

### ✅ 4.3 Handler /key (10 tests)

**Fichier** : `src/handlers/dev/key.handler.ts`
**Tests** : `src/tests/handlers/dev/key.test.ts`

**Fonctionnalités** :
- Change la clé API Riot (`config.riotApiKey`)
- Met à jour le timestamp (`config.riotApiKeyUpdatedAt`)
- Réinitialise les rappels (`config.riotApiKeyReminders = []`)
- Affiche info sur les rappels à venir

**Validation** :
- ✅ Clé doit commencer par `RGAPI-`
- ✅ Clé doit avoir plus de 6 caractères
- ✅ Un seul argument accepté
- ✅ Trim automatique des espaces

**Tests couverts** :
- ✅ 4 success cases (mise à jour, réinit rappels, message rappels, formats valides)
- ✅ 4 validation errors (aucune clé, format invalide, trop courte, trop d'args)
- ✅ 2 edge cases (trim espaces, même clé warning)

---

### ✅ 4.4 Service de rappels automatiques (12 tests)

**Fichier** : `src/services/api-key-reminders.ts`
**Tests** : `src/tests/services/api-key-reminders.test.ts`

**Fonctionnalités** :
- Vérifie l'âge de la clé API toutes les heures
- Envoie des rappels aux devs authentifiés à :
  - **22h** - Rappel simple (expire dans 2h)
  - **23h** - Rappel important (expire dans 1h)
  - **23h30** - WARNING (expire dans 30min) ⚠️
  - **24h** - CRITIQUE (clé expirée) 🚨
- Mentionne tous les devs (@dev1 @dev2) dans chaque message
- Empêche les doublons de rappels

**Tests couverts** :
- ✅ 4 success cases (rappel 22h, 23h, 23h30, 24h)
- ✅ 8 edge cases (no duplicate, no key, no devs, < 22h, multiple devs, > 24h)

**Exemple de message critique (24h)** :
```
@dev1 @dev2

🚨 CRITIQUE - Clé API Riot EXPIRÉE

La clé API a 24 heures et est maintenant expirée !

🔑 Clé actuelle : `RGAPI-xyz`

❌ Le tracking de games est actuellement INTERROMPU.

📝 Commande URGENTE : `/key <nouvelle_clé>`
```

---

## ✅ Phase 5 - Stats Handlers (TERMINÉE)

### Handlers de statistiques

Création de 3 handlers principaux pour afficher les statistiques des duos et joueurs.

#### ✅ Handler /ladder (7 tests)

**Fichiers créés** :
- ✅ `src/handlers/stats/ladder.handler.ts` - Classement des duos
- ✅ `src/tests/handlers/stats/ladder.test.ts` - Tests complets

**Features** :
- Classement décroissant par points
- Pagination (10 duos par page)
- Médailles 🥇🥈🥉 pour top 3
- Position du joueur requêteur
- Format: Nom duo • Points • Bilan (W/L)
- Affichage des joueurs du duo (noob 👥 carry)

**Tests couverts** :
- Affichage classement avec plusieurs duos
- Classement vide
- Un seul duo
- Format avec noms de joueurs
- Pagination (>10 duos)
- Duos avec 0 points
- Duos avec points négatifs

---

#### ✅ Handler /profile (11 tests)

**Fichiers créés** :
- ✅ `src/handlers/stats/profile.handler.ts` - Profil détaillé d'un joueur
- ✅ `src/tests/handlers/stats/profile.test.ts` - Tests complets

**Features** :
- Profil complet du joueur
- Points, bilan W/L, winrate
- Progression de rank (initial → actuel)
- Informations du duo (nom + partenaire)
- Winstreak actuelle (si > 0)
- Consultation d'autres joueurs via mention

**Tests couverts** :
- Profil complet avec duo
- Profil sans duo
- Profil d'un autre joueur via mention
- Calcul du winrate
- Affichage de la progression de rank
- Affichage de la winstreak
- Erreur si joueur non inscrit
- Erreur si joueur mentionné inexistant
- 0 games (nouveau joueur)
- Points négatifs
- Winstreak à 0

---

#### ✅ Handler /history (9 tests)

**Fichiers créés** :
- ✅ `src/handlers/stats/history.handler.ts` - Historique des games d'un duo
- ✅ `src/tests/handlers/stats/history.test.ts` - Tests complets

**Features** :
- Historique complet des games d'un duo
- Tri par date décroissante (plus récent en premier)
- Pagination (10 games par page)
- Pour chaque game: résultat (🏆/💀), points, KDA noob/carry, durée, matchId
- Consultation d'autres duos via mention
- Message spécial si aucune game

**Tests couverts** :
- Historique avec plusieurs games
- Historique joueur sans duo
- Tri par date (plus récent en premier)
- Affichage KDA et points
- Pagination (>10 games)
- Historique d'un autre duo via mention
- Erreur si joueur non inscrit
- Erreur si joueur mentionné inexistant
- 0 games (duo venant d'être créé)

---

### 🐛 Fix critique : Validation teamId

**Problème identifié** : Les soloQ étaient potentiellement comptabilisées si les deux joueurs d'un duo jouaient en même temps (même dans des équipes/matchs différents).

**Solution implémentée** :
1. ✅ Ajout du champ `teamId` (100 ou 200) dans `PlayerGameStats`
2. ✅ Validation dans `endGameHandler` : `noobStats.teamId === carryStats.teamId`
3. ✅ Test vérifiant qu'on ne score PAS si les joueurs sont dans des équipes différentes (1 test)

**Fichiers modifiés** :
- `src/types/game.ts` - Ajout teamId
- `src/handlers/game/end.handler.ts` - Ajout validation
- `src/tests/handlers/game/end.test.ts` - Ajout test (maintenant 8 tests)

---

## 🎨 Phase 2.5 - Architecture UI/UX (TERMINÉ)

### ✅ Système de Constants & Formatters

**Inspiré du Pacte V2** - System de lore et embeds Discord ultra-visuels

**Fichiers créés** :
- ✅ `src/constants/lore.ts` - EMOJIS, COLORS, TAUNTS, utilities
- ✅ `src/formatters/embeds.ts` - Discord embed formatters

**Constants (lore.ts)** :
- ✅ 60+ emojis thématiques (rôles, ranks, résultats, stats)
- ✅ 15+ couleurs Discord contextuelles
- ✅ 50+ taunts motivationnels (victoire, défaite, streaks, motivation)
- ✅ Utilities : `getRankEmoji()`, `getRankColor()`, `interpolate()`, `createProgressBar()`

**Formatters (embeds.ts)** :
- ✅ `formatRegisterSuccess()` - Inscription avec embed coloré
- ✅ `formatError()` - Erreurs avec contexte
- ✅ `formatGameScored()` - Résultat game avec KDA, points, taunts
- ✅ `formatWinStreak()` - Célébration streaks
- ✅ `formatPlayerProfile()` - Stats joueur complètes
- ✅ `formatDuoStats()` - Stats duo avec progression
- ✅ `formatLadder()` - Classement avec médailles 🥇🥈🥉
- ✅ `formatHistory()` - Historique games
- ✅ `formatRankChange()` - Promotion/Démotion avec taunts

**Features clés** :
- 🎨 Embeds visuels avec couleurs contextuelles
- 😀 Emojis partout pour engagement
- 💬 Taunts aléatoires dynamiques
- 📊 Progress bars visuelles
- 🏆 Messages motivationnels selon performance

---

## 📝 Notes d'implémentation

### Ordre de priorité
1. ✅ Scoring Engine (critique) - FAIT (135 tests)
2. ✅ Rank Multiplier (équilibrage) - FAIT (77 tests)
3. ✅ Handler Register (auth) - FAIT (20 tests)
4. ✅ Constants & Formatters (UI/UX) - FAIT
5. ✅ Handlers Link & Unregister (auth) - FAIT (13 tests)
6. ✅ Game tracking & scoring - FAIT (13 tests)
7. ✅ Système de gestion API Key Riot - FAIT (31 tests)
8. ✅ Stats handlers (ladder, profile, history) - FAIT (27 tests)

### Principes TDD stricts
- ✅ Jamais de code sans test
- ✅ Tests exhaustifs pour edge cases
- ✅ Table-driven pour validations
- ✅ Builders pour DRY
- ✅ FixedClock pour déterminisme
- ✅ Assertions précises (toBeCloseTo pour floats)

---

**Dernière mise à jour** : 31 octobre 2025, 02h15
**Auteur** : AdelFC
**Version** : 2.4
