const ENDPOINTS = {
  m4a: 'https://api.narakeet.com/text-to-speech/m4a',
  mp3: 'https://api.narakeet.com/text-to-speech/mp3',
  wav: 'https://api.narakeet.com/text-to-speech/wav',
};

const createHttpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const normalizeFormat = (value) => {
  const v = (value || '').toLowerCase();
  if (v === 'mp3') return 'mp3';
  if (v === 'wav') return 'wav';
  return 'm4a';
};

const normalizeContentType = (value) => {
  if (!value) return 'text/plain; charset=utf-8';
  const v = value.toLowerCase().trim();
  if (v === 'application/x-subrip' || v === 'application/x-subrip; charset=utf-8') {
    return 'application/x-subrip';
  }
  if (v === 'text/srt' || v === 'text/srt; charset=utf-8') {
    return 'text/srt';
  }
  if (v === 'text/plain' || v === 'text/plain; charset=utf-8') {
    return 'text/plain; charset=utf-8';
  }
  return 'text/plain; charset=utf-8';
};

const textToSpeech = async ({ text, format, contentType, voice, voiceSpeed, voiceVolume }) => {
  const apiKey = process.env.NARAKEET_API_KEY || 'd9oq53OreB7PVhOTzX2zV9sNALxL2HrwJ4AvwzK0';
  if (!apiKey) throw createHttpError(500, 'Narakeet API kaliti topilmadi');

  const fmt = normalizeFormat(format);
  const endpoint = ENDPOINTS[fmt] || ENDPOINTS.m4a;
  const requestContentType = normalizeContentType(contentType);

  const params = new URLSearchParams();
  const v = (voice || 'gulnora').trim();
  if (v) params.set('voice', v);

  const vSpeed = (voiceSpeed || '').trim();
  if (vSpeed) params.set('voice-speed', vSpeed);

  const vVolume = (voiceVolume || '').trim();
  if (vVolume) params.set('voice-volume', vVolume);

  const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint;

  const narakeetResp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': requestContentType,
      accept: 'application/octet-stream',
      'x-api-key': apiKey,
    },
    body: text,
  });

  if (!narakeetResp.ok) {
    const message = await narakeetResp.text().catch(() => '');
    const detail = message?.trim() ? `: ${message.trim()}` : '';
    throw createHttpError(narakeetResp.status, `Narakeet xatosi ${narakeetResp.status}${detail}`);
  }

  const buffer = await narakeetResp.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const durationHeader = narakeetResp.headers.get('x-duration-seconds');
  const duration = durationHeader ? Number(durationHeader) : undefined;
  const responseContentType = narakeetResp.headers.get('content-type') || `audio/${fmt}`;

  return {
    base64,
    duration: Number.isFinite(duration) ? duration : undefined,
    contentType: responseContentType,
  };
};

module.exports = {
  textToSpeech,
};
