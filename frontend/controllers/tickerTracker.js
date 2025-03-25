const mongoose = require('mongoose');
const moment = require('moment');

exports.getHistoricalTickersStatus = async (req, res) => {
  try {
    // Connessione al database principale
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/finance_historical", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Uso del database secondario
    const financeHistoricalDb = mongoose.connection.useDb("finance_historical");
    
    // Accedi al driver nativo
    const nativeDb = financeHistoricalDb.db;
    const collections = await nativeDb.listCollections().toArray();

    // Ricava i nomi delle collezioni
    const collectionNames = collections.map(c => c.name);

    const tickerStatuses = [];

    const expectedOldestDate = moment().subtract(5, 'years');
    const totalExpectedDays = moment().diff(expectedOldestDate, 'days');

    for (const collectionName of collectionNames) {
      const collection = financeHistoricalDb.collection(collectionName);

      const oldestRecord = await collection
        .find({})
        .sort({ Data: 1 })
        .limit(1)
        .toArray();

      const latestRecord = await collection
        .find({})
        .sort({ Data: -1 })
        .limit(1)
        .toArray();

      if (!oldestRecord.length || !latestRecord.length) {
        tickerStatuses.push({
          ticker: collectionName,
          percentage: 0,
          oldestDate: null,
          latestDate: null,
        });
        continue;
      }

      const oldestDate = moment(oldestRecord[0].Data);
      const latestDate = moment(latestRecord[0].Data);

      const actualDaysCovered = latestDate.diff(oldestDate, 'days');

      let coveragePercentage = (actualDaysCovered / totalExpectedDays) * 100;
      coveragePercentage = Math.min(100, Math.max(0, parseFloat(coveragePercentage.toFixed(2))));

      tickerStatuses.push({
        ticker: collectionName,
        percentage: coveragePercentage,
        oldestDate: oldestDate.format('YYYY-MM-DD'),
        latestDate: latestDate.format('YYYY-MM-DD'),
      });
    }

    res.json({ tickersStatus: tickerStatuses });

  } catch (error) {
    console.error("Errore nel recupero dei dati storici:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
};

// // Funzione di test
// const testGetHistoricalTickersStatus = async () => {
//   const req = {};
//   const res = {
//     json: (data) => {
//       console.log("Output del test:", JSON.stringify(data, null, 2));
//     },
//     status: (code) => ({
//       json: (data) => console.log(`Errore ${code}:`, data)
//     })
//   };

//   await exports.getHistoricalTickersStatus(req, res);
// };

// // Esegui il test
// testGetHistoricalTickersStatus();