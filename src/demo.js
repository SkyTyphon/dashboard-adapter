export const demoText = `title: Shared Home\nviews:\n  - title: Overview\n    path: overview\n    cards:\n      - type: entities\n        title: Living room\n        entities:\n          - light.living_room\n          - sensor.living_room_temperature\n          - switch.coffee_machine\n      - type: custom:mini-graph-card\n        entities:\n          - sensor.living_room_temperature\n      - type: button\n        entity: light.bedroom\n        tap_action:\n          action: toggle\n  - title: Energy\n    cards:\n      - type: energy-distribution\n        title: Power\n      - type: entity\n        entity: sensor.home_energy\n`;

export const demoStates = {
  'light.salon': { state: 'on', attributes: { friendly_name: 'Salon' } },
  'light.chambre': { state: 'off', attributes: { friendly_name: 'Chambre' } },
  'sensor.salon_temperature': { state: '21.4', attributes: { friendly_name: 'Salon temperature' } },
  'sensor.home_energy': { state: '8.2', attributes: { friendly_name: 'Home energy' } },
  'switch.coffee_maker': { state: 'off', attributes: { friendly_name: 'Coffee maker' } },
};
