from database.mongoFunctions import save_tickers
from yahooquery import Screener


def get_available_screeners():
    """ Ottiene la lista degli screener disponibili su Yahoo Finance """
    screener = Screener()
    return screener.available_screeners  # Restituisce una lista di screener validi

def get_all_tickers(screener_name, count=200):
    screener = Screener()
    
    # Scarica i dati per tutti gli screener
    data = screener.get_screeners(screener_name, count)
    
    # Set per evitare duplicati
    tickers = extract_ticker_data(data)
    
    return tickers  # Ordina alfabeticamente

def extract_ticker_data(data):
    """ Estrae tutti i dati da Yahoo Finance (sia da screener che da singoli titoli) """
    
    if not data:
        return {}

    # Controlla se è un dataset da uno screener (con "records")
    screener_keys = list(data.keys())
    
    if screener_keys and "records" in data[screener_keys[0]]:
        screener_key = screener_keys[0]  # Trova la chiave dello screener
        return [
            {
                "Ticker": record.get("ticker", "N/A"),
                "Company Name": record.get("companyName", "N/A"),
                "Form Type": record.get("formType", "N/A"),
                "File Date": record.get("fileDate", "N/A"),
                "Fund Name": record.get("fundName", "N/A"),
                "Fund Type": record.get("fundType", "N/A"),
                "Previous Shares": record.get("prevShares", "N/A"),
                "Current Shares": record.get("currentShares", "N/A"),
                "Percent Change in Shares": record.get("percentChangeInShares", "N/A"),
                "Ownership Percent": record.get("ownershipPercent", "N/A"),
                "Percent Change in Ownership": record.get("percentChangeInOwnership", "N/A"),
                "Percent of Shares Outstanding": record.get("percentOfSharesOutstanding", "N/A"),
                "Fund AUM": record.get("fundAum", "N/A"),
                "Logo URL": record.get("logoUrl", "N/A")
            }
            for record in data[screener_key]["records"]
        ]

   # Se "records" non è presente, controlla se ci sono dati nei "quotes"
    if screener_keys and "quotes" in data[screener_keys[0]]:
            screener_key = screener_keys[0]  # Trova la chiave dello screener
            return [
                {
                    "symbol": quote.get("symbol", "N/A"),
                    "Company Name": quote.get("longName", "N/A"),
                    "Exchange": quote.get("fullExchangeName", "N/A"),
                    "Market Cap": quote.get("marketCap", "N/A"),
                    "Currency": quote.get("currency", "N/A"),
                    "Regular Market Price": quote.get("regularMarketPrice", "N/A"),
                    "Regular Market Change Percent": quote.get("regularMarketChangePercent", "N/A"),
                    "Dividend Yield": quote.get("dividendYield", "N/A"),
                    "PE Ratio (TTM)": quote.get("trailingPE", "N/A"),
                    "EPS (TTM)": quote.get("epsTrailingTwelveMonths", "N/A"),
                    "52 Week Range": quote.get("fiftyTwoWeekRange", "N/A"),
                    "50 Day Avg": quote.get("fiftyDayAverage", "N/A"),
                    "200 Day Avg": quote.get("twoHundredDayAverage", "N/A"),
                    "Shares Outstanding": quote.get("sharesOutstanding", "N/A"),
                    "Book Value": quote.get("bookValue", "N/A"),
                    "Logo URL": quote.get("logoUrl", "N/A")
                }
                for quote in data[screener_key]["quotes"]
            ]
  

    return {}
    
def get_total_tickers():
    """ Scarica i ticker da tutti gli screener disponibili e li salva su MongoDB """
    screeners = get_available_screeners()
    
    for screener in screeners:
        print(f"Scaricando dati da screener: {screener}...")
        tickers = get_all_tickers(screener, count=200)
        if tickers:
            save_tickers(tickers, screener)  # Salva i dati su MongoDB
            print(f"Salvati {len(tickers)} ticker da {screener} su MongoDB.")

get_total_tickers()


