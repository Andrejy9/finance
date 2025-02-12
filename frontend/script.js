const apiUrl = "http://localhost:5050/api/financial-data/";

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


function renderLineChart(data, ticker) {
    const ctx = document.getElementById("stockChart").getContext("2d");

    // 1. Elaborazione dati e creazione labels
    const processedData = data
        .filter(entry => entry.Apertura && entry.Chiusura)
        .map(entry => ({
            x: new Date(entry.Data.replace(' ', 'T') + 'Z'), // Conserva la data reale
            o: entry.Apertura,
            h: entry.Max || entry.Massimo,
            l: entry.Min || entry.Minimo,
            c: entry.Chiusura
        }))
        .sort((a, b) => a.x - b.x);

    // 2. Crea un indice sequenziale e labels formattate
    const dateLabels = processedData.map((d, index) => {
        const date = new Date(d.x);
        return {
            index: index,
            label: date.toLocaleDateString('it-IT', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    });

    // 3. Configurazione speciale per l'asse X
    const xAxisConfig = {
        type: 'linear',
        position: 'bottom',
        ticks: {
            callback: (value) => {
                const found = dateLabels.find(d => d.index === Math.round(value));
                return found ? found.label : '';
            },
            autoSkip: true,
            maxTicksLimit: 20
        },
        grid: {
            display: false
        }
    };

    // 4. Mappa i dati all'indice sequenziale
    const indexedData = processedData.map((d, index) => ({
        x: index,
        o: d.o,
        h: d.h,
        l: d.l,
        c: d.c,
        rawDate: d.x // Conserva la data originale per i tooltip
    }));

    if (window.myChart) window.myChart.destroy();

    window.myChart = new Chart(ctx, {
        type: 'candlestick',
        data: {
            datasets: [{
                label: `${ticker} - OHLC`,
                data: indexedData,
                borderColor: 'rgba(0, 0, 0, 0.8)',
                borderWidth: 1,
                color: {
                    up: '#00ff00',
                    down: '#ff0000',
                    unchanged: '#0000ff'
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // ✅ Disabilita aspect ratio predefinito
            scales: {
                x: {
                    ...xAxisConfig,
                    afterFit: (axis) => {
                        axis.chart.canvas.style.width = '100%'; // Forza larghezza completa
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Prezzo (€)',
                        padding: { top: 10, bottom: 10 }
                    },
                    position: 'left',
                    grace: '5%',
                    beginAtZero: false,
                    ticks: {
                        mirror: true,
                        padding: 15,
                        z: 1,
                        callback: (value) => value.toFixed(2) + '€'
                    },
                    grid: {
                        drawOnChartArea: true,
                        drawTicks: false
                    },
                    afterFit: (axis) => {
                        axis.width = 80;
                        axis.left = 0; // Blocca a sinistra
                        axis.right = axis.chart.width; // Estendi a destra
                    }
                }
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        scaleMode: 'x',
                        speed: 0.5,
                        threshold: 5,
                        onPan: () => {
                            // Forza ridimensionamento canvas
                            window.dispatchEvent(new Event('resize'));
                        }
                    },
                    zoom: {
                        limits: {
                            y: { min: 'original', max: 'original' } // ✅ Mantiene fisso l'asse Y
                        },
                        wheel: {
                            enabled: true,
                            speed: 0.05,
                            modifierKey: 'shift' // 🔹 Richiede di premere Shift per lo zoom
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',

                        onZoom: () => {
                            // Aggiorna dimensioni dopo zoom
                            window.myChart.resize();
                        }
                    }
                },
                tooltip: {
                    position: 'nearest',
                    intersect: false,
                    bodyAlign: 'left',
                    usePointStyle: true,
                    callbacks: {
                        labelColor: (context) => ({
                            backgroundColor: context.raw.c >= context.raw.o ? '#00ff00' : '#ff0000',
                            borderWidth: 2
                        })
                    }
                }
            },
            layout: {
                padding: {
                    left: 85, // Compensa larghezza asse Y
                    right: 20,
                    top: 20,
                    bottom: 40
                }
            }
        }
    });

    // Listener per ridimensionamento finestra
    window.addEventListener('resize', () => {
        if (window.myChart) {
            window.myChart.resize();
            window.myChart.update();
        }
    });
}

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

function togglePan(enabled) {
    if (window.myChart) {
        window.myChart.options.plugins.zoom.pan.enabled = enabled;
        window.myChart.update();
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

document.addEventListener("DOMContentLoaded", () => {
    const tickerInput = document.getElementById("tickerInput");
    const suggestionsList = document.getElementById("suggestionsList");
    let allTickers = [];

    // Stile iniziale per la lista dei suggerimenti
    suggestionsList.style.position = 'absolute';
    suggestionsList.style.width = tickerInput.offsetWidth + 'px';
    suggestionsList.style.display = 'none';

    async function fetchTickers() {
        try {
            const response = await fetch(`http://localhost:5050/api/tickers`);
            const tickers = await response.json();

            allTickers = Object.entries(tickers).flatMap(([category, tickers]) => {
                return tickers.map(ticker => ({
                    ...ticker,
                    category: category
                }));
            });

        } catch (error) {
            console.error("Errore nel recupero dei ticker:", error);
        }
    }

    function filterTickers(query) {
        const filtered = allTickers.filter(ticker =>
            ticker.symbol.toLowerCase().startsWith(query.toLowerCase())
        );

        // Rimuove duplicati mantenendo solo il primo occorrenza
        const uniqueSymbols = new Set();
        return filtered.filter(ticker => {
            const isNew = !uniqueSymbols.has(ticker.symbol);
            uniqueSymbols.add(ticker.symbol);
            return isNew;
        });
    }

    function showSuggestions(filteredTickers) {
        suggestionsList.innerHTML = "";

        // Posiziona la lista sotto l'input
        const inputRect = tickerInput.getBoundingClientRect();
        suggestionsList.style.top = inputRect.bottom + window.scrollY + 'px';
        suggestionsList.style.left = inputRect.left + window.scrollX + 'px';
        suggestionsList.style.display = 'block';

        filteredTickers.slice(0, 5).forEach(ticker => {
            const listItem = document.createElement("li");
            listItem.textContent = ticker.symbol; // Mostra solo lo symbol
            listItem.style.cursor = 'pointer';
            listItem.style.padding = '5px';

            listItem.addEventListener("click", () => {
                tickerInput.value = ticker.symbol;
                suggestionsList.style.display = 'none'; // Nasconde la lista al click
            });

            listItem.onmouseover = () => listItem.style.backgroundColor = '#f0f0f0';
            listItem.onmouseout = () => listItem.style.backgroundColor = 'transparent';

            suggestionsList.appendChild(listItem);
        });
    }

    tickerInput.addEventListener("input", () => {
        const query = tickerInput.value.trim().toUpperCase();
        if (query.length > 0) {
            const filteredTickers = filterTickers(query);
            filteredTickers.length > 0
                ? showSuggestions(filteredTickers)
                : suggestionsList.style.display = 'none';
        } else {
            suggestionsList.style.display = 'none';
        }
    });

    // Chiude la lista quando si clicca fuori
    document.addEventListener("click", (e) => {
        if (!tickerInput.contains(e.target)) {
            suggestionsList.style.display = 'none';
        }
    });

    fetchTickers();
});


async function fetchAndDrawTickerInput() {
    try {
        var inputElement = document.getElementById('tickerInput');
        // Ottieni il valore corrente dell'input
        var ticker = inputElement.value;
        var timeframeElement = document.getElementById('timeframe'); // Ottiene il select
        var timeframe = timeframeElement.value; // Ottiene il valore selezionato

        // 1. Prima chiamata per attivare il fetch e salvataggio dati
        const fetchResponse = await fetch(`http://localhost:5050/api/fetch-data/${ticker}?timeframe=${timeframe}`);

        if (!fetchResponse.ok) {
            const errorData = await fetchResponse.json();
            alert(`Errore durante l'aggiornamento dati: ${errorData.message || 'Errore sconosciuto'}`);
            return;
        }

        // 2. Attendi il completamento dell'operazione (se necessario)
        // Opzionale: aggiungi un polling o altre logiche di attesa qui

        // 3. Ora recupera i dati aggiornati
        const dataResponse = await fetch(`http://localhost:5050/api/financial-data/${ticker}?timeframe=${timeframe}`);
        const data = await dataResponse.json();

        if (!data || data.length === 0) {
            alert("Nessun dato disponibile per il ticker selezionato.");
            return;
        }

        // 5. Aggiorna il grafico

        renderLineChart(data, ticker);

    } catch (error) {
        console.error("Errore nel flusso dati:", error);
        alert("Si è verificato un errore durante l'elaborazione dei dati");
    }
}


