const express = require('express');
const router = express.Router();
const { getFinancialData } = require('../controllers/financialDataController');

// GET /api/financial-data/:ticker
router.get('/financial-data/:ticker', getFinancialData);

module.exports = router;