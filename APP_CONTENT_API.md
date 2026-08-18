# Content API 3.0 — contrat pour l’app Flutter

## Démarrage

1. Charger le dernier `release.json`.
2. Vérifier `content_api_version` dans `compatibility.json`.
3. Charger `manifest-lock.json`.
4. Comparer les SHA-256 avec le cache local.
5. Télécharger/mettre à jour les packs nécessaires.
6. Valider les JSON avant de remplacer le cache actuel (transaction locale).

## Tolérance avant

- champ JSON inconnu : ignorer ;
- bloc de cours inconnu : ignorer le bloc et continuer ;
- type d’activité inconnu : ignorer l’activité et loguer ;
- pack corrompu : garder la version précédente ;
- aucune connexion : utiliser le cache.

## Identité des données Firebase

Ne pas stocker les cours complets dans Firebase. Firebase contient l’état utilisateur et référence les IDs immuables du contenu : `course_id`, `activity_id`, `concept_id`, `error_tag`.

## IDs

Un ID publié ne doit jamais être réutilisé pour une autre signification. Un exercice fortement modifié doit idéalement recevoir un nouvel ID afin de ne pas mélanger son historique avec l’ancien.

## Audio

Le renderer reçoit `pronunciation_target_id` / `audio_target_id`, puis résout la cible dans `pronunciation/targets.json`. Il utilise TTS ou `remote_asset` selon le champ `audio.mode`.
