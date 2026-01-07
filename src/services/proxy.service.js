const { forwardWebStreamToNode } = require('../utils/http');

const ALLOWED_HOSTS = new Set([
  '46.173.26.14:3000',
  '46.173.26.14',
  'e-content.webpack.uz',
  'e-content.webpack.uz:443',
]);

const createHttpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const proxyRequest = async (req, res) => {
  const fullUrl = new URL(req.originalUrl, 'http://local');
  const target = fullUrl.searchParams.get('url') || fullUrl.searchParams.get('u');
  if (!target) throw createHttpError(400, 'Missing url');
  const t = new URL(target);
  if (!(t.protocol === 'http:' || t.protocol === 'https:')) throw createHttpError(400, 'Invalid protocol');
  const hostKey = t.port ? `${t.hostname}:${t.port}` : t.hostname;
  if (!ALLOWED_HOSTS.has(hostKey)) throw createHttpError(403, 'Host not allowed');

  const forwardHeaders = {};
  const range = req.headers['range'];
  if (range) forwardHeaders['Range'] = range;

  const upstream = await fetch(t.toString(), { method: req.method, headers: forwardHeaders });

  res.status(upstream.status);
  const ct = upstream.headers.get('content-type');
  if (ct) res.setHeader('Content-Type', ct);
  const len = upstream.headers.get('content-length');
  if (len) res.setHeader('Content-Length', len);
  const acceptRanges = upstream.headers.get('accept-ranges');
  if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);
  const contentRange = upstream.headers.get('content-range');
  if (contentRange) res.setHeader('Content-Range', contentRange);
  const lastMod = upstream.headers.get('last-modified');
  if (lastMod) res.setHeader('Last-Modified', lastMod);
  const etag = upstream.headers.get('etag');
  if (etag) res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'public, max-age=0');

  if (req.method === 'HEAD') return res.end();
  return forwardWebStreamToNode(res, upstream.body);
};

module.exports = {
  proxyRequest,
};
