# v0.1.0-beta.2

Bilingual beta of Dashboard Adapter, a browser-only Lovelace card for adapting shared Home Assistant dashboards.

- Import a full YAML or JSON dashboard locally in the browser.
- See missing or unavailable entity references and custom card types.
- Map missing entities to existing same-domain entities.
- Review and download an adapted copy without changing Home Assistant.
- English/French UI, responsive layout and fictional demo data.
- `language: auto` follows the current Home Assistant interface language. Use `en` or `fr` to force a language.
- English demo: https://skytyphon.github.io/dashboard-adapter/en/
- French demo: https://skytyphon.github.io/dashboard-adapter/fr/
- Updated English/French guides and demonstrative images.

Automated unit, bundle and HACS repository validation checks pass. This beta has **not** yet been installed on a live Home Assistant instance. Template expressions, custom card-specific fields, resource installation and split YAML dashboards need manual review. Back up any dashboard before importing the adapted copy.
