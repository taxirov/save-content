const { ensureFilesBase, toAbsolute, toPublicAbsolute, waitUntilReachable } = require('../utils/files');
const { buildFileName, buildFileUrl, writeTextFile } = require('../utils/localFiles');

const createHttpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const uploadAudioCaption = async ({ text, duration, uploadUrl, productId, srt }) => {
  const srtContent = String(srt || '').trim() ? String(srt) : buildSrtFromText(String(text || ''), duration);
  const srtBlob = new Blob([srtContent], { type: 'text/plain; charset=utf-8' });
  const formData = new FormData();
  formData.append('file', srtBlob, `${productId}.srt`);

  const uploadBase = ensureFilesBase(uploadUrl);
  const uploadResp = await fetch(`${uploadBase}/caption/${productId}`, { method: 'POST', body: formData });
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
  try { ok = await waitUntilReachable(primary, 10, 600, 'text'); } catch {}
  if (!ok && alt && alt !== primary) {
    try { ok = await waitUntilReachable(alt, 10, 600, 'text'); } catch {}
  }

  return { fileUrl: uploadData.fileUrl, verified: ok };
};

const generateAudioCaption = async ({ text, duration, productId, srt }) => {
  const srtContent = String(srt || '').trim() ? String(srt) : buildSrtFromText(String(text || ''), duration);
  const fileName = buildFileName(productId, 'caption', 'srt');
  if (!fileName) throw createHttpError(400, "productId noto'g'ri");

  await writeTextFile('caption', fileName, srtContent);
  const fileUrl = buildFileUrl('caption', fileName);
  return { fileUrl };
};

const buildSrtFromText = (text, durationSeconds) => {
  const source = text.replace(/\s+/g, ' ').trim();
  const sentences = source.match(/[^.!?]+[.!?]?/g) || [source];
  const totalWords = source.split(/\s+/).filter(Boolean).length;
  const totalTime = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : sentences.length * 3;
  let accumulatedWords = 0;

  const timed = sentences.map((sentence, idx) => {
    const words = Math.max(sentence.split(/\s+/).filter(Boolean).length, 1);
    const startFraction = accumulatedWords / totalWords;
    accumulatedWords += words;
    const endFraction = idx === sentences.length - 1 ? 1 : Math.min(1, accumulatedWords / totalWords);
    const start = totalTime * startFraction;
    const end = totalTime * endFraction;
    return { index: idx + 1, start, end, text: sentence.trim() };
  });

  return timed.map((entry) => {
    return `${entry.index}\n${formatTimestamp(entry.start)} --> ${formatTimestamp(entry.end)}\n${entry.text}\n`;
  }).join('\n').trim();
};

const formatTimestamp = (seconds) => {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const ms = totalMs % 1000;
  const totalSeconds = Math.floor((totalMs - ms) / 1000);
  const s = totalSeconds % 60;
  const totalMinutes = Math.floor((totalSeconds - s) / 60);
  const m = totalMinutes % 60;
  const h = Math.floor((totalMinutes - m) / 60);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)},${String(ms).padStart(3, '0')}`;
};

module.exports = {
  uploadAudioCaption,
  generateAudioCaption,
};
