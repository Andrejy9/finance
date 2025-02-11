const mongoose = require('mongoose');

exports.getFinancialData = async (req, res) => {
    try {
      const financialDb = mongoose.connection.useDb("finance");
      const collection = financialDb.collection(req.params.ticker);
      const data = await collection.find({}).toArray();
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };