const { productProxyRequest } = require('../services/productProxy.service');

const productProxyHandler = async (req, res) => {
  try {
    return await productProxyRequest(req, res);
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err?.message || 'Server xatosi' });
  }
};

module.exports = {
  productProxyHandler,
};
