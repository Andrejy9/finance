const express = require('express');
const router = express.Router();
const { fetch_all_historical_data } = require('../controllers/donwloadHistoricalData');

// GET /api/financial-data/:ticker
router.get('/fetch_all_historical_data', fetch_all_historical_data);

module.exports = router;