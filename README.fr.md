# Dashboard Adapter

**Adapte un dashboard Home Assistant partagé à ta propre installation.**

Cette carte Lovelace fonctionne dans le navigateur, sans Python. Elle importe un dashboard YAML ou JSON, repère les entités absentes ou indisponibles, propose des correspondances et exporte une copie à vérifier. Elle ne modifie pas Home Assistant.

![Carte réelle avec données fictives dans un navigateur local](preview/desktop-dark.png)

La capture montre la vraie carte JavaScript avec des données de démonstration fictives ; elle ne prouve pas encore un test dans Home Assistant.

## Installation

Ajoute `https://github.com/SkyTyphon/dashboard-adapter` dans **HACS → Dépôts personnalisés → Dashboard**, puis ajoute cette carte :

```yaml
type: custom:dashboard-adapter-card
language: fr
```

Manuellement, copie [`dist/dashboard-adapter.js`](dist/dashboard-adapter.js) dans `<config>/www/`, enregistre `/local/dashboard-adapter.js` comme ressource JavaScript module, puis ajoute la carte.

## Utilisation

1. Importe un fichier `.yaml`, `.yml` ou `.json` contenant un tableau `views` à la racine, ou lance la démo.
2. Lis les dépendances. Installe les cartes `custom:*` nécessaires à part.
3. Associe chaque entité absente à une entité existante du même domaine.
4. Vérifie l’aperçu, puis télécharge la copie adaptée.
5. Importe cette copie dans Home Assistant par la méthode habituelle, après sauvegarde du dashboard cible.

La carte ne réécrit que les champs explicites d’entité : `entity`, `entity_id`, `camera_image`, `default_entity_id`, et les tableaux `entities` / `entity_ids`. Elle signale les modèles Jinja à revoir manuellement. Elle ne valide pas l’installation des cartes personnalisées et ne prend pas en charge les directives YAML `!include` ni les dashboards répartis en plusieurs fichiers. Les données importées restent dans le navigateur.

## Développement et statut

`npm ci` puis `npm run check` exécutent les tests, la compilation et le contrôle du fichier HACS. `node scripts/preview-server.mjs` lance un aperçu local avec données fictives. Code bêta public : tests dans Home Assistant et installation HACS réels encore à faire avant une version numérotée. Licence MIT.
