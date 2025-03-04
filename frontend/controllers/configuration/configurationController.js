const mongoose = require("mongoose");

exports.saveSupportResistanceConfig = async (req, res) => {
    const { min_distance, min_touches, max_levels, window } = req.body;

    if (
        typeof min_distance !== "number" ||
        typeof min_touches !== "number" ||
        typeof max_levels !== "number" ||
        typeof window !== "number"
    ) {
        return res.status(400).json({ message: "❌ Parametri non validi" });
    }

    try {
        // 🔹 Connessione al database `configurations`
        const configDb = mongoose.connection.useDb("configurations");
        const collection = configDb.collection("support_resistance");

        // ✅ Rimuove la vecchia configurazione e salva la nuova
        await collection.deleteMany({});
        await collection.insertOne({
            _id: "SR_CONFIG",
            min_distance,
            min_touches,
            max_levels,
            window,
            timestamp: new Date(),
        });

        res.json({
            success: true,
            message: "✅ Configurazione salvata correttamente nel DB `configurations`",
        });
    } catch (error) {
        console.error("❌ Errore nel salvataggio della configurazione:", error);
        res.status(500).json({
            message: "⚠️ Errore nel salvataggio della configurazione",
            error: error.message,
        });
    }
};

exports.getSupportResistanceConfig = async (req, res) => {
    try {
        // 🔹 Connessione al database `configurations`
        const configDb = mongoose.connection.useDb("configurations");
        const collection = configDb.collection("support_resistance");

        // ✅ Recupera la configurazione più recente
        const config = await collection.findOne({ _id: "SR_CONFIG" });

        if (!config) {
            return res.status(404).json({
                message: "❌ Nessuna configurazione trovata nel DB `configurations`",
            });
        }

        res.json({
            success: true,
            data: {
                min_distance: config.min_distance,
                min_touches: config.min_touches,
                max_levels: config.max_levels,
                window: config.window,
                timestamp: config.timestamp,
            },
        });
    } catch (error) {
        console.error("❌ Errore nel recupero della configurazione:", error);
        res.status(500).json({
            message: "⚠️ Errore nel recupero della configurazione",
            error: error.message,
        });
    }
};