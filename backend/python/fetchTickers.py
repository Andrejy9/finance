from database.mongoFunctions import save_tickers, get_last_screener, update_last_screener
from yahooquery import Screener

def get_available_screeners():
    """ Ottiene la lista degli screener disponibili su Yahoo Finance """
    screener = Screener()
    return screener.available_screeners  # Restituisce una lista di screener validi

def get_all_tickers(screener_name, count=200):
    screener = Screener()
    data = screener.get_screeners(screener_name, count)
    tickers = extract_ticker_data(data)
    return tickers  # Ordina alfabeticamente

def extract_ticker_data(data):
    """ Estrae tutti i dati da Yahoo Finance (sia da screener che da singoli titoli) """
    if not data:
        return {}
    
    screener_keys = list(data.keys())
    if screener_keys and "records" in data[screener_keys[0]]:
        screener_key = screener_keys[0]
        return [
            {
                "Ticker": record.get("ticker", "N/A"),
                "Company Name": record.get("companyName", "N/A"),
                "Market Cap": record.get("marketCap", "N/A"),
                "Currency": record.get("currency", "N/A"),
                "Regular Market Price": record.get("regularMarketPrice", "N/A"),
                "Shares Outstanding": record.get("sharesOutstanding", "N/A"),
                "Logo URL": record.get("logoUrl", "N/A")
            }
            for record in data[screener_key]["records"]
        ]
    
    if screener_keys and "quotes" in data[screener_keys[0]]:
        screener_key = screener_keys[0]
        return [
            {
                "symbol": quote.get("symbol", "N/A"),
                "Company Name": quote.get("longName", "N/A"),
                "Exchange": quote.get("fullExchangeName", "N/A"),
                "Market Cap": quote.get("marketCap", "N/A"),
                "Currency": quote.get("currency", "N/A"),
                "Regular Market Price": quote.get("regularMarketPrice", "N/A"),
                "Shares Outstanding": quote.get("sharesOutstanding", "N/A"),
                "Logo URL": quote.get("logoUrl", "N/A")
            }
            for quote in data[screener_key]["quotes"]
        ]
    
    return {}

def get_total_tickers():
    """ Scarica i ticker da tutti gli screener disponibili e li salva su MongoDB """
    screeners = get_available_screeners()
    last_screener = get_last_screener()  # Recupera l'ultimo screener processato
    
    if last_screener in screeners:
        start_index = screeners.index(last_screener) + 1
    else:
        start_index = 0  # Se non esiste, parte dall'inizio
    
    for screener in (screeners[start_index:]):
        if "cryptocurrencies" in screener.lower():  # ❌ Salta gli screener delle criptovalute
            print(f"❌ Saltato screener: {screener} (contiene 'cryptocurrencies')")
            continue
        
        print(f"📥 Scaricando dati da screener: {screener}...")
        tickers = get_all_tickers(screener, count=200)
        
        if tickers:
            save_tickers(tickers, screener)  # ✅ Salva i dati su MongoDB
            update_last_screener(screener)  # ✅ Aggiorna lo screener più recente
            print(f"✅ Salvati {len(tickers)} ticker da {screener} su MongoDB.")

get_total_tickers()
