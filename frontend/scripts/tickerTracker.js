async function fetchHistoricalTickersStatus() {
    try {
      const response = await fetch("http://localhost:5050/api/historical-tickers-status");
      const data = await response.json();
      return data.tickersStatus || [];
    } catch (error) {
      console.error("Error fetching historical ticker status:", error);
      return [];
    }
  }
  
  function createTableRow(tickerInfo) {
    const tr = document.createElement("tr");
  
    const oldest = new Date(tickerInfo.oldestDate);
    const latest = new Date(tickerInfo.latestDate);
    const timeframe = Math.floor((latest - oldest) / (1000 * 60 * 60 * 24));
  
    tr.innerHTML = `
      <td>${tickerInfo.ticker}</td>
      <td>${tickerInfo.oldestDate || "-"}</td>
      <td>${tickerInfo.latestDate || "-"}</td>
      <td>${isNaN(timeframe) ? "-" : timeframe}</td>
      <td>${tickerInfo.percentage}%</td>
    `;
  
    return tr;
  }
  
  async function refreshTickerData() {
    const tbody = document.getElementById("tickerTableBody");
    tbody.innerHTML = "";
  
    const tickers = await fetchHistoricalTickersStatus();
    document.getElementById("totalTickers").textContent = tickers.length;
  
    tickers.forEach(ticker => {
      const row = createTableRow(ticker);
      tbody.appendChild(row);
    });
  }
  
  // Call on page load
  document.addEventListener("DOMContentLoaded", () => {
    refreshTickerData();
  });