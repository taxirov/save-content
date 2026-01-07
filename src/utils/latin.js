const toLatinServer = async (text) => {
  const t = (text || '').trim();
  if (!t) return t;
  const token = process.env.MATN_API_TOKEN || 'vmTYSQIIyB8kUDAaNy33Asu4jjnQ5qXbsJcIehi7SOmoUmhvmdogxsTlKmM8c6W46AFweVlvflEs0VdK';
  if (!token) return t;
  try {
    const resp = await fetch('https://matn.uz/api/v1/latin', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: t }),
    });
    if (!resp.ok) return t;
    const raw = await resp.text();
    const decoded = decodeLatinResponse(raw);
    return normalizeApostrophes(decoded || t);
  } catch {
    return t;
  }
};

const decodeLatinResponse = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === 'string') return parsed;
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.text === 'string') return parsed.text;
      if (typeof parsed.data === 'string') return parsed.data;
    }
  } catch {}
  return value;
};

const normalizeApostrophes = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"');
};

module.exports = {
  toLatinServer,
  decodeLatinResponse,
  normalizeApostrophes,
};
