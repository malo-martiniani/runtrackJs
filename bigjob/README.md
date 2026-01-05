# Présences La Plateforme_

Prototype front-only (HTML/Tailwind/JS) permettant l'inscription, la connexion et la gestion des demandes de présence avec rôles (student, moderator, admin). Données stockées dans `assets/data.json` et mises à jour dans `localStorage` côté navigateur (pas de backend).

## Fonctionnalités
- Inscription réservée au domaine `laplateforme.io` (création en rôle `student`).
- Connexion par email/mot de passe.
- Demande de présence par date et créneau (08:00-12:00, 12:00-14:00, 14:00-18:00). Aucune modification possible après la date passée.
- Vue "Mes demandes" pour annuler une demande en attente tant que la date n'est pas passée.
- Panel modérateur pour accepter/refuser les demandes.
- Panel administrateur pour promouvoir/déclasser les rôles (sauf auto-démotion du dernier admin).

## Structure
- `index.html` — UI principale (Tailwind via CDN).
- `styles/custom.css` — styles additionnels (fonts, pills).
- `js/main.js` — logique métier (auth, rôles, demandes, stockage localStorage).
- `assets/data.json` — données seeds (1 admin, 1 mod, 1 student, 1 demande).

## Utilisation
1. Ouvrir `index.html` dans un navigateur moderne.
2. Se connecter avec un compte seed (admin@laplateforme.io / admin123, moderateur@laplateforme.io / mod12345, etudiant@laplateforme.io / student123) ou créer un compte avec une adresse `laplateforme.io`.
3. Les modifications sont stockées en `localStorage` : pour repartir de zéro, vider le stockage local du navigateur ou supprimer la clé `lp-presence-data`.

## Notes
- Ce projet est purement frontal : la modification du fichier JSON côté client n'est pas persistée côté serveur.
- Tailwind est chargé via CDN pour simplifier le prototype.
- Les mots de passe sont en clair car il n'y a pas de backend ; à sécuriser dans un vrai environnement.
