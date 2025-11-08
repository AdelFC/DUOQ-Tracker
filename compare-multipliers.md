# Comparaison des Multiplicateurs Peak Elo

## Formule Sévère vs Formule Douce

### Formule Sévère (originale)
```
≤1 tier: 1.00x
2 tiers:  0.90x (-10%)
3 tiers:  0.75x (-25%)
4 tiers:  0.60x (-40%)
5+ tiers: 0.50x (-50%)
```

### Formule Douce (malus divisés par 2)
```
≤1 tier: 1.00x
2 tiers:  0.95x  (-5%)
3 tiers:  0.875x (-12.5%)
4 tiers:  0.80x  (-20%)
5+ tiers: 0.75x  (-25%)
```

## Impact sur les Scénarios Typiques

| Scénario | Écart | Mult Sévère | Mult Douce | Gain |
|----------|-------|-------------|------------|------|
| **Diamant en Bronze** | 5T | **0.50x** | **0.75x** | +50% |
| **Diamant en Silver** | 4T | **0.60x** | **0.80x** | +33% |
| **Diamant en Gold** | 2T | **0.90x** | **0.95x** | +6% |
| **Emeraude en Bronze** | 4T | **0.60x** | **0.80x** | +33% |
| **Emeraude en Silver** | 3T | **0.75x** | **0.875x** | +17% |
| **Plat en Bronze** | 3T | **0.75x** | **0.875x** | +17% |
| **Plat en Silver** | 2T | **0.90x** | **0.95x** | +6% |
| **Gold en Bronze** | 2T | **0.90x** | **0.95x** | +6% |

## Estimation de l'Impact Final

**Avec Formule Douce, les joueurs récupèrent:**
- **+50% de points** pour les très gros smurfs (5+ tiers)
- **+33% de points** pour les gros smurfs (4 tiers)
- **+17% de points** pour les smurfs moyens (3 tiers)
- **+6% de points** pour les petits smurfs (2 tiers)

## Exemple Concret

**Un Diamant qui smurfe en Bronze (écart 5 tiers):**
- Formule Sévère: Gagne 100 pts → Reçoit **50 pts** (x0.50)
- Formule Douce: Gagne 100 pts → Reçoit **75 pts** (x0.75)
- **Différence: +50% de points gagnés**

**Un Emeraude en Silver (écart 3 tiers):**
- Formule Sévère: Gagne 100 pts → Reçoit **75 pts** (x0.75)
- Formule Douce: Gagne 100 pts → Reçoit **87.5 pts** (x0.875)
- **Différence: +17% de points gagnés**

## Recommandation

La **Formule Douce** semble être un bon compromis:
- ✅ Pénalise toujours les smurfs significativement
- ✅ Mais pas de manière excessive (-25% max vs -50%)
- ✅ Plus fair pour un challenge où tout le monde part de Bronze 4
- ✅ Les joueurs forts restent récompensés pour leur skill

**Conclusion**: La formule douce est **adaptée** au contexte du challenge tout en gardant un effet anti-smurf significatif.
