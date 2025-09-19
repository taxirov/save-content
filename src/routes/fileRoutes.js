const express = require('express');
const router = express.Router();
const { uploadFile } = require('../utils/fileHandler');
const fileController = require('../controllers/fileController');

router.post('/audioText/:productId', uploadFile('audioText').single('file'), fileController.saveAudioText);
router.post('/audio/:productId', uploadFile('audio').single('file'), fileController.saveAudio);
router.post('/caption/:productId', uploadFile('caption').single('file'), fileController.saveCaption);
router.post('/video/:productId', uploadFile('video').single('file'), fileController.saveVideo);
router.post('/videoCaption/:productId', uploadFile('videoCaption').single('file'), fileController.saveVideoCation)
router.get('/:id', fileController.getData)

module.exports = router;