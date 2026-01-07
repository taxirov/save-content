const { proxyRequest } = require('../services/proxy.service');

const proxyHandler = async (req, res) => {
  try {
    return await proxyRequest(req, res);
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).end(err?.message || 'Proxy error');
  }
};

module.exports = {
  proxyHandler,
};
