const apiUrl = "http://localhost:5050/api/financial-data/";

// Aggiorna getChartOptions
function getChartOptions(type) {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day',
                    tooltipFormat: 'DD MMM YYYY'
                }
            },
            y: {
                title: { display: true, text: "Prezzo (€)" }
            }
        }
    };

    const specificOptions = {
        candlestick: {
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    };

    return { ...commonOptions, ...specificOptions[type] };
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

function getFirstSelectedTicker() {
    return selectedTickers.values().next().value || null;
}

// ⚡️ Scarica i dati in tempo reale e aggiorna il grafico

function resetZoom() {
    if (myChart) {
        myChart.resetZoom();
    }
}


// Aggiorna l'evento di caricamento della pagina
document.addEventListener('DOMContentLoaded', async () => {

    await renderSavedTickersList(); // Aggiungi questa linea
});

let zoomEnabled = false;

// Ascolta la pressione del tasto Control
document.addEventListener("keydown", (event) => {
    if (event.key === "Control") {
        zoomEnabled = true;
    }
});

// Disabilita lo zoom quando il tasto Control viene rilasciato
document.addEventListener("keyup", (event) => {
    if (event.key === "Control") {
        zoomEnabled = false;
    }
});



