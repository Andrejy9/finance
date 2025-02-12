import sys
import json
from datetime import datetime
from config.settings import settings
from main import get_stock_data, save_to_mongodb

def main():
    try:
        if len(sys.argv) != 3:
            raise ValueError("Richiesti esattamente 2 argomenti: (symbol, timeframe)")

        symbol = sys.argv[1].upper()
        timeframe = sys.argv[2].lower()

        # ✅ Controllo validità timeframe (Es: 1m, 5m, 1d, 1w, ecc.)
        valid_timeframes = {"1m", "5m", "10m", "15m", "1h", "1d", "1wk", "1mo"}
        if timeframe not in valid_timeframes:
            raise ValueError(f"Timeframe non valido: {timeframe}. Usa uno tra {valid_timeframes}")
        
        result = get_stock_data(symbol, timeframe) 

        if not result.get("success"):
            return {
                "success": False,
                "error": result.get("error", "Errore sconosciuto nel fetch")
            }

        # ✅ Salva i dati su MongoDB
        save_success = save_to_mongodb(
            result["data"], 
            settings.DB_NAME, 
            f"{symbol}_{timeframe}"  # 🔹 Nome collezione distinto per timeframe
        )

        if not save_success:
            return {
                "success": False,
                "error": "Fallimento nel salvataggio su MongoDB"
            }

        return {
            "success": True,
            "message": f"Dati {symbol} salvati correttamente",
   
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Errore globale: {str(e)}"
        }

if __name__ == "__main__":
    try:
        result = main()
        print(json.dumps(result))  # Unico punto di output JSON
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Errore critico: {str(e)}"
        }))
    sys.exit(0 if result.get('success') else 1)