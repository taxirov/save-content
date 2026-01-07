const { proxyBodyForFetch } = require('../utils/http');

const TARGET = 'https://api.uy-joy.uz';
const ALLOWED_FORWARD_HEADERS = ['authorization', 'content-type', 'accept'];

const productProxyRequest = async (req, res) => {
  const targetUrl = new URL(req.originalUrl, TARGET);

  const headers = new Headers();
  for (const key of ALLOWED_FORWARD_HEADERS) {
    const value = req.headers[key];
    if (value) headers.set(key, value);
  }
  if (!headers.has('accept')) headers.set('accept', 'application/json');

  const body = proxyBodyForFetch(req);
  if (body && !headers.has('content-type') && typeof body === 'string') {
    headers.set('content-type', 'application/json');
  }

  const upstream = await fetch(targetUrl.toString(), {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method.toUpperCase()) ? undefined : body,
    redirect: 'manual',
  });

  res.status(upstream.status);
  upstream.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (upstream.body) {
    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.end(buffer);
  }
  return res.end();
};

module.exports = {
  productProxyRequest,
};
