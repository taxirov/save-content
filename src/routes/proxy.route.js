const express = require('express');
const { proxyHandler } = require('../controllers/proxy.controller');

const router = express.Router();

router.get('/api/proxy', proxyHandler);
router.head('/api/proxy', proxyHandler);
router.options('/api/proxy', (req, res) => res.status(204).end());

module.exports = router;
