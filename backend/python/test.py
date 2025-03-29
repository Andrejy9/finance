from fetchers import alphaVantage
from fetchers import financialModelPrep

import os

ticker = "AAPL"


# 📌 Esegui il download dei dati per AAPL (Apple) con timeframe

dati =  alphaVantage.fetch_weekly_prices_and_save("AAPL")

#dati = financialModelPrep.fetch_historical_fundamentals(ticker);
print(dati)

# # 📌 Stampa solo i primi 5 risultati formattati
# if dati is not None:
#     print(dati.head())



