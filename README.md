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
