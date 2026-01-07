const { readJsonBody } = require('../utils/http');
const { uploadVideo, generateVideo } = require('../services/video.service');
const { getProductFile } = require('../services/productFiles.service');

const uploadVideoHandler = async (req, res) => {
  const body = await readJsonBody(req);
  if (!body) return res.status(400).json({ error: 'Invalid JSON' });

  const {
    audioUrl,
    captionsUrl,
    images = [],
    durationSeconds,
    title = '',
    subtitle = '',
    uploadUrl,
    productId,
  } = body || {};

  if (!audioUrl) return res.status(400).json({ error: 'Audio fayli manzili topilmadi' });
  if (!captionsUrl) return res.status(400).json({ error: 'Sarlavha fayli manzili topilmadi' });
  if (!Array.isArray(images) || !images.length) return res.status(400).json({ error: 'Kamida bitta rasm tanlang' });
  if (!uploadUrl) return res.status(400).json({ error: 'Video yuklash uchun server manzili topilmadi' });
  if (!productId) return res.status(400).json({ error: 'productId talab qilinadi' });

  try {
    const result = await uploadVideo({
      audioUrl,
      captionsUrl,
      images,
      durationSeconds,
      title,
      subtitle,
      uploadUrl,
      productId,
    });

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ url: result.url, ...(result.uploadData || {}) });
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err?.message || 'Video yaratishda xatolik' });
  }
};

const generateVideoHandler = async (req, res) => {
  const body = await readJsonBody(req);
  if (!body) return res.status(400).json({ error: 'Invalid JSON' });

  const {
    audioUrl,
    captionsUrl,
    images = [],
    durationSeconds,
    title = '',
    subtitle = '',
    productId,
    id,
  } = body || {};

  const targetId = productId || id;
  if (!audioUrl) return res.status(400).json({ error: 'Audio fayli manzili topilmadi' });
  if (!captionsUrl) return res.status(400).json({ error: 'Sarlavha fayli manzili topilmadi' });
  if (!Array.isArray(images) || !images.length) return res.status(400).json({ error: 'Kamida bitta rasm tanlang' });
  if (!targetId) return res.status(400).json({ error: 'productId talab qilinadi' });

  try {
    const result = await generateVideo({
      audioUrl,
      captionsUrl,
      images,
      durationSeconds,
      title,
      subtitle,
      productId: targetId,
    });
    return res.status(200).json({ fileUrl: result.fileUrl, url: result.fileUrl });
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err?.message || 'Video yaratishda xatolik' });
  }
};

module.exports = {
  uploadVideoHandler,
  generateVideoHandler,
  async getVideoHandler(req, res) {
    const productId = req.query.product_id || req.query.productId;
    try {
      const result = await getProductFile({ productId, field: 'videoUrl' });
      return res.status(200).json({ url: result.fileUrl, fileUrl: result.fileUrl, product: result.product });
    } catch (err) {
      const status = err?.status || 500;
      return res.status(status).json({ error: err?.message || 'Server xatosi' });
    }
  },
};
