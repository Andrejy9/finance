import requests
import pandas as pd
import os
import time
from datetime import datetime
from config.settings import settings
from database.mongoFunctions import get_last_date_for_ticker
from database.mongoFunctions import alphaVantage

# 25 requests per day, nel caso di download orario mi scarica 1 mese,
# dovrei scaricare tutti i mesi per ciascun anno

# 📌 Sostituisci con la tua API Key di Alpha Vantage
API_KEY = settings.ALPHAVANTAGE_API_1


def fetch_alpha_vantage_full_history(ticker, interval="60min", api_key=API_KEY):
    """
    Scarica e salva tutti i dati storici disponibili da Alpha Vantage (intraday),
    partendo dall'ultima data disponibile in MongoDB, se presente.
    """

    base_url = "https://www.alphavantage.co/query"

    # Normalizza il nome della collezione per MongoDB
    interval_normalized = "1h" if interval == "60min" else interval
    collection_name = f"{ticker}_{interval_normalized}"
    db_name = settings.DB_NAME_HISTORICALDATA

    # Recupera la data più recente salvata
    last_date_str = get_last_date_for_ticker(db_name, collection_name, ticker)
    
    if last_date_str:
        last_date = datetime.strptime(last_date_str, "%Y-%m-%d %H:%M")
    else:
        last_date = datetime.utcnow() - pd.DateOffset(years=10)  # Default to 10 years ago if no last date

    current_date = datetime.utcnow()

    all_data_fetched = True

    start_date = last_date

    while last_date < current_date:
        month_date = last_date
        month_str = last_date.strftime("%Y-%m")
        
        # Parametri della chiamata API
        params = {
            "function": "TIME_SERIES_INTRADAY",
            "symbol": ticker,
            "interval": interval,
            "apikey": api_key,
            "adjusted": "true",
            "extended_hours": "true",
            "month": month_str
        }

        response = requests.get(base_url, params=params)
        data = response.json()

        time_series_key = next((key for key in data if "Time Series" in key), None)

        if time_series_key and time_series_key in data:
            df = pd.DataFrame.from_dict(data[time_series_key], orient="index")
            df.rename(columns={
                "1. open": "Apertura",
                "2. high": "Massimo",
                "3. low": "Minimo",
                "4. close": "Chiusura",
                "5. volume": "Volume"
            }, inplace=True)

            df.index = pd.to_datetime(df.index)
            df = df.astype({
                "Apertura": float,
                "Massimo": float,
                "Minimo": float,
                "Chiusura": float,
                "Volume": int
            })

            df = df.reset_index().rename(columns={"index": "Data"})
            df["Data"] = df["Data"].dt.strftime("%Y-%m-%d %H:%M")
            df["Ticker"] = ticker

            # Se c'è una data salvata, filtra i nuovi record
            if last_date_str:
                df = df[df["Data"] > last_date_str]

            # Controllo sulla differenza tra oggi e l'ultima data
            if not df.empty:
                last_data_date = datetime.strptime(df["Data"].max(), "%Y-%m-%d %H:%M")
                days_diff = (datetime.utcnow() - last_data_date).days
                all_data_fetched = days_diff <= 10
            else:
                all_data_fetched = False

            # Salvataggio in MongoDB
            months_total = (current_date.year - start_date.year) * 12 + (current_date.month - start_date.month) + 1
            months_done = (month_date.year - start_date.year) * 12 + (month_date.month - start_date.month) + 1
            progress_percent = round((months_done / months_total) * 100, 2)
            print(f"📊 Avanzamento: {progress_percent}% completato ({months_done}/{months_total} mesi)")

            if not df.empty:
                alphaVantage.save_historicaldata_to_mongodb(
                    df.to_dict(orient="records"),
                    db_name,
                    collection_name
                )
                #print(f"✅ Salvati {len(df)} nuovi record.")
            else:
                print("ℹ️ Nessun nuovo dato da salvare.")
        else:
            print(f"⚠️ Errore nella risposta. Messaggio: {data.get('Note') or data.get('Error Message') or data}")

        # Passa al mese successivo
        last_date += pd.DateOffset(months=1)

    return all_data_fetched

