const { readJsonBody } = require('../utils/http');
const { uploadAudio, generateAudio } = require('../services/audio.service');
const { getProductFile } = require('../services/productFiles.service');

const uploadAudioHandler = async (req, res) => {
  const body = await readJsonBody(req);
  if (!body) return res.status(400).json({ error: "Noto'g'ri JSON" });

  const { text, uploadUrl, productId, format } = body || {};
  if (!text) return res.status(400).json({ error: 'Matn topilmadi' });
  if (!uploadUrl) return res.status(400).json({ error: 'Yuklash uchun server manzili topilmadi (uploadUrl)' });
  if (!productId) return res.status(400).json({ error: 'productId talab qilinadi' });

  try {
    const result = await uploadAudio({ text, uploadUrl, productId, format });
    if (!result.verified) {
      try { res.setHeader('X-File-Unverified', '1'); } catch {}
    }
    return res.status(200).json({ url: result.fileUrl });
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err?.message || 'Server xatosi' });
  }
};

const generateAudioHandler = async (req, res) => {
  const body = await readJsonBody(req);
  if (!body) return res.status(400).json({ error: "Noto'g'ri JSON" });

  const { text, productId, id, format } = body || {};
  const targetId = productId || id;
  if (!text) return res.status(400).json({ error: 'Matn topilmadi' });
  if (!targetId) return res.status(400).json({ error: 'productId talab qilinadi' });

  try {
    const result = await generateAudio({ text, productId: targetId, format });
    return res.status(200).json({ fileUrl: result.fileUrl, url: result.fileUrl });
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err?.message || 'Server xatosi' });
  }
};

module.exports = {
  uploadAudioHandler,
  generateAudioHandler,
  async getAudioHandler(req, res) {
    const productId = req.query.product_id || req.query.productId;
    try {
      const result = await getProductFile({ productId, field: 'audioUrl' });
      return res.status(200).json({ url: result.fileUrl, fileUrl: result.fileUrl, product: result.product });
    } catch (err) {
      const status = err?.status || 500;
      return res.status(status).json({ error: err?.message || 'Server xatosi' });
    }
  },
};
