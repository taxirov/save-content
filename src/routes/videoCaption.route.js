const express = require('express');
const { generateVideoCaptionHandler, getVideoCaptionHandler } = require('../controllers/videoCaption.controller');

const router = express.Router();

router.get('/api/videoCaption', getVideoCaptionHandler);
router.post('/generate/video/caption', generateVideoCaptionHandler);

module.exports = router;
