# main.py
import sys
from pymongo import MongoClient, UpdateOne
from pymongo.errors import BulkWriteError
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