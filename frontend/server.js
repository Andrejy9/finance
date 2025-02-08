const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// ✅ Connessione unica a MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/finance", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connessione a MongoDB riuscita"))
  .catch((err) => console.error("❌ Errore di connessione a MongoDB:", err));

// ✅ Usa il database "financial_data" per i dati finanziari
const financialDb = mongoose.connection.useDb("financial_data");

// ✅ Schema per i dati finanziari
const financialDataSchema = new mongoose.Schema({
  Data: String,
  Apertura: Number,
  Chiusura: Number,
  Massimo: Number,
  Minimo: Number,
  Volume: Number,
});
const FinancialData = financialDb.model('FinancialData', financialDataSchema);

// ✅ Schema per i ticker
const tickerSchema = new mongoose.Schema({}, { strict: false });
const Ticker = mongoose.model("Ticker", tickerSchema);

// ✅ **Endpoint per recuperare i dati finanziari di un ticker specifico**
app.get('/api/financial-data/:ticker', async (req, res) => {
  const ticker = req.params.ticker;

  try {
    const collection = financialDb.collection(ticker);
    const data = await collection.find({}).toArray();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ **Endpoint per recuperare tutti i ticker**
app.get("/api/tickers", async (req, res) => {
  try {
    const tickersDb = mongoose.connection.useDb("tickers"); // 🔹 Accede al database "tickers"
    const collectionsCursor = await tickersDb.listCollections();
    const collectionNames = collectionsCursor.map(collection => collection.name);
    console.log(collectionNames);

    let allTickers = [];

    // 🔹 Per ogni collezione, recupera i documenti
    for (let collectionInfo of collectionNames) {
      const collectionName = collectionInfo;
      const collection = tickersDb.collection(collectionName);
      const tickers = await collection.find({}).toArray();
      
      // Aggiunge i documenti alla lista globale
      allTickers = allTickers.concat(tickers);
    }

    // 🔹 Ordina la lista per simbolo del ticker
    allTickers.sort((a, b) => (a.symbol > b.symbol ? 1 : -1));

    res.json(allTickers);

  } catch (err) {
    console.error("Errore nel recupero dei ticker:", err);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// ✅ **Endpoint per recuperare i dati di un ticker specifico**
app.get("/api/ticker/:symbol", async (req, res) => {
  const symbol = req.params.symbol;

  try {
    const collection = mongoose.connection.collection("tickers");
    const data = await collection.find({ symbol: symbol.toUpperCase() }).toArray();

    if (data.length === 0) {
      return res.status(404).json({ message: "Ticker non trovato" });
    }

    res.json(data);
  } catch (err) {
    console.error("Errore nel recupero dei dati:", err);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// ✅ Avvio del server
app.listen(port, () => {
  console.log(`🚀 Server in esecuzione sulla porta: ${port}`);
});