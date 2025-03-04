const express = require("express");
const router = express.Router();
const { 
    saveSupportResistanceConfig, 
    getSupportResistanceConfig 
} = require("../controllers/configuration/configurationController");

router.post("/config/support-resistance", saveSupportResistanceConfig);
router.get("/config/support-resistance", getSupportResistanceConfig);

module.exports = router;