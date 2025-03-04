const express = require('express');
const router = express.Router();
const { calculateSupportResistance, getSupportResistance } = require('../controllers/technicalAnalysis/technicalAnalysis');

// Endpoint per il calcolo dei supporti e resistenze
router.get('/analysis/calculateSupportResistance', calculateSupportResistance);
router.get('/analysis/getSupportResistance', getSupportResistance);

// 🔹 (Se necessario) Endpoint per salvare i ticker
// router.post('/save-tickers', saveTickers);

module.exports = router;