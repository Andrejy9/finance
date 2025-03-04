const baseUrl = "http://localhost:5050/api"; // Cambia con l'URL del tuo backend

async function saveConfig() {
    const configData = {
        min_distance: parseFloat(document.getElementById("min_distance").value),
        min_touches: parseInt(document.getElementById("min_touches").value),
        max_levels: parseInt(document.getElementById("max_levels").value),
        window: parseInt(document.getElementById("window").value)
    };

    try {
        const response = await fetch(`${baseUrl}/config/support-resistance`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(configData)
        });

        const result = await response.json();

        if (response.ok) {
            alert("✅ Configurazione salvata con successo!");
            console.log("📊 Configurazione aggiornata:", result);
        } else {
            console.error("❌ Errore:", result.error);
            alert(`Errore nel salvataggio: ${result.message || "Errore sconosciuto"}`);
        }
    } catch (error) {
        console.error("🚨 Errore nella richiesta:", error);
        alert("Errore nella comunicazione con il server.");
    }
}

// 🔹 Funzione per CARICARE la configurazione salvata
async function loadConfig() {
    try {
        const response = await fetch(`${baseUrl}/config/support-resistance`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            console.log("📥 Configurazione caricata:", result);

            document.getElementById("min_distance").value = result.data.min_distance || 5.0;
            document.getElementById("min_touches").value = result.data.min_touches || 10;
            document.getElementById("max_levels").value = result.data.max_levels || 25;
            document.getElementById("window").value = result.data.window || 20;

        } else {
            console.error("⚠️ Nessuna configurazione trovata:", result.message);
        }
    } catch (error) {
        console.error("❌ Errore nel recupero della configurazione:", error);
    }
}

// 🔹 Carica la configurazione automaticamente al caricamento della pagina
document.addEventListener("DOMContentLoaded", loadConfig);