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