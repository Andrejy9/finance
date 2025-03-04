const { spawn } = require('child_process');
const path = require('path');

exports.runPythonScript = async (script, params = []) => {
    return new Promise((resolve, reject) => {
        const MAX_TIMEOUT = 30000; // 30 secondi
        console.log(params);

        if (!script || typeof script !== 'string') {
            return reject(new Error("❌ Script non specificato o non valido"));
        }

        const scriptPath = path.resolve(__dirname, `../../backend/python/${script}.py`);

        const pythonProcess = spawn('python3', [scriptPath, ...params]);

        let outputBuffer = '';
        let errorBuffer = '';
        let timeoutId;

        const cleanup = () => {
            if (pythonProcess && !pythonProcess.killed) pythonProcess.kill();
            if (timeoutId) clearTimeout(timeoutId);
        };

        timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error(`⏳ Timeout: Nessuna risposta dopo ${MAX_TIMEOUT / 1000}s`));
        }, MAX_TIMEOUT);

        pythonProcess.stdout.on('data', (data) => {
            outputBuffer += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error("🚨 Errore Python:", data.toString());
            errorBuffer += data.toString();
        });

        pythonProcess.on('error', (err) => {
            cleanup();
            reject(new Error(`⚠️ Errore di esecuzione script: ${err.message}`));
        });

        pythonProcess.on('close', (code) => {
            cleanup();
            try {
                // ✅ Trova e parse il primo output JSON valido
                const cleanOutput = outputBuffer.split('\n').find(line => line.trim().startsWith('{'));
                const result = cleanOutput ? JSON.parse(cleanOutput) : null;

                if (!result) {
                    throw new Error("⚠️ Nessun output JSON valido ricevuto");
                }

                resolve(result);
            } catch (parseError) {
                reject(new Error(`⚠️ Risposta malformata: ${outputBuffer}`));
            }
        });
    });
};