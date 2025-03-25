const {runPythonScript} = require('../genericPythonExecuter')
const mongoose = require('mongoose');

exports.calculateSupportResistance = async (req, res) => {
    const ticker = req.query.ticker; // ✅ Ora legge il ticker dalla query string
    const script = "analyzer"; // Nome dello script Python

    console.log(ticker);

    if (!ticker || typeof ticker !== 'string') {
        return res.status(400).json({ message: "❌ Ticker non valido o mancante" });
    }

    try {
        // ✅ Chiama `runPythonScript` passando il nome dello script e i parametri (ticker)
        //const result = await runPythonScript(script, [ticker.toUpperCase()]);
        const result = await runPythonScript("runAction", ["analysis.support_resistance", "process_ticker", ticker.toUpperCase()]);

        if (result.success) {
            res.json({
                message: `✅ Supporti e resistenze calcolati per ${ticker.toUpperCase()}`,
                data: result.data
            });
        } else {
            res.status(400).json({
                message: "❌ Errore nel calcolo dei supporti e resistenze",
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            message: "⚠️ Errore nell'esecuzione dello script Python",
            error: error.message
        });
    }
};

exports.getSupportResistance = async (req, res) => {
    const { ticker, timeframe } = req.query;

    if (!ticker || typeof ticker !== 'string') {
        return res.status(400).json({ message: "❌ Ticker non valido o mancante" });
    }

    if (!timeframe || typeof timeframe !== 'string') {
        return res.status(400).json({ message: "❌ Timeframe non valido o mancante" });
    }

    try {
        // 🔹 Connessione al database `analysis`
        const analysisDb = mongoose.connection.useDb("analysis");
        const collection = analysisDb.collection(ticker.toUpperCase()); // ✅ Il ticker è il nome della collezione

        // ✅ Cerca il documento che contiene i supporti/resistenze
        const document = await collection.findOne({ _id: "SR" });

        if (!document || !document.timeframes || !document.timeframes[timeframe]) {
            return res.status(404).json({
                message: `❌ Nessun dato trovato per ${ticker.toUpperCase()} (${timeframe})`
            });
        }

        // ✅ Estrarre i dati dal timeframe richiesto
        const timeframeData = document.timeframes[timeframe];

        res.json({
            success: true,
            ticker: ticker.toUpperCase(),
            timeframe,
            data: {
                supports: timeframeData.supports || [],
                resistances: timeframeData.resistances || [],
                last_close: timeframeData.last_close || null,
                timestamp: timeframeData.timestamp || null
            }
        });

    } catch (error) {
        console.error("❌ Errore nel recupero dei dati MongoDB:", error);
        res.status(500).json({
            message: "⚠️ Errore nel recupero dei dati",
            error: error.message
        });
    }
};