/**
 * Simulation pour tester différentes formules de multiplicateur Peak Elo
 * Compare plusieurs approches pour pénaliser les smurfs de manière équitable
 */

import { rankToValue, parseRankString, formatRankString } from './src/services/scoring/rank-utils.js'
import type { RankInfo } from './src/types/player.js'

// Scénarios de test
interface TestScenario {
  name: string
  peakElo: string
  currentRank: string
  description: string
}

const scenarios: TestScenario[] = [
  { name: 'Smurf Diamant en Bronze', peakElo: 'D4', currentRank: 'B4', description: 'Gros smurf (6 tiers)' },
  { name: 'Smurf Diamant en Silver', peakElo: 'D4', currentRank: 'S3', description: 'Smurf moyen (5 tiers)' },
  { name: 'Smurf Diamant en Gold', peakElo: 'D4', currentRank: 'G2', description: 'Petit smurf (3 tiers)' },
  { name: 'Smurf Emeraude en Bronze', peakElo: 'E4', currentRank: 'B4', description: 'Gros smurf (5 tiers)' },
  { name: 'Smurf Emeraude en Silver', peakElo: 'E4', currentRank: 'S4', description: 'Smurf moyen (4 tiers)' },
  { name: 'Smurf Plat en Bronze', peakElo: 'P4', currentRank: 'B4', description: 'Smurf moyen (4 tiers)' },
  { name: 'Smurf Plat en Silver', peakElo: 'P4', currentRank: 'S3', description: 'Petit smurf (3 tiers)' },
  { name: 'Smurf Gold en Bronze', peakElo: 'G4', currentRank: 'B4', description: 'Petit smurf (2 tiers)' },
  { name: 'Joueur à son elo', peakElo: 'G3', currentRank: 'G3', description: 'Pas de smurf (0 tier)' },
  { name: 'Joueur 1 tier en dessous', peakElo: 'G2', currentRank: 'S2', description: 'Légère descente (1 tier)' },
  { name: 'Joueur qui climb', peakElo: 'G4', currentRank: 'P3', description: 'Monte au-dessus du peak' },
]

// ========================================
// FORMULE 1: Linéaire (progressive)
// ========================================
function formula1_Linear(peakElo: string, currentRank: RankInfo): number {
  const peakValue = rankToValue(parseRankString(peakElo))
  const currentValue = rankToValue(currentRank)

  const tierDiff = Math.floor((peakValue - currentValue) / 4) // Nombre de tiers d'écart

  if (tierDiff <= 1) {
    // Tolérance: 1 tier max
    return 1.0
  }

  // Réduction linéaire: -15% par tier au-delà du 1er
  // 2 tiers → 0.85, 3 tiers → 0.70, 4 tiers → 0.55, etc.
  const multiplier = 1.0 - (tierDiff - 1) * 0.15

  return Math.max(0.5, multiplier)
}

// ========================================
// FORMULE 2: Par pallier (step function)
// ========================================
function formula2_Step(peakElo: string, currentRank: RankInfo): number {
  const peakValue = rankToValue(parseRankString(peakElo))
  const currentValue = rankToValue(currentRank)

  const tierDiff = Math.floor((peakValue - currentValue) / 4)

  if (tierDiff <= 1) return 1.0
  if (tierDiff === 2) return 0.85
  if (tierDiff === 3) return 0.70
  if (tierDiff === 4) return 0.60
  if (tierDiff >= 5) return 0.5

  return 1.0
}

// ========================================
// FORMULE 3: Exponentielle (punitive)
// ========================================
function formula3_Exponential(peakElo: string, currentRank: RankInfo): number {
  const peakValue = rankToValue(parseRankString(peakElo))
  const currentValue = rankToValue(currentRank)

  const tierDiff = Math.floor((peakValue - currentValue) / 4)

  if (tierDiff <= 1) return 1.0

  // Réduction exponentielle: 2^tier × 10%
  // 2 tiers → 0.80, 3 tiers → 0.60, 4 tiers → 0.40, 5+ tiers → 0.20
  const reduction = Math.pow(2, tierDiff - 1) * 0.1
  const multiplier = 1.0 - reduction

  return Math.max(0.5, multiplier)
}

// ========================================
// FORMULE 4: Hybride (douce au début, sévère après)
// ========================================
function formula4_Hybrid(peakElo: string, currentRank: RankInfo): number {
  const peakValue = rankToValue(parseRankString(peakElo))
  const currentValue = rankToValue(currentRank)

  const tierDiff = Math.floor((peakValue - currentValue) / 4)

  if (tierDiff <= 1) return 1.0
  if (tierDiff === 2) return 0.90 // Léger malus
  if (tierDiff === 3) return 0.75 // Malus moyen
  if (tierDiff === 4) return 0.60 // Gros malus
  if (tierDiff >= 5) return 0.5 // Malus max

  return 1.0
}

