const express = require('express');
const { productProxyHandler } = require('../controllers/productProxy.controller');
const { handleOptions } = require('../utils/http');

const router = express.Router();

router.all('/api/product/analysis', (req, res) => {
  if (handleOptions(req, res, 'GET,POST,PUT,PATCH,DELETE,OPTIONS')) return null;
  return productProxyHandler(req, res);
});

router.all('/api/product/:id', (req, res) => {
  if (handleOptions(req, res, 'GET,POST,PUT,PATCH,DELETE,OPTIONS')) return null;
  return productProxyHandler(req, res);
});

module.exports = router;
