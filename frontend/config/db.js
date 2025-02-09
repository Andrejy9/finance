const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/finance", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connessione a MongoDB riuscita");
  } catch (err) {
    console.error("❌ Errore di connessione a MongoDB:", err);
    process.exit(1);
  }
};

module.exports = connectDB;