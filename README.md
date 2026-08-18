# Russian Learning Content — v0.3.1

Ce dépôt est la **source de vérité pédagogique** d’une application Flutter personnelle d’apprentissage du russe. L’app doit pouvoir rester stable pendant longtemps : le contenu, les cours, les exercices, les règles de révision et les cibles de prononciation évoluent ici.

## Objectif architectural

L’application implémente une fois un ensemble de renderers génériques (`choice_single`, `text_input`, `fill_blank`, `cloze_text`, `translation_input`, `reorder_tokens`, `match_pairs`, `listen_type`, `pronunciation_repeat_*`, etc.). Ensuite, ajouter de nouveaux chapitres ou des milliers d’exercices n’exige pas de mise à jour de l’app tant que ces renderers et le Content API 3.0 restent compatibles.

Le fichier `compatibility.json` est le contrat : **nouveau contenu ≠ nouvelle version de l’app**. Une mise à jour du binaire devient nécessaire uniquement pour une nouvelle interaction native/visuelle ou une rupture majeure du Content API.

## Deux expériences principales

### Session Cours

Un chapitre n’est plus une petite fiche. Chaque JSON de `courses/` contient des blocs explicatifs complets : raison d’apprendre la notion, explications en français, exemples, contrastes, erreurs fréquentes, mémoire, prononciation et checkpoint.

### Session Exercices

Une session est volontairement mélangée. Les règles de `adaptive/session-profiles.json` plafonnent les QCM et imposent une proportion de production. L’app peut mélanger : choix, saisie libre, traduction, texte à trous, phrase à compléter, reconstruction, compréhension, dictée, écoute et prononciation.

## Progression réelle, pas seulement un score

La progression est suivie par **concept**, **dimension de compétence** et **error_tag**. Les dimensions sont : reconnaissance, compréhension, rappel, production, écoute et prononciation.

Une seule réussite ne crée pas une maîtrise. La politique exige diversité de prompts/formats et prévoit une révision différée. Le chapitre suivant peut être déverrouillé en état `consolidating` si la preuve immédiate est solide, mais le statut `mastered` demande une confirmation après délai.

## Révision espacée

`adaptive/spaced-review.json` commence par un renforcement le jour même puis une validation à environ **48 h**, avant d’allonger vers 4, 8, 16, 30 et 60 jours. Les erreurs ou l’utilisation d’indices raccourcissent le prochain intervalle.

## Prononciation

`pronunciation/targets.json` définit les mots et phrases. Par défaut :

- lecture via TTS `ru-RU` ;
- répétition au microphone ;
- validation pragmatique via reconnaissance vocale/transcription ;
- architecture prête pour un futur moteur phonétique plus précis sans modifier les cours.

Le dictionnaire d’accent tonique `pronunciation/stress-dictionary.json` est extrait des accents présents dans le PDF fourni.

## Synchronisation

L’app télécharge `manifest.json` / `release.json`, compare la version et les SHA-256 du `manifest-lock.json`, puis ne remplace que les packs modifiés. En cas d’échec, elle conserve la dernière version locale valide.

## Sources

- PDF utilisateur : `Première semaine de Tony en Russie` (original et extraction page par page conservés dans `sources/pdf/`).
- `russian-morning-app` : ses principes de banques mélangées, contexte français visible, formes pièges et traduction active ont été réutilisés.
- Les explications grammaticales supplémentaires de v0.3 sont marquées `editorial-expansion` dans les blocs afin de les distinguer du contenu directement dérivé des sources.

## Validation

```bash
python scripts/validate_v3.py
python scripts/build_release.py
```

La GitHub Action exécute ces contrôles à chaque push.
