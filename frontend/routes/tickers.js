const express = require('express');
const router = express.Router();
const { 
  getCategorizedTickers,
  saveTickers,
  getSavedTickers,
  deleteTicker,
  saveHistoricalTickers,
  getSavedHistoricalTickers
} = require('../controllers/tickerController');

// GET /api/tickers
router.get('/tickers', getCategorizedTickers);
router.get('/saved-tickers', getSavedTickers);
router.get('/saved-historical-tickers', getSavedHistoricalTickers);

// POST /api/save-tickers
router.post('/save-tickers', saveTickers);
router.post('/delete-ticker', deleteTicker);
router.post('/save-historical-tickers', saveHistoricalTickers);

module.exports = router;