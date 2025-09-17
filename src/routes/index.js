const express = require('express');
const router = express.Router();
const fileRoutes = require('./fileRoutes');

// Barcha API yo'nalishlarini shu yerda guruhlash
router.use('/files', fileRoutes);

// Qo'shimcha yo'nalishlarni shu yerda qo'shish mumkin
// router.use('/users', userRoutes);
// router.use('/products', productRoutes);

module.exports = router;