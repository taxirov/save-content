const path = require('path');
const fs = require('fs/promises');

const projectRoot = path.join(__dirname, '..', '..');
const defaultPublicDir = path.join(projectRoot, 'public');

const getPublicDir = () => {
  const custom = String(process.env.PUBLIC_DIR || '').trim();
  if (custom) return path.resolve(custom);
  return defaultPublicDir;
};

const buildFileUrl = (folder, filename) => `/${folder}/${filename}`;

const sanitizeId = (value) => String(value || '').trim().replace(/[^a-zA-Z0-9._-]/g, '_');

const buildFileName = (id, suffix, ext) => {
  const safeId = sanitizeId(id);
  if (!safeId) return '';
  return `${safeId}_${suffix}.${ext}`;
};

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const ensurePublicSubdir = async (folder) => {
  const dir = path.join(getPublicDir(), folder);
  await ensureDir(dir);
  return dir;
};

const writeTextFile = async (folder, filename, content) => {
  const dir = await ensurePublicSubdir(folder);
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, content, 'utf8');
  return filePath;
};

const writeBinaryFile = async (folder, filename, buffer) => {
  const dir = await ensurePublicSubdir(folder);
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, buffer);
  return filePath;
};

module.exports = {
  getPublicDir,
  buildFileUrl,
  sanitizeId,
  buildFileName,
  ensurePublicSubdir,
  writeTextFile,
  writeBinaryFile,
};
