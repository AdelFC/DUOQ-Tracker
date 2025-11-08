/**
 * Formate les résultats de simulation en Markdown lisible
 */

import fs from 'fs'

const csv = fs.readFileSync('simulation_results.csv', 'utf-8')
const lines = csv
  .split('\n')
  .filter((l) => l.trim() && !l.startsWith('===') && !l.startsWith('Duo'))
  .filter((l) => l.match(/^\d+,/) || l.startsWith('Match,'))

// Parse CSV
const rows = lines.map((line) => line.split(','))
const header = rows[0]
const data = rows.slice(1).filter((r) => r[0] && r[0].match(/^\d+$/))

// Create Markdown output
let md = `# Simulation de 50 parties - 3 Duos

## Configuration des Duos

- **Duo 1**: Diamant (carry) + Bronze (noob)
- **Duo 2**: Emeraude (carry) + Silver (noob)
- **Duo 3**: Platine (carry) + Gold (noob)

**Tous partent de Bronze 4 0 LP**

Gains moyens: +28 LP en victoire, -20 LP en défaite

---

## Tableau Complet des Résultats

`

// Create tables per duo
for (let duoNum = 1; duoNum <= 3; duoNum++) {
  const duoName = duoNum === 1 ? 'Duo 1 (Diamant/Bronze)' : duoNum === 2 ? 'Duo 2 (Emeraude/Silver)' : 'Duo 3 (Platine/Gold)'

  md += `\n### ${duoName}\n\n`
  md += `| Match | W/L | Points Total | Carry KDA | Carry Pts | Carry Elo | Noob KDA | Noob Pts | Noob Elo |\n`
  md += `|-------|-----|--------------|-----------|-----------|-----------|----------|----------|----------|\n`

  const baseIdx = duoNum === 1 ? 1 : duoNum === 2 ? 10 : 19

  for (const row of data) {
    const matchNum = row[0]
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

// Add summary
const lastRow = data[data.length - 1]
const duo1Points = lastRow[2]
const duo2Points = lastRow[11]
const duo3Points = lastRow[20]

// Calculate W/L for each duo
const duo1Wins = data.filter((r) => r[1] === 'W').length
const duo1Losses = data.filter((r) => r[1] === 'L').length
const duo2Wins = data.filter((r) => r[10] === 'W').length
const duo2Losses = data.filter((r) => r[10] === 'L').length
const duo3Wins = data.filter((r) => r[19] === 'W').length
const duo3Losses = data.filter((r) => r[19] === 'L').length

const duo1WR = ((duo1Wins / (duo1Wins + duo1Losses)) * 100).toFixed(1)
const duo2WR = ((duo2Wins / (duo2Wins + duo2Losses)) * 100).toFixed(1)
const duo3WR = ((duo3Wins / (duo3Wins + duo3Losses)) * 100).toFixed(1)

md += `## Résumé Final

| Duo | W/L | Winrate | Carry Elo Final | Noob Elo Final | Points Total |
|-----|-----|---------|-----------------|----------------|--------------|
| **Duo 1** (Diamant/Bronze) | ${duo1Wins}W/${duo1Losses}L | ${duo1WR}% | ${lastRow[5]} | ${lastRow[8]} | ${duo1Points} |
| **Duo 2** (Emeraude/Silver) | ${duo2Wins}W/${duo2Losses}L | ${duo2WR}% | ${lastRow[14]} | ${lastRow[17]} | ${duo2Points} |
| **Duo 3** (Platine/Gold) | ${duo3Wins}W/${duo3Losses}L | ${duo3WR}% | ${lastRow[23]} | ${lastRow[26]} | ${duo3Points} |

## Observations

### Winrate et Performance
- Les duos avec un écart d'ELO plus élevé (Diamant/Bronze) ont tendance à avoir un meilleur winrate
- Cependant, le RNG de la simulation peut affecter les résultats
- Le système de multiplicateur pénalise le joueur le plus faible dans les duos déséquilibrés

### Progression en Rank
- Tous les duos progressent depuis Bronze 4
- La vitesse de progression dépend du winrate
- Les KDA reflètent généralement le niveau de compétence réel du joueur

### Système de Points
- Les points sont influencés par: W/L, KDA, rank change, streak
- Le multiplicateur de rank réduit les gains du joueur le plus faible dans les duos très déséquilibrés
- Cela encourage les duos équilibrés
`

fs.writeFileSync('SIMULATION_RESULTS.md', md)
console.log('✅ Fichier SIMULATION_RESULTS.md créé avec succès!')
