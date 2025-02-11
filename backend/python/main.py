# main.py
import sys
from pymongo import MongoClient
from fetch_data import get_stock_data
from config.settings import settings

def get_saved_symbols(db_name, collection_name):
    """Recupera la lista dei simboli salvati in MongoDB"""
    try:
        client = MongoClient(settings.MONGODB_URI)
        db = client[db_name]
        collection = db[collection_name]
        
        # Estrae tutti i documenti e recupera il campo 'symbol'
        symbols = [doc["symbol"] for doc in collection.find({}, {"symbol": 1, "_id": 0})]
        client.close()
        return symbols
    
    except KeyError as e:
        print(f"Campo 'symbol' mancante in qualche documento: {e}")
        return []
    except Exception as e:
        print(f"Errore durante il recupero dei simboli: {e}")
        return []

def save_to_mongodb(data, db_name, collection_name):
    try:
        client = MongoClient(settings.MONGODB_URI)
        db = client[db_name]
        collection = db[collection_name]

        if isinstance(data, list):
            collection.insert_many(data)
        else:
            collection.insert_one(data)

        print(f"Dati salvati con successo in '{db_name}.{collection_name}'.")

    except Exception as e:
        print(f"Errore durante il salvataggio su MongoDB: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    # Recupera i simboli dal database
    symbols = get_saved_symbols(settings.DB_NAME, "savedtickers")
    
    if not symbols:
        print("Nessun simbolo trovato nella collezione 'savedtickers'!")
        sys.exit(1)

    print(f"Simboli da processare: {', '.join(symbols)}")

    for symbol in symbols:
        print(f"\nScaricando dati per {symbol}...")
        result = get_stock_data(symbol)

        if result.get("success"):
            save_to_mongodb(result["data"], settings.DB_NAME, symbol)
        else:
            print(f"Errore per {symbol}: {result.get('error')}")