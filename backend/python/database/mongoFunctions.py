from config.settings import settings

from pymongo import MongoClient, UpdateOne
from pymongo.errors import BulkWriteError

DB_NAME = "tickers"

# Connessione a MongoDB
client = MongoClient(settings.MONGODB_URI)


def get_support_resistance_config():
    """Recupera i parametri di configurazione per il calcolo dei supporti e resistenze dal database."""
    config_db = client["configurations"]  # 🔹 Database delle configurazioni
    config_collection = config_db["support_resistance"]  # 🔹 Collezione specifica

    config = config_collection.find_one(
        {"_id": "SR_CONFIG"}
    )  # ✅ Recupera i parametri salvati

    if not config:
        print("⚠️ Nessuna configurazione trovata! Uso i valori predefiniti.")
        return {"min_distance": 5.0, "min_touches": 10, "max_levels": 25, "window": 20}

    return {
        "min_distance": config.get("min_distance", 5.0),
        "min_touches": config.get("min_touches", 10),
        "max_levels": config.get("max_levels", 25),
        "window": config.get("window", 20),
    }


def save_tickers(tickers, COLLECTION_NAME):
    """Salva o aggiorna i ticker in MongoDB"""
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


def get_last_screener():
    """Ottiene l'ultimo screener processato dal DB"""
    db = client["progress_db"]
    progress = db.screener_progress.find_one({"_id": "last_screener"})
    return progress["screener"] if progress else None


def update_last_screener(screener_name):
    """Aggiorna l'ultimo screener processato nel DB"""
    db = client["progress_db"]
    db.screener_progress.update_one(
        {"_id": "last_screener"}, {"$set": {"screener": screener_name}}, upsert=True
    )


# funzione per salvare dati storici su M
def save_historicaldata_to_mongodb(data, db_name, collection_name):
    """Salva dati in MongoDB evitando duplicati per 'Data' e 'Ticker'."""
    db = client[db_name]
    collection = db[collection_name]

    inserted_count = 0
    for record in data:
        query = {"Data": record["Data"], "Ticker": record["Ticker"]}
        if not collection.find_one(query):
            collection.insert_one(record)
            inserted_count += 1

    if inserted_count:
        print(f"📅 Salvati {inserted_count} nuovi record in '{collection_name}'")
        return True
    else:
        print(f"⚠️ Nessun nuovo dato inserito in '{collection_name}' (tutti duplicati)")
        return False


def get_last_date_for_ticker(db_name, collection_name, ticker):
    """Recupera la data più recente salvata in MongoDB per un dato ticker."""
    db = client[db_name]
    collection = db[collection_name]

    result = collection.find({"Ticker": ticker}).sort("Data", -1).limit(1)
    last_entry = next(result, None)

    if last_entry:
        print(f"🕒 Ultima data trovata in MongoDB per {ticker}: {last_entry['Data']}")
        return last_entry["Data"]
    else:
        print(
            f"⚠️ Nessun dato trovato per {ticker} nella collezione '{collection_name}'"
        )
        return None


#funzione per salvare dati recenti su MongoDB
def save_to_mongodb(data, db_name, collection_name):
    client = MongoClient(settings.MONGODB_URI)
    try:
        db = client[db_name]
        collection = db[collection_name]

        # Converti e valida i documenti
        documents = [doc for doc in (data if isinstance(data, list) else [data])]
        if not documents:
            print("⚠️ Nessun documento valido da processare")
            return True  

        print(f"📄 Documenti ricevuti: {documents}")

        # Crea operazioni di upsert
        operations = []
        for doc in documents:
            try:
                # Verifica il formato della data
                if 'Data' not in doc or not isinstance(doc['Data'], str):
                    raise ValueError(f"❌ Documento non valido: {json.dumps(doc, default=str)}")
                    
                operations.append(
                    UpdateOne(
                        {'Data': doc['Data']},
                        {'$set': doc},  # 🔥 Adesso aggiorna il documento se esiste!
                        upsert=True
                    )
                )
                    
            except Exception as e:
                print(f"⚠️ Documento scartato: {str(e)}")
                continue

        if not operations:
            print("⚠️ Nessuna operazione valida da eseguire")
            return True

        # Esegui le operazioni
        try:
            result = collection.bulk_write(operations, ordered=False)
            inserted_count = result.upserted_count or 0
            modified_count = result.modified_count or 0
            
            print(f"✅ Risultati operazione:")
            print(f"- 📌 Documenti aggiornati: {modified_count}")
            print(f"- 🆕 Nuovi documenti inseriti: {inserted_count}")
            
            return True

        except BulkWriteError as bwe:
            print("❌ Errori durante l'operazione bulk:")
            import pprint
            pprint.pprint(bwe.details)  
            return False

    except Exception as e:
        print(f"🚨 Errore critico: {str(e)}")
        return False
    finally:
        client.close()
   