# Dashboard Adapter — contexte du projet

## But

Dashboard Adapter est une carte Lovelace pour Home Assistant, distribuée via HACS (catégorie Dashboard / plugin). Elle permet de réutiliser un dashboard partagé par la communauté avec ses propres appareils : l'utilisateur importe un dashboard complet (YAML ou JSON), la carte détecte les entités manquantes ou indisponibles et les cartes `custom:*` requises, propose des remplacements d'entités du même domaine tirés des entités de l'instance, puis exporte une copie adaptée (téléchargement ou copie dans le presse-papiers). L'utilisateur réimporte lui-même cette copie via l'éditeur de configuration brute de Home Assistant.

- Dépôt GitHub public : `SkyTyphon/dashboard-adapter` (dossier local `HA_Dashboard_Community`). Démo en ligne : https://skytyphon.github.io/dashboard-adapter/en/ (et `/fr/`).
- Statut : bêta publique, version courante dans `package.json` (0.1.0-beta.4 au 2026-10-10). Licence MIT.
- Ce projet est public et communautaire : il n'a pas de lien avec l'infrastructure personnelle IA_DOMO. Ne pas charger `Contextes_IA` pour y travailler, et ne jamais y mettre de données personnelles (URL privées, jetons, IP, noms d'entités personnels).

## Contraintes de conception (à ne pas casser)

- 100 % navigateur : pas de backend, pas de Python, pas d'upload. Les fichiers restent dans le navigateur. Ne jamais ajouter de fichier Python ni de dépendance backend (règle de `CONTRIBUTING.md`).
- Ne modifie jamais la configuration de Home Assistant : lecture des états uniquement, production d'un fichier.
- Réécriture sûre : seuls les champs d'entité explicites changent (`entity`, `entity_id` y compris listes, `camera_image`, `default_entity_id`, chaînes dans `entities` et `entity_ids`). Les templates (Jinja `{{ }}`, `{% %}`, JavaScript button-card `[[[ ]]]`), le Markdown, le CSS et les champs libres de cartes custom ne sont pas réécrits, seulement comptés pour revue manuelle.
- Les commentaires YAML sont conservés autant que possible ; ancres, alias et clés de fusion (`&`, `*`, `<<:`) sont gérés (une entité ancrée est remplacée une fois, les alias suivent).
- Un remplacement est refusé si l'entité n'existe pas ou appartient à un autre domaine.
- Import refusé : pas de tableau `views` à la racine, plus de 2 000 000 de caractères, YAML invalide ou clés dupliquées, tags YAML non résolus (`!include`, `!secret`). Messages d'erreur traduits.
- Interface bilingue anglais/français, langue `auto` (suit Home Assistant : français pour toute langue française, anglais sinon), forçable avec `language: en|fr`. Les IDs d'entités et noms de champs YAML ne sont jamais traduits.
- Responsive (bureau, tablette, mobile), thèmes clair et sombre. Mode démo intégré avec entités fictives.
- Option unique de la carte : `type: custom:dashboard-adapter-card` et `language` (optionnel).

## Statuts et suggestions

- Ready : l'entité existe avec un état normal. Unavailable : état `unknown` ou `unavailable`. Missing : aucun état visible dans la session. Score de compatibilité = entités Ready / entités référencées.
- Suggestions : mêmes domaines uniquement ; comparaison des mots de l'ID et du `name` de la carte avec l'ID et le nom convivial des entités, accents ignorés, préfixes de mots acceptés (`temp` ~ `temperature`), mots rares plus pesants que les mots courants. Lien « Suggestion » en un clic seulement si une entité se démarque nettement.

## Structure du dépôt

- `src/card.js` : élément personnalisé, interface, rendu, import/export, événements.
- `src/dashboard.js` : analyse, inventaire des dépendances, suggestions, réécriture (bibliothèque `yaml`).
- `src/i18n.js` : traductions EN/FR. `src/styles.js` : styles. `src/demo.js` : données de démo fictives.
- `dist/dashboard-adapter.js` : bundle généré par esbuild (ESM, minifié, cible es2020) ; il est suivi par git car HACS le distribue. Le reconstruire (`npm run build`) après toute modification de `src/`.
- `tests/dashboard.test.js` : tests unitaires (`node --test`) pour l'analyse et la réécriture.
- `scripts/` : `build.mjs`, `build-demo.mjs`, `check-package.mjs`, `preview-server.mjs`, `browser-smoke.mjs`, `bilingual-smoke.mjs` (tests navigateur avec Playwright et Chrome installé ; `CHROME_PATH` si Chrome est ailleurs).
- `demo/index.html` : page de démo ; `demo/en/` et `demo/fr/` sont générés et ignorés par git. `preview/` : captures et page d'aperçu utilisées par les README. `examples/` : exemples de configuration de carte.
- `.github/workflows/` : `check.yml`, `hacs.yml` (validation HACS), `pages.yml` (démo GitHub Pages). `hacs.json` : `filename` = `dashboard-adapter.js`, `render_readme` = true.
- Documentation : `README.md` (anglais) et `README.fr.md` (français) doivent rester équivalents ; `CHANGELOG.md` et `RELEASE_NOTES.md` pour les versions.

## Commandes

- `npm ci` : installation.
- `npm test` : tests unitaires. `npm run build` : bundle. `npm run check` : tests + build + vérification du paquet HACS (à lancer avant tout commit ou pull request).
- `npm run build:demo` : pages de démo EN/FR. `npm run test:browser` et `npm run test:bilingual` : vérifications en vrai navigateur.
- Aperçu local : `node scripts/preview-server.mjs`, puis `/demo/en/index.html` ou `/demo/fr/index.html`.

## Règles de travail

- Changement de parsing ou de réécriture : ajouter un test ciblé dans `tests/dashboard.test.js`.
- Texte d'interface ou de documentation modifié : mettre à jour l'anglais et le français ensemble.
- Nouvelle version : mettre à jour `version` dans `package.json` (et `package-lock.json`), `CHANGELOG.md`, `RELEASE_NOTES.md`, reconstruire `dist/`, puis lancer `npm run check`. Messages de commit et de release en anglais, au style des commits existants (par exemple « Release 0.1.0-beta.4 »).
- Limite connue : l'installation sur une instance Home Assistant réelle reste à vérifier (indiqué dans la section « Status » du README).
