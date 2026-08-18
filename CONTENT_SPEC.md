# Content specification

Le dépôt contient uniquement le **contenu pédagogique**. L'application mobile télécharge `manifest.json`, puis synchronise les fichiers listés.

## Principes

- Pas de translittération.
- Interface et explications en français.
- Le russe reste en cyrillique.
- Chaque exercice possède des `concepts` et des `error_tags`.
- Une erreur fréquente doit pouvoir être détectée indépendamment de l'exercice précis.
- Les réponses alternatives valides sont déclarées dans `acceptable_answers`.
- Les contenus sont versionnés par `content_version`.

## Types d'exercices

- `multiple_choice`
- `translation`
- `fill_blank`
- `reorder`
- `classify`
- `comprehension`

## Utilisation recommandée par l'application

1. Télécharger `manifest.json`.
2. Comparer `content_version` avec la version locale.
3. Mettre en cache les fichiers de cours, vocabulaire et exercices.
4. Envoyer uniquement la progression utilisateur vers Firebase.
5. Lors d'une erreur, incrémenter les compteurs associés aux `error_tags`.
6. Construire les sessions avec environ :
   - 45 % contenu nouveau ;
   - 35 % erreurs récentes ;
   - 20 % révision espacée.

## Exemple de profil d'erreur Firebase

```json
{
  "error_tag": "я-вместо-мне",
  "attempts": 8,
  "failures": 5,
  "last_failure_at": "2026-08-09T09:00:00+04:00",
  "mastery": 0.37
}
```

L'application ne doit pas conclure qu'une notion est maîtrisée après une seule bonne réponse.
