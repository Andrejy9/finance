
from config.settings import settings
from pymongo import MongoClient

DB_NAME = "tickers"

# Connessione a MongoDB
client = MongoClient(settings.MONGODB_URI)


def save_tickers(tickers, COLLECTION_NAME):
    """ Salva o aggiorna i ticker in MongoDB """
    with MongoClient(settings.MONGODB_URI) as client:
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]

        for ticker in tickers:
            if "symbol" not in ticker:
                print(f"Errore: 'symbol' mancante in {ticker}")
                continue  # Salta l'elemento se manca 'symbol'
            
            query = {"symbol": ticker["symbol"]}  # Usa 'symbol' come chiave primaria
            update = {"$set": ticker}
            collection.update_one(query, update, upsert=True)  # Inserisce o aggiorna