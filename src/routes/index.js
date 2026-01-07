const express = require('express');
const fileRoutes = require('./fileRoutes');
const audioTextRoutes = require('./audioText.route');
const audioRoutes = require('./audio.route');
const audioCaptionRoutes = require('./audioCaption.route');
const videoRoutes = require('./video.route');
const videoCaptionRoutes = require('./videoCaption.route');
const ttsRoutes = require('./tts.route');
const latinRoutes = require('./latin.route');
const proxyRoutes = require('./proxy.route');
const productProxyRoutes = require('./productProxy.route');

const router = express.Router();

router.use('/api/files', fileRoutes);
router.use(audioTextRoutes);
router.use(audioRoutes);
router.use(audioCaptionRoutes);
router.use(videoRoutes);
router.use(videoCaptionRoutes);
router.use(ttsRoutes);
router.use(latinRoutes);
router.use(proxyRoutes);
router.use(productProxyRoutes);

module.exports = router;
