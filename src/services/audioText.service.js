const { ensureFilesBase, toAbsolute, toPublicAbsolute, waitUntilReachable } = require('../utils/files');
const { toLatinServer } = require('../utils/latin');
const { buildFileName, buildFileUrl, writeTextFile } = require('../utils/localFiles');

const createHttpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const uploadAudioText = async ({ text, uploadUrl, productId }) => {
  const latin = await toLatinServer(String(text || ''));
  const textBlob = new Blob([latin], { type: 'text/plain; charset=utf-8' });
  const formData = new FormData();
  formData.append('file', textBlob, `${productId}.txt`);

  const uploadBase = ensureFilesBase(uploadUrl);
  const uploadResp = await fetch(`${uploadBase}/audioText/${productId}`, { method: 'POST', body: formData });
  if (!uploadResp.ok) {
    const message = await uploadResp.text().catch(() => '');
    const detail = message?.trim() ? `: ${message.trim()}` : '';
    throw createHttpError(uploadResp.status, `Serverga yuklashda xatolik ${uploadResp.status}${detail}`);
  }

  const uploadData = await uploadResp.json().catch(() => null);
  if (!uploadData?.fileUrl) throw createHttpError(500, 'Serverdan fayl manzili qaytarilmadi');

  const fileUrl = uploadData.fileUrl;
  const primary = toAbsolute(uploadUrl, fileUrl);
  const alt = toPublicAbsolute(uploadUrl, fileUrl);
  let verified = false;
  try { verified = await waitUntilReachable(primary, 10, 600, 'text'); } catch {}
  if (!verified && alt && alt !== primary) {
    try { verified = await waitUntilReachable(alt, 10, 600, 'text'); } catch {}
  }

  return {
    fileUrl,
    text: latin,
    target: `${uploadBase}/audioText/${productId}`,
    verified,
  };
};

const generateAudioText = async ({ text, productId }) => {
  const latin = await toLatinServer(String(text || ''));
  const fileName = buildFileName(productId, 'audioText', 'txt');
  if (!fileName) throw createHttpError(400, "productId noto'g'ri");

  await writeTextFile('audioText', fileName, latin);
  const fileUrl = buildFileUrl('audioText', fileName);
  return { fileUrl, text: latin };
};

module.exports = {
  uploadAudioText,
  generateAudioText,
};
