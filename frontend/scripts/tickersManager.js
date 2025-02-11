let savedTickers = [];

// ⚡️ Ottiene i ticker dal database in base alla categoria
async function updateTickerList() {
    const tickerContainer = document.getElementById("tickerContainer");

    try {
        const response = await fetch(`http://localhost:5050/api/tickers`);
        const data = await response.json();
        
        // Pulisci il container
        tickerContainer.innerHTML = '';

        // Crea elemento filtro se non esiste
        const filterInput = document.getElementById("tickerFilter");
        filterInput.onkeyup = () => filterTickers(data);

        // Itera sulle categorie
        for (const category in data) {
            if (data.hasOwnProperty(category)) {
                // Crea container categoria
                const categoryDiv = document.createElement("div");
                categoryDiv.className = "category";
                
                // Header categoria (clickabile)
                const header = document.createElement("div");
                header.className = "category-header";
                header.innerHTML = `
                    ${category}
                    <span class="toggle-icon">▼</span>
                `;
                
                // Lista ticker (nascosta per default)
                const tickerList = document.createElement("div");
                tickerList.className = "ticker-list";
                tickerList.style.display = "none";

                // Popola lista ticker
                data[category].forEach(ticker => {
                    const item = document.createElement("div");
                    item.className = "ticker-item";
                    item.innerHTML = `
                        <input type="checkbox" class="ticker-checkbox">
                        ${ticker["Company Name"] || ticker.symbol} (${ticker.symbol})
                    `;
                    tickerList.appendChild(item);
                });

                // Toggle visibilità
                header.addEventListener("click", () => {
                    const isVisible = tickerList.style.display !== "none";
                    tickerList.style.display = isVisible ? "none" : "block";
                    header.querySelector(".toggle-icon").textContent = isVisible ? "▶" : "▼";
                });

                categoryDiv.appendChild(header);
                categoryDiv.appendChild(tickerList);
                tickerContainer.appendChild(categoryDiv);
            }

            await populateSavedTickers();
            await renderSavedTickersList(); 

        }

    } catch (error) {
        console.error("Errore nel caricamento dei ticker:", error);
    }
}

// Funzione filtro
function filterTickers(data) {
    const filterText = document.getElementById("tickerFilter").value.toLowerCase();
    
    document.querySelectorAll(".category").forEach(categoryDiv => {
        const categoryName = categoryDiv.querySelector(".category-header").textContent.toLowerCase();
        let hasVisibleItems = false;

        categoryDiv.querySelectorAll(".ticker-item").forEach(item => {
            const text = item.textContent.toLowerCase();
            const isVisible = text.includes(filterText);
            item.style.display = isVisible ? "block" : "none";
            if (isVisible) hasVisibleItems = true;
        });

        // Mostra/nascondi intera categoria in base al filtro
        categoryDiv.style.display = hasVisibleItems || categoryName.includes(filterText) ? "block" : "none";
    });
}

// ⚡️ Recupera i ticker selezionati da #tickerContainer e li salva
function saveSelectedTickers() {
    const tickerContainer = document.getElementById("tickerContainer");

    if (!tickerContainer) {
        console.error("Elemento tickerContainer non trovato!");
        return;
    }

    // Trova tutti i checkbox selezionati
    const selectedCheckboxes = tickerContainer.querySelectorAll("input[type='checkbox']:checked");

    // Estrae i valori dei ticker selezionati, rimuovendo eventuali duplicati
    const selectedTickers = Array.from(new Set(Array.from(selectedCheckboxes).map(checkbox => {
        // Ottieni il valore del ticker dal testo dell'elemento
        const tickerText = checkbox.closest(".ticker-item").textContent.trim();
        const tickerSymbolMatch = tickerText.match(/\(([A-Z0-9.-]+)\)/);
        return tickerSymbolMatch ? tickerSymbolMatch[1] : null;
    }))).filter(ticker => ticker !== null); // Filtra eventuali valori null


    // Verifica se ci sono ticker selezionati
    if (selectedTickers.length === 0) {
        alert("Nessun ticker selezionato!");
        return;
    }

    console.log("Tickers selezionati:", selectedTickers);
    sendSavedTickersToBackend(selectedTickers);
}

