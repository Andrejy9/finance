const express = require('express');
const router = express.Router();
const { 
    getHistoricalTickersStatus
} = require('../controllers/tickerTracker');

// GET /api/tickers
router.get('/historical-tickers-status', getHistoricalTickersStatus);


// POST /api/save-tickers
//router.post('/save-tickers', saveTickers);
//router.post('/delete-ticker', deleteTicker)

module.exports = router;