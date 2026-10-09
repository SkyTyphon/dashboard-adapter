const messages = {
  en: {
    beta: 'BETA', analysis: 'Dashboard analysis', footer: 'Adapt dashboards locally', syntaxError: 'Invalid YAML or JSON. Check the file syntax and duplicate keys.', sizeError: 'File exceeds the 2 MB limit.', structureError: 'Expected a complete dashboard with a views array.',
    eyebrow: 'DASHBOARD PORTABILITY STUDIO', title: 'Make a shared dashboard yours.',
    subtitle: 'Inspect dependencies, match missing entities, and export a clean copy. Your Home Assistant configuration is never changed.',
    import: 'Import dashboard', demo: 'Try demo', drop: 'Drop a YAML or JSON dashboard here',
    privacy: 'Processed in your browser · No upload', ready: 'Ready', missing: 'Missing', unavailable: 'Unavailable',
    views: 'Views', cards: 'Cards', entities: 'Entities', health: 'Compatibility',
    dependencies: 'Dependencies', mapping: 'Entity mapping', preview: 'Export preview',
    custom: 'Custom cards', customHint: 'Install these cards separately. This tool cannot confirm which frontend resources are installed.',
    dynamic: 'Template expressions', dynamicHint: 'Review template expressions manually; embedded entity IDs are not rewritten.',
    noIssues: 'All referenced entities were found.', noDashboard: 'Start with a shared dashboard file or explore the demo.',
    choose: 'Choose replacement', export: 'Export adapted dashboard', original: 'Original', adapted: 'Adapted',
    unresolved: 'Unresolved references remain in the export.', filename: 'Dashboard file',
    demoLabel: 'Demo data · example entities only', fileError: 'Could not read dashboard',
    noHass: 'No Home Assistant state available. Import and structure checks still work.',
    changes: 'Changes', download: 'Download', selected: 'selected', noChanges: 'Choose a replacement to see an adapted export.',
    reset: 'Clear', invalidMapping: 'Choose an existing entity from the same domain.', previewNote: 'Only explicit entity fields are changed. Review the exported YAML or JSON before importing it into Home Assistant.',
  },
  fr: {
    beta: 'BÊTA', analysis: 'Analyse du dashboard', footer: 'Adapter les dashboards localement', syntaxError: 'YAML ou JSON invalide. Vérifie la syntaxe du fichier et les clés en double.', sizeError: 'Le fichier dépasse la limite de 2 Mo.', structureError: 'Le fichier doit contenir un dashboard complet avec un tableau views.',
    eyebrow: 'ATELIER DE PORTABILITÉ', title: 'Adapte un dashboard partagé à ta maison.',
    subtitle: 'Vérifie les dépendances, associe les entités absentes et exporte une copie corrigée. La configuration de Home Assistant reste intacte.',
    import: 'Importer un dashboard', demo: 'Essayer la démo', drop: 'Dépose ici un dashboard YAML ou JSON',
    privacy: 'Traitement dans ton navigateur · Aucun envoi', ready: 'Présentes', missing: 'Absentes', unavailable: 'Indisponibles',
    views: 'Vues', cards: 'Cartes', entities: 'Entités', health: 'Compatibilité',
    dependencies: 'Dépendances', mapping: 'Correspondance des entités', preview: 'Aperçu de l’export',
    custom: 'Cartes personnalisées', customHint: 'Installe ces cartes séparément. Cet outil ne peut pas confirmer les ressources frontend installées.',
    dynamic: 'Expressions de modèle', dynamicHint: 'Vérifie les modèles manuellement ; leurs identifiants intégrés ne sont pas réécrits.',
    noIssues: 'Toutes les entités référencées ont été trouvées.', noDashboard: 'Charge un dashboard partagé ou explore la démo.',
    choose: 'Choisir une entité', export: 'Exporter le dashboard adapté', original: 'Original', adapted: 'Adapté',
    unresolved: 'Des références non résolues restent dans l’export.', filename: 'Fichier dashboard',
    demoLabel: 'Données de démo · entités fictives', fileError: 'Impossible de lire le dashboard',
    noHass: 'État Home Assistant indisponible. L’import et les contrôles de structure fonctionnent quand même.',
    changes: 'Modifications', download: 'Télécharger', selected: 'choisie', noChanges: 'Choisis une entité de remplacement pour voir un export adapté.',
    reset: 'Effacer', invalidMapping: 'Choisis une entité existante du même domaine.', previewNote: 'Seuls les champs explicites d’entité sont modifiés. Vérifie le YAML ou JSON exporté avant de l’importer dans Home Assistant.',
  },
};

export function translate(language) {
  return messages[language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'];
}

export function translateError(message, language) {
  const t = translate(language);
  if (message.includes('2 MB limit')) return t.sizeError;
  if (message.includes('views array')) return t.structureError;
  return t.syntaxError;
}
