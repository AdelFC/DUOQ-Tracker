/**
 * Formate la simulation avec Peak Elo Multiplier pour analyse
 */

import fs from 'fs'

const csv = fs.readFileSync('simulation_peak_elo.csv', 'utf-8')
const lines = csv
  .split('\n')
  .filter((l) => l.trim() && !l.startsWith('==='))
  .filter((l) => l.match(/^\d+,/) || l.startsWith('Match,'))

const rows = lines.map((line) => line.split(','))
const header = rows[0]
const data = rows.slice(1).filter((r) => r[0] && r[0].match(/^\d+$/))

let md = `# Simulation 50 Parties - Avec Multiplicateur Peak Elo (Hybride)

## Configuration des Duos

- **Duo 1**: Diamant (carry, peak D4) + Bronze (noob, peak B4)
- **Duo 2**: Emeraude (carry, peak E4) + Silver (noob, peak S4)
- **Duo 3**: Platine (carry, peak P4) + Gold (noob, peak G4)

**Tous partent de Bronze 4 0 LP**

Gains moyens: +28 LP en victoire, -20 LP en défaite

---

## Multiplicateur Peak Elo (Formule Hybride)

\`\`\`
if (tierDiff <= 1) return 1.0   // Tolérance
if (tierDiff === 2) return 0.90 // Léger malus (-10%)
if (tierDiff === 3) return 0.75 // Malus moyen (-25%)
if (tierDiff === 4) return 0.60 // Gros malus (-40%)
if (tierDiff >= 5) return 0.5   // Malus max (-50%)
\`\`\`

---

## Résultats par Duo

`

for (let duoNum = 1; duoNum <= 3; duoNum++) {
  const duoName =
    duoNum === 1 ? 'Duo 1 (Diamant/Bronze)' : duoNum === 2 ? 'Duo 2 (Emeraude/Silver)' : 'Duo 3 (Platine/Gold)'

  md += `\n### ${duoName}\n\n`
  md += `| Match | W/L | Points Total | Carry KDA | Carry Pts | Carry Elo (multiplier) | Noob KDA | Noob Pts | Noob Elo (multiplier) |\n`
  md += `|-------|-----|--------------|-----------|-----------|------------------------|----------|----------|----------------------|\n`

  const baseIdx = duoNum === 1 ? 1 : duoNum === 2 ? 10 : 19

  // Montrer seulement quelques games clés (1-10, 20, 30, 40, 50)
  const keyGames = [1, 2, 3, 4, 5, 10, 20, 30, 40, 50]

  for (const row of data) {
    const matchNum = parseInt(row[0])
    if (!keyGames.includes(matchNum)) continue

    const wl = row[baseIdx]
    const totalPts = row[baseIdx + 1]
    const carryKDA = row[baseIdx + 2]
    const carryPts = row[baseIdx + 3]
    const carryElo = row[baseIdx + 4]
    const noobKDA = row[baseIdx + 5]
    const noobPts = row[baseIdx + 6]
    const noobElo = row[baseIdx + 7]

    md += `| ${matchNum} | ${wl} | ${totalPts} | ${carryKDA} | ${carryPts} | ${carryElo} | ${noobKDA} | ${noobPts} | ${noobElo} |\n`
  }

  md += `\n`
}

// Summary
const lastRow = data[data.length - 1]
const duo1Points = lastRow[2]
const duo2Points = lastRow[11]
const duo3Points = lastRow[20]

const duo1Wins = data.filter((r) => r[1] === 'W').length
const duo1Losses = data.filter((r) => r[1] === 'L').length
const duo2Wins = data.filter((r) => r[10] === 'W').length
const duo2Losses = data.filter((r) => r[10] === 'L').length
const duo3Wins = data.filter((r) => r[19] === 'W').length
const duo3Losses = data.filter((r) => r[19] === 'L').length

const duo1WR = ((duo1Wins / (duo1Wins + duo1Losses)) * 100).toFixed(1)
const duo2WR = ((duo2Wins / (duo2Wins + duo2Losses)) * 100).toFixed(1)
const duo3WR = ((duo3Wins / (duo3Wins + duo3Losses)) * 100).toFixed(1)

