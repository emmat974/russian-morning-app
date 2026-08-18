# Prononciation — Content API

## Lecture correcte

Le contenu fournit le texte russe et, lorsque disponible dans les sources, une version d’affichage avec accent tonique. Le TTS doit utiliser `ru-RU`.

## Évaluation utilisateur

La première version peut utiliser la reconnaissance vocale comme proxy :

1. jouer la cible ;
2. enregistrer la répétition ;
3. obtenir une transcription russe ;
4. normaliser ponctuation/accents ;
5. comparer à la ou aux transcriptions acceptées ;
6. conserver le score de confiance du moteur de reconnaissance.

Ce système vérifie surtout l’intelligibilité et n’est pas une analyse phonétique complète. Le schéma prévoit qu’un futur provider `phoneme_score` puisse remplacer/compléter ce mécanisme sans modifier les fichiers de cours.

## Mots et phrases

Le catalogue distingue `word`, `phrase`, `sentence`. Les sessions doivent alterner des mots difficiles et des phrases entières pour éviter une prononciation correcte mot par mot mais artificielle en contexte.
