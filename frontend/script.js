const apiUrl = "http://localhost:5050/api/financial-data/";

async function fetchAndDrawChart() {
    const ticker = document.getElementById("ticker").value;
    const response = await fetch(apiUrl + ticker);
    const data = await response.json();

    if (!data || data.length === 0) {
        alert("Nessun dato disponibile per il ticker selezionato.");
        return;
    }

    // Estrarre le date e i prezzi di chiusura per il grafico
    const labels = data.map(entry => entry.Data);
    const closePrices = data.map(entry => entry.Chiusura);

    // Creare o aggiornare il grafico
    createChart(labels, closePrices);
}

function createChart(labels, closePrices) {
    const ctx = document.getElementById("stockChart").getContext("2d");

    // Distruggere il grafico esistente se già presente
    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: "Prezzo di Chiusura",
                data: closePrices,
                borderColor: "blue",
                backgroundColor: "rgba(0, 0, 255, 0.2)",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { display: true, title: { display: true, text: "Data e Ora" } },
                y: { display: true, title: { display: true, text: "Prezzo (€)" } }
            }
        }
    });
}

// Caricare il grafico iniziale con il primo ticker disponibile
fetchAndDrawChart();


let savedTickers = [];

// ⚡️ Ottiene i ticker dal database in base alla categoria
async function updateTickerList() {
    const category = document.getElementById("category").value;
    const tickerSelect = document.getElementById("ticker");

    try {
        console.log(category);  
        // Richiesta all'API per ottenere i ticker della categoria selezionata
        const response = await fetch(`http://localhost:5050/api/tickers`);
        const data = await response.json();
        console.log(data);

        // Pulisce il dropdown
        tickerSelect.innerHTML = "";

        // Aggiunge le nuove opzioni
        data.forEach(ticker => {
            let option = document.createElement("option");
            option.value = ticker.symbol;
            
            // ✅ Usa ["Company Name"] invece di .Company Name
            option.textContent = `${ticker["Company Name"]} (${ticker.symbol})`;
        
            tickerSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Errore nel caricamento dei ticker:", error);
    }
}

// ⚡️ Salva il ticker selezionato
function saveTicker() {
    const tickerSelect = document.getElementById("ticker");
    const selectedTicker = tickerSelect.value;

    if (!savedTickers.includes(selectedTicker)) {
        savedTickers.push(selectedTicker);
        updateSavedTickersUI();
    }
}

// ⚡️ Aggiorna la lista dei ticker salvati
function updateSavedTickersUI() {
    const savedList = document.getElementById("savedTickers");
    savedList.innerHTML = "";

    savedTickers.forEach(ticker => {
        let listItem = document.createElement("li");
        listItem.textContent = ticker;

        let removeBtn = document.createElement("button");
        removeBtn.textContent = "X";
        removeBtn.onclick = () => removeTicker(ticker);

        listItem.appendChild(removeBtn);
        savedList.appendChild(listItem);
    });
}

// ⚡️ Rimuove un ticker dalla lista salvata
function removeTicker(ticker) {
    savedTickers = savedTickers.filter(t => t !== ticker);
    updateSavedTickersUI();
}

// ⚡️ Scarica i dati in tempo reale e aggiorna il grafico
async function fetchAndDrawChart() {
    if (savedTickers.length === 0) {
        alert("Seleziona almeno un ticker da scaricare.");
        return;
    }

    const stockChart = document.getElementById("stockChart").getContext("2d");

    try {
        const response = await fetch(`http://localhost:5050/api/ticker-data?tickers=${savedTickers.join(",")}`);
        const data = await response.json();

        // Prepara i dati per il grafico
        const labels = data.map(entry => entry.symbol);
        const prices = data.map(entry => entry["Regular Market Price"]);

        // Disegna il grafico
        new Chart(stockChart, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Prezzo Attuale",
                    data: prices,
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });

    } catch (error) {
        console.error("Errore nel caricamento dati:", error);
    }
}

// Inizializza il menù con la categoria predefinita
updateTickerList();