# Guide d’ajout de contenu sans mise à jour de l’app

## Ajouter un nouveau chapitre

1. Copier un JSON de `courses/` existant.
2. Donner un `id` unique, un `order`, des `prerequisites` et des `content_blocks`.
3. N’utiliser que les types de blocs listés dans `catalog/lesson-block-types.json`.
4. Ajouter des activités dans `exercises/` avec des `activity_type` existants.
5. Ajouter les nouvelles cibles audio/prononciation dans `pronunciation/targets.json` si nécessaire.
6. Ajouter le chapitre à `catalog/curriculum.json`.
7. Incrémenter `content_version` ou la version du pack concerné.
8. Exécuter `python scripts/validate_v3.py` puis `python scripts/build_release.py`.

## Ajouter uniquement des exercices

Aucune modification Flutter n’est nécessaire si `activity_type` existe déjà. Les activités inconnues par une vieille app doivent être ignorées proprement, jamais faire planter la session.

## Ajouter de l’audio

Une cible peut rester en `audio.mode = tts` ou passer à `remote_asset` avec une URL GitHub/CDN et un checksum. Le modèle de données est prévu pour les deux.

## Ajouter un nouveau type d’exercice

C’est le cas qui **peut exiger une mise à jour de l’app**. Ajouter d’abord le renderer Flutter, puis publier le nouveau type dans `catalog/activity-types.json` et augmenter les exigences de compatibilité.

## Règles pédagogiques

- ne pas créer 20 variantes identiques d’un même prompt ;
- varier personne, contexte et direction de traduction ;
- utiliser des distracteurs plausibles ;
- taguer précisément les erreurs ;
- relier les formes à un lemme quand possible ;
- ne pas considérer une réussite immédiate comme une maîtrise long terme ;
- privilégier « même concept, autre phrase » pour la remédiation.
