
import sys
import json
from analysis.support_resistance import process_ticker

def run(ticker="AAPL"):
    try:
        result = process_ticker(ticker.upper())
        return result
    except Exception as e:
        return {
            "success": False,
            "error": f"Errore in process_ticker: {str(e)}"
        }

if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            raise ValueError("Errore: specificare un ticker come argomento")

        TICKER = sys.argv[1].upper()  # 🔹 Converte il ticker in maiuscolo
        result = process_ticker(TICKER)

        print(json.dumps(result))  # ✅ Output JSON unificato
        sys.exit(0 if result.get("success") else 1)

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Errore critico: {str(e)}"
        }))
        sys.exit(1)