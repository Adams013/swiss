export const SWISS_LOCATION_OPTIONS = [
  ['Zurich, Switzerland', 'Zurich', 'filters.locations.zurich'],
  ['Geneva, Switzerland', 'Geneva', 'filters.locations.geneva'],
  ['Basel, Switzerland', 'Basel', 'filters.locations.basel'],
  ['Bern, Switzerland', 'Bern', 'filters.locations.bern'],
  ['Lausanne, Switzerland', 'Lausanne', 'filters.locations.lausanne'],
  ['Lugano, Switzerland', 'Lugano', 'filters.locations.lugano'],
  ['Lucerne, Switzerland', 'Lucerne', 'filters.locations.lucerne'],
  ['St. Gallen, Switzerland', 'St. Gallen', 'filters.locations.stgallen'],
  ['Fribourg, Switzerland', 'Fribourg', 'filters.locations.fribourg'],
  ['Neuchâtel, Switzerland', 'Neuchâtel', 'filters.locations.neuchatel'],
  ['Winterthur, Switzerland', 'Winterthur', 'filters.locations.winterthur'],
  ['Zug, Switzerland', 'Zug', 'filters.locations.zug'],
  ['Sion, Switzerland', 'Sion', 'filters.locations.sion'],
  ['Chur, Switzerland', 'Chur', 'filters.locations.chur'],
  ['Biel/Bienne, Switzerland', 'Biel/Bienne', 'filters.locations.biel'],
  ['Schaffhausen, Switzerland', 'Schaffhausen', 'filters.locations.schaffhausen'],
  ['Thun, Switzerland', 'Thun', 'filters.locations.thun'],
  ['La Chaux-de-Fonds, Switzerland', 'La Chaux-de-Fonds', 'filters.locations.laChauxDeFonds'],
  ['Locarno, Switzerland', 'Locarno', 'filters.locations.locarno'],
  ['Bellinzona, Switzerland', 'Bellinzona', 'filters.locations.bellinzona'],
  ['Aarau, Switzerland', 'Aarau', 'filters.locations.aarau'],
  ['St. Moritz, Switzerland', 'St. Moritz', 'filters.locations.stMoritz'],
  ['Canton of Zurich', 'Canton of Zurich', 'filters.locations.cantonZurich'],
  ['Canton of Bern', 'Canton of Bern', 'filters.locations.cantonBern'],
  ['Canton of Lucerne', 'Canton of Lucerne', 'filters.locations.cantonLucerne'],
  ['Canton of Uri', 'Canton of Uri', 'filters.locations.cantonUri'],
  ['Canton of Schwyz', 'Canton of Schwyz', 'filters.locations.cantonSchwyz'],
  ['Canton of Obwalden', 'Canton of Obwalden', 'filters.locations.cantonObwalden'],
  ['Canton of Nidwalden', 'Canton of Nidwalden', 'filters.locations.cantonNidwalden'],
  ['Canton of Glarus', 'Canton of Glarus', 'filters.locations.cantonGlarus'],
  ['Canton of Zug', 'Canton of Zug', 'filters.locations.cantonZug'],
  ['Canton of Fribourg', 'Canton of Fribourg', 'filters.locations.cantonFribourg'],
  ['Canton of Solothurn', 'Canton of Solothurn', 'filters.locations.cantonSolothurn'],
  ['Canton of Basel-Stadt', 'Canton of Basel-Stadt', 'filters.locations.cantonBaselStadt'],
  ['Canton of Basel-Landschaft', 'Canton of Basel-Landschaft', 'filters.locations.cantonBaselLandschaft'],
  ['Canton of Schaffhausen', 'Canton of Schaffhausen', 'filters.locations.cantonSchaffhausen'],
  ['Canton of Appenzell Ausserrhoden', 'Canton of Appenzell Ausserrhoden', 'filters.locations.cantonAppenzellAusserrhoden'],
  ['Canton of Appenzell Innerrhoden', 'Canton of Appenzell Innerrhoden', 'filters.locations.cantonAppenzellInnerrhoden'],
  ['Canton of St. Gallen', 'Canton of St. Gallen', 'filters.locations.cantonStGallen'],
  ['Canton of Graubünden', 'Canton of Graubünden', 'filters.locations.cantonGraubunden'],
  ['Canton of Aargau', 'Canton of Aargau', 'filters.locations.cantonAargau'],
  ['Canton of Thurgau', 'Canton of Thurgau', 'filters.locations.cantonThurgau'],
  ['Canton of Ticino', 'Canton of Ticino', 'filters.locations.cantonTicino'],
  ['Canton of Vaud', 'Canton of Vaud', 'filters.locations.cantonVaud'],
  ['Canton of Valais', 'Canton of Valais', 'filters.locations.cantonValais'],
  ['Canton of Neuchâtel', 'Canton of Neuchâtel', 'filters.locations.cantonNeuchatel'],
  ['Canton of Geneva', 'Canton of Geneva', 'filters.locations.cantonGeneva'],
  ['Canton of Jura', 'Canton of Jura', 'filters.locations.cantonJura'],
  ['Remote within Switzerland', 'Remote within Switzerland', 'filters.locations.remoteSwitzerland'],
  ['Hybrid (Zurich)', 'Hybrid – Zurich', 'filters.locations.hybridZurich'],
  ['Hybrid (Geneva)', 'Hybrid – Geneva', 'filters.locations.hybridGeneva'],
  ['Hybrid (Lausanne)', 'Hybrid – Lausanne', 'filters.locations.hybridLausanne'],
  ['Hybrid (Basel)', 'Hybrid – Basel', 'filters.locations.hybridBasel'],
  ['Across Switzerland', 'Across Switzerland', 'filters.locations.acrossSwitzerland'],
].map(([value, label, translationKey]) => ({ value, label, translationKey }));

export const WORK_ARRANGEMENT_OPTIONS = [
  { value: 'on_site', label: 'On-site', translationKey: 'onSite' },
  { value: 'hybrid', label: 'Hybrid', translationKey: 'hybrid' },
  { value: 'remote', label: 'Remote', translationKey: 'remote' },
];

const WORK_ARRANGEMENT_VALUES = new Set(WORK_ARRANGEMENT_OPTIONS.map((option) => option.value));
const WORK_ARRANGEMENT_LABEL_MAP = WORK_ARRANGEMENT_OPTIONS.reduce((accumulator, option) => {
  accumulator[option.value] = option;
  return accumulator;
}, {});

const ALLOWED_SWISS_LOCATIONS = new Set(
  SWISS_LOCATION_OPTIONS.map((option) =>
    option.value
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase(),
  ),
);

export const buildWorkArrangementLabel = (translate, arrangement) => {
  if (!arrangement || typeof arrangement !== 'string') {
    return '';
  }

  const normalized = arrangement.trim();
  const option = WORK_ARRANGEMENT_LABEL_MAP[normalized];
  if (!option) {
    return '';
  }

  return translate(`jobs.arrangements.${option.translationKey}`, option.label);
};

export const normalizeLocationValue = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

export const isAllowedSwissLocation = (value) => {
  if (!value) {
    return false;
  }

  const normalized = normalizeLocationValue(value);
  if (ALLOWED_SWISS_LOCATIONS.has(normalized)) {
    return true;
  }

  return Array.from(ALLOWED_SWISS_LOCATIONS).some((candidate) => normalized.includes(candidate));
};

export const isWorkArrangementValue = (value) => WORK_ARRANGEMENT_VALUES.has(value);
