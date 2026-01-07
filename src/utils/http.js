const { Readable } = require('stream');

const applyCors = (req, res, methods = 'GET,POST,PUT,PATCH,DELETE,OPTIONS') => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, Range');
};

const handleOptions = (req, res, methods) => {
  if (req.method === 'OPTIONS') {
    applyCors(req, res, methods);
    res.status(204).end();
    return true;
  }
  return false;
};

const readRawBody = async (req) => {
  if (req.readableEnded) return '';
  return await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
};

const readJsonBody = async (req) => {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  const raw = await readRawBody(req);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const proxyBodyForFetch = (req) => {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  if (req.body === undefined || req.body === null) return undefined;
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return req.body;
  return JSON.stringify(req.body);
};

const forwardWebStreamToNode = (res, webStream) => {
  if (!webStream) return res.end();
  Readable.fromWeb(webStream).pipe(res);
};

module.exports = {
  applyCors,
  handleOptions,
  readRawBody,
  readJsonBody,
  proxyBodyForFetch,
  forwardWebStreamToNode,
};
