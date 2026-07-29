# Russe du matin

Mini-application statique pour tablette, sans base de données et sans framework.

## Lancer l'application

Les fichiers JSON sont chargés avec `fetch`, donc il faut servir le dossier avec un petit serveur HTTP.

### Avec Python

```bash
python3 -m http.server 8080
```

Puis ouvrir :

```text
http://localhost:8080
```

### Hébergement simple

Le dossier peut être déposé tel quel sur GitHub Pages, Netlify, Cloudflare Pages ou n'importe quel hébergement statique.

## Ajouter une série

1. Copier un fichier dans `data/`.
2. Modifier les questions.
3. Ajouter son chemin dans `DATA_FILES` au début de `app.js`.

Chaque série est choisie aléatoirement au démarrage.

- Après chaque réponse, correcte ou fausse, l’application explique pourquoi la forme convient à la phrase.


## Explications pédagogiques V2
Chaque question contient désormais une micro-leçon structurée : règle, comparaison, explication du piège et mémo. Les mêmes explications apparaissent après une bonne ou une mauvaise réponse.


## Version pédagogique vérifiée
Chaque question affiche désormais la phrase russe complète et sa traduction avant l’explication. Les six fichiers JSON ont été vérifiés individuellement afin que chaque règle corresponde exactement à la phrase visible.
