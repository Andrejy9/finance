import requests
import pandas as pd
from config.settings import settings
#from mongodb_module import save_historicaldata_to_mongodb

FMP_API_KEY = settings.FMP_API_KEY

def fetch_historical_fundamentals(ticker, api_key=FMP_API_KEY, period='daily'):
    """Scarica dati fondamentali storici per un ticker da Financial Modeling Prep."""

    ratios_url = f"https://financialmodelingprep.com/api/v3/ratios/{ticker}?period={period}&apikey={api_key}"
    key_metrics_url = f"https://financialmodelingprep.com/api/v3/key-metrics/{ticker}?period={period}&apikey={api_key}"

    ratios_response = requests.get(ratios_url).json()
    metrics_response = requests.get(key_metrics_url).json()

    if not ratios_response or not metrics_response:
        print(f"❌ Nessun dato trovato per {ticker}")
        return None

    # Combina i due dataset usando la data come chiave comune
    ratios_df = pd.DataFrame(ratios_response).set_index('date')
    metrics_df = pd.DataFrame(metrics_response).set_index('date')

    combined_df = pd.concat([ratios_df, metrics_df], axis=1, join='inner').reset_index()

    # Seleziona e rinomina colonne rilevanti
    selected_columns = {
        "date": "Data",
        "priceEarningsRatio": "PE_ratio",
        "eps": "EPS",
        "returnOnEquity": "ROE",
        "returnOnAssets": "ROA",
        "dividendYield": "Dividend_Yield",
        "revenueGrowth": "Revenue_Growth"
    }

    combined_df = combined_df[list(selected_columns.keys())]
    combined_df.rename(columns=selected_columns, inplace=True)
    combined_df["Ticker"] = ticker

    return combined_df

def save_historical_fundamentals(ticker, db_name=settings.DB_NAME_FUNDAMENTALS, period='annual'):
    df = fetch_historical_fundamentals(ticker, period=period)

    if df is not None:
        collection_name = f"fundamentals_historical_{ticker}_{period}"

        # save_historicaldata_to_mongodb(
        #     df.to_dict(orient="records"),
        #     db_name,
        #     collection_name
        # )

        print(f"✅ Dati storici salvati correttamente per {ticker} ({period})")
    else:
        print(f"❌ Impossibile salvare dati storici per {ticker}")

# 📌 Esempio di utilizzo:
if __name__ == "__main__":
    ticker = "AAPL"
    save_historical_fundamentals(ticker, period='annual')  # o 'quarter' per dati trimestrali