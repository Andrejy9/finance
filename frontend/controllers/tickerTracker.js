const mongoose = require("mongoose");
const moment = require("moment");

exports.getHistoricalTickersStatus = async (req, res) => {
  try {
    const tickerStatuses = [];

    // ---------- ANALISI finance_historical ----------
    const financeHistoricalDb = mongoose.connection.useDb("polygon_historical");
    const financeCollections = await financeHistoricalDb.db.listCollections().toArray();
    const financeCollectionNames = financeCollections.map(c => c.name);

    const expectedOldestDate = moment().subtract(2, 'years');
    const totalExpectedDays = moment().diff(expectedOldestDate, 'days');

    for (const collectionName of financeCollectionNames) {
      const collection = financeHistoricalDb.collection(collectionName);

      const [oldestRecord, latestRecord] = await Promise.all([
        collection.find().sort({ Data: 1 }).limit(1).toArray(),
        collection.find().sort({ Data: -1 }).limit(1).toArray(),
      ]);

      const totalCount = await collection.countDocuments();

      if (!oldestRecord.length || !latestRecord.length) {
        tickerStatuses.push({
          ticker: collectionName,
          percentage: 0,
          count: totalCount,
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
        count: totalCount,
        oldestDate: oldestDate.format('YYYY-MM-DD'),
        latestDate: latestDate.format('YYYY-MM-DD'),
      });
    }

    // ---------- ANALISI fundamentalsDB ----------
    const fundamentalsDb = mongoose.connection.useDb("fundamentalsDB");
    const fundamentalsCollections = await fundamentalsDb.db.listCollections().toArray();

    const fundamentalsStatus = [];
    const tickerMap = {};

    fundamentalsCollections.forEach(({ name }) => {
      const match = name.match(/^(.+?)_((balance|income|cashflow)_(annual|quarterly)|dividends)$/);
      if (match) {
        const [ , ticker, type ] = match;
        if (!tickerMap[ticker]) tickerMap[ticker] = {};
        tickerMap[ticker][type] = name;
      }
    });

    for (const [ticker, types] of Object.entries(tickerMap)) {
      const entry = { ticker };

      for (const [type, collectionName] of Object.entries(types)) {
        const collection = fundamentalsDb.collection(collectionName);

        let dateField = "fiscalDateEnding";
        if (type === "dividends") {
          dateField = "ex_dividend_date";
        }

        const [latestDoc] = await collection
          .find({ [dateField]: { $exists: true } })
          .sort({ [dateField]: -1 })
          .limit(1)
          .toArray();

        const [oldestDoc] = await collection
          .find({ [dateField]: { $exists: true } })
          .sort({ [dateField]: 1 })
          .limit(1)
          .toArray();

        const totalCount = await collection.countDocuments();

        if (!latestDoc || !oldestDoc) {
          entry[type] = {
            latestDate: null,
            oldestDate: null,
            count: totalCount,
            daysAgo: null,
            isRecent: false
          };
          continue;
        }

        const latestDate = moment(latestDoc[dateField]);
        const oldestDate = moment(oldestDoc[dateField]);
        const now = moment();
        const daysAgo = now.diff(latestDate, 'days');
        const isRecent = daysAgo <= 180;

        entry[type] = {
          latestDate: latestDate.format('YYYY-MM-DD'),
          oldestDate: oldestDate.format('YYYY-MM-DD'),
          count: totalCount,
          daysAgo,
          isRecent
        };
      }

      fundamentalsStatus.push(entry);
    }

    // ---------- RISPOSTA ----------
    res.json({
      tickersStatus: tickerStatuses,
      fundamentalsStatus
    });

  } catch (error) {
    console.error("Errore nel recupero dei dati:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
};
    

// // ✅ Funzione di test
// const testGetHistoricalTickersStatus = async () => {
//   const req = {};
//   const res = {
//     json: (data) => {
//       console.log("✅ Output del test:", JSON.stringify(data, null, 2));
//     },
//     status: (code) => ({
//       json: (data) => console.error(`❌ Errore ${code}:`, data)
//     })
//   };

//   await exports.getHistoricalTickersStatus(req, res);
// };

// // ✅ Esegui il test
// testGetHistoricalTickersStatus();