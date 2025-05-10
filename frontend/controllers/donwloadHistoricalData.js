const { spawn, exec } = require('child_process');
const {runPythonScript} = require('./genericPythonExecuter')

const path = require('path');



exports.fetch_all_historical_data = async (req, res) => {
    const pathToScript = path.resolve(__dirname, '../../backend/python/runAction.py');

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const venvPythonPath = path.resolve(__dirname, '../../backend/python/venv310/bin/python');
    const pythonProcess = spawn(venvPythonPath, [pathToScript, 'polygonRun', 'fetch_all_historical_data']);
      
    pythonProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(Boolean);
        for (const line of lines) {
            res.write(`data: ${line}\n\n`);
        }
    });

    pythonProcess.stderr.on('data', (data) => {
        const message = data.toString().trim();
        console.error("Errore Python:", message);
        res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
    });

    pythonProcess.on('error', (err) => {
        res.write(`event: error\ndata: ${JSON.stringify({ message: "Errore di esecuzione script", error: err.message })}\n\n`);
        res.end();
    });

    pythonProcess.on('close', () => {
        res.write(`event: end\ndata: done\n\n`);
        res.end();
    });
};