// ========================================
// FORMULE 5: Aucun multiplicateur (baseline)
// ========================================
function formula5_None(_peakElo: string, _currentRank: RankInfo): number {
  return 1.0
}

// ========================================
// Simulation
// ========================================

const formulas = [
  { name: 'Linéaire (-15%/tier)', fn: formula1_Linear },
  { name: 'Par Pallier', fn: formula2_Step },
  { name: 'Exponentielle', fn: formula3_Exponential },
  { name: 'Hybride (douce)', fn: formula4_Hybrid },
  { name: 'Aucun (baseline)', fn: formula5_None },
]

console.log('# Comparaison des Formules de Multiplicateur Peak Elo\n')
console.log('## Scénarios de Test\n')

for (const scenario of scenarios) {
  const peakValue = rankToValue(parseRankString(scenario.peakElo))
  const currentValue = rankToValue(parseRankString(scenario.currentRank))
  const tierDiff = Math.floor((peakValue - currentValue) / 4)

  console.log(`### ${scenario.name}`)
  console.log(`- Peak Elo: ${scenario.peakElo}`)
  console.log(`- Current Rank: ${scenario.currentRank}`)
  console.log(`- Écart: ${tierDiff} tiers`)
  console.log(`- Description: ${scenario.description}`)
  console.log()

  console.log('| Formule | Multiplicateur | Points gagnés (sur 100 base) |')
  console.log('|---------|----------------|------------------------------|')

  for (const formula of formulas) {
    const multiplier = formula.fn(scenario.peakElo, parseRankString(scenario.currentRank))
    const points = Math.round(100 * multiplier)

    console.log(`| ${formula.name} | **${multiplier.toFixed(2)}x** | ${points} pts |`)
  }

  console.log()
}

// ========================================
// Analyse comparative
// ========================================

console.log('## 📊 Analyse Comparative\n')

console.log('### Tableau récapitulatif\n')
console.log('| Scénario | Écart | Linéaire | Pallier | Expo | Hybride | Baseline |')
console.log('|----------|-------|----------|---------|------|---------|----------|')

for (const scenario of scenarios) {
  const peakValue = rankToValue(parseRankString(scenario.peakElo))
  const currentValue = rankToValue(parseRankString(scenario.currentRank))
  const tierDiff = Math.floor((peakValue - currentValue) / 4)

  const m1 = formula1_Linear(scenario.peakElo, parseRankString(scenario.currentRank))
  const m2 = formula2_Step(scenario.peakElo, parseRankString(scenario.currentRank))
  const m3 = formula3_Exponential(scenario.peakElo, parseRankString(scenario.currentRank))
  const m4 = formula4_Hybrid(scenario.peakElo, parseRankString(scenario.currentRank))
  const m5 = formula5_None(scenario.peakElo, parseRankString(scenario.currentRank))

  console.log(
    `| ${scenario.name.slice(0, 25)} | ${tierDiff}T | ${m1.toFixed(2)} | ${m2.toFixed(2)} | ${m3.toFixed(2)} | ${m4.toFixed(2)} | ${m5.toFixed(2)} |`
  )
}

console.log('\n### Recommandations\n')

console.log(`**Formule Linéaire (-15%/tier):**
- ✅ Progressive et prévisible
- ✅ Pénalise proportionnellement l'écart
- ⚠️ Peut être trop sévère pour les gros smurfs (D4 en Bronze → 0.50x)

**Formule Par Pallier:**
- ✅ Simple à comprendre
- ✅ Paliers clairs
- ⚠️ Transitions abruptes entre palliers

**Formule Exponentielle:**
- ✅ Très punitive pour les gros smurfs
- ⚠️ Trop sévère dès 3+ tiers (0.60x pour 3 tiers)
- ❌ Peut décourager les joueurs légitimes en descente

**Formule Hybride (douce):**
- ✅ Tolérante pour 2 tiers (0.90x)
- ✅ Sévère pour les vrais smurfs (4+ tiers → 0.60x)
- ✅ **RECOMMANDÉE** pour équilibre fairness/punition

**Baseline (aucun multiplicateur):**
- ❌ Ne pénalise pas les smurfs
- ❌ Permet de farmer des points en bas elo

---

### 🎯 Recommandation Finale

**Formule Hybride (douce)** semble le meilleur compromis:
- Tolérance pour 1 tier (normal decay, meta shifts, etc.)
- Léger malus pour 2 tiers (-10%)
- Malus significatif pour 3+ tiers (-25% à -50%)
- Ne décourage pas les joueurs légitimes qui ont baissé un peu

Exemple d'impact sur les points:
- Joueur à son elo (0-1 tier): **100% des points** ✓
- Petit smurf (2 tiers): **90% des points** (-10%)
- Smurf moyen (3 tiers): **75% des points** (-25%)
- Gros smurf (4 tiers): **60% des points** (-40%)
- Très gros smurf (5+ tiers): **50% des points** (-50%)
`)
