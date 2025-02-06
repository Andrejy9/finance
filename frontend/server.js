const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// Connessione a MongoDB
mongoose.connect("mongodb://localhost:27017/financial_data", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connessione a MongoDB riuscita'))
.catch((err) => console.error('Errore di connessione a MongoDB:', err));

// Definizione dello schema e del modello per i dati finanziari
const financialDataSchema = new mongoose.Schema({
  Data: String,
  Apertura: Number,
  Chiusura: Number,
  Massimo: Number,
  Minimo: Number,
  Volume: Number,
});

const FinancialData = mongoose.model('FinancialData', financialDataSchema);

// Endpoint per recuperare i dati finanziari
app.get('/api/financial-data/:ticker', async (req, res) => {
  const ticker = req.params.ticker;

  try {
    // Accedi dinamicamente alla collezione corrispondente al ticker
    const collection = mongoose.connection.collection(ticker);
    
    // Recupera tutti i documenti all'interno della collezione
    const data = await collection.find({}).toArray();

    console.log(data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server in esecuzione sulla porta: ${port}`);
});