// Funzione di esempio per inviare i ticker al backend
async function sendSavedTickersToBackend(tickers) {
    try {
        const response = await fetch("http://localhost:5050/api/save-tickers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ tickers }),
        });

        if (!response.ok) {
            // Se la risposta non è ok, tenta di ottenere il messaggio di errore dal corpo della risposta
            const errorData = await response.json();
            throw new Error(errorData.message || "Errore durante il salvataggio dei ticker.");
        }

        const result = await response.json();
        
        // Estrarre i ticker effettivamente salvati dal backend
        const savedTickers = result.tickers || []; // Assicurati che sia sempre un array
        const count = savedTickers.length; // Numero di ticker salvati
        const savedTickersList = savedTickers.map(t => t.symbol).join(", "); // Lista formattata
        
        await populateSavedTickers();
        await renderSavedTickersList();

        console.log(`✅ Tickers salvati con successo (${count}): ${savedTickersList}`);
        alert(`✅ ${count} ticker salvati con successo: ${savedTickersList}`);

    } catch (error) {
        console.error("❌ Errore durante il salvataggio dei ticker:", error);
        alert(`❌ Errore durante il salvataggio dei ticker: ${error.message}`);
    }
}

// ✅ Funzione per recuperare i ticker salvati dal backend
async function fetchSavedTickers() {
    try {
        const response = await fetch("http://localhost:5050/api/saved-tickers");
        const data = await response.json();
        return data.tickers || [];
    } catch (error) {
        console.error("Errore nel recupero dei ticker salvati:", error);
        return [];
    }
}

// ✅ Funzione per popolare i checkbox selezionati
async function populateSavedTickers() {
    const savedTickers = await fetchSavedTickers();
    
    document.querySelectorAll(".ticker-item").forEach(item => {
        const tickerText = item.textContent.trim();
        const tickerSymbolMatch = tickerText.match(/\(([A-Z]+)\)/);
        if (tickerSymbolMatch) {
            const checkbox = item.querySelector(".ticker-checkbox");
            checkbox.checked = savedTickers.includes(tickerSymbolMatch[1]);
        }
    });
}

// Funzione per visualizzare i ticker salvati
// Aggiungi questa variabile globale
let selectedTickers = new Set();

async function renderSavedTickersList() {
    const savedTickersList = document.getElementById("savedTickersList");
    const savedTickers = await fetchSavedTickers();

    savedTickersList.innerHTML = ""; // Pulisci la lista

    savedTickers.forEach(ticker => {
        const listItem = document.createElement("li");

        // Contenitore principale
        const tickerContainer = document.createElement("div");
        tickerContainer.className = "ticker-container";
        if (selectedTickers.has(ticker.symbol)) {
            tickerContainer.classList.add("selected");
        }

        // Checkbox di selezione
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selectedTickers.has(ticker.symbol);
        checkbox.onchange = () => toggleTickerSelection(ticker.symbol, tickerContainer);

        // Testo del ticker
        const tickerText = document.createElement("span");
        tickerText.className = "ticker-text";
        tickerText.textContent = ticker.symbol;
        if (ticker["Company Name"]) {
            tickerText.textContent += ` - ${ticker["Company Name"]}`;
        }

        // Bottone espansione "+"
        const expandBtn = document.createElement("button");
        expandBtn.className = "expand-ticker-btn";
        expandBtn.textContent = "+";
        expandBtn.onclick = (e) => {
            e.stopPropagation();
            toggleDetails(detailsDiv, expandBtn);
        };

        // Bottone rimozione "×"
        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-ticker-btn";
        removeBtn.textContent = "×";
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeSavedTicker(ticker.symbol);
        };

        // Contenitore dettagli nascosto
        const detailsDiv = document.createElement("div");
        detailsDiv.className = "ticker-details";
        detailsDiv.style.display = "none";

        // Popola i dettagli (come prima)
        for (const key in ticker) {
            if (key !== "symbol" && key !== "Company Name" && key !== "_id") {
                const detailItem = document.createElement("p");
                const keySpan = document.createElement("span");
                keySpan.textContent = `${key}: `;
                keySpan.classList.add("detail-key");
                const valueSpan = document.createElement("span");
                valueSpan.textContent = ticker[key];
                valueSpan.classList.add("detail-value");
                detailItem.appendChild(keySpan);
                detailItem.appendChild(valueSpan);
                detailsDiv.appendChild(detailItem);
            }
        }

        // Struttura della lista
        tickerContainer.appendChild(checkbox);
        tickerContainer.appendChild(expandBtn);
        tickerContainer.appendChild(tickerText);
        tickerContainer.appendChild(removeBtn);
        listItem.appendChild(tickerContainer);
        listItem.appendChild(detailsDiv);
        savedTickersList.appendChild(listItem);
    });
}

