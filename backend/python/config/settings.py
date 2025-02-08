import os

class Settings:
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    DB_NAME = "financial_data"
    
settings = Settings()