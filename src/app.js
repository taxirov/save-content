const express = require('express');
const path = require('path');
const allRoutes = require('./routes');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', allRoutes);

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