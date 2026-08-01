# Site 100P Location

Site vitrine et tunnel de réservation de **100P Location** (location de voitures sans permis, Vichy et Auvergne).
Client : Jean Charles Taret (TYT03). Agence : **Lumi**.

- **Production :** https://100p-location.fr
- **Hébergement :** Netlify (site statique, pas de build)
- **Formulaires :** Netlify Forms

---

## Nature du projet

Site **100 % statique** : HTML, CSS et JavaScript classiques. Aucun framework, aucun backend,
aucune base de données. Chaque page embarque son CSS critique en `<style>` inline, plus
`assets/site.css` et `assets/site.js` en commun.

Le parcours de réservation fonctionne entièrement côté navigateur via `sessionStorage`,
sans paiement en ligne : le client remplit une demande, 100P confirme ensuite.

```
index.html                 Accueil (+ chatbot de réservation)
vehicules.html             La flotte
offres.html                Grille tarifaire complète
reservation.html           Récapitulatif et formulaire de demande
reservation-resultats.html Sélection véhicule et meet point
contact.html               Formulaire de contact
blog.html + 3 articles     Blog SEO
assurance / conditions / horaires / cgv / mentions-legales / confidentialite / merci
assets/site.css            Styles communs
assets/site.js             Scripts communs
```

## Développement local

Aucune installation nécessaire. Servir le dossier avec n'importe quel serveur statique :

```bash
python -m http.server 8000
# puis http://localhost:8000
```

Ouvrir les fichiers en `file://` fonctionne partiellement mais casse les formulaires
et certains chemins relatifs. Toujours passer par un serveur HTTP.

## Déploiement

Le dépôt est connecté à Netlify. Tout push sur `main` déclenche un déploiement.
Pas de commande de build : Netlify publie le dossier racine tel quel.

## Historique

Site développé initialement par **Yanis**, repris par **Lumi le 01/08/2026**.
Aucun historique Git n'a été transmis lors de la reprise : le premier commit de ce dépôt
correspond à l'état exact alors en production.

## Points de vigilance

- **Netlify Forms** : les demandes de contact et de réservation arrivent dans le compte
  Netlify. Vérifier que les notifications pointent bien vers une adresse 100P active.
- **Tarifs** : la grille officielle est celle du document client du 17/07/2026, reprise
  dans `context/clients/100P.md` côté Jarvis. `offres.html` en est la source d'affichage.
- **Meet points** : les adresses listées dans `reservation-resultats.html` doivent être
  confirmées par le client avant toute communication qui les met en avant.
- **Mentions d'âge** : la formulation officielle est « Dès 14 ans, permis AM requis ».
