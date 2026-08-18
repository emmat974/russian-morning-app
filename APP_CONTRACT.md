# Contrat de consommation pour l'application

## Rôles

### GitHub
Source de vérité du contenu pédagogique statique :
- manifest ;
- cours ;
- vocabulaire ;
- exercices ;
- taxonomie des erreurs ;
- règles de normalisation ;
- séries de pratique.

### Firebase
État personnel de l'apprenant :
- tentatives ;
- réponses ;
- erreurs détectées ;
- fréquence par `error_tag` ;
- maîtrise estimée par concept ;
- historique des sessions ;
- planning de révision espacée.

### iPhone
- synchronise le contenu GitHub ;
- conserve un cache local ;
- exécute les exercices ;
- normalise les réponses ;
- envoie la progression vers Firebase ;
- construit les sessions adaptatives.

## Synchronisation

1. Charger `manifest.json`.
2. Comparer `content_version` à la version locale.
3. Télécharger uniquement les fichiers référencés par le manifest.
4. Conserver le corpus en cache hors ligne.
5. Ne jamais écraser l'historique Firebase lors d'une mise à jour de contenu.

## Adaptation

La sélection doit prioriser :
- progression normale ;
- notions récemment échouées ;
- révision espacée ;
- production active.

Si un `error_tag` devient fréquent, augmenter son poids mais préférer un exercice différent partageant le
même concept ou le même tag. Le même exercice ne doit pas devenir une boucle de mémorisation mécanique.

## Validation des réponses

Appliquer `normalization.json` :
- accents toniques facultatifs ;
- espaces normalisés ;
- ponctuation terminale tolérante pour les réponses courtes ;
- variantes explicites dans `acceptable_answers` ;
- pas de translittération.

## Active / preview

`manifest.json` distingue :
- `active_course_ids` : disponibles dans le flux normal ;
- `preview_course_ids` : synchronisés mais bloqués jusqu'à déblocage pédagogique.
