# Comparaison des Formules de Multiplicateur Peak Elo

## Scénarios de Test

### Smurf Diamant en Bronze
- Peak Elo: D4
- Current Rank: B4
- Écart: 5 tiers
- Description: Gros smurf (6 tiers)

| Formule | Multiplicateur | Points gagnés (sur 100 base) |
|---------|----------------|------------------------------|
| Linéaire (-15%/tier) | **0.50x** | 50 pts |
| Par Pallier | **0.50x** | 50 pts |
| Exponentielle | **0.50x** | 50 pts |
| Hybride (douce) | **0.50x** | 50 pts |
| Aucun (baseline) | **1.00x** | 100 pts |

### Smurf Diamant en Silver
- Peak Elo: D4
- Current Rank: S3
- Écart: 3 tiers
- Description: Smurf moyen (5 tiers)

| Formule | Multiplicateur | Points gagnés (sur 100 base) |
|---------|----------------|------------------------------|
| Linéaire (-15%/tier) | **0.70x** | 70 pts |
| Par Pallier | **0.70x** | 70 pts |
| Exponentielle | **0.60x** | 60 pts |
| Hybride (douce) | **0.75x** | 75 pts |
| Aucun (baseline) | **1.00x** | 100 pts |

### Smurf Diamant en Gold
- Peak Elo: D4
- Current Rank: G2
- Écart: 2 tiers
- Description: Petit smurf (3 tiers)

| Formule | Multiplicateur | Points gagnés (sur 100 base) |
|---------|----------------|------------------------------|
| Linéaire (-15%/tier) | **0.85x** | 85 pts |
| Par Pallier | **0.85x** | 85 pts |
| Exponentielle | **0.80x** | 80 pts |
| Hybride (douce) | **0.90x** | 90 pts |
| Aucun (baseline) | **1.00x** | 100 pts |

### Smurf Emeraude en Bronze
- Peak Elo: E4
- Current Rank: B4
- Écart: 4 tiers
- Description: Gros smurf (5 tiers)

| Formule | Multiplicateur | Points gagnés (sur 100 base) |
|---------|----------------|------------------------------|
| Linéaire (-15%/tier) | **0.55x** | 55 pts |
| Par Pallier | **0.60x** | 60 pts |
| Exponentielle | **0.50x** | 50 pts |
| Hybride (douce) | **0.60x** | 60 pts |
| Aucun (baseline) | **1.00x** | 100 pts |

### Smurf Emeraude en Silver
- Peak Elo: E4
- Current Rank: S4
- Écart: 3 tiers
- Description: Smurf moyen (4 tiers)

| Formule | Multiplicateur | Points gagnés (sur 100 base) |
|---------|----------------|------------------------------|
| Linéaire (-15%/tier) | **0.70x** | 70 pts |
| Par Pallier | **0.70x** | 70 pts |
| Exponentielle | **0.60x** | 60 pts |
| Hybride (douce) | **0.75x** | 75 pts |
| Aucun (baseline) | **1.00x** | 100 pts |

### Smurf Plat en Bronze
- Peak Elo: P4
- Current Rank: B4
- Écart: 3 tiers
- Description: Smurf moyen (4 tiers)

| Formule | Multiplicateur | Points gagnés (sur 100 base) |
|---------|----------------|------------------------------|
| Linéaire (-15%/tier) | **0.70x** | 70 pts |
| Par Pallier | **0.70x** | 70 pts |
| Exponentielle | **0.60x** | 60 pts |
| Hybride (douce) | **0.75x** | 75 pts |
| Aucun (baseline) | **1.00x** | 100 pts |

### Smurf Plat en Silver
- Peak Elo: P4
- Current Rank: S3
- Écart: 1 tiers
- Description: Petit smurf (3 tiers)

