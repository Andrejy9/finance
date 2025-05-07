from database.mongoFunctions import get_all_tickers_from_historical
from fetchers import alphaVantage

import traceback
import json
import sys

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
        print(json.dumps({"type": "start", "total": len(tickers)}))
        sys.stdout.flush()

        total = len(tickers)
        for i, ticker in enumerate(tickers, start=1):
            remaining = total - i
            percent = round((i / total) * 100, 2)
            print(json.dumps({
                "type": "progress",
                "index": i,
                "total": total,
                "percent": percent,
                "ticker": ticker,
                "remaining": remaining
            }))
            sys.stdout.flush()
            completed = False
            while not completed:
                try:
                    completed = alphaVantage.fetch_alpha_vantage_full_history(ticker)
                    if completed:
                        print(json.dumps({"type": "complete", "ticker": ticker}))
                        sys.stdout.flush()
                except Exception as e:
                    print(json.dumps({
                        "type": "error",
                        "ticker": ticker,
                        "message": str(e),
                        "traceback": traceback.format_exc()
                    }))
                    sys.stdout.flush()
                    print(json.dumps({"type": "stopped"}))
                    sys.stdout.flush()
                    break
            else:
                print(json.dumps({"type": "summary", "ticker": ticker}))
                sys.stdout.flush()
