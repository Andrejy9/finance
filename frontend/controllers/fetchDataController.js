const { spawn, exec } = require('child_process');
const path = require('path');


exports.fetchAndSaveStockData = async (req, res) => {
    const symbol = req.params.ticker; // <-- Questo è il cambiamento chiave
    const timeframe = req.query.timeframe;

    const MAX_TIMEOUT = 30000; // 30 secondi

    if (!symbol || typeof symbol !== 'string') {
        return res.status(400).json({ message: "Formato symbol non valido" });
    }

    const scriptPath = path.resolve(
        __dirname,
        '../../backend/python/stock_fetcher.py'
    );

    const venvPythonPath = path.resolve(__dirname, '../../backend/python/venv310/bin/python');
    const pythonProcess = spawn(venvPythonPath, [scriptPath, symbol.toUpperCase(), timeframe]);
    let outputBuffer = '';
    let errorBuffer = '';
    let timeoutId;
    
    //exec('which python3', (err, stdout) => console.log("Python path:", stdout.trim()));

    const cleanup = () => {
        pythonProcess.kill();
        clearTimeout(timeoutId);
    };

    timeoutId = setTimeout(() => {
        cleanup();
        res.status(504).json({
            message: "Timeout script Python",
            error: `Nessuna risposta dopo ${MAX_TIMEOUT / 1000}s`
        });
    }, MAX_TIMEOUT);

    pythonProcess.stdout.on('data', (data) => {
        outputBuffer += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error("Errore Python:", data.toString());
        errorBuffer += data.toString();
    });

    pythonProcess.on('error', (err) => {
        cleanup();
        res.status(500).json({
            message: "Errore di esecuzione script",
            error: `Avvio fallito: ${err.message}`
        });
    });

    pythonProcess.on('close', (code) => {
        cleanup();

        try {
            // Pulizia dell'output da eventuali log non JSON
            const cleanOutput = outputBuffer.split('\n').find(line => line.startsWith('{'));
            const result = cleanOutput ? JSON.parse(cleanOutput) : null;

            if (!result) {
                throw new Error("Nessun output JSON valido ricevuto");
            }

            if (result.success) {
                res.json({
                    message: result.message,
                    data: result.data
                });
            } else {
                res.status(400).json({
                    message: "Errore nell'operazione",
                    error: result.error
                });
            }
        } catch (parseError) {
            res.status(500).json({
                message: "Risposta malformata",
                error: `Output ricevuto: ${outputBuffer}`,
                parseError: parseError.message
            });
        }
    });
};