| Formule | Multiplicateur | Points gagnés (sur 100 base) |
|---------|----------------|------------------------------|
| Linéaire (-15%/tier) | **1.00x** | 100 pts |
| Par Pallier | **1.00x** | 100 pts |
| Exponentielle | **1.00x** | 100 pts |
| Hybride (douce) | **1.00x** | 100 pts |
| Aucun (baseline) | **1.00x** | 100 pts |

### Smurf Gold en Bronze
- Peak Elo: G4
- Current Rank: B4
- Écart: 2 tiers
- Description: Petit smurf (2 tiers)

| Formule | Multiplicateur | Points gagnés (sur 100 base) |
|---------|----------------|------------------------------|
| Linéaire (-15%/tier) | **0.85x** | 85 pts |
| Par Pallier | **0.85x** | 85 pts |
| Exponentielle | **0.80x** | 80 pts |
| Hybride (douce) | **0.90x** | 90 pts |
| Aucun (baseline) | **1.00x** | 100 pts |

### Joueur à son elo
- Peak Elo: G3
- Current Rank: G3
- Écart: 0 tiers
- Description: Pas de smurf (0 tier)

| Formule | Multiplicateur | Points gagnés (sur 100 base) |
|---------|----------------|------------------------------|
| Linéaire (-15%/tier) | **1.00x** | 100 pts |
| Par Pallier | **1.00x** | 100 pts |
| Exponentielle | **1.00x** | 100 pts |
| Hybride (douce) | **1.00x** | 100 pts |
| Aucun (baseline) | **1.00x** | 100 pts |

### Joueur 1 tier en dessous
- Peak Elo: G2
- Current Rank: S2
- Écart: 1 tiers
- Description: Légère descente (1 tier)

| Formule | Multiplicateur | Points gagnés (sur 100 base) |
|---------|----------------|------------------------------|
| Linéaire (-15%/tier) | **1.00x** | 100 pts |
| Par Pallier | **1.00x** | 100 pts |
| Exponentielle | **1.00x** | 100 pts |
| Hybride (douce) | **1.00x** | 100 pts |
| Aucun (baseline) | **1.00x** | 100 pts |

### Joueur qui climb
- Peak Elo: G4
- Current Rank: P3
- Écart: -2 tiers
- Description: Monte au-dessus du peak

| Formule | Multiplicateur | Points gagnés (sur 100 base) |
|---------|----------------|------------------------------|
| Linéaire (-15%/tier) | **1.00x** | 100 pts |
| Par Pallier | **1.00x** | 100 pts |
| Exponentielle | **1.00x** | 100 pts |
| Hybride (douce) | **1.00x** | 100 pts |
| Aucun (baseline) | **1.00x** | 100 pts |

## 📊 Analyse Comparative

### Tableau récapitulatif

| Scénario | Écart | Linéaire | Pallier | Expo | Hybride | Baseline |
|----------|-------|----------|---------|------|---------|----------|
| Smurf Diamant en Bronze | 5T | 0.50 | 0.50 | 0.50 | 0.50 | 1.00 |
| Smurf Diamant en Silver | 3T | 0.70 | 0.70 | 0.60 | 0.75 | 1.00 |
| Smurf Diamant en Gold | 2T | 0.85 | 0.85 | 0.80 | 0.90 | 1.00 |
| Smurf Emeraude en Bronze | 4T | 0.55 | 0.60 | 0.50 | 0.60 | 1.00 |
| Smurf Emeraude en Silver | 3T | 0.70 | 0.70 | 0.60 | 0.75 | 1.00 |
| Smurf Plat en Bronze | 3T | 0.70 | 0.70 | 0.60 | 0.75 | 1.00 |
| Smurf Plat en Silver | 1T | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| Smurf Gold en Bronze | 2T | 0.85 | 0.85 | 0.80 | 0.90 | 1.00 |
| Joueur à son elo | 0T | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| Joueur 1 tier en dessous | 1T | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| Joueur qui climb | -2T | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |

### Recommandations

**Formule Linéaire (-15%/tier):**
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

