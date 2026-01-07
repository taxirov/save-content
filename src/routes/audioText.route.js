const express = require('express');
const { generateAudioTextHandler, getAudioTextHandler } = require('../controllers/audioText.controller');

const router = express.Router();

router.get('/api/audioText', getAudioTextHandler);
router.post('/generate/audio/text', generateAudioTextHandler);

module.exports = router;
