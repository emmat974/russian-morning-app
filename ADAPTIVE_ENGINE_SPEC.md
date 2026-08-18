# Moteur adaptatif — spécification de contenu

## Unité de progression

L’activité n’est pas l’unité principale. L’app agrège les preuves vers :

- concepts ;
- error tags ;
- lexèmes/formes ;
- dimensions de compétence ;
- chapitres.

## Preuve de maîtrise

Une réponse correcte augmente la confiance, mais l’augmentation est limitée si le même prompt vient d’être vu. Une réponse de production sans indice vaut plus qu’un QCM. Une réussite après 48 h apporte une preuve beaucoup plus forte qu’une seconde réussite dans la même minute.

## Erreurs fréquentes

Une erreur doit alimenter son `error_tag`. À partir d’un seuil, la session doit insérer des activités d’autres formats et d’autres phrases portant le même tag/concept.

## Chapitre suivant

`consolidating` peut ouvrir le chapitre suivant si les seuils immédiats sont atteints. Les révisions continuent en arrière-plan. `mastered` n’est accordé qu’après une validation différée. Ainsi, l’utilisateur n’est pas forcé d’attendre deux jours sans avancer, mais l’app ne prétend pas qu’une notion est définitivement acquise le jour même.

## Oubli

Une erreur après une longue période n’efface pas tout l’historique : elle place le concept en `fragile`, programme une révision rapide et réduit temporairement la confiance.
