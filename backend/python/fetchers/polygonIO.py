import requests
import pandas as pd
import os
from datetime import datetime, timedelta
import time
from config.settings import settings
from database.mongoFunctions import polygonIO
from database.mongoFunctions import get_last_date_for_ticker


API_KEY = settings.POLYGON_API_KEY
BASE_URL = "https://api.polygon.io"


import json
import sys

def fetch_polygon_full_history(ticker):
    """
    Scarica tutti i dati orari disponibili da Polygon.io per il ticker specificato,
    mese per mese, e li salva in MongoDB.
    Restituisce True se completato correttamente, False in caso di errore.
    """
    db_name = "polygon_historical"
    collection_name = f"{ticker}_1h"

    # Recupera la data più recente salvata
    last_date_str = get_last_date_for_ticker(db_name, collection_name, ticker)

    if last_date_str:
        start_date = datetime.strptime(last_date_str, "%Y-%m-%d %H:%M").date()
    else:
        start_date = datetime.utcnow().date() - timedelta(days=730)

    end_date = datetime.utcnow().date()
    current = start_date

    # Calcolo totale mesi per la progress bar
    months_total = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month) + 1

    months_done = 0
    all_data_fetched = True

    while current < end_date:
        # Intervallo mensile
        period_start = current
        period_end = current + timedelta(days=30)
        if period_end > end_date:
            period_end = end_date

        start_str = period_start.strftime("%Y-%m-%d")
        end_str = period_end.strftime("%Y-%m-%d")

        try:
            print(f"📦 Scarico {ticker} dal {start_str} al {end_str}")
            print(json.dumps({
                "type": "info",
                "message": f"Scarico {ticker} dal {start_str} al {end_str}"
            }))
            sys.stdout.flush()

            fetch_polygon_hourly_prices_and_save(ticker, start_str, end_str)
            time.sleep(1.2)

        except Exception as e:
            print(f"❌ Errore durante il download {ticker} {start_str} - {end_str}: {e}")
            print(json.dumps({
                "type": "error",
                "ticker": ticker,
                "message": str(e)
            }))
            sys.stdout.flush()
            return False

        months_done += 1
        progress_percent = round((months_done / months_total) * 100, 2)
        print(json.dumps({
            "type": "month_progress",
            "progress_percent": progress_percent,
            "months_done": months_done,
            "months_total": months_total
        }))
        sys.stdout.flush()

        current = period_end

    return all_data_fetched

def fetch_polygon_hourly_prices_and_save(ticker, start_date, end_date):
    """
    Scarica i dati orari storici da Polygon.io (solo per mercati USA) e li salva su MongoDB.
    I campi salvati seguono la stessa nomenclatura usata per Alpha Vantage.
    """
    url = f"{BASE_URL}/v2/aggs/ticker/{ticker}/range/1/hour/{start_date}/{end_date}"
    params = {
        "adjusted": "true",
        "sort": "asc",
        "limit": 50000,
        "apiKey": API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    if "results" not in data:
        print(f"⚠️ Errore per {ticker}: {data}")
        return

    df = pd.DataFrame(data["results"])
    df["Data"] = pd.to_datetime(df["t"], unit="ms")
    df.rename(columns={
        "o": "Apertura",
        "h": "Massimo",
        "l": "Minimo",
        "c": "Chiusura",
        "v": "Volume"
    }, inplace=True)

    df = df[["Data", "Apertura", "Massimo", "Minimo", "Chiusura", "Volume"]]
    df["Data"] = df["Data"].dt.strftime("%Y-%m-%d %H:%M")
    df["Ticker"] = ticker

    polygonIO.save_historicaldata_to_mongodb(df.to_dict(orient="records"), "polygon_historical", f"{ticker}_1h")

def fetch_polygon_financials_and_save(ticker):
    """
    Scarica i financials (income statement) da Polygon.io e salva su MongoDB.
    """
    url = f"{BASE_URL}/v2/reference/financials?ticker={ticker}"
    params = {
        "apiKey": API_KEY,
        "limit": 100  # cambia se servono più report
    }

    response = requests.get(url, params=params)
    data = response.json()

    if "results" not in data:
        print(f"⚠️ Nessun financial report trovato: {data}")
        return

    timestamp = datetime.utcnow().isoformat()
    for report in data["results"]:
        report["FetchedAt"] = timestamp
        report["Ticker"] = ticker

    polygonIO.save_financial_reports_to_mongodb(data["results"], "polygon_fundamentals", f"{ticker}_financials")

def fetch_polygon_dividends_and_save(ticker):
    """
    Scarica i dividendi da Polygon.io e salva su MongoDB.
    """
    url = f"{BASE_URL}/v3/reference/dividends"
    params = {
        "ticker": ticker,
        "apiKey": API_KEY,
        "limit": 1000
    }

    response = requests.get(url, params=params)
    data = response.json()

    if "results" not in data:
        print(f"⚠️ Nessun dividendo trovato: {data}")
        return

    timestamp = datetime.utcnow().isoformat()
    for div in data["results"]:
        div["FetchedAt"] = timestamp
        div["Ticker"] = ticker

    polygonIO.save_dividends_to_mongodb(data["results"], "polygon_fundamentals", f"{ticker}_dividends")

def fetch_polygon_weekly_prices_and_save(ticker, start_date, end_date):
    """
    Scarica i dati settimanali da Polygon.io e li salva su MongoDB.
    """
    url = f"{BASE_URL}/v2/aggs/ticker/{ticker}/range/1/week/{start_date}/{end_date}"
    params = {
        "adjusted": "true",
        "sort": "asc",
        "limit": 5000,
        "apiKey": API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    if "results" not in data:
        print(f"⚠️ Nessun dato settimanale trovato: {data}")
        return

    df = pd.DataFrame(data["results"])
    df["Date"] = pd.to_datetime(df["t"], unit="ms")
    df.rename(columns={"c": "Close", "o": "Open", "h": "High", "l": "Low", "v": "Volume"}, inplace=True)
    df["Ticker"] = ticker
    df["FetchedAt"] = datetime.utcnow().isoformat()

    polygonIO.save_weekly_prices_to_mongodb(df.to_dict(orient="records"), "polygon_weekly", f"{ticker}_weekly")