const { ensureFilesBase, toAbsolute, toPublicAbsolute, waitUntilReachable } = require('../utils/files');
const { toLatinServer } = require('../utils/latin');
const { buildFileName, buildFileUrl, writeBinaryFile } = require('../utils/localFiles');

const ENDPOINT = 'https://api.elevenlabs.io/v1/text-to-speech/1bPXrtOTOTW6dae9i0K9';

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

const generateAudioBuffer = async ({ text, format }) => {
  const apiKey = process.env.ELEVENLABS_API || 'sk_eb736eb54bb49683c91fead56ae08c7797cecbe9ed754c92';
  if (!apiKey) throw createHttpError(500, 'ElevenLabs API kaliti topilmadi');

  let sourceText = String(text || '');
  try {
    sourceText = await toLatinServer(sourceText);
  } catch {}

  const elevenlabsResponse = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
      accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: sourceText,
      model_id: 'eleven_v3',
    }),
  });
  if (!elevenlabsResponse.ok) {
    const message = await elevenlabsResponse.text().catch(() => '');
    const detail = message?.trim() ? `: ${message.trim()}` : '';
    throw createHttpError(elevenlabsResponse.status, `ElevenLabs xatosi ${elevenlabsResponse.status}${detail}`);
  }

  const audioBuffer = await elevenlabsResponse.arrayBuffer();
  const contentType = elevenlabsResponse.headers.get('content-type') || `audio/${format}`;
  return { audioBuffer, contentType, sourceText };
};

const uploadAudio = async ({ text, uploadUrl, productId, format }) => {
  const resolvedFormat = normalizeFormat(format);
  const { audioBuffer, contentType } = await generateAudioBuffer({ text, format: resolvedFormat });

  const formData = new FormData();
  const fileBlob = new Blob([audioBuffer], { type: contentType });
  formData.append('file', fileBlob, `${productId}.${resolvedFormat}`);

  const uploadBase = ensureFilesBase(uploadUrl);
  const uploadResp = await fetch(`${uploadBase}/audio/${productId}`, { method: 'POST', body: formData });
  if (!uploadResp.ok) {
    const message = await uploadResp.text().catch(() => '');
    const detail = message?.trim() ? `: ${message.trim()}` : '';
    throw createHttpError(uploadResp.status, `Serverga yuklashda xatolik ${uploadResp.status}${detail}`);
  }

  const uploadData = await uploadResp.json().catch(() => null);
  if (!uploadData?.fileUrl) throw createHttpError(500, 'Serverdan fayl manzili qaytarilmadi');

  const primary = toAbsolute(uploadUrl, uploadData.fileUrl);
  const alt = toPublicAbsolute(uploadUrl, uploadData.fileUrl);
  let ok = false;
  try { ok = await waitUntilReachable(primary, 12, 600); } catch {}
  if (!ok && alt && alt !== primary) {
    try { ok = await waitUntilReachable(alt, 12, 600); } catch {}
  }

  return { fileUrl: uploadData.fileUrl, verified: ok };
};

const generateAudio = async ({ text, productId, format }) => {
  const resolvedFormat = normalizeFormat(format);
  const { audioBuffer } = await generateAudioBuffer({ text, format: resolvedFormat });
  const fileName = buildFileName(productId, 'audio', resolvedFormat);
  if (!fileName) throw createHttpError(400, "productId noto'g'ri");

  await writeBinaryFile('audio', fileName, Buffer.from(audioBuffer));
  const fileUrl = buildFileUrl('audio', fileName);
  return { fileUrl };
};

module.exports = {
  uploadAudio,
  generateAudio,
};
