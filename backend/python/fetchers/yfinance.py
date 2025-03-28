# fetch_data.py
import yfinance as yf
import sys
import json
from datetime import datetime
from config.settings import settings
from database.mongoFunctions import save_to_mongodb

def get_stock_data(ticker, timeframe):
    try:
        period = determine_period(timeframe)

        # Scarica i dati con progressivo
        data = yf.download(ticker, period=period, interval=timeframe,  progress=False)

        if data.empty:
            return {"error": "Nessun dato trovato per questo ticker"}

        # Formatta le date e i numer
        formatted_data = []
        for index, row in data.iterrows():
            formatted_data.append({
                "Data": index.strftime("%Y-%m-%d %H:%M"),
                "Apertura": round(row['Open'].item(), 2),
                "Chiusura": round(row['Close'].item(), 2),
                "Massimo": round(row['High'].item(), 2),
                "Minimo": round(row['Low'].item(), 2),
                "Volume": int(row['Volume'].item())
            })

        return {
            "success": True,
            "ticker": ticker,
            "periodo": "1 anno",
            "data": formatted_data
        }

    except Exception as e:
        return {"success": False, "error": str(e)}
    
def determine_period(timeframe):
    timeframe_to_period = {
        "1m": "7d",    # 7 giorni per timeframe da 1 minuto
        "5m": "14d",   # 2 settimane per timeframe da 5 minuti
        "10m": "21d",  # 3 settimane per timeframe da 10 minuti
        "15m": "30d",  # 1 mese per timeframe da 15 minuti
        "1h": "60d",   # 2 mesi per timeframe da 1 ora
        "1d": "2y",    # 2 anni per timeframe da 1 giorno
        "1wk": "5y",   # 5 anni per timeframe settimanale
        "1mo": "24y",  # 24 anni per timeframe mensile
    }

    return timeframe_to_period.get(timeframe, "6mo")  # Default a 6 mesi se non specificato

def fetchTickerAndSave():
    """
    Funzione principale per il recupero e il salvataggio dei dati di borsa.
    
    Accetta due argomenti da linea di comando: symbol (es. AAPL) e timeframe (es. 1d).
    Recupera i dati tramite `get_stock_data`, li valida e li salva in MongoDB.
    Restituisce un dizionario JSON con il risultato dell'operazione.
    """
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
    # Default a AAPL se nessun ticker è specificato
    ticker = sys.argv[1] if len(sys.argv) > 1 else "NVDA"
    
    result = get_stock_data(ticker, "1h")
    
    # Stampa formattata per debug
    print("\n" + "="*50)
    print(f"Dati storici per {ticker} (ultimo anno)")
    print("="*50)
    
    if result.get("success"):
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"ERRORE: {result.get('error')}")