const baseUrl = "http://localhost:5050/api/"

async function fetchAndCalculateSupportResistance() {
    try {
        var inputElement = document.getElementById('tickerInput');
        var timeframeElement = document.getElementById('timeframe'); // Ottiene il select
        var timeframe = timeframeElement.value; // Ottiene il valore selezionato


        var ticker = inputElement.value.trim().toUpperCase();
        
        if (!ticker) {
            alert("Inserisci un ticker valido.");
            return;
        }
        const url = `${baseUrl}/analysis/calculateSupportResistance?ticker=${ticker}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok) {
            console.log("✅ Supporti e Resistenze:", result);
            alert(`Calcolo completato per ${ticker}. Controlla la console per i dettagli.`);

            await drawSupportResistanceLevels(ticker, timeframe);
        } else {
            console.error("❌ Errore:", result.error);
            alert(`Errore nel calcolo: ${result.message || 'Errore sconosciuto'}`);
        }

    } catch (error) {
        console.error("🚨 Errore nella richiesta:", error);
        alert("Errore nella comunicazione con il server.");
    }
}

async function fetchSupportResistanceLevels(ticker, timeframe) {
    try {
        if (!ticker || !timeframe) {
            alert("Inserisci un ticker e un timeframe validi.");
            return;
        }

        const url = `${baseUrl}/analysis/getSupportResistance?ticker=${ticker}&timeframe=${timeframe}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
            console.log("📊 Livelli di Supporto e Resistenza:", result);
            return result.data;
        } else {
            console.error("❌ Errore:", result.error);
            alert(`Errore nel recupero: ${result.message || 'Errore sconosciuto'}`);
        }
    } catch (error) {
        console.error("🚨 Errore nella richiesta:", error);
        alert("Errore nella comunicazione con il server.");
    }
}

async function drawSupportResistanceLevels(ticker, timeframe) {
    try {
        const data = await fetchSupportResistanceLevels(ticker, timeframe);
        if (!data) {
            console.error("❌ Nessun dato di supporto/resistenza trovato.");
            return;
        }

        const { supports, resistances } = data;

        if (!supports.length && !resistances.length) {
            console.warn("⚠️ Nessun livello significativo trovato.");
            return;
        }

        // 📌 Aggiungi le annotazioni al grafico
        const annotations = [];

        // ✅ Disegna le linee dei supporti
        supports.forEach((level, index) => {
            annotations.push({
                type: 'line',
                scaleID: 'y',
                value: level,
                borderColor: 'rgba(0, 255, 0, 0.6)', // Verde trasparente
                borderWidth: 1,
                borderDash: [5, 5], // Linea tratteggiata
                label: {
                    display: true,
                    content: `Supporto ${index + 1}`,
                    position: 'start',
                    backgroundColor: 'rgba(0, 255, 0, 0.3)',
                    font: { size: 12 }
                }
            });
        });

        // ✅ Disegna le linee delle resistenze
        resistances.forEach((level, index) => {
            annotations.push({
                type: 'line',
                scaleID: 'y',
                value: level,
                borderColor: 'rgba(255, 0, 0, 0.6)', // Rosso trasparente
                borderWidth: 1,
                borderDash: [5, 5],
                label: {
                    display: true,
                    content: `Resistenza ${index + 1}`,
                    position: 'start',
                    backgroundColor: 'rgba(255, 0, 0, 0.3)',
                    font: { size: 12 }
                }
            });
        });

        // ✅ Aggiorna le annotazioni nel grafico
        if (window.myChart) {
            window.myChart.options.plugins.annotation = {
                annotations
            };
            window.myChart.update();
        } else {
            console.warn("⚠️ Il grafico non è stato inizializzato.");
        }

    } catch (error) {
        console.error("❌ Errore nel disegno dei livelli:", error);
    }
}