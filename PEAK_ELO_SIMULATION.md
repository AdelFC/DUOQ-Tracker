# Simulation 50 Parties - Avec Multiplicateur Peak Elo (Hybride)

## Configuration des Duos

- **Duo 1**: Diamant (carry, peak D4) + Bronze (noob, peak B4)
- **Duo 2**: Emeraude (carry, peak E4) + Silver (noob, peak S4)
- **Duo 3**: Platine (carry, peak P4) + Gold (noob, peak G4)

**Tous partent de Bronze 4 0 LP**

Gains moyens: +28 LP en victoire, -20 LP en défaite

---

## Multiplicateur Peak Elo (Formule Hybride)

```
if (tierDiff <= 1) return 1.0   // Tolérance
if (tierDiff === 2) return 0.90 // Léger malus (-10%)
if (tierDiff === 3) return 0.75 // Malus moyen (-25%)
if (tierDiff === 4) return 0.60 // Gros malus (-40%)
if (tierDiff >= 5) return 0.5   // Malus max (-50%)
```

---

## Résultats par Duo


### Duo 1 (Diamant/Bronze)

| Match | W/L | Points Total | Carry KDA | Carry Pts | Carry Elo (multiplier) | Noob KDA | Noob Pts | Noob Elo (multiplier) |
|-------|-----|--------------|-----------|-----------|------------------------|----------|----------|----------------------|
| 1 | W | 34 | 20/1/16 | 16 | B4 26LP (x0.50) | 7/3/7 | 18 | B4 29LP (x1.00) |
| 2 | W | 54 | 20/1/18 | 11 | B4 55LP (x0.50) | 8/4/10 | 9 | B4 59LP (x1.00) |
| 3 | W | 65 | 20/2/23 | 11 | B4 84LP (x0.50) | 6/4/5 | 0 | B4 86LP (x1.00) |
| 4 | W | 177 | 20/1/17 | 42 | B3 10LP (x0.60) | 6/2/13 | 70 | B3 17LP (x1.00) |
| 5 | W | 232 | 6/2/11 | 21 | B3 37LP (x0.60) | 5/4/10 | 34 | B3 46LP (x1.00) |
| 10 | W | 363 | 20/1/17 | 25 | B2 32LP (x0.60) | 6/2/12 | 26 | B2 44LP (x1.00) |
| 20 | W | 764 | 8/2/9 | 1 | S4 58LP (x0.60) | 8/2/12 | 6 | S4 74LP (x1.00) |
| 30 | L | 888 | 8/3/8 | -15 | S3 38LP (x0.75) | 2/8/3 | -25 | S3 37LP (x1.00) |
| 40 | W | 1078 | 18/1/20 | 53 | S1 16LP (x0.75) | 5/3/8 | 66 | S1 14LP (x1.00) |
| 50 | W | 1496 | 20/2/17 | 21 | G3 47LP (x0.90) | 8/3/8 | 14 | G3 42LP (x1.00) |


### Duo 2 (Emeraude/Silver)

| Match | W/L | Points Total | Carry KDA | Carry Pts | Carry Elo (multiplier) | Noob KDA | Noob Pts | Noob Elo (multiplier) |
|-------|-----|--------------|-----------|-----------|------------------------|----------|----------|----------------------|
| 1 | W | 42 | 15/2/22 | 17 | B4 27LP (x0.60) | 11/4/10 | 25 | B4 30LP (x1.00) |
| 2 | L | 24 | 8/3/10 | -4 | B4 9LP (x0.60) | 5/8/4 | -14 | B4 9LP (x1.00) |
| 3 | W | 54 | 20/1/14 | 16 | B4 39LP (x0.60) | 6/2/7 | 14 | B4 38LP (x1.00) |
| 4 | W | 74 | 18/2/16 | 7 | B4 69LP (x0.60) | 10/2/14 | 13 | B4 67LP (x1.00) |
| 5 | L | 34 | 9/3/8 | -15 | B4 48LP (x0.60) | 5/6/8 | -25 | B4 49LP (x1.00) |
| 10 | W | 7 | 18/1/20 | 4 | B4 92LP (x0.60) | 6/2/16 | -3 | B4 95LP (x1.00) |
| 20 | W | 455 | 16/1/16 | 19 | B2 59LP (x0.75) | 7/2/12 | 21 | B2 54LP (x1.00) |
| 30 | W | 571 | 15/2/13 | 13 | B1 44LP (x0.75) | 10/4/14 | 22 | B1 38LP (x1.00) |
| 40 | L | 1058 | 9/3/9 | -8 | S3 13LP (x0.90) | 5/7/7 | -11 | S3 12LP (x1.00) |
| 50 | L | 874 | 9/3/9 | -19 | S4 30LP (x0.75) | 5/7/8 | -25 | S4 33LP (x1.00) |


