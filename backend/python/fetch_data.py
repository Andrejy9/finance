# fetch_data.py
import yfinance as yf
import sys
import json
from datetime import datetime

def get_stock_data(ticker):
    try:
        # Scarica i dati con progressivo
        data = yf.download(ticker, period="7d", interval="5m",  progress=False)

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

if __name__ == "__main__":
    # Default a AAPL se nessun ticker è specificato
    ticker = sys.argv[1] if len(sys.argv) > 1 else "SOXX"
    
    result = get_stock_data(ticker)
    
    # Stampa formattata per debug
    print("\n" + "="*50)
    print(f"Dati storici per {ticker} (ultimo anno)")
    print("="*50)
    
    if result.get("success"):
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"ERRORE: {result.get('error')}")