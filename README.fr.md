# Dashboard Adapter

**[Readme English](README.md)**

Si tu veux essayer une démo, teste-la ici : **[Démo](https://skytyphon.github.io/dashboard-adapter/fr/)**.

Si tu aimes mon travail :

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/skytyphoni)

[![Open HACS repository — ouvrir le dépôt dans HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=SkyTyphon&repository=dashboard-adapter&category=plugin)

**Reprends un dashboard Home Assistant partagé avec tes propres appareils.**

Tu télécharges un dashboard qui utilise `light.living_room`, alors que ta lumière s’appelle `light.salon` ? Dashboard Adapter repère cette référence absente, te laisse choisir ta lumière et télécharge une copie adaptée.

![Vraie démo : repérer les références absentes, choisir les entités locales puis comparer le YAML adapté](preview/how-it-works-fr.png)

*La vraie carte fonctionne avec des appareils fictifs. L’image montre le même exemple avant et après les remplacements choisis.*

## Table des matières

1. [Ce que fait la carte](#ce-que-fait-la-carte)
2. [Fonctionnalités](#fonctionnalités)
3. [Essayer avant d’installer](#essayer-avant-dinstaller)
4. [Prérequis](#prérequis)
5. [Installation](#installation)
   - [Avec HACS (recommandé)](#avec-hacs-recommandé)
   - [Dépôt personnalisé HACS](#dépôt-personnalisé-hacs)
   - [Installation manuelle sans HACS](#installation-manuelle-sans-hacs)
   - [Ajouter la carte à un dashboard](#ajouter-la-carte-à-un-dashboard)
6. [Adapter ton dashboard](#adapter-ton-dashboard)
   - [Pas à pas](#pas-à-pas)
   - [Présentation de l’interface](#présentation-de-linterface)
7. [Configuration](#configuration)
   - [Options de la carte](#options-de-la-carte)
   - [Réglage de la langue](#réglage-de-la-langue)
   - [Exemples prêts à copier](#exemples-prêts-à-copier)
8. [Fonctionnement](#fonctionnement)
   - [Ce qui est vérifié et remplacé](#ce-qui-est-vérifié-et-remplacé)
   - [État des entités](#état-des-entités)
   - [Suggestions de remplacement](#suggestions-de-remplacement)
   - [Cartes personnalisées et modèles](#cartes-personnalisées-et-modèles)
   - [Fichier exporté](#fichier-exporté)
9. [Fichiers, confidentialité et limites](#fichiers-confidentialité-et-limites)
10. [Dépannage](#dépannage)
11. [Questions fréquentes](#questions-fréquentes)
12. [Développement](#développement)
13. [Contribuer](#contribuer)
14. [État du projet et soutien](#état-du-projet-et-soutien)

## Ce que fait la carte

1. Importe un dashboard complet en YAML ou JSON.
2. Affiche les entités absentes, les états indisponibles et les cartes personnalisées nécessaires.
3. Te laisse choisir une entité existante pour chaque référence absente.
4. Compare les fichiers original et adapté, puis télécharge une copie.

C’est une **carte Lovelace**, distribuée dans HACS en catégorie **Dashboard**. Elle fonctionne dans le navigateur, sans Python, et n’enregistre aucune modification dans Home Assistant. Tu importes toi-même la copie téléchargée.

## Fonctionnalités

- **Import YAML et JSON**, par sélection de fichier ou glisser-déposer.
- **Inventaire des dépendances** : chaque référence d’entité, son emplacement dans le dashboard et chaque type de carte `custom:*`.
- **Score de compatibilité** : part des entités référencées qui existent et sont disponibles dans ton Home Assistant.
- **Correspondance des entités** avec des suggestions du même domaine, tirées de tes propres entités.
- **Aperçu côte à côte** des fichiers original et adapté avant téléchargement.
- **Réécriture prudente** : seuls les champs explicites d’entité changent ; les commentaires YAML sont conservés lorsque possible.
- **Détection des modèles** : les expressions Jinja (`{{ }}` et `{% %}`) sont comptées pour que tu les vérifies toi-même.
- **Interface en français et en anglais**, qui suit automatiquement la langue de Home Assistant.
- **Mode démo intégré** avec des entités fictives, accessible directement dans la carte.
- **Entièrement local** : aucun envoi, aucun serveur, aucune modification de ta configuration Home Assistant.
- **Affichage adaptatif** sur ordinateur, tablette et mobile, en thème clair ou sombre.

## Essayer avant d’installer

Ouvre la [démo française](https://skytyphon.github.io/dashboard-adapter/fr/). Clique sur **Appliquer des exemples**, puis compare les deux panneaux YAML. Clique sur **Télécharger** pour récupérer l’exemple adapté. Les appareils sont fictifs et la démo ne se connecte pas à ton Home Assistant.

La [démo anglaise](https://skytyphon.github.io/dashboard-adapter/en/) propose les mêmes fonctions. Chaque page permet de changer de langue et de thème clair/sombre.

Une fois installée, la carte propose aussi un bouton **Essayer la démo** qui charge le même dashboard fictif sans toucher à tes entités.

## Prérequis

- Home Assistant avec les dashboards (Lovelace) et le droit de modifier un dashboard.
- [HACS](https://hacs.xyz/) pour l’installation recommandée. L’installation manuelle fonctionne sans.
- Un navigateur récent, sur ordinateur ou mobile.
- Le dashboard source complet dans un fichier `.yaml`, `.yml` ou `.json`.

## Installation

### Avec HACS (recommandé)

Clique sur **[Open HACS repository](https://my.home-assistant.io/redirect/hacs_repository/?owner=SkyTyphon&repository=dashboard-adapter&category=plugin)** pour ouvrir ce dépôt dans ton Home Assistant. HACS doit déjà être installé. Au premier accès, My Home Assistant demande l’adresse de ton instance.

Clique ensuite sur **Télécharger** dans HACS. Pour la bêta, active les préversions si HACS propose cette option. Actualise ton navigateur une fois le téléchargement terminé.

### Dépôt personnalisé HACS

1. Dans HACS, ouvre **Dépôts personnalisés**.
2. Ajoute `https://github.com/SkyTyphon/dashboard-adapter` en catégorie **Dashboard**.
3. Télécharge Dashboard Adapter. Pour la bêta, active les préversions si HACS propose cette option.
4. Actualise Home Assistant dans ton navigateur.

HACS enregistre normalement la ressource tout seul. Si Home Assistant signale que la carte n’existe pas, vérifie que cette ressource est enregistrée comme **module JavaScript** dans **Paramètres → Tableaux de bord → Ressources** :

```text
/hacsfiles/dashboard-adapter/dashboard-adapter.js
```

### Installation manuelle sans HACS

1. Copie [`dist/dashboard-adapter.js`](dist/dashboard-adapter.js) dans `<config>/www/dashboard-adapter.js`.
2. Dans **Paramètres → Tableaux de bord → Ressources**, enregistre `/local/dashboard-adapter.js` comme **module JavaScript**.
3. Actualise le navigateur, idéalement en vidant le cache.

Recommence la copie à chaque nouvelle version.

### Ajouter la carte à un dashboard

Modifie un dashboard, ajoute une carte et cherche **Dashboard Adapter** dans le sélecteur de cartes, ou ajoute une carte **Manuelle** et colle :

```yaml
type: custom:dashboard-adapter-card
language: auto
```

La carte est plus confortable dans une vue large, par exemple une vue panneau ou sections : elle occupe par défaut toute la largeur de la grille.

## Adapter ton dashboard

### Pas à pas

1. Exporte la configuration complète du dashboard source depuis son éditeur de configuration brute dans un fichier `.yaml`, `.yml` ou `.json`.
2. Clique sur **Importer un dashboard** ou dépose le fichier sur la carte.
3. Consulte **Dépendances**. Installe séparément les cartes personnalisées indiquées.
4. Ouvre **Correspondance des entités**. Choisis une suggestion ou saisis l’identifiant d’une entité existante du même domaine. Une lumière `light.*` doit être remplacée par une autre lumière `light.*`.
5. Ouvre **Aperçu de l’export** et vérifie les deux fichiers. Les références non résolues restent dans la copie exportée.
6. Clique sur **Télécharger**. Sauvegarde le dashboard de destination, puis importe la copie dans l’éditeur habituel de Home Assistant.

Pour importer le résultat, ouvre le dashboard de destination, choisis **Modifier le tableau de bord → ⋮ → Éditeur de configuration brute**, remplace le contenu par le fichier téléchargé et enregistre. Garde d’abord une copie de l’ancienne configuration.

### Présentation de l’interface

| Zone | Contenu |
| --- | --- |
| Barre d’outils | Nom du fichier, boutons **Importer un dashboard**, **Essayer la démo** et **Effacer**. |
| Résumé | Score de **Compatibilité**, nombre de vues, cartes et entités, compteurs Présentes / Absentes / Indisponibles. |
| Onglet **Dépendances** | Chaque entité référencée avec son état et son emplacement, les cartes personnalisées et les expressions de modèle détectées. |
| Onglet **Correspondance des entités** | Une ligne par entité absente, avec un champ de remplacement et des suggestions. Le titre de l’onglet indique résolues / absentes. |
| Onglet **Aperçu de l’export** | Fichiers original et adapté côte à côte, nombre de modifications, alerte pour les références non résolues et bouton **Télécharger**. |

Les emplacements utilisent un chemin lisible comme `views[0].cards[2].entity`, pour retrouver chaque référence dans le fichier source.

## Configuration

### Options de la carte

| Option | Valeurs | Par défaut | Description |
| --- | --- | --- | --- |
| `type` | `custom:dashboard-adapter-card` | obligatoire | Type de carte. |
| `language` | `auto`, `en`, `fr` | `auto` | Langue de l’interface. Toute autre valeur est refusée par l’éditeur de carte. |

La carte n’a pas d’autre option : tout le reste se fait dans la carte.

### Réglage de la langue

| Réglage | Comportement |
| --- | --- |
| `language: auto` | Suit la langue de l’interface Home Assistant de l’utilisateur connecté. |
| `language: fr` | Force le français. |
| `language: en` | Force l’anglais. |
| Aucun champ `language` | Identique à `auto`. |

`auto` utilise le français pour toute langue Home Assistant française et l’anglais pour toutes les autres langues. Pour la version française de la carte :

```yaml
type: custom:dashboard-adapter-card
language: fr
```

Les deux versions utilisent la même ressource JavaScript. Les identifiants d’entités et les noms de champs YAML restent identiques dans les deux langues.

### Exemples prêts à copier

- [Langue automatique](examples/card.auto.yaml)
- [Carte française](examples/card.fr.yaml)
- [Carte anglaise](examples/card.en.yaml)

## Fonctionnement

### Ce qui est vérifié et remplacé

Champs explicites pris en charge : `entity`, `entity_id` (y compris les listes), `camera_image`, `default_entity_id`, ainsi que les chaînes dans les tableaux `entities` et `entity_ids`. Les identifiants séparés par des virgules dans ces champs sont traités un par un. Les cartes imbriquées, les piles, les éléments d’images et les cibles d’actions sont parcourus à toute profondeur.

Exemple : dans l’extrait ci-dessous, les deux références à `light.living_room` sont détectées et remplacées ensemble.

```yaml
- type: button
  entity: light.living_room
  tap_action:
    action: perform-action
    perform_action: light.toggle
    target:
      entity_id:
        - light.living_room
```

Toutes les occurrences d’un même identifiant sont remplacées par le même choix.

### État des entités

| État | Signification |
| --- | --- |
| **Présente** | L’entité existe et a un état normal. |
| **Indisponible** | L’entité existe mais son état est `unknown` ou `unavailable`. Elle n’est pas proposée au remplacement. |
| **Absente** | Aucun état avec cet identifiant n’est visible pour la session. Elle peut être remplacée. |

La présence d’une entité est vérifiée dans les états accessibles à la session frontend Home Assistant. Un état absent ne prouve pas que l’entité a été supprimée ; vérifie **Outils de développement → États** si nécessaire.

Le score de **Compatibilité** correspond au nombre d’entités présentes divisé par le nombre d’entités référencées.

### Suggestions de remplacement

Les suggestions viennent de tes propres entités du même domaine, classées selon les mots qu’elles partagent avec l’identifiant absent (par exemple `living`, `room`, `temperature`). Jusqu’à huit suggestions sont affichées. Elles ne garantissent pas que l’appareil proposé corresponde au bon usage : vérifie que l’entité joue bien le même rôle.

Un remplacement est refusé si l’entité n’existe pas ou appartient à un autre domaine.

### Cartes personnalisées et modèles

La carte liste les types `custom:*`, sans confirmer l’installation de leurs ressources. Installe-les séparément, en général avec HACS.

Les modèles doivent être vérifiés manuellement : les identifiants intégrés dans Jinja, JavaScript, Markdown, CSS ou des champs propres à certaines cartes ne sont pas réécrits. Le nombre de champs contenant du Jinja est affiché dans **Dépendances**.

### Fichier exporté

- Le téléchargement garde le format source et ajoute `-adapted` au nom, par exemple `mon-dashboard-adapted.yaml`.
- Les commentaires YAML sont conservés lorsque possible ; la mise en forme peut changer.
- Le JSON exporté utilise deux espaces d’indentation.
- Les entités sans correspondance restent inchangées.

## Fichiers, confidentialité et limites

Le fichier doit contenir un tableau `views` à la racine. La limite est de 2 000 000 caractères, soit environ 2 Mo pour du texte ASCII. Le YAML doit être valide, sans clé en double. Les fichiers restent dans le navigateur jusqu’au téléchargement ; la carte ne les envoie ni ne les conserve. Effacer la carte ou recharger la page supprime l’import et les correspondances choisies.

Vérifie les URL privées ou les jetons présents avant de partager un export : cet outil ne les anonymise pas.

Non pris en charge :

- Les directives YAML `!include`, `!secret` et les autres tags Home Assistant.
- Les dashboards répartis en plusieurs fichiers.
- Une carte ou une vue seule, sans la structure complète du dashboard.
- Les identifiants dans les modèles ou dans les champs de texte libre propres à certaines cartes.
- Le remplacement par une entité d’un autre domaine.

## Dépannage

| Problème | Vérification |
| --- | --- |
| Carte introuvable | Ressource enregistrée comme module JavaScript, fichier téléchargé, navigateur actualisé en vidant le cache. |
| Import refusé | Dashboard complet avec `views` à la racine ; YAML/JSON valide ; aucune clé en double ni tag non pris en charge ; fichier de moins de 2 Mo. |
| Remplacement refusé | Entité existante et du même domaine que la référence source. |
| Aucune suggestion | Aucune entité du même domaine n’existe, ou tu es en mode démo avec des entités fictives. Saisis l’identifiant à la main. |
| Toutes les entités sont absentes | La carte est affichée hors de Home Assistant ou la session n’a pas accès aux états. Les contrôles de structure fonctionnent quand même. |
| Mauvaise langue | Utilise `auto` pour suivre Home Assistant, ou force `fr` / `en`. |
| Le dashboard adapté affiche encore des erreurs | Installe les cartes personnalisées listées et vérifie à la main les modèles et les champs propres à certaines cartes. |

## Questions fréquentes

**La carte modifie-t-elle ma configuration Home Assistant ?**
Non. Elle lit seulement les états des entités et produit un fichier. Tu décides de l’importer ou non.

**Mon dashboard est-il envoyé quelque part ?**
Non. Le fichier est lu et traité dans ton navigateur.

**Puis-je adapter un dashboard pour quelqu’un d’autre ?**
Oui, mais les suggestions et la disponibilité utilisent les entités de l’instance Home Assistant où la carte tourne.

**Pourquoi une entité est-elle indisponible et pas absente ?**
Elle existe dans ton instance mais renvoie actuellement `unknown` ou `unavailable`. Vérifie l’appareil ou l’intégration plutôt que de la remplacer.

**Est-ce compatible avec les dashboards en mode YAML ?**
Oui, si tu fournis la configuration complète dans un seul fichier, sans `!include` ni autre tag YAML.

## Développement

`npm ci` puis `npm run check` exécutent les tests unitaires, la compilation et le contrôle de l’artefact. `npm run build:demo` génère les deux démos. Lance `node scripts/preview-server.mjs`, puis ouvre `/demo/fr/index.html` ou `/demo/en/index.html` sur le serveur local.

| Commande | Rôle |
| --- | --- |
| `npm test` | Tests unitaires de l’analyse, de la lecture et de la réécriture. |
| `npm run build` | Construit `dist/dashboard-adapter.js`. |
| `npm run check` | Tests, compilation et contrôle de l’artefact HACS. |
| `npm run build:demo` | Construit les démos française et anglaise. |
| `npm run test:browser` | Tests en navigateur réel : bureau, correspondance, téléchargement, français, thème clair et mobile. |
| `npm run test:bilingual` | Tests de langue : langue forcée et automatique, export, erreurs traduites et navigation. |

Les tests navigateur utilisent Chrome installé. Définis `CHROME_PATH` si Chrome se trouve ailleurs.

Organisation du code : `src/card.js` (carte et interface), `src/dashboard.js` (lecture, analyse, suggestions et réécriture), `src/i18n.js` (traductions), `src/styles.js`, `src/demo.js` (données fictives de démo).

## Contribuer

Les tickets et les pull requests sont bienvenus. Indique la version de Home Assistant, la structure du dashboard, le résultat attendu et le résultat obtenu. Retire des exemples les URL privées, jetons, adresses IP et noms d’entités personnels. Voir [CONTRIBUTING.md](CONTRIBUTING.md) et le [journal des modifications](CHANGELOG.md).

## État du projet et soutien

Bêta publique. Les tests automatisés, la démo navigateur et la validation du dépôt HACS passent. L’installation sur une instance Home Assistant réelle reste à vérifier. [Signale un problème](https://github.com/SkyTyphon/dashboard-adapter/issues) avec un exemple anonymisé.

Licence MIT, voir [LICENSE](LICENSE). Si le projet t’aide, tu peux [m’offrir un café](https://buymeacoffee.com/skytyphoni).
