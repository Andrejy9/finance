const express = require('express');
const router = express.Router();
const { getFinancialData, getHistoricalFinancialData } = require('../controllers/financialDataController');

// GET /api/financial-data/:ticker
router.get('/financial-data/:ticker', getFinancialData);
router.get('/historical-financial-data/:ticker', getHistoricalFinancialData);

module.exports = router;