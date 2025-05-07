import os

class Settings:
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    DB_NAME = "finance"
    DB_NAME_HISTORICALDATA = "finance_historical"
    ALPHAVANTAGE_API = "YX729VXIS0EY0SHW"
    ALPHAVANTAGE_API_1 = "YX729VXIS0EY0SHW"
    FMP_API_KEY = "EwQ619E1ipgAvXNO7KbubN6RuyO0aKqO"
    DB_NAME_FUNDAMENTALS = "fundamentalsDB"
    DB_NAME_WEEKLY_TICKERS = "weeklyPrices"
    
settings = Settings()