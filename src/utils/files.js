const { URL } = require('url');

const ensureFilesBase = (value) => {
  const s = String(value || '').trim();
  if (!s) return '/api/files';
  try {
    const u = new URL(s);
    let p = (u.pathname || '').replace(/\/$/, '');
    const idx = p.toLowerCase().indexOf('/files');
    if (idx >= 0) p = p.slice(0, idx + 6);
    else p = `${p}/files`;
    u.pathname = p;
    return u.toString().replace(/\/$/, '');
  } catch {
    let b = s.replace(/\/$/, '');
    const idx = b.toLowerCase().indexOf('/files');
    if (idx >= 0) b = b.slice(0, idx + 6);
    else b = `${b}/files`;
    return b;
  }
};

const toAbsolute = (base, maybe) => {
  const p = String(maybe || '');
  if (/^https?:\/\//i.test(p)) return p;
  try {
    const u = new URL(String(base || ''));
    const origin = `${u.protocol}//${u.host}`;
    if (p.startsWith('/')) return `${origin}${p}`;
    const basePath = u.pathname.replace(/\/$/, '');
    return `${origin}${basePath ? `${basePath}/${p}` : `/${p}`}`;
  } catch {
    const b = String(base || '').replace(/\/$/, '');
    return `${b}${p.startsWith('/') ? '' : '/'}${p}`;
  }
};

const toPublicAbsolute = (base, p) => {
  try {
    const u = new URL(String(base || ''));
    const origin = `${u.protocol}//${u.host}`;
    const pub = mapPublicOrigin(origin);
    const path = String(p || '');
    if (!/^https?:\/\//i.test(path)) return `${pub}${path.startsWith('/') ? '' : '/'}${path}`;
    return path;
  } catch {
    return '';
  }
};

const mapPublicOrigin = (origin) => {
  try {
    const u = new URL(origin);
    const h = u.hostname;
    if (h.includes('e-kontent.vercel.app') || h.startsWith('46.173.26.14')) {
      return 'https://e-content.webpack.uz';
    }
    return `${u.protocol}//${u.host}`;
  } catch {
    return origin;
  }
};

const waitUntilReachable = async (url, attempts = 6, delayMs = 400, expect = 'array') => {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const head = await fetch(url, { method: 'HEAD' });
      if (head && head.ok) {
        const len = Number(head.headers.get('content-length') || '0');
        if (Number.isFinite(len) && len > 0) return true;
      }
    } catch {}
    try {
      const resp = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (resp && resp.ok) {
        if (expect === 'text') {
          const txt = await resp.text();
          if (txt && txt.trim()) return true;
        } else {
          const ab = await resp.arrayBuffer();
          if ((ab?.byteLength ?? 0) > 0) return true;
        }
      }
    } catch {}
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
};

module.exports = {
  ensureFilesBase,
  toAbsolute,
  toPublicAbsolute,
  waitUntilReachable,
};
