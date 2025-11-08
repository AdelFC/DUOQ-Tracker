# AutoPoll Dynamic Interval System

## 📋 Vue d'ensemble

Le système de polling automatique (`AutoPollService`) ajuste dynamiquement son intervalle de vérification en fonction du nombre de duos inscrits, afin de respecter les limites de rate limiting de l'API Riot Games.

## 🎯 Objectif

**Éviter le bannissement de la clé API** en respectant les limites Riot tout en maximisant la réactivité de détection des games.

## 📊 Limites Riot API

```
- 20 requêtes / 1 seconde
- 100 requêtes / 2 minutes (limite principale)
```

## 🔧 Consommation API par Duo

Pour chaque duo à chaque poll :
- **2 calls** : `getRecentMatchIds()` pour noob et carry
- **~1 call** : `getMatchDetails()` (seulement si nouveau match)
- **~2 calls** : `getRank()` pour noob et carry (seulement si nouveau match)

**Total moyen : ~5 calls/duo/poll**

## 📐 Système par Paliers

```typescript
// Intervalles fixes par tranche de duos
1-4 duos   → 30s   (tier 1)
5-8 duos   → 45s   (tier 2)
9-12 duos  → 60s   (tier 3)
13-16 duos → 90s   (tier 4)
17-20 duos → 120s  (tier 5)
21+ duos   → nbDuos × 7.5s (linéaire)
```

### Marge de sécurité

- Limite Riot : 100 calls / 2min = **50 calls/min**
- Marge de sécurité : **80%** → **40 calls/min utilisables**

### Avantages du système par paliers

1. **Stabilité** : Moins d'ajustements d'intervalle (seulement au changement de palier)
2. **Prévisibilité** : Comportement clair et documentable
3. **Performance** : Intervalles optimisés par tranche d'utilisation
4. **Scalabilité** : Passe à linéaire pour 21+ duos

## 📈 Exemples Concrets

| Nombre de Duos | Palier | Intervalle | API Calls/min | % Limite |
|----------------|--------|------------|---------------|----------|
| 1              | 1-4    | 30s        | 4             | 8%       |
| 2              | 1-4    | 30s        | 8             | 16%      |
| 4              | 1-4    | 30s        | 16            | 32%      |
| 5              | 5-8    | 45s        | 13            | 26%      |
| 8              | 5-8    | 45s        | 21            | 42%      |
| 9              | 9-12   | 60s        | 18            | 36%      |
| 12             | 9-12   | 60s        | 24            | 48%      |
| 13             | 13-16  | 90s        | 17            | 34%      |
| 16             | 13-16  | 90s        | 21            | 42%      |
| 17             | 17-20  | 120s       | 17            | 34%      |
| 20             | 17-20  | 120s       | 20            | 40%      |
| 25             | 21+    | 187.5s     | 16            | 32%      |
| 30             | 21+    | 225s       | 16            | 32%      |

## 🔄 Ajustement Automatique

### Quand ?

L'intervalle est recalculé **après chaque poll** et ajusté si la différence dépasse **10%**.

### Exemple de scénario

1. **Démarrage** : 0 duos → intervalle 60s (fallback)
2. **2 joueurs s'inscrivent et forment un duo** : 1 duo → intervalle 30s (palier 1-4)
3. **4 nouveaux duos se créent** : 5 duos → intervalle ajusté à 45s (palier 5-8)
4. **5 duos supplémentaires** : 10 duos → intervalle ajusté à 60s (palier 9-12)
5. **3 nouveaux duos** : 13 duos → intervalle ajusté à 90s (palier 13-16)

### Logs

```
[AutoPoll] Started - Interval: 30s | Duos: 1 | Est. API calls: ~4/min
[AutoPoll] Interval adjusted: 30s → 45s (5 duos)
[AutoPoll] Interval adjusted: 45s → 60s (10 duos)
[AutoPoll] Interval adjusted: 60s → 90s (13 duos)
```

## 🚀 Avantages

1. ✅ **Pas de rate limiting** : Reste toujours sous 80% de la limite
2. ✅ **Réactivité maximale** : Intervalle court (30s) pour les petits groupes
3. ✅ **Scalabilité automatique** : S'adapte jusqu'à 30+ duos sans intervention
4. ✅ **Transparence** : Logs clairs sur l'intervalle et la consommation

## ⚙️ Configuration

### Par défaut

L'intervalle se calcule automatiquement, aucune configuration requise.

### Personnalisation (optionnel)

Modifier les constantes dans `auto-poll.service.ts` :

```typescript
private readonly MIN_INTERVAL_MS = 30000  // Intervalle minimum (30s)
private readonly MS_PER_DUO = 7500        // Temps par duo (7.5s)
```

Pour être **plus conservateur** (moins de risque) :
```typescript
private readonly MS_PER_DUO = 10000  // 10s par duo (40% de la limite)
```

Pour être **plus agressif** (détection plus rapide) :
```typescript
private readonly MS_PER_DUO = 6000   // 6s par duo (~50% de la limite)
```

## 📝 Notes Techniques

### Thread Safety

- Le flag `isPolling` empêche les polls concurrents
- L'ajustement d'intervalle redémarre le service proprement (stop → start)

### Gestion des Erreurs

- Les erreurs de poll n'affectent pas l'ajustement d'intervalle
- Rate limiting 429 détecté et loggé dans Discord (via `logWarn`)

### Performance

- Calcul d'intervalle : O(1)
- Vérification d'ajustement : O(1)
- Impact CPU négligeable

## 🔍 Monitoring

### Logs à surveiller

```bash
# Intervalle actuel et estimation API calls
[AutoPoll] Started - Interval: 75s | Duos: 10 | Est. API calls: ~16/min

# Ajustements automatiques
[AutoPoll] Interval adjusted: 30s → 75s (10 duos)

# Rate limiting (⚠️ problème !)
🚨 RATE LIMIT RIOT API
```

### Commande de debug

```bash
# Vérifier le statut du service
/dev status
```

## 🆘 Dépannage

### Symptôme : Rate limiting malgré l'intervalle dynamique

**Causes possibles :**
1. Autre service consommant l'API Riot en parallèle
2. Spike de nouveaux matchs détectés (beaucoup de `getMatchDetails`)

**Solution :**
- Réduire `MS_PER_DUO` à 10000 ou 12000
- Limiter le nombre de duos à 15-20

### Symptôme : Intervalle trop long (détection lente)

**Cause :** Beaucoup de duos inscrits

**Solutions :**
1. Accepter le délai (c'est normal pour éviter rate limiting)
2. Obtenir une clé API Production Riot (limite 10x supérieure)
3. Réduire `MS_PER_DUO` (risque de rate limiting)

## 📚 Références

- [Riot API Rate Limiting](https://developer.riotgames.com/apis#league-of-legends)
- Code source : `src/services/auto-poll.service.ts`
- Initialisation : `src/bot/index.ts:106-122`
