from fetchers import alphaVantage
from periodic.main import PeriodicDataFetcher

fetcher = PeriodicDataFetcher()
fetcher.fetch_all_historical_data()