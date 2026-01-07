const path = require('path');
const os = require('os');
const fs = require('fs/promises');
const crypto = require('crypto');
const { bundle, renderMedia, getCompositions } = require('@remotion/renderer');
const { ensureFilesBase } = require('../utils/files');
const { ensurePublicSubdir, buildFileName, buildFileUrl } = require('../utils/localFiles');

const projectRoot = path.join(__dirname, '..', '..');
const remotionRoot = path.join(projectRoot, 'remotion');
const imagesDir = path.join(projectRoot, 'src', 'images', 'obyekt');
const backgroundPng = path.join(projectRoot, 'src', 'images', 'background.png');

const FPS = 30;
const COMPOSITION_ID = 'property-video';

const createHttpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const uploadVideo = async ({ audioUrl, captionsUrl, images, durationSeconds, title, subtitle, uploadUrl, productId }) => {
  const outputLocation = path.join(os.tmpdir(), `remotion-${rand()}.mp4`);
  let bundleLocation = null;

  try {
    bundleLocation = await renderVideo({
      audioUrl,
      captionsUrl,
      images,
      durationSeconds,
      title,
      subtitle,
      outputLocation,
    });

    const buffer = await fs.readFile(outputLocation);
    const formData = new FormData();
    const fileBlob = new Blob([buffer], { type: 'video/mp4' });
    formData.append('file', fileBlob, `${productId}.mp4`);

    const uploadResp = await fetch(`${ensureFilesBase(uploadUrl)}/video/${productId}`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResp.ok) {
      const message = await uploadResp.text().catch(() => '');
      const detail = message?.trim() ? `: ${message.trim()}` : '';
      throw createHttpError(uploadResp.status, `Serverga yuklashda xatolik ${uploadResp.status}${detail}`);
    }

    const uploadData = await uploadResp.json().catch(() => null);
    const url = uploadData?.fileUrl || uploadData?.url || null;
    return { url, uploadData };
  } finally {
    if (bundleLocation) await safeRm(bundleLocation);
    await safeRm(outputLocation);
  }
};

const generateVideo = async ({ audioUrl, captionsUrl, images, durationSeconds, title, subtitle, productId }) => {
  const fileName = buildFileName(productId, 'video', 'mp4');
  if (!fileName) throw createHttpError(400, "productId noto'g'ri");

  const destDir = await ensurePublicSubdir('video');
  const outputLocation = path.join(destDir, fileName);
  let bundleLocation = null;

  try {
    bundleLocation = await renderVideo({
      audioUrl,
      captionsUrl,
      images,
      durationSeconds,
      title,
      subtitle,
      outputLocation,
    });

    const fileUrl = buildFileUrl('video', fileName);
    return { fileUrl };
  } finally {
    if (bundleLocation) await safeRm(bundleLocation);
  }
};

const renderVideo = async ({ audioUrl, captionsUrl, images, durationSeconds, title, subtitle, outputLocation }) => {
  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) throw createHttpError(500, `Audio faylini yuklashda xatolik: ${audioRes.statusText}`);
  const audioBuffer = await audioRes.arrayBuffer();
  const audioBase64 = Buffer.from(audioBuffer).toString('base64');
  const audioType = audioRes.headers.get('content-type') || 'audio/mpeg';
  const audioSrc = `data:${audioType};base64,${audioBase64}`;

  const captionsRes = await fetch(captionsUrl);
  if (!captionsRes.ok) throw createHttpError(500, `Sarlavha faylini yuklashda xatolik: ${captionsRes.statusText}`);
  const captionsSrt = await captionsRes.text();

  const backgroundSrc = await fileToDataUrl(backgroundPng);
  const slides = await resolveSlides(images);

  const parsedCaptions = parseSrt(captionsSrt);
  const endFromCaptions = parsedCaptions.length ? Math.max(...parsedCaptions.map((c) => c.endSeconds)) : 0;
  const estFromSlides = slides.length * 3.2;
  const seconds = resolveDuration(durationSeconds, endFromCaptions, estFromSlides);
  const durationInFrames = Math.max(Math.ceil(seconds * FPS), FPS * 6);

  const formatted = parsedCaptions.map((c) => ({
    text: c.text,
    startFrame: Math.max(0, Math.round(c.startSeconds * FPS)),
    endFrame: Math.round(Math.min(seconds, c.endSeconds) * FPS),
  }));

  const inputProps = {
    audioSrc,
    backgroundSrc,
    slides: slides.length ? slides : [{ src: backgroundSrc }],
    captions: formatted,
    title,
    subtitle,
    durationInFrames,
  };

  const bundleLocation = await bundle({
    entryPoint: path.join(remotionRoot, 'index.jsx'),
    outDir: path.join(os.tmpdir(), `remotion-bundle-${rand()}`),
  });
  const compositions = await getCompositions(bundleLocation, { inputProps });
  const composition = compositions.find((c) => c.id === COMPOSITION_ID);
  if (!composition) throw createHttpError(500, `Composition ${COMPOSITION_ID} topilmadi`);

  await renderMedia({
    serveUrl: bundleLocation,
    composition,
    codec: 'h264',
    inputProps,
    outputLocation,
    audioCodec: 'aac',
    videoBitrate: '8M',
  });

  return bundleLocation;
};

