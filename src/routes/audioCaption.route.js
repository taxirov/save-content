const express = require('express');
const { generateAudioCaptionHandler, getAudioCaptionHandler } = require('../controllers/audioCaption.controller');

const router = express.Router();

router.get('/api/caption', getAudioCaptionHandler);
router.post('/generate/caption', generateAudioCaptionHandler);

module.exports = router;
