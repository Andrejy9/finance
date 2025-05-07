
function downloadHistoricalData() {
    const outputDiv = document.getElementById("historicalDownloadOutput");
    outputDiv.innerHTML = ""; // pulizia

    const eventSource = new EventSource("http://localhost:5050/api/fetch_all_historical_data");

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            const entry = document.createElement("div");

            if (data.type === "start") {
                entry.textContent = `Inizio download: ${data.total} ticker`;
            } else if (data.type === "progress") {
                entry.textContent = `📦 ${data.ticker}: ${data.percent}% (${data.index}/${data.total})`;
            } else if (data.type === "complete") {
                entry.textContent = `✅ Completato: ${data.ticker}`;
            } else if (data.type === "error") {
                entry.textContent = `❌ Errore per ${data.ticker}: ${data.message}`;
                entry.style.color = "red";
            } else if (data.type === "summary") {
                entry.textContent = `📈 Riepilogo per ${data.ticker}`;
            } else {
                entry.textContent = `🟡 Altro: ${event.data}`;
            }

            outputDiv.appendChild(entry);
        } catch (err) {
            console.error("Errore nella ricezione dati SSE:", err);
        }
    };

    eventSource.addEventListener("end", () => {
        const endMsg = document.createElement("div");
        endMsg.textContent = "✅ Download completato!";
        endMsg.style.fontWeight = "bold";
        outputDiv.appendChild(endMsg);
        eventSource.close();
    });

    eventSource.onerror = (err) => {
        console.error("Errore SSE:", err);
        const errorMsg = document.createElement("div");
        errorMsg.textContent = "❌ Connessione interrotta o errore lato server.";
        errorMsg.style.color = "red";
        outputDiv.appendChild(errorMsg);
        eventSource.close();
    };
}