const mongoose = require('mongoose');


exports.getCategorizedTickers = async (req, res) => {
  try {
    const tickersDb = mongoose.connection.useDb("tickers");
    const collectionsCursor = await tickersDb.listCollections();
    const collectionNames = collectionsCursor.map(collection => collection.name);

    const categorizedTickers = {};

    for (const collectionName of collectionNames) {
      const collection = tickersDb.collection(collectionName);
      const tickers = await collection.find({}).toArray();
      tickers.sort((a, b) => a.symbol.localeCompare(b.symbol));
      categorizedTickers[collectionName] = tickers;
    }

    res.json(categorizedTickers);
  } catch (err) {
    console.error("Errore nel recupero dei ticker:", err);
    res.status(500).json({ message: "Errore interno del server" });
  }
};

exports.saveTickers = async (req, res) => {
  try {
    const financeDb = mongoose.connection.useDb("finance");
    const savedTickersCollection = financeDb.collection("savedtickers");

    const { tickers } = req.body;
    if (!tickers?.length) return res.status(400).json({ message: "Nessun ticker selezionato" });

    const tickerSymbols = tickers.map(t => t.toUpperCase());
    const tickersDb = mongoose.connection.useDb("tickers");
    const collectionsCursor = await tickersDb.listCollections();
    const collectionNames = collectionsCursor.map(collection => collection.name);


    let tickerDetails = [];
    for (const collection of collectionNames) {
      const results = await tickersDb.collection(collection)
        .find({ symbol: { $in: tickerSymbols } })
        .toArray();
      tickerDetails.push(...results);
    }

    if (!tickerDetails.length) {
      return res.status(404).json({ message: "Nessun dettaglio trovato" });
    }

    let documents = tickerDetails.map(ticker => ({
      ...ticker,
      savedAt: new Date()
    }));

    // Rimuove eventuali duplicati prima di inserire i nuovi ticker
    documents = documents.filter(
      (ticker, index, self) => index === self.findIndex(t => t.symbol === ticker.symbol)
    );

    // Controlla se i ticker esistono già nella collezione "savedtickers"
    const existingTickers = await savedTickersCollection.find({
      symbol: { $in: tickerSymbols }
    }).toArray();

    if (existingTickers.length > 0) {
      const existingSymbols = existingTickers.map(t => t.symbol);
      return res.status(409).json({
        message: `I seguenti ticker sono già presenti: ${existingSymbols.join(', ')}`
      });
    }

    await savedTickersCollection.insertMany(documents);
    res.json({ message: "Ticker salvati con successo", tickers: documents });

  } catch (error) {
    console.error("Errore nel salvataggio:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
};

exports.getSavedTickers = async (req, res) => {
  try {
      const financeDb = mongoose.connection.useDb("finance");
      const savedTickersCollection = financeDb.collection("savedtickers");

      // Recupera tutti i dettagli dei ticker salvati
      const tickers = await savedTickersCollection.find({}).toArray();

      res.json({ tickers });
  } catch (error) {
      console.error("Errore nel recupero dei ticker salvati:", error);
      res.status(500).json({ message: "Errore interno del server" });
  }
};

exports.deleteTicker = async (req, res) => {
  try {
      const financeDb = mongoose.connection.useDb("finance");
      const savedTickersCollection = financeDb.collection("savedtickers");
      
      const result = await savedTickersCollection.deleteOne({ 
          symbol:  req.body.symbol.toUpperCase() 
      });

      if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Ticker non trovato" });
      }

      res.json({ message: "Ticker rimosso con successo" });
  } catch (error) {
      res.status(500).json({ message: "Errore interno del server" });
  }
};

exports.saveHistoricalTickers = async (req, res) => {
  try {
    const financeDb = mongoose.connection.useDb("finance");
    const historicalTickersCollection = financeDb.collection("historicaltickers");

    const { tickers } = req.body;
    if (!Array.isArray(tickers)) {
      return res.status(400).json({ message: "Invalid tickers format" });
    }

    // Cancella tutti i documenti esistenti
    await historicalTickersCollection.deleteMany({});

    // Inserisce i nuovi ticker
    const documents = tickers.map(symbol => ({
      symbol: symbol.toUpperCase(),
      savedAt: new Date()
    }));

    await historicalTickersCollection.insertMany(documents);

    res.json({ message: "Historical tickers updated", tickers: documents.map(d => d.symbol) });

  } catch (error) {
    console.error("Errore nel salvataggio dei ticker storici:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
};

exports.getSavedHistoricalTickers = async (req, res) => {
  try {
    const financeDb = mongoose.connection.useDb("finance");
    const collection = financeDb.collection("historicaltickers");

    const documents = await collection.find({}).toArray();
    const tickers = documents.map(doc => doc.symbol);

    res.json({ tickers });
  } catch (error) {
    console.error("Errore nel recupero dei ticker storici:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
};
