const { fetchAndSaveStockData } = require('./fetchDataController'); // Sostituisci con il percorso corretto

// Simulazione di una richiesta HTTP
const mockRequest = {
  body: {
    symbol: 'A2A.MI' // Sostituisci con il simbolo che desideri testare
  }
};

// Simulazione di una risposta HTTP
const mockResponse = {
  status: (code) => {
    console.log(`Status: ${code}`);
    return mockResponse;
  },
  json: (data) => {
    console.log('Response JSON:', data);
  }
};

// Esecuzione della funzione con le richieste simulate
fetchAndSaveStockData(mockRequest, mockResponse);