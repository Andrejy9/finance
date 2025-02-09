const configureExpress = require('./config/express');
const connectDB = require('./config/db');
const tickerRoutes = require('./routes/tickers');
const financialDataRoutes = require('./routes/financialData');

const app = configureExpress();
const port = process.env.PORT || 5050;

// Connessione al database
connectDB();

// Registrazione routes
app.use('/api', tickerRoutes);
app.use('/api', financialDataRoutes);

// Gestione errori globale
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Errore interno del server' });
});

app.listen(port, () => {
  console.log(`🚀 Server in esecuzione sulla porta: ${port}`);
});