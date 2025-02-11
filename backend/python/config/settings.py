import os

class Settings:
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    DB_NAME = "finance"
    
settings = Settings()