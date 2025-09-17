const { PrismaClient } = require('@prisma/client');

// PrismaClient ilovasini global ob'yektga saqlaymiz.
// Bu ishlab chiqish (development) muhitida
// har bir so'rovda yangi ilova yaratilishining oldini oladi.
const prisma = global.prisma || new PrismaClient();

// Agar ishlab chiqish muhiti bo'lmasa,
// global ob'yektga nusxasini biriktiramiz.
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

module.exports = prisma;