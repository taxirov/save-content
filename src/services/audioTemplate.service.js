const normalizeSpaces = (text) => text.replace(/\s+/g, ' ').trim();

const normalizeValue = (value, fallback = "ma'lumot ko'rsatilmagan") => {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim();
  return str ? str : fallback;
};

const formatRounded = (value, fallback = "ma'lumot ko'rsatilmagan") => {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return String(Math.round(num));
};

const formatCommunications = (values) => {
  if (!Array.isArray(values) || !values.length) return '';
  const titles = {
    water_supply: 'Suv',
    electric_lighting: 'Elektr',
    gas_supply: 'Gaz',
    sewage: 'Kanalizatsiya',
  };
  return values
    .map((code) => titles[code] || code)
    .filter(Boolean)
    .join(', ');
};

const buildAudioTemplate = (item) => {
  const rawRegion = item?.productRegion || item?.raw?.productOrder?.region || item?.raw?.region || null;
  const parentName = rawRegion?.parent?.name || rawRegion?.parent?.parent?.name || item?.region || '';
  const regionName = rawRegion?.name || item?.district || '';
  const mfyName = item?.productMfy?.name || item?.raw?.productOrder?.mfy?.name || '';
  const mfyWord = mfyName.trim().split(/\s+/)[0] || '';
  const categoryText = (() => {
    const map = { 19: 'noturar binoni', 8: 'kvartirani', 12: 'xususiy uyni' };
    if (map[item?.categoryId]) return map[item.categoryId];
    if (item?.category) return `${String(item.category).toLowerCase()}ni`;
    return 'obyektni';
  })();
  const areaAll = formatRounded(item?.areaAll ?? item?.area);
  const buildingArea = formatRounded(item?.buildingArea ?? item?.areaAll ?? item?.area);
  const effectiveArea = formatRounded(item?.effectiveArea || item?.area_living);
  const typeOfBuilding = (() => {
    const base = item?.typeOfBuildingLabel || item?.typeOfBuilding;
    if (!base || !String(base).trim()) return '';
    return String(base).trim().toLowerCase();
  })();
  const floorsBuilding = normalizeValue(item?.floorsBuilding);
  const floors = normalizeValue(item?.floors);
  const floorsSentence = item?.separateBuilding
    ? `Uy qavatliligi ${floorsBuilding}.`
    : `Uy qavatliligi ${floorsBuilding}, qavati ${floors}.`;
  const communications = formatCommunications(item?.engineerCommunications);

  const sentences = [
    normalizeSpaces(`${parentName || ''} ${regionName || ''} ${mfyWord ? `${mfyWord} mahallasida` : ''} joylashgan ${categoryText} taklif qilamiz.`),
    `Umumiy yer maydoni ${areaAll} metr kvadrat.`,
    `Qurilish osti maydoni ${buildingArea} metr kvadrat.`,
    `Foydali maydoni ${effectiveArea} metr kvadrat.`,
    normalizeSpaces(`Qurilish turi ${typeOfBuilding}.`),
    normalizeSpaces(floorsSentence),
    communications ? `${communications} ta'minoti mavjud.` : '',
    'Joylashuvi qulay.',
    "Batafsil ma'lumot uchun 55 517 22 20 raqamiga bog'laning!",
  ];

  const isApartment = Number(item?.categoryId) === 8 || String(item?.category || '').toLowerCase().includes('kvartir');
  if (isApartment) {
    const filtered = sentences.filter((line) => {
      const v = String(line || '');
      return !/^Umumiy yer maydoni\s+/i.test(v) && !/^Qurilish osti maydoni\s+/i.test(v);
    });
    return filtered.join(' ');
  }
  return sentences.join(' ');
};

module.exports = {
  buildAudioTemplate,
};
