from fetchers import alphaVantage
import os


# 📌 Esegui il download dei dati per AAPL (Apple) con timeframe

dati =  alphaVantage.fetch_alpha_vantage_full_history("TSLA", interval="60min")

# 📌 Stampa solo i primi 5 risultati formattati
if dati is not None:
    print(dati.head())
