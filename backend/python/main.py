# main.py
import sys
from pymongo import MongoClient
from fetch_data import get_stock_data
from config.settings import settings

def save_to_mongodb(data, db_name, collection_name):
    try:
        # Connessione a MongoDB
        client = MongoClient(settings.MONGODB_URI)
        db = client[db_name]
        collection = db[collection_name]

        # Inserimento dei dati
        if isinstance(data, list):
            collection.insert_many(data)
        else:
            collection.insert_one(data)

        print(f"Dati salvati con successo nella collezione '{collection_name}' del database '{db_name}'.")

    except Exception as e:
        print(f"Errore durante il salvataggio su MongoDB: {e}")

if __name__ == "__main__":
    # Lista dei ticker da scaricare
    tickers = ["AAPL", "MSFT", "GOOGL"]  # Puoi aggiungere altri ticker alla lista

    for ticker in tickers:
        print(f"Scaricando dati per {ticker}...")
        result = get_stock_data(ticker)

        if result.get("success"):
            # Salva i dati nel database
            save_to_mongodb(result["data"], settings.DB_NAME, ticker)
        else:
            print(f"Errore nel recupero dei dati per {ticker}: {result.get('error')}")