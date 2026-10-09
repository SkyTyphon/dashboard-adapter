# v0.1.0-beta.3

Reliability beta of Dashboard Adapter, a browser-only Lovelace card for adapting shared Home Assistant dashboards.

Fixes:

- The replacement being typed, the focus and the scroll position are no longer lost when Home Assistant pushes state updates.
- YAML anchors, aliases and merge keys (`&name`, `*name`, `<<:`) are rewritten correctly instead of failing at export.
- Unresolved YAML tags such as `!include` and `!secret` are refused with a clear, translated message.
- Export errors are shown in the preview, translated, and export is disabled until they are fixed.
- Card count no longer includes tile features or picture elements.
- button-card JavaScript templates (`[[[ ]]]`) are detected alongside Jinja.

Improvements:

- Present and unavailable entities can also be replaced from a secondary list in **Entity mapping**.
- New **Copy** button, useful in the Home Assistant mobile app and over plain HTTP.
- Analysis and preview are cached between redraws.
- Accent colors adapt to light Home Assistant themes.
- English and French guides updated.

Demos: https://skytyphon.github.io/dashboard-adapter/en/ and https://skytyphon.github.io/dashboard-adapter/fr/

Automated unit, browser and HACS repository validation checks pass. This beta has **not** yet been installed on a live Home Assistant instance. Template expressions, custom card-specific fields and resource installation need manual review. Back up any dashboard before importing the adapted copy.
