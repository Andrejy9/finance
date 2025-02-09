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
    const tickerContainer = document.getElementById("tickerContainer");

    try {
        const response = await fetch(`http://localhost:5050/api/tickers`);
        const data = await response.json();
        
        // Pulisci il container
        tickerContainer.innerHTML = '';

        // Crea elemento filtro se non esiste
        const filterInput = document.getElementById("tickerFilter");
        filterInput.onkeyup = () => filterTickers(data);

        // Itera sulle categorie
        for (const category in data) {
            if (data.hasOwnProperty(category)) {
                // Crea container categoria
                const categoryDiv = document.createElement("div");
                categoryDiv.className = "category";
                
                // Header categoria (clickabile)
                const header = document.createElement("div");
                header.className = "category-header";
                header.innerHTML = `
                    ${category}
                    <span class="toggle-icon">▼</span>
                `;
                
                // Lista ticker (nascosta per default)
                const tickerList = document.createElement("div");
                tickerList.className = "ticker-list";
                tickerList.style.display = "none";

                // Popola lista ticker
                data[category].forEach(ticker => {
                    const item = document.createElement("div");
                    item.className = "ticker-item";
                    item.innerHTML = `
                        <input type="checkbox" class="ticker-checkbox">
                        ${ticker["Company Name"] || ticker.symbol} (${ticker.symbol})
                    `;
                    tickerList.appendChild(item);
                });

                // Toggle visibilità
                header.addEventListener("click", () => {
                    const isVisible = tickerList.style.display !== "none";
                    tickerList.style.display = isVisible ? "none" : "block";
                    header.querySelector(".toggle-icon").textContent = isVisible ? "▶" : "▼";
                });

                categoryDiv.appendChild(header);
                categoryDiv.appendChild(tickerList);
                tickerContainer.appendChild(categoryDiv);
            }
        }

    } catch (error) {
        console.error("Errore nel caricamento dei ticker:", error);
    }
}

// Funzione filtro
function filterTickers(data) {
    const filterText = document.getElementById("tickerFilter").value.toLowerCase();
    
    document.querySelectorAll(".category").forEach(categoryDiv => {
        const categoryName = categoryDiv.querySelector(".category-header").textContent.toLowerCase();
        let hasVisibleItems = false;

        categoryDiv.querySelectorAll(".ticker-item").forEach(item => {
            const text = item.textContent.toLowerCase();
            const isVisible = text.includes(filterText);
            item.style.display = isVisible ? "block" : "none";
            if (isVisible) hasVisibleItems = true;
        });

        // Mostra/nascondi intera categoria in base al filtro
        categoryDiv.style.display = hasVisibleItems || categoryName.includes(filterText) ? "block" : "none";
    });
}

// ⚡️ Recupera i ticker selezionati da #tickerContainer e li salva
function saveSelectedTickers() {
    const tickerContainer = document.getElementById("tickerContainer");

    if (!tickerContainer) {
        console.error("Elemento tickerContainer non trovato!");
        return;
    }

    // Trova tutti i checkbox selezionati
    const selectedCheckboxes = tickerContainer.querySelectorAll("input[type='checkbox']:checked");

    // Estrae i valori dei ticker selezionati
    const selectedTickers = Array.from(selectedCheckboxes).map(checkbox => {
        // Ottieni il valore del ticker dal testo dell'elemento
        const tickerText = checkbox.closest(".ticker-item").textContent.trim();
        const tickerSymbolMatch = tickerText.match(/\(([A-Z]+)\)/);
        return tickerSymbolMatch ? tickerSymbolMatch[1] : null;
    }).filter(ticker => ticker !== null); // Filtra eventuali valori null

    // Verifica se ci sono ticker selezionati
    if (selectedTickers.length === 0) {
        alert("Nessun ticker selezionato!");
        return;
    }

    console.log("Tickers selezionati:", selectedTickers);
    sendSavedTickersToBackend(selectedTickers);
}

// Funzione di esempio per inviare i ticker al backend
async function sendSavedTickersToBackend(tickers) {
    try {
        const response = await fetch("http://localhost:5050/api/save-tickers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ tickers }),
        });

        if (!response.ok) {
            throw new Error(`Errore HTTP: ${response.status}`);
        }

        const result = await response.json();
        console.log("Tickers salvati con successo:", result);
        alert("Tickers salvati con successo!");
    } catch (error) {
        console.error("Errore durante il salvataggio dei ticker:", error);
        alert("Errore durante il salvataggio dei ticker. Riprova più tardi.");
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