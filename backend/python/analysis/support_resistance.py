import pandas as pd
import numpy as np
import pymongo
from pymongo import MongoClient
from datetime import datetime
from config.settings import settings
import sys
import json
from database.mongoFunctions import get_support_resistance_config


# Configurazione MongoDB
client = MongoClient(settings.MONGODB_URI)
db = client['finance']

# Parametri configurabili
WINDOW_SIZE = 5  # Per il calcolo dei minimi/massimi locali

def get_timeframe_collections(ticker):
    """Ottiene tutte le collezioni per il ticker specificato"""
    collections = db.list_collection_names()
    return [col for col in collections if col.startswith(f"{ticker}_")]

def fetch_data(collection_name):
    """Recupera i dati dalla collezione MongoDB"""
    collection = db[collection_name]
    data = list(collection.find().sort('Data', pymongo.ASCENDING))
    
    if not data:
        return pd.DataFrame()

    df = pd.DataFrame(data)
    df['Data'] = pd.to_datetime(df['Data'])
    df.set_index('Data', inplace=True)
    return df[['Apertura', 'Massimo', 'Minimo', 'Chiusura', 'Volume']]

def find_pivots(series, window=WINDOW_SIZE):
    """Trova i punti di pivot (supporti e resistenze)"""
    if len(series) < window:
        return pd.Series(dtype=float), pd.Series(dtype=float)

    min_idx = series.rolling(window=window, center=True).apply(lambda x: np.argmin(x) == (len(x)//2), raw=True)
    max_idx = series.rolling(window=window, center=True).apply(lambda x: np.argmax(x) == (len(x)//2), raw=True)

    supports = series[min_idx == 1].dropna()
    resistances = series[max_idx == 1].dropna()
    return supports, resistances

def calculate_support_resistance(df, 
                               min_distance=5.0, 
                               min_touches=10, 
                               max_levels=25,
                               window=20):
    """
    Calcola i livelli di supporto e resistenza con parametri configurabili
    :param min_distance: Distanza minima percentuale tra i livelli (es. 1.0 = 1%)
    :param min_touches: Numero minimo di tocchi per considerare un livello significativo
    :param max_levels: Numero massimo di livelli da restituire
    :param window: Finestra temporale per il calcolo della frequenza dei tocchi
    """
    closes = df['Chiusura']
    
    # 1. Trova tutti i potenziali livelli
    raw_supports, raw_resistances = find_pivots(closes)

    # 2. Funzione per processare i livelli
    def process_levels(levels, price_series):
        levels_df = pd.DataFrame({'price': levels})
        
        # Calcola frequenza dei tocchi
        levels_df['touches'] = levels_df['price'].apply(
            lambda x: price_series[
                (price_series > x * 0.995) & 
                (price_series < x * 1.005)
            ].count()
        )
        
        # Filtra per numero minimo di tocchi
        levels_df = levels_df[levels_df['touches'] >= min_touches]
        
        # Ordina per significatività (tocchi + vicinanza al prezzo corrente)
        current_price = price_series.iloc[-1]
        levels_df['score'] = levels_df['touches'] * np.exp(
            -np.abs(levels_df['price'] - current_price)/current_price
        )
        
        # Filtra e ordina
        levels_df = levels_df.sort_values('score', ascending=False)
        
        # Filtra per distanza minima
        filtered = []
        for price in levels_df['price'].sort_values():
            if not filtered or abs(price - filtered[-1])/filtered[-1] > min_distance/100:
                filtered.append(price)
        
        return filtered[:max_levels]

    # 3. Processa supporti e resistenze
    supports = process_levels(raw_supports, closes)
    resistances = process_levels(raw_resistances, closes)

    return {
        'supports': sorted(supports),
        'resistances': sorted(resistances, reverse=True),
        'last_close': closes.iloc[-1] if not closes.empty else None,
        'parameters': {
            'min_distance': min_distance,
            'min_touches': min_touches,
            'max_levels': max_levels,
            'window': window
        }
    }

def save_results(ticker, timeframe, results):
    """Salva i livelli di supporto e resistenza nel database 'analysis' organizzati per ticker e timeframe."""
    
    # ✅ Connetti al database 'analysis'
    analysis_db = client['analysis']
    
    # ✅ Accedi alla collezione con il nome del ticker
    collection = analysis_db[ticker]

    # ✅ Struttura del documento SR per ogni timeframe
    sr_data = {
        'timeframe': timeframe,
        'supports': results['supports'],
        'resistances': results['resistances'],
        'last_close': results['last_close'],
        'timestamp': datetime.now()
    }

    # ✅ Aggiorna il documento "SR" o crealo se non esiste
    collection.update_one(
        {'_id': 'SR'},  # ID fisso per il documento SR
        {'$set': {f'timeframes.{timeframe}': sr_data}},  # Organizza i dati per timeframe
        upsert=True  # Crea il documento se non esiste
    )

def process_ticker(ticker):
    """Elabora tutte le collezioni per il ticker"""

    # ✅ Recupera i parametri di configurazione da MongoDB
    config = get_support_resistance_config()

    collections = get_timeframe_collections(ticker)
    processed_collections = 0

    for col in collections:
        try:
            print(f"🔄 Elaborazione: {col}")
            timeframe = col.split('_')[1] if '_' in col else "unknown"

            # ✅ Recupera i dati
            df = fetch_data(col)
            if df.empty:
                print(f"⚠ Nessun dato disponibile per {col}, saltato.")
                continue

            # ✅ Calcola i livelli usando la configurazione recuperata
            results = calculate_support_resistance(
                df,
                min_distance=config["min_distance"],
                min_touches=config["min_touches"],
                max_levels=config["max_levels"],
                window=config["window"]
            )

            if results['last_close'] is None:
                print(f"⚠ Dati insufficienti per il calcolo di supporti/resistenze in {col}, saltato.")
                continue

            # ✅ Salva i risultati
            save_results(ticker, timeframe, results)
            processed_collections += 1

        except Exception as e:
            print(f"❌ Errore durante l'elaborazione di {col}: {str(e)}")

    return {
        "success": True,
        "message": f"✅ Elaborazione completata per {ticker}!",
        "ticker": ticker,
        "processed_collections": processed_collections,
        "total_collections": len(collections)
    }


    try:
        if len(sys.argv) != 2:
            raise ValueError("Errore: specificare un ticker come argomento")

        TICKER = sys.argv[1].upper()  # 🔹 Converte il ticker in maiuscolo
        result = process_ticker(TICKER)

        print(json.dumps(result))  # ✅ Output JSON unificato
        sys.exit(0 if result.get("success") else 1)

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Errore critico: {str(e)}"
        }))
        sys.exit(1)