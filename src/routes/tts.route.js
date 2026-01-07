const express = require('express');
const { ttsHandler } = require('../controllers/tts.controller');

const router = express.Router();

router.post('/api/tts', ttsHandler);

module.exports = router;
