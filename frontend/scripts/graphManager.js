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
        }

        // 2. Attendi il completamento dell'operazione (se necessario)
        // Opzionale: aggiungi un polling o altre logiche di attesa qui

        // 3. Ora recupera i dati aggiornati
        const dataResponse = await fetch(`http://localhost:5050/api/financial-data/${ticker}?timeframe=${timeframe}`);
        const data = await dataResponse.json();

        console.log(data);

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

function renderLineChart(data, ticker) {
    const ctx = document.getElementById("stockChart").getContext("2d");
    const canvas = document.getElementById("stockChart");


    // 1. Aggiungi variabili per tracciare la posizione del mouse
    let mouseX = 0;
    let mouseY = 0;



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

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        window.myChart.update('none'); // Aggiorna senza animazioni
    });

    canvas.addEventListener('mouseleave', () => {
        mouseX = -100; // Posizione fuori dall'area
        mouseY = -100;
        window.myChart.update();
    });

    const crosshairPlugin = {
        id: 'customCrosshair',
        afterDraw: (chart) => {
            const { ctx, chartArea: { top, bottom, left, right } } = chart;

            // Disegna linea verticale
            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 1;
            ctx.moveTo(mouseX, top);
            ctx.lineTo(mouseX, bottom);
            ctx.stroke();

            // Disegna linea orizzontale
            ctx.beginPath();
            ctx.moveTo(left, mouseY);
            ctx.lineTo(right, mouseY);
            ctx.stroke();
            ctx.restore();
        }
    };

    Chart.register(crosshairPlugin);


    window.myChart = new Chart(ctx, {
        type: 'candlestick',
        data: {
            datasets: [{
                label: `${ticker}`,
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
                        }),
                        label: function (context) {
                            return `📍 ${context.raw.rawDate.toLocaleString()} | O: ${context.raw.o} | H: ${context.raw.h} | L: ${context.raw.l} | C: ${context.raw.c}`;
                        }
                    }
                },
            },
            onHover: (e) => {
                // Aggiorna la posizione solo quando il mouse è sul grafico
                if (e.x !== null && e.y !== null) {
                    mouseX = e.x;
                    mouseY = e.y;
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