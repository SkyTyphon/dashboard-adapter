# Dashboard Adapter

**[Readme Français](README.fr.md)**

If you want to try a demo, test it here: **[Demo](https://skytyphon.github.io/dashboard-adapter/en/)**.

If you like my work:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/skytyphoni)

[![Open HACS repository](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=SkyTyphon&repository=dashboard-adapter&category=plugin)

**Reuse a shared Home Assistant dashboard with your own devices.**

Downloaded a dashboard that uses `light.living_room`, while yours is called `light.salon`? Dashboard Adapter finds that missing reference, lets you choose your light, and downloads an adapted copy.

![Real demo: inspect missing references, choose replacement entities, then compare the adapted YAML](preview/how-it-works-en.png)

*Actual card running with fictional devices. The image shows the same sample before and after selected replacements.*

## What it does

1. Import a complete dashboard as YAML or JSON.
2. See missing entities, unavailable states and required custom card types.
3. Choose an existing replacement for each missing entity.
4. Compare the original and adapted files, then download a copy.

This is a **Lovelace card**, distributed through HACS as a **Dashboard** plugin. It runs in your browser, contains no Python and never saves changes to Home Assistant. You import the downloaded copy yourself.

## Try it first

Open the [English demo](https://skytyphon.github.io/dashboard-adapter/en/). Click **Apply example mappings**, then compare the two YAML panels. Click **Download** to get the adapted sample. The demo uses fictional devices and has no connection to your Home Assistant.

The [French demo](https://skytyphon.github.io/dashboard-adapter/fr/) offers the same features. Each page has a language switch and a light/dark theme switch.

## Install with HACS

Click **[Open HACS repository](https://my.home-assistant.io/redirect/hacs_repository/?owner=SkyTyphon&repository=dashboard-adapter&category=plugin)** to open this repository in your Home Assistant. HACS must already be installed. On your first visit, My Home Assistant asks for your instance address.

You can also add it manually:

1. In HACS, open **Custom repositories**.
2. Add `https://github.com/SkyTyphon/dashboard-adapter` with category **Dashboard**.
3. Download Dashboard Adapter. For the beta, enable prerelease versions if HACS offers that option.
4. Refresh Home Assistant, edit a dashboard, add a manual card and paste:

```yaml
type: custom:dashboard-adapter-card
language: auto
```

`auto` follows your Home Assistant interface language. Omitting `language` does the same. French and English are supported; other languages fall back to English.

If Home Assistant reports “Custom element doesn't exist”, check that this resource is registered as a **JavaScript module**:

```text
/hacsfiles/dashboard-adapter/dashboard-adapter.js
```

## Adapt your dashboard

1. Export the complete source dashboard from its raw configuration editor to a `.yaml`, `.yml` or `.json` file.
2. Click **Import dashboard** or drop the file onto the card.
3. Read **Dependencies**. Install listed custom cards separately.
4. Open **Entity mapping**. Choose a suggestion or type an existing entity ID of the same domain. For example, replace a `light.*` entity with another `light.*` entity.
5. Open **Export preview** and check both files. Unresolved references remain visible in the exported copy.
6. Click **Download**. Back up the destination dashboard, then import the adapted configuration through Home Assistant's normal editor.

## Going further

### Language settings

| Setting | Behavior |
| --- | --- |
| `language: auto` | Follows the language of the current Home Assistant user interface. |
| `language: en` | Forces English. |
| `language: fr` | Forces French. |
| No `language` field | Same as `auto`. |

For the English version of the card:

```yaml
type: custom:dashboard-adapter-card
language: en
```

The same JavaScript resource supplies both versions. Entity IDs and YAML field names stay unchanged across languages.

Ready-to-copy examples: [automatic language](examples/card.auto.yaml), [English card](examples/card.en.yaml), [French card](examples/card.fr.yaml).

### Manual installation

Copy [`dist/dashboard-adapter.js`](dist/dashboard-adapter.js) into `<config>/www/dashboard-adapter.js`. Register `/local/dashboard-adapter.js` as a **JavaScript module** resource, refresh the browser and add the card configuration above.

### What is inspected and replaced

Supported explicit fields: `entity`, `entity_id` (including lists), `camera_image`, `default_entity_id`, plus strings in `entities` and `entity_ids` arrays. Nested cards and action targets are traversed. Suggestions match the entity domain and words in its ID; they are suggestions, not confirmed device matches.

Entity presence is checked against states available to the current Home Assistant frontend session. A missing state does not prove that an entity has been deleted; check **Developer Tools → States** if needed. `unknown` and `unavailable` are displayed separately from missing IDs.

The card lists `custom:*` types, but cannot confirm whether their resources are installed. Review template expressions manually: entity IDs inside Jinja, JavaScript, Markdown, CSS and arbitrary custom card fields are not rewritten. YAML `!include`, other Home Assistant YAML tags and dashboards split across multiple files are not supported.

### Files, privacy and limits

Import requires a root `views` array and is limited to 2,000,000 characters (approximately 2 MB for ASCII text). YAML comments are preserved where possible, but formatting may change. JSON exports use two-space indentation. Files stay in the browser until you download them; the card does not upload or persist them.

Review private URLs or tokens in your source dashboard before sharing an export: this tool does not anonymize them.

### Troubleshooting

| Problem | What to check |
| --- | --- |
| Card not found | JavaScript resource registered, file downloaded, browser refreshed. |
| Import rejected | Complete dashboard with a root `views` array; valid YAML/JSON; no duplicate keys or unsupported tags. |
| Replacement rejected | Existing entity ID, same domain as the source reference. |
| Unexpected language | Use `auto` to follow the Home Assistant user interface, or force `fr` / `en`. |

### Development

Run `npm ci` and `npm run check` for unit tests, compilation and artifact checks. Run `npm run build:demo` to generate both demo pages. Serve locally with `node scripts/preview-server.mjs`; open `/demo/en/index.html` or `/demo/fr/index.html`.

`npm run test:browser` checks real browser interactions, export, translations and mobile layout using installed Chrome. Set `CHROME_PATH` if Chrome is elsewhere.

## Status and support

Public beta. Automated tests, browser demo and HACS repository validation pass. Installation on a live Home Assistant instance remains to be verified. [Report a problem](https://github.com/SkyTyphon/dashboard-adapter/issues) with a sanitized example.

MIT license. If this project helps you, you can [buy me a coffee](https://buymeacoffee.com/skytyphoni).
