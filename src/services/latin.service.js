const { decodeLatinResponse, normalizeApostrophes } = require('../utils/latin');

const API_URL = 'https://matn.uz/api/v1/latin';

const createHttpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const convertLatin = async ({ text }) => {
  const token = process.env.MATN_API_TOKEN || 'vmTYSQIIyB8kUDAaNy33Asu4jjnQ5qXbsJcIehi7SOmoUmhvmdogxsTlKmM8c6W46AFweVlvflEs0VdK';
  if (!token) throw createHttpError(500, 'Matn API token topilmadi');

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!resp.ok) {
    const message = await resp.text().catch(() => '');
    const detail = message?.trim() ? `: ${message.trim()}` : '';
    throw createHttpError(resp.status, `Matn.uz xatosi ${resp.status}${detail}`);
  }

  const rawLatin = await resp.text();
  const decodedLatin = decodeLatinResponse(rawLatin);
  const latin = normalizeApostrophes(decodedLatin);
  return { text: latin };
};

module.exports = {
  convertLatin,
};