function toggleTickerSelection(symbol, container) {
    if (selectedTickers.has(symbol)) {
        selectedTickers.delete(symbol);
        container.classList.remove("selected");
    } else {
        selectedTickers.add(symbol);
        container.classList.add("selected");
    }
}

function toggleDetails(detailsDiv, btn) {
    if (detailsDiv.style.display === "none") {
        detailsDiv.style.display = "block";
        btn.textContent = "−";
    } else {
        detailsDiv.style.display = "none";
        btn.textContent = "+";
    }
}

// Funzione per rimuovere un ticker
async function removeSavedTicker(tickerSymbol) {
    try {
        const response = await fetch("http://localhost:5050/api/delete-ticker", { // ✅ URL senza parametro nell'endpoint
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ symbol: tickerSymbol }), // ✅ Passa il simbolo nel corpo della richiesta
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Errore nella rimozione");
        }

        // Riaggiorna la lista
        await renderSavedTickersList();
        console.log(`Ticker ${tickerSymbol} rimosso con successo`);
    } catch (error) {
        console.error("Errore nella rimozione:", error);
        alert(`Errore: ${error.message}`);
    }
}

// Variabile globale per mantenere i dati originali
let allTickersData = {};
let currentCategory = 'all';

async function updateTickerList() {
    try {
        const response = await fetch(`http://localhost:5050/api/tickers`);
        allTickersData = await response.json();
        
        // Popola il menù a tendina delle categorie
        const categorySelect = document.getElementById("category");
        categorySelect.innerHTML = '<option value="all">Tutte le categorie</option>';
        
        Object.keys(allTickersData).forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });

        applyFilters();

    } catch (error) {
        console.error("Errore nel caricamento dei ticker:", error);
    }
}

function applyFilters() {
    const filterText = document.getElementById("tickerFilter").value.toLowerCase();
    const selectedCategory = document.getElementById("category").value;
    
    const tickerContainer = document.getElementById("tickerContainer");
    tickerContainer.innerHTML = '';

    // Filtra le categorie
    Object.keys(allTickersData).forEach(category => {
        if (selectedCategory !== 'all' && category !== selectedCategory) return;

        const categoryLower = category.toLowerCase();
        const tickers = allTickersData[category];
        
        // Filtra i ticker nella categoria
        const filteredTickers = tickers.filter(ticker => {
            const symbolMatch = ticker.symbol.toLowerCase().includes(filterText);
            const nameMatch = ticker["Company Name"]?.toLowerCase().includes(filterText);
            return symbolMatch || nameMatch;
        });

        if (filteredTickers.length > 0 || categoryLower.includes(filterText)) {
            createCategorySection(category, filteredTickers);
        }
    });
}

function createCategorySection(category, tickers) {
    const tickerContainer = document.getElementById("tickerContainer");
    
    const categoryDiv = document.createElement("div");
    categoryDiv.className = "category";
    
    const header = document.createElement("div");
    header.className = "category-header";
    header.innerHTML = `
        ${category}
        <span class="toggle-icon">▼</span>
    `;

    const tickerList = document.createElement("div");
    tickerList.className = "ticker-list";
    tickerList.style.display = "none";

    tickers.forEach(ticker => {
        const item = document.createElement("div");
        item.className = "ticker-item";
        item.innerHTML = `
            <input type="checkbox" class="ticker-checkbox">
            ${ticker["Company Name"] || ticker.symbol} (${ticker.symbol})
        `;
        tickerList.appendChild(item);
    });

    header.addEventListener("click", () => {
        const isVisible = tickerList.style.display !== "none";
        tickerList.style.display = isVisible ? "none" : "block";
        header.querySelector(".toggle-icon").textContent = isVisible ? "▶" : "▼";
    });

    categoryDiv.appendChild(header);
    categoryDiv.appendChild(tickerList);
    tickerContainer.appendChild(categoryDiv);
}

document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname.endsWith("tickersManager.html")) {
        const toggleBtn = document.getElementById("toggleTickerBtn");
        const tickerContainer = document.getElementById("tickerContainer");

        if (toggleBtn && tickerContainer) {
            toggleBtn.addEventListener("click", function () {
                tickerContainer.classList.toggle("hidden");
                this.textContent = tickerContainer.classList.contains("hidden") ? "+" : "−";
            });
        }
    }
});



document.addEventListener('DOMContentLoaded', async () => {
    if (window.location.pathname.endsWith("tickersManager.html") || window.location.pathname === "/") {
        await updateTickerList();
        await populateSavedTickers();
        await renderSavedTickersList(); // Aggiungi questa linea
    }
});