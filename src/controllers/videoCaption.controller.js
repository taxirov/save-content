const { readJsonBody } = require('../utils/http');
const { uploadVideoCaption, generateVideoCaption } = require('../services/videoCaption.service');
const { getProductFile } = require('../services/productFiles.service');

const uploadVideoCaptionHandler = async (req, res) => {
  const body = await readJsonBody(req);
  if (!body) return res.status(400).json({ error: "Noto'g'ri JSON" });

  const { text, uploadUrl, productId } = body || {};
  if (!text) return res.status(400).json({ error: 'Matn topilmadi' });
  if (!uploadUrl) return res.status(400).json({ error: 'Yuklash uchun server manzili topilmadi (uploadUrl)' });
  if (!productId) return res.status(400).json({ error: 'productId talab qilinadi' });

  try {
    const result = await uploadVideoCaption({ text, uploadUrl, productId });
    if (!result.verified) {
      try { res.setHeader('X-File-Unverified', '1'); } catch {}
    }
    return res.status(200).json({ url: result.fileUrl });
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err?.message || 'Server xatosi' });
  }
};

const generateVideoCaptionHandler = async (req, res) => {
  const body = await readJsonBody(req);
  if (!body) return res.status(400).json({ error: "Noto'g'ri JSON" });

  const { text, productId, id } = body || {};
  const targetId = productId || id;
  if (!text) return res.status(400).json({ error: 'Matn topilmadi' });
  if (!targetId) return res.status(400).json({ error: 'productId talab qilinadi' });

  try {
    const result = await generateVideoCaption({ text, productId: targetId });
    return res.status(200).json({ fileUrl: result.fileUrl, url: result.fileUrl });
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err?.message || 'Server xatosi' });
  }
};

module.exports = {
  uploadVideoCaptionHandler,
  generateVideoCaptionHandler,
  async getVideoCaptionHandler(req, res) {
    const productId = req.query.product_id || req.query.productId;
    try {
      const result = await getProductFile({ productId, field: 'videoCaptionUrl' });
      return res.status(200).json({ url: result.fileUrl, fileUrl: result.fileUrl, product: result.product });
    } catch (err) {
      const status = err?.status || 500;
      return res.status(status).json({ error: err?.message || 'Server xatosi' });
    }
  },
};
