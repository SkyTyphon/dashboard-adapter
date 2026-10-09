# v0.1.0-beta.4

Smarter replacement suggestions for Dashboard Adapter, a browser-only Lovelace card for adapting shared Home Assistant dashboards.

- Suggestions compare the missing reference (its ID and the `name` given in the card) with the ID and friendly name of each entity of the same domain.
- Accents are ignored and word prefixes match (`temp` finds `temperature`).
- Rare words, such as a device name, weigh more than common ones such as `status` or `battery`; words that none of your entities use are left out.
- Replacement fields show friendly names, then other entities of the same domain so they can be filtered by typing.
- A one-click **Suggestion** link appears only when one entity clearly stands out.

Measured on a real 167-entity dashboard: when an entity was renamed with a `_2` suffix, the right one was ranked first 155 times and always in the top three, and every one-click suggestion shown (114) was correct.

Demos: https://skytyphon.github.io/dashboard-adapter/en/ and https://skytyphon.github.io/dashboard-adapter/fr/

Suggestions are not confirmed device matches: a removed device can leave entities with the same name behind. Check each replacement and back up any dashboard before importing the adapted copy.
