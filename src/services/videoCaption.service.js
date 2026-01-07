const { ensureFilesBase, toAbsolute, waitUntilReachable } = require('../utils/files');
const { buildFileName, buildFileUrl, writeTextFile } = require('../utils/localFiles');

const createHttpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const uploadVideoCaption = async ({ text, uploadUrl, productId }) => {
  const blob = new Blob([String(text || '')], { type: 'text/plain; charset=utf-8' });
  const form = new FormData();
  form.append('file', blob, `${productId}.txt`);

  const uploadBase = ensureFilesBase(uploadUrl);
  const uploadResp = await fetch(`${uploadBase}/videoCaption/${productId}`, { method: 'POST', body: form });
  if (!uploadResp.ok) {
    const message = await uploadResp.text().catch(() => '');
    const detail = message?.trim() ? `: ${message.trim()}` : '';
    throw createHttpError(uploadResp.status, `Serverga yuklashda xatolik ${uploadResp.status}${detail}`);
  }

  const data = await uploadResp.json().catch(() => null);
  if (!data?.fileUrl) throw createHttpError(500, 'Serverdan fayl manzili qaytarilmadi');

  const publicUrl = toAbsolute(uploadUrl, data.fileUrl);
  let ok = false;
  try { ok = await waitUntilReachable(publicUrl, 10, 600, 'text'); } catch {}

  return { fileUrl: data.fileUrl, verified: ok };
};

const generateVideoCaption = async ({ text, productId }) => {
  const fileName = buildFileName(productId, 'videoCaption', 'txt');
  if (!fileName) throw createHttpError(400, "productId noto'g'ri");

  await writeTextFile('videoCaption', fileName, String(text || ''));
  const fileUrl = buildFileUrl('videoCaption', fileName);
  return { fileUrl };
};

module.exports = {
  uploadVideoCaption,
  generateVideoCaption,
};