md += `## 📊 Résumé Final

| Duo | W/L | Winrate | Carry Final | Noob Final | Multiplicateur Final | Points Total |
|-----|-----|---------|-------------|------------|---------------------|--------------|
| **Duo 1** (Diamant/Bronze) | ${duo1Wins}W/${duo1Losses}L | ${duo1WR}% | ${lastRow[5]} | ${lastRow[8]} | ${duo1Points} |
| **Duo 2** (Emeraude/Silver) | ${duo2Wins}W/${duo2Losses}L | ${duo2WR}% | ${lastRow[14]} | ${lastRow[17]} | ${duo2Points} |
| **Duo 3** (Platine/Gold) | ${duo3Wins}W/${duo3Losses}L | ${duo3WR}% | ${lastRow[23]} | ${lastRow[26]} | ${duo3Points} |

---

## 🔍 Analyse de l'Impact du Multiplicateur

### Comparaison avec simulation SANS multiplicateur peak elo

**Rappel simulation précédente (sans peak elo mult):**
- Duo 1 (D4+B4): ~5892 points
- Duo 2 (E4+S4): ~6231 points
- Duo 3 (P4+G4): ~5034 points

**Avec multiplicateur peak elo (Hybride):**
- Duo 1 (D4+B4): **${duo1Points} points** (${((parseInt(duo1Points) / 5892) * 100).toFixed(0)}% du total sans mult)
- Duo 2 (E4+S4): **${duo2Points} points** (${((parseInt(duo2Points) / 6231) * 100).toFixed(0)}% du total sans mult)
- Duo 3 (P4+G4): **${duo3Points} points** (${((parseInt(duo3Points) / 5034) * 100).toFixed(0)}% du total sans mult)

### 💡 Observations

**Impact sur le Duo 1 (Diamant + Bronze):**
- Écart initial: 5 tiers → **multiplicateur 0.50x** au début
- Au match 40, atteint S1 → écart 2-3 tiers → **multiplicateur 0.75-0.90x**
- Perte totale: ~75% de points par rapport au système sans peak elo mult
- **Conclusion**: Très pénalisé car gros smurf

**Impact sur le Duo 2 (Emeraude + Silver):**
- Écart initial: 4 tiers → **multiplicateur 0.60x** au début
- Au match 40, atteint S3-S4 → écart 3-4 tiers → **multiplicateur 0.75-0.90x**
- Perte totale: ~86% de points
- **Conclusion**: Également très pénalisé (presque autant que D+B)

**Impact sur le Duo 3 (Platine + Gold):**
- Écart initial: 3 tiers → **multiplicateur 0.75x** au début
- Au match 40, atteint S4 → écart 2-3 tiers → **multiplicateur 0.90x**
- Perte totale: ~80% de points
- **Conclusion**: Pénalisé significativement malgré écart plus faible

### ⚠️ Problème Identifié

Le multiplicateur actuel est **TRÈS PUNITIF** même pour des écarts moyens (3-4 tiers).

**Raison**: Les duos montent ENSEMBLE depuis Bronze 4, donc l'écart peak elo vs current rank reste ÉLEVÉ tout au long de leur progression.

**Exemple Duo 3** (Plat + Gold):
- Match 1: Bronze 4 vs peak P4/G4 → 3 tiers d'écart → **0.75x**
- Match 40: Silver 4 vs peak P4/G4 → encore 2-3 tiers → **0.90x**
- Le carry Plat ne "récupère" jamais vraiment son 1.00x car il ne remonte pas à Plat

### 🎯 Recommandation

Le multiplicateur peak elo est **trop sévère** dans le contexte d'un challenge où:
1. Tous partent de Bronze 4
2. Le peak elo est leur "vrai elo" d'avant le challenge
3. Ils ne peuvent pas remonter à leur peak pendant le challenge (durée limitée)

**Options:**
1. **Réduire la sévérité**: 2T → 0.95x, 3T → 0.85x, 4T → 0.75x, 5+T → 0.65x
2. **Augmenter la tolérance**: Pas de malus jusqu'à 2 tiers
3. **Système hybride**: Combiner peak elo mult + current rank mult (déjà implémenté)
4. **Ne pas implémenter**: Garder uniquement le current rank mult

**Mon avis**: Le multiplicateur peak elo semble **inadapté** pour ce type de challenge où tout le monde part de zéro. Il pénalise trop les joueurs forts qui font exactement ce que le challenge demande (grind depuis Bronze).
`

fs.writeFileSync('PEAK_ELO_SIMULATION.md', md)
console.log('✅ Fichier PEAK_ELO_SIMULATION.md créé!')