### Duo 3 (Platine/Gold)

| Match | W/L | Points Total | Carry KDA | Carry Pts | Carry Elo (multiplier) | Noob KDA | Noob Pts | Noob Elo (multiplier) |
|-------|-----|--------------|-----------|-----------|------------------------|----------|----------|----------------------|
| 1 | L | 3 | 8/3/7 | 2 | B4 0LP (x0.75) | 5/7/7 | 1 | B4 0LP (x0.90) |
| 2 | W | 49 | 12/2/17 | 17 | B4 25LP (x0.75) | 13/3/14 | 29 | B4 30LP (x0.90) |
| 3 | L | 40 | 8/3/11 | -4 | B4 5LP (x0.75) | 7/6/8 | -5 | B4 8LP (x0.90) |
| 4 | L | 43 | 9/3/6 | 1 | B4 0LP (x0.75) | 7/6/8 | 2 | B4 0LP (x0.90) |
| 5 | W | 95 | 18/1/18 | 23 | B4 29LP (x0.75) | 10/2/18 | 29 | B4 30LP (x0.90) |
| 10 | L | 15 | 4/6/6 | -19 | B4 0LP (x0.75) | 4/4/9 | -22 | B4 0LP (x0.90) |
| 20 | W | 4 | 13/1/12 | -2 | B4 94LP (x0.75) | 7/2/14 | 2 | B4 82LP (x0.90) |
| 30 | W | 711 | 16/1/16 | 24 | B1 27LP (x0.90) | 14/2/13 | 70 | B1 5LP (x1.00) |
| 40 | W | 929 | 20/1/16 | 63 | S4 15LP (x0.90) | 8/2/16 | 9 | B1 73LP (x1.00) |
| 50 | W | 1026 | 13/1/13 | 16 | S4 41LP (x0.90) | 8/2/10 | 70 | S4 3LP (x1.00) |

## 📊 Résumé Final

| Duo | W/L | Winrate | Carry Final | Noob Final | Multiplicateur Final | Points Total |
|-----|-----|---------|-------------|------------|---------------------|--------------|
| **Duo 1** (Diamant/Bronze) | 41W/9L | 82.0% | G3 47LP (x0.90) | G3 42LP (x1.00) | 1496 |
| **Duo 2** (Emeraude/Silver) | 31W/19L | 62.0% | S4 30LP (x0.75) | S4 33LP (x1.00) | 874 |
| **Duo 3** (Platine/Gold) | 28W/22L | 56.0% | S4 41LP (x0.90) | S4 3LP (x1.00) | 1026 |

---

## 🔍 Analyse de l'Impact du Multiplicateur

### Comparaison avec simulation SANS multiplicateur peak elo

**Rappel simulation précédente (sans peak elo mult):**
- Duo 1 (D4+B4): ~5892 points
- Duo 2 (E4+S4): ~6231 points
- Duo 3 (P4+G4): ~5034 points

**Avec multiplicateur peak elo (Hybride):**
- Duo 1 (D4+B4): **1496 points** (25% du total sans mult)
- Duo 2 (E4+S4): **874 points** (14% du total sans mult)
- Duo 3 (P4+G4): **1026 points** (20% du total sans mult)

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
