import os

class Settings:
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    DB_NAME = "finance"
    DB_NAME_HISTORICALDATA = "finance_historical"
    ALPHAVANTAGE_API = "RB13LRYJPP1X3N2H"
    ALPHAVANTAGE_API_1 = "K829J58MR42XXJDZ"
    
settings = Settings()