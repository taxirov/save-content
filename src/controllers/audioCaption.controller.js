const { readJsonBody } = require('../utils/http');
const { uploadAudioCaption, generateAudioCaption } = require('../services/audioCaption.service');
const { getProductFile } = require('../services/productFiles.service');

const uploadAudioCaptionHandler = async (req, res) => {
  const body = await readJsonBody(req);
  if (!body) return res.status(400).json({ error: "Noto'g'ri JSON" });

  const { text, duration, uploadUrl, productId, srt } = body || {};
  if (!text && !srt) return res.status(400).json({ error: 'Matn yoki SRT topilmadi' });
  if (!srt && !duration) return res.status(400).json({ error: 'Audio davomiyligi topilmadi' });
  if (!uploadUrl) return res.status(400).json({ error: 'Yuklash uchun server manzili topilmadi (uploadUrl)' });
  if (!productId) return res.status(400).json({ error: 'productId talab qilinadi' });

  try {
    const result = await uploadAudioCaption({ text, duration, uploadUrl, productId, srt });
    if (!result.verified) {
      try { res.setHeader('X-File-Unverified', '1'); } catch {}
    }
    return res.status(200).json({ url: result.fileUrl });
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err?.message || 'Server xatosi' });
  }
};

const generateAudioCaptionHandler = async (req, res) => {
  const body = await readJsonBody(req);
  if (!body) return res.status(400).json({ error: "Noto'g'ri JSON" });

  const { text, duration, productId, id, srt } = body || {};
  const targetId = productId || id;
  if (!text && !srt) return res.status(400).json({ error: 'Matn yoki SRT topilmadi' });
  if (!srt && !duration) return res.status(400).json({ error: 'Audio davomiyligi topilmadi' });
  if (!targetId) return res.status(400).json({ error: 'productId talab qilinadi' });

  try {
    const result = await generateAudioCaption({ text, duration, productId: targetId, srt });
    return res.status(200).json({ fileUrl: result.fileUrl, url: result.fileUrl });
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err?.message || 'Server xatosi' });
  }
};

module.exports = {
  uploadAudioCaptionHandler,
  generateAudioCaptionHandler,
  async getAudioCaptionHandler(req, res) {
    const productId = req.query.product_id || req.query.productId;
    try {
      const result = await getProductFile({ productId, field: 'captionUrl' });
      return res.status(200).json({ url: result.fileUrl, fileUrl: result.fileUrl, product: result.product });
    } catch (err) {
      const status = err?.status || 500;
      return res.status(status).json({ error: err?.message || 'Server xatosi' });
    }
  },
};
