# Russe du matin — V4 équilibrée

Application statique HTML/CSS/JavaScript pour GitHub Pages.

Chaque session contient automatiquement :
- 3 questions du récit du chapitre 1 ;
- 2 questions du dialogue du chapitre 1 ;
- 3 questions du récit du chapitre 2 ;
- 2 questions du dialogue du chapitre 2.

L’algorithme évite autant que possible de répéter la même famille de mots dans une session et alterne les quatre banques. Les exercices de saisie affichent des formes pièges proches. Les accents toniques sont ignorés lors de la validation.

## V6 — contexte visible
Les exercices de saisie libre et les questions avancées affichent désormais toujours le contexte français de la phrase. La difficulté vient du rappel du russe, pas de l’interprétation d’une phrase isolée.


## V7 — traduction active par séries

Le menu principal sépare maintenant deux parcours :
- **Exercices du cours** : fonctionnement historique, banques mélangées et révisions automatiques ;
- **Exercices de traduction** : saisie d’une phrase française complète en russe.

Les séries de traduction sont stockées séparément dans `data/series-traduction.json`. Elles couvrent actuellement : dire, demander, travailler, inviter, voir, aimer, avoir et aller/venir. Chaque série varie les pronoms, les rôles dans la phrase, les temps et les compléments afin de créer des automatismes.
