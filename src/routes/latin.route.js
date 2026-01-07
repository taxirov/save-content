const express = require('express');
const { latinHandler } = require('../controllers/latin.controller');

const router = express.Router();

router.post('/api/latin', latinHandler);

module.exports = router;
