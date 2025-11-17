# Revue Complète: /admin recalculate

## 📊 Résumé

La commande `/admin recalculate` fonctionne correctement pour les cas d'usage principaux mais a **UN PROBLÈME CRITIQUE** avec les ranks historiques qui affecte le multiplicateur peak elo.

---

## ✅ CE QUI FONCTIONNE CORRECTEMENT

### 1. Mise à jour des données State

**Recalculate modifie:**
- ✅ `state.players`:
  - `totalPoints` ← recalculé depuis zéro
  - `gamesPlayed` ← recompté
  - `wins` / `losses` ← recompté
  - `streaks` ← recalculé chronologiquement
  - `currentRank` ← mis à jour avec newRank de chaque game
  - `lastGameAt` ← dernière game jouée
- ✅ `state.duos`:
  - `totalPoints` ← somme des points des games
  - `gamesPlayed` ← nombre de games
  - `wins` / `losses` ← recompté
  - `currentStreak` / `longestWinStreak` / `longestLossStreak` ← recalculé
  - `lastGameAt` ← dernière game jouée
- ✅ `state.games`:
  - Complètement reconstruit avec les nouvelles games re-pollées
  - `pointsAwarded` correctement stocké pour chaque game

### 2. Commandes qui lisent les données

#### `/ladder`
Lit: `state.duos` (totalPoints, wins, losses, gamesPlayed) + `state.players` (gameName)
- ✅ **Toutes ces données sont correctement mises à jour par recalculate**

#### `/profile`
Lit: `state.players` (totalPoints, wins, losses, streaks, currentRank, initialRank) + `state.duos` (totalPoints, wins, losses, streaks)
- ✅ **Toutes ces données sont correctement mises à jour par recalculate**

#### `/history`
Lit: `state.games` (pointsAwarded, win, KDA, duration, matchId)
- ✅ **state.games est complètement reconstruit avec les bons pointsAwarded**

### 3. Persistence

Le PersistenceService sauvegarde automatiquement:
- ✅ `players` (Array)
- ✅ `duos` (Array)
- ✅ `games` (Array)
- ✅ Auto-save toutes les 5 minutes + save on shutdown

**Toutes les données modifiées par recalculate sont bien persistées.**

### 4. Filtrage par team

Quand `/admin recalculate team:TeamName`:
- ✅ Ne reset que les stats de la team spécifiée (pas toutes les teams)
- ✅ Ne supprime que les games de cette team dans state.games
- ✅ Re-poll et rescore seulement les games de ce duo
- ✅ Pas de risque de double comptage entre teams
- ✅ Permet de contourner les rate limits en faisant team par team

---

## ❌ PROBLÈME CRITIQUE: Ranks Historiques

### Le Problème

**Les ranks utilisés pour le recalcul ne sont PAS les ranks historiques au moment des games, mais les ranks ACTUELS de l'API Riot.**

#### Code problématique (recalculate.handler.ts:145-154)

```typescript
// Fetch current ranks from Riot API
let noobNewRank = noob.currentRank
let carryNewRank = carry.currentRank

try {
  const [noobRank, carryRank] = await Promise.all([
    state.riotService.getRankBySummonerId(noobData.summonerId),  // ← RANK ACTUEL
    state.riotService.getRankBySummonerId(carryData.summonerId), // ← RANK ACTUEL
  ])

  if (noobRank) noobNewRank = noobRank
  if (carryRank) carryNewRank = carryRank
```

#### Puis (lignes 180, 204):

```typescript
previousRank: noob.currentRank,  // ← Rank dans state (peut être déjà modifié)
newRank: noobNewRank,             // ← Rank actuel de l'API (pas historique)
```

### Conséquences

1. **Peak Elo Multiplier incorrect:**
   - Le multiplicateur est calculé avec `previousRank` (rank au moment de la game)
   - Mais `previousRank` = `currentRank` du state qui peut déjà avoir été modifié
   - Et même si on reset `currentRank` à `initialRank`, ce n'est pas le rank exact au moment de chaque game

2. **Exemple concret:**
   - Joueur avec peak D1
   - Game jouée il y a 2 semaines: rank était P2
   - Aujourd'hui: rank est G4
   - **Recalculate utilisera G4 pour previousRank ET newRank**
   - Multiplicateur sera calculé comme "D1 vs G4" = ×0.80 (malus -20%)
   - Alors qu'à l'époque c'était "D1 vs P2" = ×1.00 (tolerance)

3. **Toutes les games auront probablement le même rank:**
   - Si un joueur est G2 aujourd'hui, toutes ses games rescorées auront previousRank=G2 et newRank=G2
   - Le peak elo multiplier sera le même pour toutes les games
   - Alors qu'en réalité le joueur a peut-être monté/descendu entre les games

### Pourquoi c'est critique

- Le peak elo multiplier peut varier de ×0.70 à ×1.20 (différence de 50%)
- Utiliser les mauvais ranks peut changer le score final de -30% à +20%
- **Le rescoring n'est PAS fidèle aux conditions réelles des games**

---

## 🔧 SOLUTION PROPOSÉE

### Option 1: Stocker les ranks dans TrackedGame (RECOMMANDÉ)

