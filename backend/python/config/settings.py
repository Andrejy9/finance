import os

class Settings:
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    DB_NAME = "finance"
    DB_NAME_HISTORICALDATA = "finance_historical"
    ALPHAVANTAGE_API = "Z5LNJRNRO7FSEZ9B"
    ALPHAVANTAGE_API_1 = "Z5LNJRNRO7FSEZ9B"
    FMP_API_KEY = "EwQ619E1ipgAvXNO7KbubN6RuyO0aKqO"
    DB_NAME_FUNDAMENTALS = "fundamentalsDB"
    
settings = Settings()