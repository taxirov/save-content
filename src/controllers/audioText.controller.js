const { readJsonBody } = require('../utils/http');
const { uploadAudioText, generateAudioText } = require('../services/audioText.service');
const { buildAudioTemplate } = require('../services/audioTemplate.service');
const { getProductFile } = require('../services/productFiles.service');

const uploadAudioTextHandler = async (req, res) => {
  const body = await readJsonBody(req);
  if (!body) return res.status(400).json({ error: "Noto'g'ri JSON" });

  const { text, uploadUrl, productId } = body || {};
  if (!text) return res.status(400).json({ error: 'Matn topilmadi' });
  if (!uploadUrl) return res.status(400).json({ error: 'Yuklash uchun server manzili topilmadi (uploadUrl)' });
  if (!productId) return res.status(400).json({ error: 'productId talab qilinadi' });

  try {
    const result = await uploadAudioText({ text, uploadUrl, productId });
    if (!result.verified) {
      try { res.setHeader('X-File-Unverified', '1'); } catch {}
    }
    try { res.setHeader('X-Upload-Target', result.target); } catch {}
    return res.status(200).json({ url: result.fileUrl, text: result.text, target: result.target });
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err?.message || 'Server xatosi' });
  }
};

const generateAudioTextHandler = async (req, res) => {
  const body = await readJsonBody(req);
  if (!body) return res.status(400).json({ error: "Noto'g'ri JSON" });

  const { text, productId, id, item, product } = body || {};
  const targetId = productId || id;
  if (!targetId) return res.status(400).json({ error: 'productId talab qilinadi' });

  try {
    const resolvedText = text || buildAudioTemplate(item || product || body);
    if (!resolvedText || !String(resolvedText).trim()) {
      return res.status(400).json({ error: 'Matn topilmadi' });
    }
    const result = await generateAudioText({ text: resolvedText, productId: targetId });
    return res.status(200).json({ fileUrl: result.fileUrl, url: result.fileUrl, text: result.text });
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err?.message || 'Server xatosi' });
  }
};

module.exports = {
  uploadAudioTextHandler,
  generateAudioTextHandler,
  async getAudioTextHandler(req, res) {
    const productId = req.query.product_id || req.query.productId;
    try {
      const result = await getProductFile({ productId, field: 'audioTextUrl' });
      return res.status(200).json({ url: result.fileUrl, fileUrl: result.fileUrl, product: result.product });
    } catch (err) {
      const status = err?.status || 500;
      return res.status(status).json({ error: err?.message || 'Server xatosi' });
    }
  },
};
