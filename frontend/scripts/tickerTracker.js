async function fetchStatusData() {
  try {
    const response = await fetch("http://localhost:5050/api/historical-tickers-status");
    const data = await response.json();
    return {
      tickers: data.tickersStatus || [],
      fundamentals: data.fundamentalsStatus || []
    };
  } catch (error) {
    console.error("Error fetching status data:", error);
    return { tickers: [], fundamentals: [] };
  }
}

function createTickerTableRow(tickerInfo) {
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

function createFundamentalsTableRows(fundamentalInfo) {
  const rows = [];

  const ticker = fundamentalInfo.ticker;
  const types = Object.entries(fundamentalInfo).filter(([key]) => key !== "ticker");

  types.forEach(([type, data]) => {
    const tr = document.createElement("tr");

    const statusColor = data.isRecent ? 'green' : 'red';
    const statusLabel = data.isRecent ? '✔️ Recent' : '⚠️ Outdated';

    tr.innerHTML = `
      <td>${ticker} - ${type}</td>      
      <td>${data.count ?? "-"}</td>
      <td>${data.oldestDate || "-"}</td>
      <td>${data.latestDate || "-"}</td>
      <td>${data.daysAgo ?? "-"}</td>
      <td style="color: ${statusColor}; font-weight: bold;">${statusLabel}</td>
    `;

    rows.push(tr);
  });

  return rows;
}

async function refreshStatusData() {
  const { tickers, fundamentals } = await fetchStatusData();

  // Update Ticker Table
  const tickerBody = document.getElementById("tickerTableBody");
  tickerBody.innerHTML = "";
  tickers.forEach(ticker => {
    const row = createTickerTableRow(ticker);
    tickerBody.appendChild(row);
  });
  document.getElementById("totalTickers").textContent = tickers.length;

  // Update Fundamentals Table
  const fundamentalsBody = document.getElementById("fundamentalsTableBody");
  fundamentalsBody.innerHTML = "";

  let rowCount = 0;
  fundamentals.forEach(fund => {
    const rows = createFundamentalsTableRows(fund);
    rows.forEach(row => {
      fundamentalsBody.appendChild(row);
      rowCount++;
    });
  });
  document.getElementById("totalFundamentals").textContent = rowCount;
}

// Call on page load
document.addEventListener("DOMContentLoaded", () => {
  refreshStatusData();
});