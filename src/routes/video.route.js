const express = require('express');
const { generateVideoHandler, getVideoHandler } = require('../controllers/video.controller');

const router = express.Router();

router.get('/api/video', getVideoHandler);
router.post('/generate/video', generateVideoHandler);

module.exports = router;
