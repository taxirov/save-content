const express = require('express');
const { generateAudioHandler, getAudioHandler } = require('../controllers/audio.controller');

const router = express.Router();

router.get('/api/audio', getAudioHandler);
router.post('/generate/audio', generateAudioHandler);

module.exports = router;
