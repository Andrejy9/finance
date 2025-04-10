# Questo script viene chiamato da un processo child in JavaScript
# per scaricare i dati dei ticker utilizzando Yahoo Finance (yfinance) e salvarli su MongoDB
# Restituisce un oggetto JSON come output.

import sys
import json
from fetchers.yfinance import fetchTickerAndSave

if __name__ == "__main__":
    try:
        result = fetchTickerAndSave()
        print(json.dumps(result))  # Unico punto di output JSON
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Errore critico: {str(e)}"
        }))
    sys.exit(0 if result.get('success') else 1)