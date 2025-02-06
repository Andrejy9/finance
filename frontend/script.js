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