def fetch_income_statement_and_save(ticker, api_key=API_KEY):
    """
    Scarica i dati di bilancio (Income Statement) annuali e trimestrali da Alpha Vantage
    e li salva su MongoDB usando la funzione save_financial_reports_to_mongodb.
    """
    url = "https://www.alphavantage.co/query"
    params = {
        "function": "INCOME_STATEMENT",
        "symbol": ticker,
        "apikey": api_key
    }

    response = requests.get(url, params=params)
    data = response.json()

    if "annualReports" not in data or "quarterlyReports" not in data:
        print(f"⚠️ Errore o dati mancanti per {ticker}. Messaggio: {data.get('Note') or data.get('Error Message') or data}")
        return

    # Connessione a MongoDB
    db_name = settings.DB_NAME_FUNDAMENTALS

    # Aggiungi ticker e timestamp a ogni record
    timestamp = datetime.utcnow().isoformat()

    def enrich(records):
        for report in records:
            report["Ticker"] = ticker
            report["FetchedAt"] = timestamp
        return records

    # Enrich e salvataggio annualReports
    annual_reports = enrich(data["annualReports"])
    alphaVantage.save_financial_reports_to_mongodb(annual_reports, db_name, f"{ticker}_income_annual")

    # Enrich e salvataggio quarterlyReports
    quarterly_reports = enrich(data["quarterlyReports"])
    alphaVantage.save_financial_reports_to_mongodb(quarterly_reports, db_name, f"{ticker}_income_quarterly")

def fetch_dividends_and_save(ticker, api_key=API_KEY):
    """
    Scarica i dati sui dividendi da Alpha Vantage e li salva su MongoDB
    usando la funzione save_dividends_to_mongodb.
    """
    url = "https://www.alphavantage.co/query"
    params = {
        "function": "DIVIDENDS",
        "symbol": ticker,
        "apikey": api_key
    }

    response = requests.get(url, params=params)
    data = response.json()

    if "data" not in data:
        print(f"⚠️ Errore o dati mancanti per {ticker}. Messaggio: {data.get('Note') or data.get('Error Message') or data}")
        return

    db_name = settings.DB_NAME_FUNDAMENTALS
    timestamp = datetime.utcnow().isoformat()

    def enrich(records):
        for report in records:
            report["Ticker"] = ticker
            report["FetchedAt"] = timestamp
        return records

    enriched_dividends = enrich(data["data"])
    alphaVantage.save_dividends_to_mongodb(enriched_dividends, db_name, f"{ticker}_dividends")

def fetch_balance_sheet_and_save(ticker, api_key=API_KEY):
    """
    Scarica i dati di balance sheet (annual e quarterly) da Alpha Vantage
    e li salva su MongoDB usando la funzione save_balance_sheets_to_mongodb.
    """
    url = "https://www.alphavantage.co/query"
    params = {
        "function": "BALANCE_SHEET",
        "symbol": ticker,
        "apikey": api_key
    }

    response = requests.get(url, params=params)
    data = response.json()

    if "annualReports" not in data or "quarterlyReports" not in data:
        print(f"⚠️ Errore o dati mancanti per {ticker}. Messaggio: {data.get('Note') or data.get('Error Message') or data}")
        return

    db_name = settings.DB_NAME_FUNDAMENTALS
    timestamp = datetime.utcnow().isoformat()

    def enrich(records):
        for report in records:
            report["Ticker"] = ticker
            report["FetchedAt"] = timestamp
        return records

    # Enrich e salvataggio annuale
    annual_reports = enrich(data["annualReports"])
    alphaVantage.save_balance_sheets_to_mongodb(annual_reports, db_name, f"{ticker}_balance_annual")

    # Enrich e salvataggio trimestrale
    quarterly_reports = enrich(data["quarterlyReports"])
    alphaVantage.save_balance_sheets_to_mongodb(quarterly_reports, db_name, f"{ticker}_balance_quarterly")

def fetch_weekly_prices_and_save(ticker, api_key=API_KEY):
    """
    Scarica i dati settimanali (non adjusted) da Alpha Vantage
    e li salva su MongoDB.
    """
    url = "https://www.alphavantage.co/query"
    params = {
        "function": "TIME_SERIES_WEEKLY",
        "symbol": ticker,
        "apikey": api_key
    }

    response = requests.get(url, params=params)
    data = response.json()

    if "Weekly Time Series" not in data:
        print(f"⚠️ Errore o dati mancanti per {ticker}. Messaggio: {data.get('Note') or data.get('Error Message') or data}")
        return

    db_name = settings.DB_NAME_WEEKLY_TICKERS
    collection_name = f"{ticker}_weekly"

    time_series = data["Weekly Time Series"]
    timestamp = datetime.utcnow().isoformat()

    records = []
    for date_str, values in time_series.items():
        record = {
            "Ticker": ticker,
            "Date": date_str,
            "FetchedAt": timestamp,
            "Open": float(values["1. open"]),
            "High": float(values["2. high"]),
            "Low": float(values["3. low"]),
            "Close": float(values["4. close"]),
            "Volume": int(values["5. volume"])
        }
        records.append(record)

    alphaVantage.save_weekly_prices_to_mongodb(records, db_name, collection_name)