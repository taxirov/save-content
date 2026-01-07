const express = require('express');
const allRoutes = require('./routes');
const { PrismaClient } = require('@prisma/client');
const { applyCors } = require('./utils/http');
const { getPublicDir } = require('./utils/localFiles');

const prisma = new PrismaClient();
const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.use((req, res, next) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  return next();
});
app.use(express.static(getPublicDir()));

app.use(allRoutes);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError) {
    return res.status(400).json({ error: "Noto'g'ri JSON" });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Server xatosi' });
});

async function main() {
  try {
    await prisma.$connect();
    console.log('PostgreSQL ga muvaffaqiyatli ulanildi');
  } catch (e) {
    console.error('PostgreSQL ga ulanishda xatolik:', e);
    process.exit(1);
  }
}

main();

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} da ishga tushdi`);
});
