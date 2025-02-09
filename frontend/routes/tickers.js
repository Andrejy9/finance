const express = require('express');
const router = express.Router();
const { 
  getCategorizedTickers,
  saveTickers,
  getSavedTickers,
  deleteTicker
} = require('../controllers/tickerController');

// GET /api/tickers
router.get('/tickers', getCategorizedTickers);
router.get('/saved-tickers', getSavedTickers);




// POST /api/save-tickers
router.post('/save-tickers', saveTickers);
router.post('/delete-ticker', deleteTicker)

module.exports = router;