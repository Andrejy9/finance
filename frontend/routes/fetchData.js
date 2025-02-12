const express = require('express');
const router = express.Router();
const { fetchAndSaveStockData } = require('../controllers/fetchDataController');

// GET /api/financial-data/:ticker
router.get('/fetch-data/:ticker', fetchAndSaveStockData);

module.exports = router;