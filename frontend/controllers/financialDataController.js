const mongoose = require('mongoose');

exports.getFinancialData = async (req, res) => {
    try {
        const { ticker } = req.params;
        const { timeframe } = req.query;

        if (!ticker) {
            return res.status(400).json({ message: "Ticker non specificato" });
        }

        if (!timeframe) {
            return res.status(400).json({ message: "Timeframe non specificato" });
        }

        const validTimeframes = ["1m", "5m", "10m", "15m", "1h", "1d", "1wk", "1mo"];
        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({ message: "Timeframe non valido. Usa: " + validTimeframes.join(", ") });
        }

        // Connessione al database MongoDB
        const financialDb = mongoose.connection.useDb("finance");
        const collection = financialDb.collection(`${ticker}_${timeframe}`); // 🔹 Usa una collezione separata per ogni timeframe

        // Recupera i dati filtrati
        const data = await collection.find({}).toArray();

        if (!data.length) {
            return res.status(404).json({ message: `Nessun dato trovato per ${ticker} (${timeframe})` });
        }

        res.json(data);

    } catch (err) {
        res.status(500).json({ message: "Errore nel recupero dei dati", error: err.message });
    }
};

exports.getHistoricalFinancialData = async (req, res) => {
    try {
        const { ticker } = req.params;
        const { timeframe } = req.query;

        if (!ticker) {
            return res.status(400).json({ message: "Ticker non specificato" });
        }

        if (!timeframe) {
            return res.status(400).json({ message: "Timeframe non specificato" });
        }

        const validTimeframes = ["1m", "5m", "10m", "15m", "60min",  "1h", "1d", "1wk", "1mo"];
        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({ message: "Timeframe non valido. Usa: " + validTimeframes.join(", ") });
        }

        // Connessione al database MongoDB
        const financialDb = mongoose.connection.useDb("polygon_historical");
        const collection = financialDb.collection(`${ticker}_${timeframe}`); // 🔹 Usa una collezione separata per ogni timeframe

        // Recupera i dati filtrati
        const data = await collection.find({}).toArray();

        if (!data.length) {
            return res.status(404).json({ message: `Nessun dato trovato per ${ticker} (${timeframe})` });
        }

        res.json(data);

    } catch (err) {
        res.status(500).json({ message: "Errore nel recupero dei dati", error: err.message });
    }
};