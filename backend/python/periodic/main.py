from database.mongoFunctions import get_all_tickers_from_historical
from fetchers import alphaVantage

import traceback

class PeriodicDataFetcher:
    def __init__(self):
        from database.mongoFunctions import client
        self.client = client

    def fetch_all_historical_data(self):
        """
        Recupera tutti i ticker dalla collection 'historicaltickers' e scarica i dati storici
        per ciascun ticker utilizzando fetch_alpha_vantage_full_history. Il processo continua
        fino a quando Alpha Vantage non restituisce un errore (tipicamente legato al rate limit).
        """
        tickers = get_all_tickers_from_historical()
        print(f"📊 Inizio download per {len(tickers)} ticker...\n")

        total = len(tickers)
        for i, ticker in enumerate(tickers, start=1):
            remaining = total - i
            percent = round((i / total) * 100, 2)
            print(f"➡️  [{i}/{total}] ({percent}%) Scarico dati per {ticker}... | Rimangono: {remaining} ticker")
            completed = False
            while not completed:
                try:
                    completed = alphaVantage.fetch_alpha_vantage_full_history(ticker)
                    if completed:
                        print(f"✅ Completato il download per {ticker}.")
                except Exception as e:
                    print(f"🛑 Errore durante il download per {ticker}: {e}")
                    traceback.print_exc()
                    print("🚫 Interrotto il ciclo a causa di un errore (possibile rate limit raggiunto).")
                    break
            else:
                print(f"📈 Riepilogo per {ticker}: download completato.")