const rand = () => crypto.randomBytes(6).toString('hex');
const safeRm = async (p) => { try { await fs.rm(p, { recursive: true, force: true }); } catch {} };

const fileToDataUrl = async (p) => {
  try {
    const data = await fs.readFile(p);
    return `data:${mime(path.extname(p))};base64,${data.toString('base64')}`;
  } catch {
    return null;
  }
};

const resolveSlides = async (ids) => {
  const map = await indexLocalImages();
  const out = [];
  await Promise.all((ids || []).map(async (val) => {
    const k = String(val || '').trim();
    if (!k) return;
    if (map.has(k)) { out.push(map.get(k)); return; }
    if (/^https?:\/\//i.test(k)) {
      const d = await httpImageToDataUrl(k).catch(() => null);
      if (d) out.push({ src: d });
      return;
    }
    if (k.startsWith('data:')) { out.push({ src: k }); return; }
  }));
  return out;
};

const indexLocalImages = async () => {
  const m = new Map();
  let list = [];
  try { list = await fs.readdir(imagesDir); } catch { return m; }
  await Promise.all(list.map(async (name) => {
    const id = name.replace(/\.[^.]+$/, '');
    const p = path.join(imagesDir, name);
    try {
      const data = await fs.readFile(p);
      m.set(id, { src: `data:${mime(path.extname(name))};base64,${data.toString('base64')}` });
    } catch {}
  }));
  return m;
};

const mime = (ext) => {
  const e = ext.toLowerCase();
  if (e === '.png') return 'image/png';
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg';
  if (e === '.webp') return 'image/webp';
  if (e === '.m4a') return 'audio/mp4';
  if (e === '.mp3') return 'audio/mpeg';
  return 'application/octet-stream';
};

const httpImageToDataUrl = async (url) => {
  const resp = await fetch(url);
  if (!resp.ok) throw createHttpError(500, `Rasmni yuklab bo'lmadi: ${resp.status}`);
  const ct = resp.headers.get('content-type') || 'image/jpeg';
  const buf = Buffer.from(await resp.arrayBuffer());
  const b64 = buf.toString('base64');
  return `data:${ct};base64,${b64}`;
};

const resolveDuration = (explicit, a, b) => {
  const c = [explicit, a, b].filter((x) => Number.isFinite(x) && x > 0);
  return c.length ? Math.max(...c) : 30;
};

const parseSrt = (s) => {
  if (!s || typeof s !== 'string') return [];
  const text = s.replace(/\r/g, '');
  const blocks = text.split(/\n\n+/);
  const out = [];
  for (const b of blocks) {
    const lines = b.trim().split('\n');
    if (lines.length < 2) continue;
    let t = lines[0];
    let content = lines.slice(1);
    if (/^\d+$/.test(lines[0])) { t = lines[1]; content = lines.slice(2); }
    const m = t.match(/(\d{2}:\d{2}:\d{2},\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2},\d{3})/);
    if (!m) continue;
    const start = tc(m[1]);
    const end = tc(m[2]);
    const line = content.join(' ').trim();
    if (!Number.isFinite(start) || !Number.isFinite(end) || !line) continue;
    out.push({ startSeconds: start, endSeconds: end, text: line });
  }
  return out;
};

const tc = (code) => {
  const m = code.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
  if (!m) return NaN;
  const [, h, mi, s, ms] = m;
  return Number(h) * 3600 + Number(mi) * 60 + Number(s) + Number(ms) / 1000;
};

module.exports = {
  uploadVideo,
  generateVideo,
};