**Modifier `TrackedGame` pour inclure les ranks:**

```typescript
export interface TrackedGame {
  // ... existing fields ...

  // Rank history (pour recalculate)
  noobPreviousRank?: RankInfo  // Rank du noob au début de la game
  noobNewRank?: RankInfo       // Rank du noob après la game
  carryPreviousRank?: RankInfo // Rank du carry au début de la game
  carryNewRank?: RankInfo      // Rank du carry après la game
  noobPeakElo?: string         // Peak elo du noob au moment de la game
  carryPeakElo?: string        // Peak elo du carry au moment de la game
}
```

**Modifications nécessaires:**

1. **auto-poll.service.ts** (quand une game est scorée):
   - Stocker previousRank et newRank dans TrackedGame
   - Ces ranks sont RÉELS car récupérés au moment de la game

2. **recalculate.handler.ts**:
   - Si TrackedGame a déjà des ranks stockés → les réutiliser
   - Sinon → utiliser les ranks actuels (fallback pour anciennes games)

**Avantages:**
- ✅ Recalculate utilisera les ranks historiques corrects
- ✅ Peak elo multiplier sera précis
- ✅ Backwards compatible (fallback sur ranks actuels si pas stockés)
- ✅ Permet des recalculates illimités sans perte de précision

**Inconvénients:**
- ❌ Nécessite une migration des données (anciennes games n'auront pas les ranks)
- ❌ Augmente la taille de state.json

### Option 2: Reset currentRank à initialRank avant recalculate

**Plus simple mais moins précis:**

Avant de rescorer, faire:
```typescript
for (const playerId of playerIdsToReset) {
  const player = state.players.get(playerId)
  if (!player) continue
  player.currentRank = player.initialRank  // ← Reset au rank de départ
  // ... autres resets
}
```

**Avantages:**
- ✅ Facile à implémenter
- ✅ Pas de migration de données

**Inconvénients:**
- ❌ Toujours pas les ranks historiques exacts
- ❌ Suppose que le joueur était à son initialRank pour toutes les games
- ❌ Peak elo multiplier sera toujours calculé avec initialRank → newRank

### Option 3: Ne rien faire et documenter la limitation

**Accepter que recalculate est une approximation:**
- Les ranks utilisés seront actuels, pas historiques
- Documenter clairement cette limitation
- Utile principalement pour corriger le code de scoring, pas pour précision historique

---

## 📋 RECOMMANDATION

### Pour maintenant (court terme)

**Option 2 + Documentation:**
1. Reset `currentRank` à `initialRank` avant recalculate
2. Ajouter un warning dans le message de succès:
   ```
   ⚠️ Note: Les ranks utilisés sont une approximation
   Pour un scoring précis, utilisez le système en temps réel
   ```

### Pour le futur (long terme)

**Option 1 si tu veux un système robuste:**
1. Modifier `TrackedGame` pour stocker les ranks
2. Mettre à jour auto-poll pour sauvegarder les ranks
3. Mettre à jour recalculate pour réutiliser les ranks stockés
4. Migration: Anciennes games gardent le fallback (ranks actuels)

---

## 🎯 CHECKLIST FINALE

### Fonctionnalités testées

- [x] `/ladder` affiche les bons totaux après recalculate
- [x] `/profile` affiche les bonnes stats après recalculate
- [x] `/history` affiche les bons pointsAwarded après recalculate
- [x] Recalculate par team ne touche que cette team
- [x] Recalculate complet reset et rescore toutes les teams
- [x] Persistence sauvegarde toutes les données modifiées
- [x] Streaks recalculés chronologiquement (remakes ignorés)
- [x] pointsAwarded correctement stocké dans state.games
- [⚠️] Ranks historiques (problème documenté ci-dessus)

### Comportements vérifiés

- [x] Re-poll fetch les games depuis l'API Riot (max 100 par joueur)
- [x] Games filtrées par date (startDate paramètre)
- [x] Games triées chronologiquement avant rescore
- [x] Delay de 100ms entre chaque duo pour éviter rate limits
- [x] Gestion des erreurs si team introuvable
- [x] Message de succès avec stats (games re-pollées, rescorées, duos traités)
- [x] Auto-save persistence après recalculate (dans les 5 min)

---

## 💡 CONCLUSION

**Le système recalculate fonctionne bien pour:**
- ✅ Corriger des bugs de scoring
- ✅ Appliquer de nouvelles formules (comme v3.0)
- ✅ Reconstruire state.games perdu
- ✅ Rescorer après changement de peak elo

**Mais attention:**
- ⚠️ Les ranks utilisés ne sont PAS historiques (problème peak elo multiplier)
- ⚠️ Rate limits Riot API (d'où le paramètre team pour faire manuellement)
- ⚠️ Anciennes games (>100 récentes) ne seront pas re-pollées

**Pour un usage en production:**
- 👍 Utiliser `/admin recalculate team:TeamName` pour éviter rate limits
- 👍 Faire les recalculates team par team
- 👍 Accepter que les ranks sont approximatifs (ou implémenter Option 1)
- 👍 Documenter clairement cette limitation aux utilisateurs
