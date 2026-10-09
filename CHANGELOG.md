# Changelog

## Unreleased

- Smarter replacement suggestions: friendly names and card `name` fields are compared, accents ignored, word prefixes matched, and rare words weigh more than common ones.
- Replacement fields list friendly names and other entities of the same domain.
- One-click **Suggestion** link when a single entity clearly matches.

## 0.1.0-beta.3

- Keep the replacement being typed, focus and scroll position when Home Assistant pushes state updates; redraw only when a referenced entity changes status.
- Support YAML anchors, aliases and merge keys when rewriting entities.
- Refuse unresolved YAML tags such as `!include` and `!secret` with a translated message.
- Show translated export errors in the preview and disable export while they remain.
- Count only real cards (tile features and picture elements excluded).
- Detect button-card JavaScript templates (`[[[ ]]]`) alongside Jinja.
- Allow replacing present and unavailable entities from a secondary list.
- Add a **Copy** button with a fallback for Home Assistant served over plain HTTP.
- Cache analysis and preview between redraws.
- Theme-aware accent colors for light Home Assistant themes.

## 0.1.0-beta.2

- Separate English and French demo URLs with matching documentation links.
- Explicit `language: auto` follows the current Home Assistant interface language; `en` and `fr` override it.
- Localized card footer, accessibility labels and import errors.
- Equivalent English/French README guides with advanced settings and support links.
- Demonstrative before/after images captured from the working card.
- Real browser checks for both languages, auto settings, export and mobile layout.

## 0.1.0 - Local beta

- Initial YAML/JSON dashboard import and dependency inventory.
- Explicit entity mapping, structural rewrite, and adapted export.
- English/French responsive interface and fictional demo mode.
- Browser-only HACS Dashboard bundle and automated checks.
