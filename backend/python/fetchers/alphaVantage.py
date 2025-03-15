import requests
import pandas as pd
import os
import time
from datetime import datetime
from config.settings import settings
from database.mongoFunctions import save_historicaldata_to_mongodb, get_last_date_for_ticker

# 25 requests per day, nel caso di download orario mi scarica 1 mese,
# dovrei scaricare tutti i mesi per ciascun anno

# 📌 Sostituisci con la tua API Key di Alpha Vantage
API_KEY = settings.ALPHAVANTAGE_API_1

def fetch_alpha_vantage_data(ticker, interval="5min", output_size="full", api_key=API_KEY):
    """Scarica i dati storici da Alpha Vantage e li struttura in un DataFrame."""
    
    base_url = "https://www.alphavantage.co/query"
    
    params = {
        "function": "TIME_SERIES_INTRADAY",
        "symbol": ticker,
        "interval": interval,
        "apikey": api_key,
        "outputsize": output_size
    }
    
    response = requests.get(base_url, params=params)
    data = response.json()
    
    # 🔹 Controllo errori: verifica se la risposta è valida
    time_series_key = next((key for key in data.keys() if "Time Series" in key), None)
    
    if not time_series_key or time_series_key not in data:
        print("❌ Errore: Nessun dato trovato per il ticker", ticker)
        print("📌 Messaggio ricevuto:", data)
        return None

    # 🔹 Convertire in DataFrame
    df = pd.DataFrame.from_dict(data[time_series_key], orient="index")
    
    # 🔹 Rinominare colonne per migliorare leggibilità
    column_mapping = {
        "1. open": "Apertura",
        "2. high": "Massimo",
        "3. low": "Minimo",
        "4. close": "Chiusura",
        "5. volume": "Volume"
    }
    
    df.rename(columns=column_mapping, inplace=True)

    # 🔹 Convertire i dati nei formati corretti
    df.index = pd.to_datetime(df.index)
    df = df.astype({"Apertura": float, "Massimo": float, "Minimo": float, "Chiusura": float, "Volume": int})

    # 🔹 Strutturare i dati nel formato richiesto
    df = df.reset_index().rename(columns={"index": "Data"})
    df["Data"] = df["Data"].dt.strftime("%Y-%m-%d %H:%M")

    return df

# # 📌 Esegui il download dei dati per AAPL (Apple) con timeframe
# dati = fetch_alpha_vantage_data("AAPL", interval="60min")

# # 📌 Stampa solo i primi 5 risultati formattati
# if dati is not None:
#     print(dati.head())

#     # 📌 Salva i dati in un file CSV
#     dati.to_csv("AAPL_alpha_vantage.csv", index=False)
#     save_path = os.path.join(os.getcwd(), "AAPL_alpha_vantage.csv")
#     dati.to_csv(save_path, index=False)
#     print(f"✅ Dati salvati in '{save_path}'")


def fetch_alpha_vantage_full_history(ticker, interval="60min", start_year=2015, end_year=None, api_key=API_KEY):
    """Scarica e salva dati storici Alpha Vantage mese per mese in MongoDB a partire dall'ultima data salvata."""

    base_url = "https://www.alphavantage.co/query"
    inverval_converted = interval     # ✅ Se l'intervallo è '1h', lo converto in '60min' per Alpha Vantage
    if interval == "60min":
        inverval_converted = "1h"
    collection_name = f"{ticker}_{inverval_converted}"
    db_name = settings.DB_NAME_HISTORICALDATA
    end_year = end_year or datetime.today().year
    current_month = datetime.today().month

    # 🔍 Recupera la data più recente presente su MongoDB
    last_date_str = get_last_date_for_ticker(db_name, collection_name, ticker)

    if last_date_str:
        last_date = datetime.strptime(last_date_str, "%Y-%m-%d %H:%M")
        start_year = last_date.year
        start_month = last_date.month
    else:
        start_month = 1  # se non ci sono dati, parte da gennaio

    for year in range(start_year, end_year + 1):
        for month in range(1, 13):
            if year == start_year and month < start_month:
                continue
            if year == end_year and month > current_month:
                break

            month_str = f"{year}-{month:02d}"
            print(f"⬇️ Scarico dati per {month_str}...")

            params = {
                "function": "TIME_SERIES_INTRADAY",
                "symbol": ticker,
                "interval": interval,
                "apikey": api_key,
                "outputsize": "full",
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

                save_historicaldata_to_mongodb(
                    df.to_dict(orient="records"),
                    db_name,
                    collection_name
                )

            else:
                print(f"⚠️ Nessun dato per {month_str}. Messaggio: {data.get('Note') or data.get('Error Message') or data}")

            time.sleep(12.1)
    """Scarica e salva dati storici Alpha Vantage mese per mese negli ultimi 10 anni in MongoDB."""

    base_url = "https://www.alphavantage.co/query"
    end_year = end_year or datetime.today().year
    current_month = datetime.today().month

    for year in range(start_year, end_year + 1):
        for month in range(1, 13):
            if year == end_year and month > current_month:
                break

            month_str = f"{year}-{month:02d}"
            print(f"⬇️ Scarico dati per {month_str}...")

            params = {
                "function": "TIME_SERIES_INTRADAY",
                "symbol": ticker,
                "interval": interval,
                "apikey": api_key,
                "outputsize": "full",
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

                # 🔸 Salvataggio su MongoDB mese per mese
                save_historicaldata_to_mongodb(
                    df.to_dict(orient="records"),
                    settings.DB_NAME_HISTORICALDATA,
                    f"{ticker}_{interval}"
                )

            else:
                print(f"⚠️ Nessun dato per {month_str}. Messaggio: {data.get('Note') or data.get('Error Message') or data}")

            time.sleep(12.1)
    """Scarica dati storici Alpha Vantage mese per mese per coprire fino a 10+ anni."""

    base_url = "https://www.alphavantage.co/query"
    all_data = []

    end_year = end_year or datetime.today().year
    current_month = datetime.today().month

    for year in range(start_year, end_year + 1):
        for month in range(1, 13):
            # Evita mesi futuri
            if year == end_year and month > current_month:
                break

            month_str = f"{year}-{month:02d}"
            print(f"⬇️ Scarico dati per {month_str}...")

            params = {
                "function": "TIME_SERIES_INTRADAY",
                "symbol": ticker,
                "interval": interval,
                "apikey": api_key,
                "outputsize": "full",
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

                all_data.append(df)
            else:
                print(f"⚠️ Nessun dato per {month_str}. Messaggio: {data.get('Note') or data.get('Error Message') or data}")

            # ⏱️ Rispetta il limite di 5 richieste al minuto (gratuito)
            time.sleep(12.1)

    # Combina tutti i dati in un DataFrame unico
    if all_data:
        final_df = pd.concat(all_data).drop_duplicates(subset=["Data"]).sort_values("Data").reset_index(drop=True)
        print(f"✅ Completato. Totale righe: {len(final_df)}")
        return final_df
    else:
        print("❌ Nessun dato recuperato.")
        return None