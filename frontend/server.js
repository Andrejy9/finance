const configureExpress = require('./config/express');
const connectDB = require('./config/db');
const tickerRoutes = require('./routes/tickers');
const financialDataRoutes = require('./routes/financialData');
const fetchDataRouters = require('./routes/fetchData');
const technicalAnalysis = require('./routes/technicalAnalysis');
const configuration = require('./routes/configuration');
const tickerTracker = require('./routes/tickerTracker');

const app = configureExpress();
const port = process.env.PORT || 5050;

// Connessione al database
connectDB();

// Registrazione routes
app.use('/api', tickerRoutes);
app.use('/api', financialDataRoutes);
app.use('/api', fetchDataRouters);
app.use('/api', technicalAnalysis);
app.use('/api', configuration);
app.use('/api', tickerTracker);
app.use('/api', require('./routes/donwloadHistoricalData'));

// Gestione errori globale
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Errore interno del server' });
});

app.listen(port, () => {
  console.log(`🚀 Server in esecuzione sulla porta: ${port}`);
});