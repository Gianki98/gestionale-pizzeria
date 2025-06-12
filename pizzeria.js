// Definizione dello stato dell'applicazione
const appState = {
  menu: {
    categories: [
      { id: "antipasti", name: "Antipasti" },
      { id: "mezze-familiari", name: "1/2 Familiari" },
      { id: "pizze-speciali", name: "Pizze Speciali" },
      { id: "pizze-classiche", name: "Pizze Classiche" },
      { id: "pizze-create", name: "Pizze Create" },
      { id: "schiacciate", name: "Schiacciate" },
      { id: "bevande", name: "Bevande" },
    ],
    items: [],
  },
  tables: [],
  takeaways: [],
  deliveries: [], // Array per memorizzare gli ordini a domicilio
  riders: [
    // Array dei rider disponibili
    { id: 1, name: "Gigetto", active: true },
    { id: 2, name: "Riccardo", active: true },
    { id: 3, name: "Giordi", active: true },
  ],
  currentOrderId: null,
  currentOrderType: null, // 'table' o 'takeaway'
  currentDeliveryId: null, // ID del domicilio attualmente selezionato
  settings: {
    restaurantName: "Pizzeria Ximenes",
    coverCharge: 1.0,
    defaultDeliveryFee: 0.0,
  },
  ingredients: [
    { id: "acciughe", name: "Acciughe", price: 1.0 },
    { id: "bacon", name: "Bacon", price: 2.0 },
    { id: "caciocavallo", name: "Caciocavallo", price: 1.0 },
    { id: "carciofi", name: "Carciofi", price: 1.0 },
    { id: "cipolla", name: "Cipolla", price: 1.0 },
    { id: "emmental", name: "Emmental", price: 1.0 },
    { id: "friarielli", name: "Friarielli", price: 2.0 },
    { id: "funghi", name: "Funghi", price: 1.0 },
    { id: "gorgonzola", name: "Gorgonzola", price: 1.0 },
    { id: "grana", name: "Scaglie di Grana", price: 1.0 },
    {
      id: "granella-di-pistacchio",
      name: "Granella di Pistacchio",
      price: 0.0,
    },
    { id: "melanzane", name: "Melanzane", price: 1.0 },
    { id: "mollica", name: "Mollica", price: 0.0 },
    { id: "mortadella", name: "Mortadella", price: 2.0 },
    { id: "mozzarella", name: "Mozzarella", price: 1.0 },
    { id: "mozzarella-di-bufala", name: "Mozzarella di Bufala", price: 4.0 },
    { id: "olio", name: "Olio", price: 0.0 },
    { id: "olive", name: "Olive", price: 1.0 },
    { id: "origano", name: "Origano", price: 0.0 },
    { id: "patatine-fritte", name: "Patatine fritte", price: 1.0 },
    { id: "peperoni", name: "Peperoni", price: 1.0 },
    { id: "pesto", name: "Pesto", price: 1.0 },
    { id: "pesto-di-pistacchio", name: "Pesto di Pistacchio", price: 2.0 },
    { id: "pollo", name: "Pollo a cubetti", price: 2.0 },
    { id: "pomodoro", name: "Pomodoro", price: 0.0 },
    { id: "pomodoro-a-fette", name: "Pomodoro a fette", price: 1.0 },
    { id: "pomodorini", name: "Pomodorini", price: 1.0 },
    { id: "prosciutto-cotto", name: "Prosciutto", price: 1.0 },
    { id: "prosciutto-crudo", name: "Prosciutto Crudo", price: 2.0 },
    { id: "rucola", name: "Rucola", price: 1.0 },
    { id: "salame-dolce", name: "Salame Dolce", price: 2.0 },
    { id: "salame-piccante", name: "Salame Piccante", price: 1.0 },
    { id: "salsa-bbq", name: "Salsa BBQ", price: 0.0 },
    { id: "salsa-rosa", name: "Salsa Rosa", price: 0.0 },
    { id: "salsiccia", name: "Salsiccia", price: 2.0 },
    { id: "spinaci", name: "Spinaci", price: 1.0 },
    { id: "stracciatella", name: "Stracciatella", price: 2.0 },
    { id: "tonno", name: "Tonno", price: 2.0 },
    { id: "wurstel", name: "Wurstel", price: 1.0 },
  ],
};
// Inizializza l'API client (assicurati che api_client.js sia caricato prima di pizzeria.js nell'HTML)
//let api;
/*if (typeof PizzeriaAPI !== "undefined") {
  api = new PizzeriaAPI();
}*/
// Funzione di inizializzazione
async function initializeApp() {
  await loadData(); // Ora è asincrona
  cleanupCorruptedOrders();
  loadMenuItems();
  renderTabs();
  renderTables();
  renderTakeaways();
  renderMenuEditor();
  setupEventListeners();

  initializeDeliveryEvents();

  renderDeliveries();
  updateUI();

  // AGGIORNATO: Migliora la gestione WebSocket
  if (api && api.socket) {
    console.log("WebSocket connesso, aggiornamenti real-time attivi");

    // Configura i listener WebSocket per sincronizzazione
    setupWebSocketListeners();

    // Dentro initializeApp, dopo setupWebSocketListeners();
    // Attendi che il socket sia completamente connesso prima di sincronizzare
    if (api.socket.connected) {
      setTimeout(() => {
        syncExistingOrders();
      }, 500);
    } else {
      api.socket.once("connect", () => {
        setTimeout(() => {
          syncExistingOrders();
        }, 500);
      });
    }

    // Definisci la funzione globale per aggiornare l'interfaccia
    window.aggiornaListaOrdini = async function () {
      console.log("Aggiornamento lista ordini...");
      await loadData();
      renderTables();
      renderTakeaways();
    };
  }
}

function setupWebSocketListeners() {
  if (!api || !api.socket) return;

  const socket = api.socket;

  console.log("📡 Setup WebSocket listeners...");

  // Aggiungi un listener per verificare la connessione
  socket.on("connect", () => {
    console.log("✅ WebSocket connesso!");
  });

  socket.on("disconnect", () => {
    console.log("❌ WebSocket disconnesso!");
  });

  // Ascolta gli eventi dal SERVER (non dal client)
  socket.on("ordine_aggiunto", (ordineData) => {
    console.log("🔔 Nuovo ordine da altro dispositivo:", ordineData);
    mostraNotifica(`Nuovo ordine: ${ordineData.tavolo}`, "info");

    // Ricarica i dati e aggiorna l'interfaccia
    window.aggiornaListaOrdini();
  });

  socket.on("ordine_aggiornato", (ordineData) => {
    console.log("🔔 Ordine modificato da altro dispositivo:", ordineData);

    // Trova l'ordine locale usando il type dal ordineData
    let tableOrTakeaway = null;

    if (ordineData.type === "table") {
      tableOrTakeaway = appState.tables.find((t) => t.id === ordineData.id);
    } else {
      tableOrTakeaway = appState.takeaways.find((t) => t.id === ordineData.id);
    }

    if (tableOrTakeaway) {
      // Aggiorna TUTTI i dati dell'ordine
      tableOrTakeaway.order.items = ordineData.items || [];
      tableOrTakeaway.order.covers = ordineData.covers || 0;
      if (ordineData.stato) {
        tableOrTakeaway.status = ordineData.stato;
      }

      saveData();

      // Se stiamo visualizzando questo ordine, aggiorna la vista
      if (ordineData.id === appState.currentOrderId) {
        renderOrderDetails();
        console.log("✅ Vista ordine corrente aggiornata");
      }

      // Aggiorna sempre le liste
      if (ordineData.type === "table") {
        renderTables();
      } else {
        renderTakeaways();
      }

      console.log("✅ Ordine aggiornato localmente");
    } else {
      console.log("⚠️ Ordine non trovato localmente:", ordineData.id);
    }

    mostraNotifica(`Ordine modificato: ${ordineData.tavolo}`, "warning");
  });

  socket.on("ordine_rimosso", (ordineId) => {
    console.log("🔔 Ordine eliminato da altro dispositivo:", ordineId);
    mostraNotifica("Un ordine è stato eliminato", "info");
    window.aggiornaListaOrdini();
  });

  socket.on("tavolo_sincronizzato", (tavoloData) => {
    console.log("🔔 Tavolo sincronizzato:", tavoloData);
    window.aggiornaListaOrdini();
  });
  socket.on("nuovo_tavolo_asporto", (data) => {
    console.log("🆕 Nuovo tavolo/asporto ricevuto:", data);
    console.log("Tipo ricevuto:", data.type);
    console.log("Dati ricevuti:", data.data);

    if (data.type === "takeaway") {
      // Verifica se non esiste già
      const exists = appState.takeaways.some((t) => t.id === data.data.id);
      if (!exists) {
        appState.takeaways.push(data.data);
        saveData();
        renderTakeaways();
        mostraNotifica(`Nuovo asporto creato: #${data.data.number}`, "info");
      }
    } else if (data.type === "table") {
      // Simile per i tavoli
      const exists = appState.tables.some((t) => t.id === data.data.id);
      if (!exists) {
        appState.tables.push(data.data);
        saveData();
        renderTables();
        mostraNotifica(`Nuovo tavolo creato: ${data.data.number}`, "info");
      }
    }
  });
  // Aggiungi questo listener per la chiusura ordini delivery
  socket.on("delivery_chiuso", (data) => {
    console.log("🔒 Delivery chiuso ricevuto:", data);

    const delivery = appState.deliveries.find((d) => d.id === data.id);
    if (delivery) {
      delivery.status = data.status;
      delivery.closedAt = data.closedAt;

      saveData();
      renderDeliveries();

      if (appState.currentOrderId === data.id) {
        showMainView();
      }

      mostraNotifica("Ordine domicilio completato", "info");
    }
  });
  // NUOVO: Aggiungi listener per sync_all_orders dal server
  socket.on("sync_all_orders_broadcast", (data) => {
    console.log("🔄 Sincronizzazione completa ricevuta:", data);

    // Controlla timestamp per evitare sovrascritture errate
    const localTimestamp = localStorage.getItem("pizzeria_last_update");
    const incomingTimestamp = data.timestamp;

    // Accetta i dati solo se sono più recenti o se non abbiamo dati locali
    if (
      !localTimestamp ||
      !incomingTimestamp ||
      new Date(incomingTimestamp) > new Date(localTimestamp)
    ) {
      console.log("📥 Accetto dati dal server (più recenti)");

      // Aggiorna tavoli
      if (data.tables) {
        appState.tables = data.tables;
        renderTables();
      }

      // Aggiorna asporti
      if (data.takeaways) {
        appState.takeaways = data.takeaways;
        renderTakeaways();
      }

      // NUOVO: Aggiorna domicili
      if (data.deliveries) {
        appState.deliveries = data.deliveries;
        renderDeliveries();
      }

      // NUOVO: Aggiorna rider
      if (data.riders) {
        appState.riders = data.riders;
      }

      // Aggiorna timestamp
      if (incomingTimestamp) {
        localStorage.setItem("pizzeria_last_update", incomingTimestamp);
      }

      saveData();
    } else {
      console.log("📤 Ignoro dati dal server (ho dati più recenti)");
    }
  });
  // NUOVO: Listener per ricevere i dati quando li richiediamo
  socket.on("sync_response", (data) => {
    console.log("📥 Risposta sincronizzazione ricevuta:", {
      hasTimestamp: !!data.timestamp,
      tablesCount: data.tables?.length || 0,
      takeawaysCount: data.takeaways?.length || 0,
      deliveriesCount: data.deliveries?.length || 0,
      forceUpdate: data.forceUpdate,
    });

    // Se il server dice di forzare l'aggiornamento, accetta tutto
    if (data.forceUpdate || !localStorage.getItem("pizzeria_last_update")) {
      console.log("📥 Accetto tutti i dati dal server");
      acceptIncomingData(data);
      return;
    }

    // Altrimenti confronta i timestamp
    const localTimestamp = localStorage.getItem("pizzeria_last_update");
    const serverTimestamp = data.timestamp;

    if (
      !serverTimestamp ||
      new Date(serverTimestamp) > new Date(localTimestamp)
    ) {
      console.log("📥 Server ha dati più recenti, li accetto");
      acceptIncomingData(data);
    } else {
      console.log("📤 Ho dati più recenti, li invio al server");
      // Invia i tuoi dati al server
      api.socket.emit("sync_all_orders", {
        tables: appState.tables,
        takeaways: appState.takeaways,
        deliveries: appState.deliveries,
        riders: appState.riders,
        timestamp: localTimestamp,
      });
    }
  });

  // Aggiungi questa nuova funzione dopo sync_response:
  function acceptIncomingData(data) {
    // Accetta tutti i dati dal server
    appState.tables = data.tables || [];
    appState.takeaways = data.takeaways || [];
    appState.deliveries = data.deliveries || [];

    if (data.riders && data.riders.length > 0) {
      appState.riders = data.riders;
    }

    // Aggiorna timestamp
    const newTimestamp = data.timestamp || new Date().toISOString();
    localStorage.setItem("pizzeria_last_update", newTimestamp);

    // Salva in localStorage
    localStorage.setItem("pizzeria_tables", JSON.stringify(appState.tables));
    localStorage.setItem(
      "pizzeria_takeaways",
      JSON.stringify(appState.takeaways)
    );
    localStorage.setItem(
      "pizzeria_deliveries",
      JSON.stringify(appState.deliveries)
    );
    localStorage.setItem("pizzeria_riders", JSON.stringify(appState.riders));

    // Renderizza tutto
    renderTables();
    renderTakeaways();
    renderDeliveries();

    console.log("✅ Dati accettati e interfaccia aggiornata");
  }
  // Aggiungi questo listener dove hai gli altri (cerca api.socket.on)
  socket.on("delivery_aggiornato", (data) => {
    console.log("📦 Delivery aggiornato da altro dispositivo:", data);

    // Trova il delivery nell'array
    const deliveryIndex = appState.deliveries.findIndex(
      (d) => d.id === data.deliveryId
    );

    if (deliveryIndex !== -1) {
      // Aggiorna il delivery
      appState.deliveries[deliveryIndex] = data.delivery;

      // Re-renderizza solo se è il delivery attualmente visualizzato
      if (
        appState.currentOrderId === data.deliveryId &&
        appState.currentOrderType === "delivery"
      ) {
        renderOrderDetails();
      }

      // Aggiorna la lista delivery
      renderDeliveries();
      saveData();
    }
  });

  // Funzione helper per fare merge dei tavoli
  function mergeTables(localTables, serverTables) {
    const merged = [...localTables];

    serverTables.forEach((serverTable) => {
      const localTable = merged.find((t) => t.id === serverTable.id);

      if (!localTable) {
        // Tavolo nuovo dal server, aggiungilo
        merged.push(serverTable);
      } else if (serverTable.orders && serverTable.orders.length > 0) {
        // Se il server ha ordini per questo tavolo, usa la versione del server
        const index = merged.findIndex((t) => t.id === serverTable.id);
        merged[index] = serverTable;
      }
      // Altrimenti mantieni la versione locale
    });

    return merged;
  }

  // Funzione helper per fare merge degli ordini (asporto/delivery)
  function mergeOrders(localOrders = [], serverOrders = []) {
    // Gestisci i casi nulli/undefined
    if (!localOrders) localOrders = [];
    if (!serverOrders) serverOrders = [];

    console.log(
      "🔀 Merge orders - locale:",
      localOrders.length,
      "server:",
      serverOrders.length
    );

    // Se il server non ha ordini, mantieni quelli locali
    if (serverOrders.length === 0) {
      console.log("✅ Server vuoto, mantengo ordini locali");
      return localOrders;
    }

    // Se locale non ha ordini, prendi quelli del server
    if (localOrders.length === 0) {
      console.log("📥 Locale vuoto, prendo ordini server");
      return serverOrders;
    }

    // Altrimenti fai il merge normale
    const merged = [...localOrders];
    const localIds = new Set(localOrders.map((o) => o.id));

    serverOrders.forEach((serverOrder) => {
      if (!localIds.has(serverOrder.id)) {
        merged.push(serverOrder);
      }
    });

    return merged;
  }
  // Listener per chiusura ordini
  socket.on("ordine_chiuso", (data) => {
    console.log("🔒 Ordine chiuso ricevuto:", data);

    let tableOrTakeaway;
    if (data.type === "table") {
      tableOrTakeaway = appState.tables.find((t) => t.id === data.id);
    } else {
      tableOrTakeaway = appState.takeaways.find((t) => t.id === data.id);
    }

    if (tableOrTakeaway) {
      // Imposta lo stato a closed come nel tuo closeOrder
      tableOrTakeaway.status = "closed";
      tableOrTakeaway.order.closedAt = new Date().toISOString();

      saveData();

      // Se stiamo visualizzando questo ordine, torna alla home
      if (appState.currentOrderId === data.id) {
        showTablesView();
      }

      // Aggiorna le visualizzazioni
      renderTables();
      renderTakeaways();

      mostraNotifica(
        `Ordine ${data.type === "table" ? "tavolo" : "asporto"} chiuso`,
        "info"
      );
    }
  });
}

// Funzione per caricare i dati dal localStorage
async function loadData() {
  try {
    // Carica prima i dati locali come fallback
    const savedMenu = localStorage.getItem("pizzeria_menu");
    const savedSettings = localStorage.getItem("pizzeria_settings");
    const savedIngredients = localStorage.getItem("pizzeria_ingredients");

    if (savedMenu) {
      appState.menu = JSON.parse(savedMenu);
    }

    if (savedSettings) {
      appState.settings = JSON.parse(savedSettings);
    }

    if (savedIngredients) {
      appState.ingredients = JSON.parse(savedIngredients);
    }

    // Se l'API è disponibile, carica i dati dal server
    if (api) {
      try {
        // Carica gli ordini dal server (tavoli e asporto)
        const ordiniServer = await api.getOrdini();

        // Mappa gli ordini del server sui tavoli/asporto locali
        // Questo è un esempio, dovrai adattarlo alla struttura dei tuoi dati
        console.log("Ordini dal server:", ordiniServer);

        // Per ora manteniamo la compatibilità con localStorage per tavoli e asporto
        const savedTables = localStorage.getItem("pizzeria_tables");
        const savedTakeaways = localStorage.getItem("pizzeria_takeaways");

        if (savedTables) {
          appState.tables = JSON.parse(savedTables);
        }

        if (savedTakeaways) {
          appState.takeaways = JSON.parse(savedTakeaways);
        }
        // AGGIUNGI QUI IL CARICAMENTO DOMICILI E RIDER
        const savedDeliveries = localStorage.getItem("pizzeria_deliveries");
        const savedRiders = localStorage.getItem("pizzeria_riders");

        if (savedDeliveries) {
          appState.deliveries = JSON.parse(savedDeliveries);
        }

        if (savedRiders) {
          appState.riders = JSON.parse(savedRiders);
        }
      } catch (error) {
        console.error("Errore caricamento dati dal server:", error);
        // Usa i dati locali come fallback
      }
    }

    //  gli elementi della categoria "rosticceria" se esiste
    const validCategoryIds = appState.menu.categories.map((cat) => cat.id);
    appState.menu.items = appState.menu.items.filter((item) =>
      validCategoryIds.includes(item.categoryId)
    );
  } catch (error) {
    console.error("Errore nel caricamento dei dati:", error);
  }
}
// Funzione di ricerca nel menu
// Sostituisci completamente la funzione searchMenuItems
function searchMenuItems() {
  const searchTerm = document
    .getElementById("menuSearchInput")
    .value.toLowerCase()
    .trim();
  const activeCategory = document
    .querySelector("#editorCategoryTabs .category-tab.active")
    .getAttribute("data-category");

  // Se il campo di ricerca è vuoto, mostra tutti i prodotti della categoria attuale
  if (searchTerm === "") {
    document.getElementById("menuEditorList").innerHTML = "";
    renderMenuItemsForEditor(activeCategory);
    return;
  }

  const menuEditorList = document.getElementById("menuEditorList");
  menuEditorList.innerHTML = "";

  // Filtra gli items per il termine di ricerca
  let items;
  if (searchTerm) {
    // Cerca in tutte le categorie se c'è un termine di ricerca
    items = appState.menu.items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm) ||
        (item.description &&
          item.description.toLowerCase().includes(searchTerm))
    );

    // Ordina i risultati: prima quelli che iniziano con il termine di ricerca,
    // poi quelli che lo contengono altrove nel nome
    items.sort((a, b) => {
      const aNameStart = a.name.toLowerCase().startsWith(searchTerm) ? 0 : 1;
      const bNameStart = b.name.toLowerCase().startsWith(searchTerm) ? 0 : 1;

      if (aNameStart !== bNameStart) {
        return aNameStart - bNameStart;
      }

      return a.name.localeCompare(b.name);
    });
  } else {
    // Altrimenti filtra solo per la categoria corrente
    items = appState.menu.items.filter(
      (item) => item.categoryId === activeCategory
    );
  }

  if (items.length === 0) {
    menuEditorList.innerHTML =
      '<div class="text-center p-3">Nessun risultato trovato.</div>';
    return;
  }

  // Visualizza i risultati
  items.forEach((item) => {
    const categoryName =
      appState.menu.categories.find((c) => c.id === item.categoryId)?.name ||
      "Categoria sconosciuta";

    const editorItem = document.createElement("div");
    editorItem.className = "editor-item";
    editorItem.innerHTML = `
            <div class="editor-item-details">
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-category">Categoria: ${categoryName}</div>
                <div class="menu-item-price">€${formatPrice(item.price)}</div>
            </div>
            <div class="editor-item-actions">
                <button class="btn btn-sm btn-outline edit-item" data-id="${
                  item.id
                }">Modifica</button>
                <button class="btn btn-sm btn-danger delete-item" data-id="${
                  item.id
                }">Elimina</button>
            </div>
        `;

    menuEditorList.appendChild(editorItem);
  });

  // Aggiungi event listeners ai pulsanti
  document.querySelectorAll(".edit-item").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const itemId = button.getAttribute("data-id");
      const item = appState.menu.items.find((i) => i.id === itemId);
      if (item) {
        showEditItemModal(item);
      }
    });
  });

  document.querySelectorAll(".delete-item").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const itemId = button.getAttribute("data-id");
      if (confirm("Sei sicuro di voler eliminare questo prodotto?")) {
        appState.menu.items = appState.menu.items.filter(
          (i) => i.id !== itemId
        );
        saveData();
        searchMenuItems(); // Aggiorna i risultati della ricerca
      }
    });
  });
}
// Funzione per salvare i dati nel localStorage
// Sostituisci la funzione saveData() con questa versione
async function saveData() {
  try {
    // Aggiorna timestamp SEMPRE
    const timestamp = new Date().toISOString();
    localStorage.setItem("pizzeria_last_update", timestamp);

    // Salva in localStorage
    localStorage.setItem("pizzeria_menu", JSON.stringify(appState.menu));
    localStorage.setItem("pizzeria_tables", JSON.stringify(appState.tables));
    localStorage.setItem(
      "pizzeria_takeaways",
      JSON.stringify(appState.takeaways)
    );
    localStorage.setItem(
      "pizzeria_settings",
      JSON.stringify(appState.settings)
    );
    localStorage.setItem(
      "pizzeria_ingredients",
      JSON.stringify(appState.ingredients)
    );
    localStorage.setItem(
      "pizzeria_deliveries",
      JSON.stringify(appState.deliveries)
    );
    localStorage.setItem("pizzeria_riders", JSON.stringify(appState.riders));

    // SEMPRE sincronizza con il server quando c'è una modifica
    if (api && api.socket && api.socket.connected) {
      console.log("📤 Invio aggiornamenti al server...");

      api.socket.emit("sync_all_orders", {
        tables: appState.tables,
        takeaways: appState.takeaways,
        deliveries: appState.deliveries,
        riders: appState.riders,
        timestamp: timestamp,
      });
    }
  } catch (error) {
    console.error("Errore nel salvataggio dei dati:", error);
  }
}
// Aggiungi questa funzione per creare un ordine sul server
/*async function addItemToOrder(tableOrTakeaway, type) {
  if (!api) return;

  try {
    const orderData = {
      numero_ordine: `${type}-${tableOrTakeaway.id}-${Date.now()}`,
      tavolo:
        type === "table"
          ? `${tableOrTakeaway.prefix || ""} ${tableOrTakeaway.number}`
          : `Asporto #${tableOrTakeaway.number}`,
      articoli: tableOrTakeaway.order.items.map((item) => ({
        nome: item.name,
        prezzo: item.basePrice,
        quantita: item.quantity,
        note: item.notes || "",
      })),
      note: tableOrTakeaway.order.notes || "",
    };

    const result = await api.salvaOrdine(orderData);
    console.log("Ordine salvato sul server:", result);

    // Salva l'ID dell'ordine del server nell'oggetto locale
    tableOrTakeaway.serverOrderId = result.ordine.id;

    // NUOVO: Emetti evento WebSocket per sincronizzazione
    if (api.socket && api.socket.connected) {
      api.socket.emit("nuovo_ordine", result.ordine);
      console.log("📡 Evento nuovo_ordine inviato via WebSocket");
    }

    return result;
  } catch (error) {
    console.error("Errore creazione ordine sul server:", error);
  }
}*/

// Caricamento iniziale dei prodotti dal menu fornito
function loadMenuItems() {
  // Se ci sono già prodotti nel menu, non caricare quelli predefiniti
  if (appState.menu.items.length > 0) {
    return;
  }

  // Lista degli antipasti
  appState.menu.items.push({
    id: generateId(),
    categoryId: "antipasti",
    name: "Patatine fritte",
    price: 3.0,
    description: "",
    variants: [
      { name: "Piccole", price: 2.0 },
      { name: "Medie", price: 3.0 },
      { name: "Grandi", price: 5.0 },
    ],
    defaultVariant: "Medie",
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "antipasti",
    name: "Misto caldo",
    price: 7.0,
    description: "Patatine fritte con frittura mista secondo disponibilità",
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "antipasti",
    name: "Sfincionello",
    price: 7.0,
    description: "",
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "antipasti",
    name: "Bruschetta",
    price: 7.0,
    description: "Pizza condita con pomodoro a pezzi",
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "antipasti",
    name: "Bomba atomica",
    price: 15.0,
    description:
      "Patatine fritte, panelle, crocchè di patate, anelli di cipolla, arancinette, crocchette di pollo e mozzarelline fritte",
  });

  // Lista delle pizze speciali
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-speciali",
    name: "Cu ti sta tuccannu'",
    price: 7.0,
    description: "Pomodoro, mozzarella fiordilatte, funghi freschi, salsiccia",
    ingredients: ["pomodoro", "mozzarella", "funghi", "salsiccia"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-speciali",
    name: "Chicken BBQ",
    price: 8.0,
    description: "Mozzarella fiordilatte, pollo a cubetti, bacon, salsa BBQ",
    ingredients: ["mozzarella", "pollo", "bacon", "salsa-bbq"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-speciali",
    name: "Messicana",
    price: 8.0,
    description:
      "Pomodoro, mozzarella fiordilatte, carciofi, melanzane, pomodoro a fette, olive",
    ingredients: [
      "pomodoro",
      "mozzarella",
      "carciofi",
      "melanzane",
      "pomodoro-a-fette",
      "olive",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-speciali",
    name: "Sfilatino",
    price: 8.0,
    description: "Mozzarella, prosciutto, salame piccante, emmental",
    ingredients: [
      "mozzarella",
      "prosciutto-cotto",
      "salame-piccante",
      "emmental",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-speciali",
    name: "Un mi tuccari chiu'",
    price: 8.0,
    description:
      "Pomodoro, mozzarella fiordilatte, carciofi, funghi freschi, salsiccia",
    ingredients: ["pomodoro", "mozzarella", "carciofi", "funghi", "salsiccia"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-speciali",
    name: "Stracciatella",
    price: 9.0,
    description:
      "Mozzarella fiordilatte, prosciutto, emmental, salame piccante, bacon, con al centro stracciatella",
    ingredients: [
      "mozzarella",
      "prosciutto-cotto",
      "emmental",
      "salame-piccante",
      "bacon",
      "stracciatella",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-speciali",
    name: "Quadrangola",
    price: 9.0,
    description:
      "Pomodoro, mozzarella, prosciutto, salsiccia, emmental, con bordi ripieni di mozzarella e prosciutto",
    ingredients: [
      "pomodoro",
      "mozzarella",
      "prosciutto-cotto",
      "salsiccia",
      "emmental",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-speciali",
    name: "Greca",
    price: 9.0,
    description:
      "Pomodoro, mozzarella fiordilatte, prosciutto, gorgonzola, melanzane, salame piccante, caciocavallo",
    ingredients: [
      "pomodoro",
      "mozzarella",
      "prosciutto-cotto",
      "gorgonzola",
      "melanzane",
      "salame-piccante",
      "caciocavallo",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-speciali",
    name: "Ai salumi",
    price: 9.0,
    description:
      "Pomodoro, mozzarella fiordilatte, salame dolce, bacon, emmental",
    ingredients: [
      "pomodoro",
      "mozzarella",
      "salame-dolce",
      "bacon",
      "emmental",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-speciali",
    name: "Colapesce",
    price: 9.0,
    description:
      "Mozzarella fiordilatte, Emmental, Gorgonzola, prosciutto, Salame piccante, cipolla",
    ingredients: [
      "mozzarella",
      "emmental",
      "gorgonzola",
      "prosciutto-cotto",
      "salame-piccante",
      "cipolla",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-speciali",
    name: "U' ziu Vicè",
    price: 9.0,
    description:
      "Mozzarella fiordilatte, bacon, salsiccia, patatine fritte, salsa BBQ",
    ingredients: [
      "mozzarella",
      "bacon",
      "salsiccia",
      "patatine-fritte",
      "salsa-bbq",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-speciali",
    name: "Italia",
    price: 10.0,
    description: "Pomodoro, pesto, mozzarella di Bufala, pomodorini",
    ingredients: ["pomodoro", "pesto", "mozzarella-di-bufala", "pomodorini"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-speciali",
    name: "Friarielli",
    price: 10.0,
    description: "Mozzarella di Bufala, Friarielli, salsiccia",
    ingredients: ["mozzarella-di-bufala", "friarielli", "salsiccia"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-speciali",
    name: "4 Canti",
    price: 10.0,
    description:
      "1/4 quattro formaggi, 1/4 capricciosa, 1/4 romana con salame piccante, 1/4 mozzarella fiordilatte, salsiccia e cipolla",
    ingredients: [],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-speciali",
    name: "Philip Morris",
    price: 10.0,
    description:
      "Pomodoro, mozzarella fiordilatte, pesto, crudo, stracciatella e scaglie di Grana",
    ingredients: [
      "pomodoro",
      "mozzarella",
      "pesto",
      "prosciutto-crudo",
      "stracciatella",
      "grana",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-speciali",
    name: "Covaccino",
    price: 12.0,
    description:
      "Tutti i condimenti vengono serviti all'uscita della pizza. Mozzarella di bufala, prosciutto crudo, pomodorini, rucola, scaglie di Grana",
    ingredients: [
      "mozzarella-di-bufala",
      "prosciutto-crudo",
      "pomodorini",
      "rucola",
      "grana",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-speciali",
    name: "Pistacchiosa",
    price: 12.0,
    description:
      "Pesto di pistacchio, mozzarella di bufala, mortadella e granella di pistacchio",
    ingredients: [
      "pesto-di-pistacchio",
      "mozzarella-di-bufala",
      "mortadella",
      "granella-di-pistacchio",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-speciali",
    name: "Original",
    price: 13.0,
    description:
      "Pomodoro, mozzarella di bufala, prosciutto crudo, rucola, pomodorini, scaglie di Grana",
    ingredients: [
      "pomodoro",
      "mozzarella-di-bufala",
      "prosciutto-crudo",
      "rucola",
      "pomodorini",
      "grana",
    ],
  });

  // Lista delle pizze classiche
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Margherita",
    price: 4.0,
    description: "Pomodoro e mozzarella fiordilatte",
    ingredients: ["pomodoro", "mozzarella"],
    variants: [
      { name: "Baby", price: 4.0 },
      { name: "", price: 4.0 },
    ],
    defaultVariant: "",
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Pomodoro",
    price: 4.0,
    description: "Pomodoro",
    ingredients: ["pomodoro"],
    variants: [
      { name: "Baby", price: 4.0 },
      { name: "", price: 4.0 },
    ],
    defaultVariant: "",
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Biancaneve",
    price: 4.5,
    description: "Mozzarella fiordilatte",
    ingredients: ["mozzarella"],
    variants: [
      { name: "Baby", price: 4.5 },
      { name: "", price: 4.5 },
    ],
    defaultVariant: "",
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Romana",
    price: 4.5,
    description: "Pomodoro, mozzarella fiordilatte e prosciutto",
    ingredients: ["pomodoro", "mozzarella", "prosciutto-cotto"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Diavola",
    price: 4.5,
    description: "Pomodoro, mozzarella fiordilatte e salame piccante",
    ingredients: ["pomodoro", "mozzarella", "salame-piccante"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Marinara",
    price: 4.5,
    description: "Pomodoro, acciughe, origano e olio",
    ingredients: ["pomodoro", "acciughe", "origano", "olio"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Napoli",
    price: 4.5,
    description: "Pomodoro, mozzarella fiordilatte, acciughe",
    ingredients: ["pomodoro", "mozzarella", "acciughe"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Calzone",
    price: 4.5,
    description:
      "Pizza ripiena di pomodoro, mozzarella fiordilatte e prosciutto cotto",
    ingredients: ["pomodoro", "mozzarella", "prosciutto-cotto"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Patatosa",
    price: 5.0,
    description: "Pomodoro, mozzarella fiordilatte, patatine fritte",
    ingredients: ["pomodoro", "mozzarella", "patatine-fritte"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Parmigiana",
    price: 5.0,
    description:
      "Pomodoro, mozzarella fiordilatte, melanzane, scaglie di Grana",
    ingredients: ["pomodoro", "mozzarella", "melanzane", "grana"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "4 Formaggi",
    price: 5.0,
    description: "Mozzarella fiordilatte, gorgonzola, emmental, formaggi vari",
    ingredients: ["mozzarella", "gorgonzola", "emmental", "formaggi-vari"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "4 Gusti",
    price: 5.0,
    description: "Pomodoro, mozzarella fiordilatte, prosciutto, carciofi",
    ingredients: ["pomodoro", "mozzarella", "prosciutto-cotto", "carciofi"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Nutella",
    price: 5.0,
    description: "nutella",
    ingredients: ["nutella"],
    noFamily: true, // Questo flag impedirà l'opzione familiare
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Capricciosa",
    price: 6.0,
    description:
      "Pomodoro, mozzarella fiordilatte, prosciutto, carciofi, funghi freschi, wurstel, olive",
    ingredients: [
      "pomodoro",
      "mozzarella",
      "prosciutto-cotto",
      "carciofi",
      "funghi",
      "wurstel",
      "olive",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Bomba",
    price: 6.0,
    description:
      "Pomodoro, mozzarella fiordilatte, prosciutto cotto, funghi freschi, salame piccante",
    ingredients: [
      "pomodoro",
      "mozzarella",
      "prosciutto-cotto",
      "funghi",
      "salame-piccante",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Faccia da vecchia",
    price: 6.0,
    description: "Cipolla, mollica, acciughe, caciocavallo",
    ingredients: ["cipolla", "mollica", "acciughe", "caciocavallo"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Tonno",
    price: 6.0,
    description: "pomodoro, mozzarella fiordilatte, tonno",
    ingredients: ["pomodoro", "mozzarella", "tonno"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Braccio di ferro",
    price: 6.5,
    description: "Mozzarella fiordilatte, spinaci, gorgonzola",
    ingredients: ["mozzarella", "spinaci", "gorgonzola"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Calzone Special",
    price: 7.0,
    description:
      "Pomodoro, mozzarella fiordilatte, salame piccante, salsiccia, melanzane",
    ingredients: [
      "pomodoro",
      "mozzarella",
      "salame-piccante",
      "salsiccia",
      "melanzane",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Boscaiola",
    price: 7.0,
    description:
      "Pomodoro, mozzarella fiordilatte, prosciutto cotto, salsiccia, funghi freschi",
    ingredients: [
      "pomodoro",
      "mozzarella",
      "prosciutto-cotto",
      "salsiccia",
      "funghi",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "San Daniele",
    price: 7.0,
    description:
      "Pomodoro, mozzarella fiordilatte, prosciutto crudo e scaglie di Grana",
    ingredients: ["pomodoro", "mozzarella", "prosciutto-crudo", "grana"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Pazza",
    price: 7.0,
    description:
      "Mozzarella fiordilatte, pomodoro a fette, rucola, scaglie di grana",
    ingredients: ["mozzarella", "pomodoro-a-fette", "rucola", "grana"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Completa",
    price: 7.0,
    description: "",
    ingredients: [],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Bufalina",
    price: 8.0,
    description: "Pomodoro e mozzarella di bufala",
    ingredients: ["pomodoro", "mozzarella-di-bufala"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Margo'",
    price: 8.0,
    description:
      "Pomodoro, mozzarella fiordilatte, prosciutto, salame piccante e gorgonzola",
    ingredients: [
      "pomodoro",
      "mozzarella",
      "prosciutto-cotto",
      "salame-piccante",
      "gorgonzola",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Vegetariana",
    price: 8.0,
    description:
      "Pomodoro, funghi freschi, carciofi, melanzane, peperoni, spinaci",
    ingredients: [
      "pomodoro",
      "funghi",
      "carciofi",
      "melanzane",
      "peperoni",
      "spinaci",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Rustica",
    price: 8.0,
    description:
      "Pomodoro, salame dolce, pomodoro a fette, grana, mozzarella fiordilatte e origano",
    ingredients: [
      "pomodoro",
      "salame-dolce",
      "pomodoro-a-fette",
      "grana",
      "mozzarella",
      "origano",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Campagnola",
    price: 8.0,
    description:
      "Pomodoro, mozzarella fiordilatte, cipolla, pomodoro a fette, olive, caciocavallo",
    ingredients: [
      "pomodoro",
      "mozzarella",
      "cipolla",
      "pomodoro-a-fette",
      "olive",
      "caciocavallo",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-classiche",
    name: "Esplosiva",
    price: 8.0,
    description:
      "Pomodoro, mozzarella fiordilatte, salame piccante, salsiccia, peperoni",
    ingredients: [
      "pomodoro",
      "mozzarella",
      "salame-piccante",
      "salsiccia",
      "peperoni",
    ],
  });

  // Lista delle pizze create dai clienti
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-create",
    name: "Silvio",
    price: 6.0,
    description: "Pomodoro, mozzarella fiordilatte, funghi, gorgonzola",
    ingredients: ["pomodoro", "mozzarella", "funghi", "gorgonzola"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-create",
    name: "Peppe",
    price: 6.5,
    description:
      "Pomodoro, mozzarella fiordilatte, salame piccante, funghi, emmental",
    ingredients: [
      "pomodoro",
      "mozzarella",
      "salame-piccante",
      "funghi",
      "emmental",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-create",
    name: "Riccardo",
    price: 7.0,
    description: "Mozzarella fiordilatte, tonno, pomodoro a fette, salsa rosa",
    ingredients: ["mozzarella", "tonno", "pomodoro-a-fette", "salsa-rosa"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-create",
    name: "El Nino",
    price: 7.0,
    description:
      "Pomodoro, mozzarella fiordilatte, cipolla, peperoni, pomodoro a fette",
    ingredients: [
      "pomodoro",
      "mozzarella",
      "cipolla",
      "peperoni",
      "pomodoro-a-fette",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-create",
    name: "Matteo",
    price: 7.5,
    description:
      "Pomodoro, mozzarella fiordilatte, patatine, salsiccia, cipolla",
    ingredients: [
      "pomodoro",
      "mozzarella",
      "patatine-fritte",
      "salsiccia",
      "cipolla",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-create",
    name: "Don Dom",
    price: 7.5,
    description:
      "Pomodoro, mozzarella fiordilatte, prosciutto, melanzane, gorgonzola, scaglie di Grana",
    ingredients: [
      "pomodoro",
      "mozzarella",
      "prosciutto-cotto",
      "melanzane",
      "gorgonzola",
      "grana",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-create",
    name: "Russo",
    price: 7.5,
    description:
      "Pomodoro, mozzarella fiordilatte, salame piccante, salsiccia, emmental",
    ingredients: [
      "pomodoro",
      "mozzarella",
      "salame-piccante",
      "salsiccia",
      "emmental",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-create",
    name: "Federica",
    price: 9.0,
    description: "Mozzarella fiordilatte, salsiccia, emmental, bacon",
    ingredients: ["mozzarella", "salsiccia", "emmental", "bacon"],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-create",
    name: "Salvo",
    price: 9.0,
    description:
      "Pomodoro, mozzarella fiordilatte, carciofi, salsiccia, pomodorini, rucola",
    ingredients: [
      "pomodoro",
      "mozzarella",
      "carciofi",
      "salsiccia",
      "pomodorini",
      "rucola",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-create",
    name: "Rita",
    price: 10.0,
    description: "Bufala, salsiccia, funghi, pesto di pistacchio",
    ingredients: [
      "mozzarella-di-bufala",
      "salsiccia",
      "funghi",
      "pesto-di-pistacchio",
    ],
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "pizze-create",
    name: "Martina",
    price: 10.0,
    description:
      "Mozzarella fiordilatte, funghi, spinaci, salsiccia, melanzane, scaglie di grana",
    ingredients: [
      "mozzarella",
      "funghi",
      "spinaci",
      "salsiccia",
      "melanzane",
      "grana",
    ],
  });

  // Lista schiacciate
  appState.menu.items.push({
    id: generateId(),
    categoryId: "schiacciate",
    name: "Classica",
    price: 5.0,
    description: "",
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "schiacciate",
    name: "Norma",
    price: 5.0,
    description: "",
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "schiacciate",
    name: "4 Caci",
    price: 5.0,
    description: "",
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "schiacciate",
    name: "Tonnata",
    price: 6.0,
    description: "",
  });
  appState.menu.items.push({
    id: generateId(),
    categoryId: "schiacciate",
    name: "Sfiziosa",
    price: 8.0,
    description: "",
  });

  // Lista bevande
  // BEVANDE SENZA VARIANTI (formato unico)
  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Partannina",
    price: 1.0,
    description: "",
  });

  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Caffè",
    price: 1.0,
    description: "",
  });

  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Spuma",
    price: 1.0,
    description: "",
  });

  // BEVANDE CON VARIANTI

  // Acqua
  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Acqua",
    price: 1.0,
    variants: [
      { name: "50cl Naturale", price: 1.0 },
      { name: "50cl Frizzante", price: 1.0 },
      { name: "1L Naturale", price: 2.0 },
      { name: "1L Frizzante", price: 2.0 },
    ],
  });

  // Coca Cola
  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Coca Cola",
    price: 2.0,
    variants: [
      { name: "33cl Classica", price: 1.5 },
      { name: "33cl Classica", price: 2.0 },
      { name: "33cl Zero", price: 1.5 },
      { name: "33cl Zero", price: 2.0 },
      { name: "Bottiglia", price: 3.0 },
      { name: "Bottiglia", price: 4.0 },
    ],
  });

  // BIBITE IN LATTINA (tutte stesso formato)
  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Fanta",
    price: 2.0,
    description: "33cl",
    variants: [
      { name: "33cl", price: 1.5 },
      { name: "33cl", price: 2.0 },
    ],
  });

  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Sprite",
    price: 2.0,
    description: "33cl",
    variants: [
      { name: "33cl", price: 1.5 },
      { name: "33cl", price: 2.0 },
    ],
  });

  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Chinotto",
    price: 2.0,
    description: "33cl",
    variants: [
      { name: "33cl", price: 1.5 },
      { name: "33cl", price: 2.0 },
    ],
  });

  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Thè",
    price: 2.0,
    description: "Limone o Pesca",
    variants: [
      { name: "125ml Limone", price: 0.5 },
      { name: "125ml Pesca", price: 0.0 },
      { name: "50cl Limone", price: 1.5 },
      { name: "50cl Pesca", price: 1.5 },
      { name: "50cl Limone", price: 2.0 },
      { name: "50cl Pesca", price: 2.0 },
    ],
  });

  // BIRRE

  // Moretti con varianti
  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Moretti",
    price: 2.0,
    variants: [
      { name: "33cl", price: 1.5 },
      { name: "33cl", price: 2.0 },
      { name: "66cl", price: 2.0 },
      { name: "66cl", price: 3.0 },
    ],
  });

  // Birre formato singolo
  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Beck's",
    price: 3.0,
    description: "33cl",
  });

  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Heineken",
    price: 3.0,
    description: "33cl",
  });

  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Corona",
    price: 3.5,
    description: "33cl",
  });

  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Tennent's",
    price: 4.0,
    description: "33cl",
  });

  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Ichnusa",
    price: 4.0,
    description: "50cl",
  });

  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Ceres",
    price: 4.0,
    description: "33cl",
  });

  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Messina",
    price: 4.0,
    description: "50cl",
  });

  // ENERGY DRINKS
  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Energy Drink",
    price: 2.0,
    description: "",
    variants: [
      { name: "33cl", price: 1.5 },
      { name: "33cl", price: 2.0 },
    ],
  });

  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Red Bull",
    price: 3.0,
    description: "",
    variants: [
      { name: "33cl", price: 2.5 },
      { name: "33cl", price: 3.0 },
    ],
  });

  // LIQUORI
  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Amaro",
    price: 2.0,
    description: "",
  });

  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Limoncello",
    price: 2.0,
    description: "",
  });

  // VINI
  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Corvo Glicine",
    price: 12.0,
    description: "Vino bianco",
  });

  appState.menu.items.push({
    id: generateId(),
    categoryId: "bevande",
    name: "Vino Regaleali",
    price: 15.0,
    description: "",
  });
  // Extra
}
// Funzioni di utilità
function generateId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
// Funzione helper per emettere eventi WebSocket
// Funzione helper per emettere eventi WebSocket
function emitOrderUpdate(action = "ordine_modificato") {
  if (!api || !api.socket || !api.socket.connected) return;

  let tableOrTakeaway;
  let displayName;

  if (appState.currentOrderType === "table") {
    tableOrTakeaway = appState.tables.find(
      (t) => t.id === appState.currentOrderId
    );
    if (tableOrTakeaway) {
      if (tableOrTakeaway.customName) {
        displayName = `Tavolo ${
          tableOrTakeaway.prefix ? tableOrTakeaway.prefix + " " : ""
        }${tableOrTakeaway.customName}`;
      } else {
        displayName = `Tavolo ${
          tableOrTakeaway.prefix ? tableOrTakeaway.prefix + " " : ""
        }${tableOrTakeaway.number}`;
      }
    }
  } else if (appState.currentOrderType === "takeaway") {
    // MODIFICA: aggiungi if specifico
    tableOrTakeaway = appState.takeaways.find(
      (t) => t.id === appState.currentOrderId
    );
    if (tableOrTakeaway) {
      displayName = `Asporto #${tableOrTakeaway.number}`;
    }
  } else if (appState.currentOrderType === "delivery") {
    // AGGIUNGI: nuovo blocco delivery
    const delivery = appState.deliveries.find(
      (d) => d.id === appState.currentOrderId
    );
    if (delivery) {
      tableOrTakeaway = delivery; // Usa delivery come tableOrTakeaway
      displayName = `Domicilio - ${delivery.customerName}`;
    }
  }

  if (tableOrTakeaway && displayName) {
    const orderData = {
      id: appState.currentOrderId,
      type: appState.currentOrderType,
      tavolo: displayName,
      items: tableOrTakeaway.order.items,
      covers: tableOrTakeaway.order.covers || 0,
      stato: tableOrTakeaway.status,
    };

    // Usa i nomi degli eventi che il server ascolta
    api.socket.emit(action, orderData);
    console.log(`📡 Evento ${action} emesso:`, orderData);
  }
}
// Funzione per mostrare notifiche
function mostraNotifica(messaggio, tipo = "info") {
  // Crea elemento notifica
  const notifica = document.createElement("div");
  notifica.className = `notifica notifica-${tipo}`;
  notifica.innerHTML = `
    <span>${messaggio}</span>
    <button onclick="this.parentElement.remove()">×</button>
  `;

  // Aggiungi al DOM
  document.body.appendChild(notifica);

  // Rimuovi automaticamente dopo 5 secondi
  setTimeout(() => {
    if (notifica.parentElement) {
      notifica.remove();
    }
  }, 5000);
}
async function modificaOrdineServer(ordineId, nuoviDati) {
  if (!api) return;

  try {
    const response = await api.modificaOrdine(ordineId, nuoviDati);

    // Emetti evento WebSocket
    if (api.socket && api.socket.connected) {
      api.socket.emit("ordine_modificato", response);
      console.log("📡 Evento ordine_modificato inviato via WebSocket");
    }

    return response;
  } catch (error) {
    console.error("❌ Errore modifica ordine:", error);
  }
}

// Funzione per eliminare ordine (aggiungi se non ce l'hai)
async function eliminaOrdineServer(ordineId) {
  if (!api) return;

  try {
    const response = await api.eliminaOrdine(ordineId);

    // Emetti evento WebSocket
    if (api.socket && api.socket.connected) {
      api.socket.emit("ordine_eliminato", ordineId);
      console.log("📡 Evento ordine_eliminato inviato via WebSocket");
    }

    return response;
  } catch (error) {
    console.error("❌ Errore eliminazione ordine:", error);
  }
}
function formatPrice(price) {
  return parseFloat(price).toFixed(2);
}
// Helper per tornare alla vista principale
function showMainView() {
  document.getElementById("orderView").classList.add("hidden");
  document.querySelector("main").classList.remove("hidden");

  // Torna al tab attivo
  const activeTab = document.querySelector(".tab.active");
  if (activeTab) {
    activeTab.click();
  }
}
// Funzioni per l'interfaccia utente
function renderTabs() {
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.getAttribute("data-tab");

      // Rimuove la classe 'active' da tutte le tab e contenuti
      tabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      // Aggiunge la classe 'active' alla tab e contenuto corrente
      tab.classList.add("active");
      document.getElementById(tabId).classList.add("active");

      // Gestione casi speciali
      if (tabId === "tables-back") {
        showTablesView();
      }
      // Gestione tab Domicilio
      if (tabId === "delivery") {
        renderDeliveries();
      }
    });
  });
}

function showTablesView() {
  // Nascondi la vista dell'ordine
  document.getElementById("orderView").classList.add("hidden");

  // Mostra la vista principale
  document.querySelector("main").classList.remove("hidden");

  // Mostra i tab principali
  document.querySelector("main .tabs").classList.remove("hidden");

  // Determina quale tab mostrare in base al tipo di ordine corrente
  let tabToActivate = "tables"; // default

  if (appState.currentOrderType === "takeaway") {
    tabToActivate = "takeaway";
  } else if (appState.currentOrderType === "delivery") {
    tabToActivate = "delivery";
  }

  // Rimuovi active da tutti i tab
  document.querySelectorAll("main .tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  document.querySelectorAll("main .tab-content").forEach((content) => {
    content.classList.remove("active");
    content.classList.remove("hidden");
  });

  // Attiva il tab corretto
  const targetTab = document.querySelector(
    `main .tab[data-tab="${tabToActivate}"]`
  );
  if (targetTab) {
    targetTab.classList.add("active");
  }

  const targetContent = document.getElementById(tabToActivate);
  if (targetContent) {
    targetContent.classList.add("active");
  }

  // Reset dello stato corrente
  appState.currentOrderId = null;
  appState.currentOrderType = null;
  appState.currentDeliveryId = null;
}

function showOrderView(orderId, orderType) {
  appState.currentOrderId = orderId;
  appState.currentOrderType = orderType;

  // Gestione specifica per delivery
  if (orderType === "delivery") {
    const delivery = appState.deliveries.find((d) => d.id === orderId);
    if (delivery) {
      appState.currentDeliveryId = orderId;
    }
  }

  // Nascondi la vista principale e mostra la vista ordine
  document.getElementById("orderView").classList.remove("hidden");
  document.querySelector("main").classList.add("hidden");

  // IMPORTANTE: Nascondi SOLO i tab della vista principale, non quelli dell'orderView
  document.querySelectorAll("main .tabs").forEach((el) => {
    el.classList.add("hidden");
  });

  document.querySelectorAll("main .tab-content").forEach((el) => {
    el.classList.add("hidden");
  });

  // Assicurati che i tab dell'orderView siano visibili
  document.querySelector("#orderView .tabs").classList.remove("hidden");
  document.querySelectorAll("#orderView .tab-content").forEach((el) => {
    // Rimuovi hidden solo dal tab attivo
    if (el.id === "order-details" && el.classList.contains("active")) {
      el.classList.remove("hidden");
    }
  });

  renderOrderDetails();
  renderMenuCategories();

  // Emetti evento per notificare che stiamo visualizzando questo ordine
  if (api && api.socket && api.socket.connected) {
    api.socket.emit("ordine_aperto", {
      id: orderId,
      type: orderType,
    });
    console.log("📡 Apertura ordine emessa:", orderType, orderId);
  }
}

function updateUI() {
  document.getElementById("restaurantName").value =
    appState.settings.restaurantName;
  document.getElementById("coverCharge").value = appState.settings.coverCharge;
  document.querySelector("header h1").textContent =
    appState.settings.restaurantName + " - Gestionale";
}

function renderTakeaways() {
  const takeawayContainer = document.getElementById("takeawayContainer");
  takeawayContainer.innerHTML = "";

  appState.takeaways.forEach((takeaway) => {
    const takeawayCard = document.createElement("div");
    takeawayCard.className = `table-card ${takeaway.status}`;
    takeawayCard.innerHTML = `
            <div class="table-number">Asporto #${takeaway.number}</div>
            <div class="table-status ${takeaway.status}">${getStatusText(
      takeaway.status
    )}</div>
        `;

    takeawayCard.addEventListener("click", () => {
      if (takeaway.status === "closed") {
        // Per gli asporti chiusi, apri in modalità di sola lettura
        showOrderView(takeaway.id, "takeaway");
        // Disabilita i pulsanti di modifica
        document.getElementById("printOrderBtn").disabled = false;
        document.getElementById("printReceiptBtn").disabled = false;
        document.getElementById("closeOrderBtn").disabled = true;
        document.getElementById("applyDiscountBtn").disabled = true;
      } else {
        // Per gli asporti attivi o nuovi
        if (takeaway.status === "new") {
          // Inizializza un nuovo ordine per gli asporti nuovi
          takeaway.status = "active";
          takeaway.order = {
            items: [],
            discount: 0,
            discountType: "percentage",
            discountReason: "",
            customerName: "",
            customerPhone: "",
            createdAt: new Date().toISOString(),
          };
          saveData();
        }

        showOrderView(takeaway.id, "takeaway");
        // Abilita tutti i pulsanti
        document.getElementById("printOrderBtn").disabled = false;
        document.getElementById("printReceiptBtn").disabled = false;
        document.getElementById("closeOrderBtn").disabled = false;
        document.getElementById("applyDiscountBtn").disabled = false;
      }
    });

    takeawayContainer.appendChild(takeawayCard);
  });
}

function getStatusText(status) {
  switch (status) {
    case "new":
      return "Da Aprire";
    case "active":
      return "Attivo";
    case "closed":
      return "Chiuso";
    default:
      return status;
  }
}

// Funzioni per la gestione del menu
function renderMenuEditor() {
  // Render delle categorie nel menu editor
  const editorCategoryTabs = document.getElementById("editorCategoryTabs");
  editorCategoryTabs.innerHTML = "";

  appState.menu.categories.forEach((category, index) => {
    const categoryTab = document.createElement("button");
    categoryTab.className = `category-tab ${index === 0 ? "active" : ""}`;
    categoryTab.textContent = category.name;
    categoryTab.setAttribute("data-category", category.id);

    categoryTab.addEventListener("click", () => {
      document
        .querySelectorAll("#editorCategoryTabs .category-tab")
        .forEach((tab) => {
          tab.classList.remove("active");
        });
      categoryTab.classList.add("active");
      renderMenuItemsForEditor(category.id);
    });

    editorCategoryTabs.appendChild(categoryTab);
  });

  // Render degli items per la prima categoria
  if (appState.menu.categories.length > 0) {
    renderMenuItemsForEditor(appState.menu.categories[0].id);
  }
}

function renderMenuItemsForEditor(categoryId) {
  const menuEditorList = document.getElementById("menuEditorList");
  menuEditorList.innerHTML = "";

  const items = appState.menu.items.filter(
    (item) => item.categoryId === categoryId
  );

  items.forEach((item) => {
    const editorItem = document.createElement("div");
    editorItem.className = "editor-item";
    editorItem.innerHTML = `
            <div class="editor-item-details">
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-price">€${formatPrice(item.price)}</div>
            </div>
            <div class="editor-item-actions">
                <button class="btn btn-sm btn-outline edit-item" data-id="${
                  item.id
                }">Modifica</button>
                <button class="btn btn-sm btn-danger delete-item" data-id="${
                  item.id
                }">Elimina</button>
            </div>
        `;

    menuEditorList.appendChild(editorItem);
  });

  // Aggiungi event listeners ai pulsanti
  document.querySelectorAll(".edit-item").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const itemId = button.getAttribute("data-id");
      const item = appState.menu.items.find((i) => i.id === itemId);
      if (item) {
        showEditItemModal(item);
      }
    });
  });

  document.querySelectorAll(".delete-item").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const itemId = button.getAttribute("data-id");
      if (confirm("Sei sicuro di voler eliminare questo prodotto?")) {
        appState.menu.items = appState.menu.items.filter(
          (i) => i.id !== itemId
        );
        saveData();
        renderMenuItemsForEditor(categoryId);
      }
    });
  });
}

// Funzioni per la gestione degli ordini
function renderMenuCategories() {
  const categoriesTabs = document.getElementById("categoriesTabs");
  const menuCategories = document.getElementById("menuCategories");

  categoriesTabs.innerHTML = "";
  menuCategories.innerHTML = "";

  appState.menu.categories.forEach((category, index) => {
    // Crea la tab della categoria
    const categoryTab = document.createElement("button");
    categoryTab.className = `category-tab ${index === 0 ? "active" : ""}`;
    categoryTab.textContent = category.name;
    categoryTab.setAttribute("data-category", category.id);

    categoryTab.addEventListener("click", () => {
      document
        .querySelectorAll("#categoriesTabs .category-tab")
        .forEach((tab) => {
          tab.classList.remove("active");
        });
      categoryTab.classList.add("active");

      document.querySelectorAll(".menu-category").forEach((cat) => {
        cat.classList.remove("active");
      });
      document
        .querySelector(`.menu-category[data-category="${category.id}"]`)
        .classList.add("active");
    });

    categoriesTabs.appendChild(categoryTab);

    // Crea la sezione per gli items della categoria
    const categorySection = document.createElement("div");
    categorySection.className = `menu-category ${index === 0 ? "active" : ""}`;
    categorySection.setAttribute("data-category", category.id);

    const items = appState.menu.items.filter(
      (item) => item.categoryId === category.id
    );

    items.forEach((item) => {
      const menuItem = document.createElement("div");
      menuItem.className = "menu-item";
      menuItem.innerHTML = `
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-price">€${formatPrice(item.price)}</div>
            `;

      menuItem.addEventListener("click", () => {
        // Quando si clicca su un item, lo aggiungiamo all'ordine corrente
        addItemToOrder(item);
      });

      categorySection.appendChild(menuItem);
    });
    // Aggiungi un item speciale per la categoria 1/2 Familiari
    if (appState.menu.categories.some((cat) => cat.id === "mezze-familiari")) {
      const halfFamilyCategory = document.querySelector(
        '.menu-category[data-category="mezze-familiari"]'
      );
      if (halfFamilyCategory) {
        halfFamilyCategory.innerHTML = `
      <div class="menu-item" style="grid-column: 1 / -1;">
        <div class="menu-item-name">Pizza 1/2 e 1/2 Familiare</div>
        <div class="menu-item-price">Prezzo variabile</div>
      </div>
    `;

        halfFamilyCategory
          .querySelector(".menu-item")
          .addEventListener("click", () => {
            showHalfFamilyModal();
          });
      }
    }
    menuCategories.appendChild(categorySection);
  });
}

function groupIngredients(additions) {
  const grouped = {};

  additions.forEach((addition) => {
    if (!grouped[addition.id]) {
      grouped[addition.id] = {
        id: addition.id,
        name: addition.name,
        price: addition.price,
        count: 1,
      };
    } else {
      grouped[addition.id].count++;
    }
  });

  return Object.values(grouped);
}

// FUNZIONE renderOrderDetails MODIFICATA
function renderOrderDetails() {
  let order;
  let orderTitle;

  if (appState.currentOrderType === "table") {
    const table = appState.tables.find((t) => t.id === appState.currentOrderId);
    if (!table) return;
    order = table.order;
    if (table.customName) {
      orderTitle = `Tavolo ${table.prefix ? table.prefix + " " : ""}${
        table.customName
      }`;
    } else {
      orderTitle = `Tavolo ${table.prefix ? table.prefix + " " : ""}${
        table.number
      }`;
    }
    document.getElementById("orderStatus").textContent = getStatusText(
      table.status
    );
    document.getElementById(
      "orderStatus"
    ).className = `table-status ${table.status}`;
  } else if (appState.currentOrderType === "takeaway") {
    const takeaway = appState.takeaways.find(
      (t) => t.id === appState.currentOrderId
    );
    if (!takeaway) return;
    order = takeaway.order;
    orderTitle = `Asporto #${takeaway.number}`;
    document.getElementById("orderStatus").textContent = getStatusText(
      takeaway.status
    );
    document.getElementById(
      "orderStatus"
    ).className = `table-status ${takeaway.status}`;
  } else if (appState.currentOrderType === "delivery") {
    const delivery = appState.deliveries.find(
      (d) => d.id === appState.currentOrderId
    );
    if (!delivery) return;
    order = delivery.order;
    orderTitle = `Domicilio - ${delivery.customerName}`;
    document.getElementById("orderStatus").textContent =
      delivery.status === "pending"
        ? "Da preparare"
        : delivery.status === "delivering"
        ? "In consegna"
        : "Consegnato";
    document.getElementById(
      "orderStatus"
    ).className = `table-status ${delivery.status}`;
  } else {
    return;
  }

  document.getElementById("orderTitle").textContent = orderTitle;

  // Render degli items dell'ordine
  const orderItemsContainer = document.getElementById("orderItems");
  orderItemsContainer.innerHTML = "";

  if (!order || !order.items) return;

  // Aggiungi coperto se è un tavolo, non per asporto
  renderCoverItem(order, orderItemsContainer);

  // Aggiungi gli items dell'ordine
  order.items.forEach((item, index) => {
    // Log di debug
    console.log(`Rendering item ${index}:`, item);

    // Controllo di sicurezza per evitare items undefined
    if (!item || !item.name) {
      console.error("❌ Item non valido trovato all'indice", index, ":", item);
      return; // Salta questo item
    }
    const orderItem = document.createElement("div");
    orderItem.className = "order-item";

    // All'interno del blocco che costruisce itemDetails, dopo il nome dell'item
    let displayName = item.name;
    if (item.variant) {
      displayName += ` <span style="color: #666; font-size: 0.9em;">(${item.variant})</span>`;
    }

    let itemDetails = `
<div class="order-item-details">
    <div class="order-item-name">${displayName}</div>
`;

    // Aggiungi l'indicazione per le pizze familiari
    if (item.isFamily) {
      itemDetails +=
        '<div class="order-item-options"><div>Familiare</div></div>';
    }
    // Aggiungi l'indicazione per le mezze familiari
    if (item.isHalfFamily) {
      itemDetails +=
        '<div class="order-item-options"><div>Familiare 1/2 e 1/2</div></div>';

      // Mostra le aggiunzioni/rimozioni per ogni metà
      if (item.firstHalf) {
        if (
          (item.firstHalf.additions && item.firstHalf.additions.length > 0) ||
          (item.firstHalf.removals && item.firstHalf.removals.length > 0)
        ) {
          itemDetails +=
            '<div class="order-item-options" style="font-size: 0.9em;">';
          itemDetails += `<div><strong>1/2 ${item.firstHalf.name}:</strong></div>`;

          if (item.firstHalf.additions && item.firstHalf.additions.length > 0) {
            // MODIFICA: Raggruppa gli ingredienti
            const grouped = groupIngredients(item.firstHalf.additions);
            const additionsList = grouped
              .map((a) => {
                const priceInfo = item.isFamily
                  ? `(€${(a.price * 2).toFixed(2)})`
                  : `(€${a.price.toFixed(2)})`;
                return `+ ${a.name}${
                  a.count > 1 ? " x" + a.count : ""
                } ${priceInfo}`;
              })
              .join(", ");
            itemDetails += `<div style="margin-left: 10px;">${additionsList}</div>`;
          }

          if (item.firstHalf.removals && item.firstHalf.removals.length > 0) {
            const removalsList = item.firstHalf.removals
              .map((r) => `- ${r}`)
              .join(", ");
            itemDetails += `<div style="margin-left: 10px;">${removalsList}</div>`;
          }

          itemDetails += "</div>";
        }
      }

      if (item.secondHalf) {
        if (
          (item.secondHalf.additions && item.secondHalf.additions.length > 0) ||
          (item.secondHalf.removals && item.secondHalf.removals.length > 0)
        ) {
          itemDetails +=
            '<div class="order-item-options" style="font-size: 0.9em;">';
          itemDetails += `<div><strong>1/2 ${item.secondHalf.name}:</strong></div>`;

          if (
            item.secondHalf.additions &&
            item.secondHalf.additions.length > 0
          ) {
            // MODIFICA: Raggruppa gli ingredienti
            const grouped = groupIngredients(item.secondHalf.additions);
            const additionsList = grouped
              .map((a) => {
                const priceInfo = item.isFamily
                  ? `(€${(a.price * 2).toFixed(2)})`
                  : `(€${a.price.toFixed(2)})`;
                return `+ ${a.name}${
                  a.count > 1 ? " x" + a.count : ""
                } ${priceInfo}`;
              })
              .join(", ");
            itemDetails += `<div style="margin-left: 10px;">${additionsList}</div>`;
          }

          if (item.secondHalf.removals && item.secondHalf.removals.length > 0) {
            const removalsList = item.secondHalf.removals
              .map((r) => `- ${r}`)
              .join(", ");
            itemDetails += `<div style="margin-left: 10px;">${removalsList}</div>`;
          }

          itemDetails += "</div>";
        }
      }
    }

    // Mostra opzioni pizza se presenti (per pizze normali)
    if (
      !item.isHalfFamily && // Solo per pizze non mezze familiari
      ((item.additions && item.additions.length > 0) ||
        (item.removals && item.removals.length > 0))
    ) {
      itemDetails += '<div class="order-item-options">';

      if (item.additions && item.additions.length > 0) {
        // MODIFICA: Raggruppa gli ingredienti e mostra il prezzo
        const grouped = groupIngredients(item.additions);
        const additionsList = grouped
          .map((a) => {
            // Calcola il prezzo corretto (raddoppiato per familiari)
            const pricePerUnit = item.isFamily ? a.price * 2 : a.price;
            const totalPrice = pricePerUnit * a.count;
            return `+ ${a.name}${
              a.count > 1 ? " x" + a.count : ""
            } (€${totalPrice.toFixed(2)})`;
          })
          .join(", ");
        itemDetails += `<div>${additionsList}</div>`;
      }

      if (item.removals && item.removals.length > 0) {
        const removalsList = item.removals.map((r) => `NO ${r}`).join(", ");
        itemDetails += `<div>${removalsList}</div>`;
      }

      itemDetails += "</div>";
    }

    // Mostra note se presenti
    if (item.notes) {
      itemDetails += `<div class="order-item-options">Note: ${item.notes}</div>`;
    }

    // Mostra informazioni su sconto od omaggio
    if (item.discount > 0 || item.isComplement) {
      itemDetails += '<div class="order-item-options">';

      if (item.discount > 0) {
        itemDetails += `<div>Sconto: ${item.discount}%</div>`;
      }

      if (item.isComplement) {
        itemDetails += "<div>Omaggio</div>";
      }

      itemDetails += "</div>";
    }

    itemDetails += "</div>";

    // Calcola il prezzo incluso modifiche
    let itemPrice = item.basePrice;

    // Applica il fattore moltiplicativo per pizze familiari
    if (item.isFamily) {
      itemPrice *= 2;
    }

    // Aggiungi costi per aggiunzioni (considerando le quantità)
    if (item.additions && item.additions.length > 0) {
      // Raggruppa prima di calcolare il prezzo totale
      const grouped = groupIngredients(item.additions);
      grouped.forEach((addition) => {
        // Per le pizze familiari, anche le aggiunte costano il doppio
        let additionPrice = addition.price * addition.count;
        if (item.isFamily) {
          additionPrice *= 2;
        }
        itemPrice += additionPrice;
      });
    }

    // Per mezze familiari, calcola il prezzo delle aggiunzioni
    if (item.isHalfFamily) {
      if (item.firstHalf && item.firstHalf.additions) {
        const grouped = groupIngredients(item.firstHalf.additions);
        grouped.forEach((addition) => {
          itemPrice += addition.price * addition.count;
        });
      }
      if (item.secondHalf && item.secondHalf.additions) {
        const grouped = groupIngredients(item.secondHalf.additions);
        grouped.forEach((addition) => {
          itemPrice += addition.price * addition.count;
        });
      }
    }

    // Applica sconto se presente
    let finalPrice = itemPrice;
    if (item.discount > 0) {
      finalPrice = itemPrice * (1 - item.discount / 100);
    }

    // Se è un omaggio, il prezzo è 0
    if (item.isComplement) {
      finalPrice = 0;
    }

    // Moltiplica per la quantità
    finalPrice = finalPrice * item.quantity;

    orderItem.innerHTML = `
    ${itemDetails}
    <div class="order-item-price">€${formatPrice(finalPrice)}</div>
    <div class="order-item-actions">
        <button class="btn btn-sm btn-icon btn-outline decrease-quantity" data-index="${index}" title="Diminuisci">-</button>
        <span class="quantity-display">${item.quantity}</span>
        <button class="btn btn-sm btn-icon btn-outline increase-quantity" data-index="${index}" title="Aumenta">+</button>
        <button class="btn btn-sm btn-icon btn-outline edit-order-item" data-index="${index}" title="Modifica">✏️</button>
        <button class="btn btn-sm btn-icon btn-danger remove-order-item" data-index="${index}" title="Rimuovi">🗑️</button>
    </div>
`;

    orderItemsContainer.appendChild(orderItem);
  });

  // Aggiungi event listeners ai pulsanti
  // Aggiungi event listeners ai pulsanti
  document.querySelectorAll(".edit-order-item").forEach((button) => {
    button.addEventListener("click", () => {
      const index = parseInt(button.getAttribute("data-index"));
      showEditOrderItemModal(index);
    });
  });

  document.querySelectorAll(".remove-order-item").forEach((button) => {
    button.addEventListener("click", () => {
      const index = parseInt(button.getAttribute("data-index"));
      if (
        confirm("Sei sicuro di voler rimuovere questo prodotto dall'ordine?")
      ) {
        removeItemFromOrder(index);
      }
    });
  });

  // AGGIUNGI QUI I NUOVI LISTENERS
  // Aggiungi event listeners per i pulsanti di quantità
  document.querySelectorAll(".decrease-quantity").forEach((button) => {
    button.addEventListener("click", () => {
      const index = parseInt(button.getAttribute("data-index"));
      changeItemQuantity(index, -1);
    });
  });

  document.querySelectorAll(".increase-quantity").forEach((button) => {
    button.addEventListener("click", () => {
      const index = parseInt(button.getAttribute("data-index"));
      changeItemQuantity(index, 1);
    });
  });

  // Aggiorna i totali
  updateOrderTotals();
}

// Aggiungi questa nuova funzione al tuo codice
function changeItemQuantity(index, delta) {
  let orderObject;

  if (appState.currentOrderType === "table") {
    const table = appState.tables.find((t) => t.id === appState.currentOrderId);
    if (!table) return;
    orderObject = table.order;
  } else if (appState.currentOrderType === "takeaway") {
    const takeaway = appState.takeaways.find(
      (t) => t.id === appState.currentOrderId
    );
    if (!takeaway) return;
    orderObject = takeaway.order;
  } else if (appState.currentOrderType === "delivery") {
    const delivery = appState.deliveries.find(
      (d) => d.id === appState.currentOrderId
    );
    if (!delivery) return;
    orderObject = delivery.order;
  } else {
    return;
  }

  if (!orderObject.items || !orderObject.items[index]) return;

  const newQuantity = orderObject.items[index].quantity + delta;

  // Non permettere quantità inferiore a 0
  if (newQuantity >= 0) {
    orderObject.items[index].quantity = newQuantity;
    saveData();
    renderOrderDetails();
    updateOrderTotals();

    // Emetti evento WebSocket per sincronizzare
    if (api && api.socket && api.socket.connected) {
      let orderData;

      if (appState.currentOrderType === "table") {
        const table = appState.tables.find(
          (t) => t.id === appState.currentOrderId
        );
        if (table) {
          orderData = {
            id: appState.currentOrderId,
            type: appState.currentOrderType,
            tavolo: `Tavolo ${table.prefix || ""} ${
              table.number || table.customName || ""
            }`,
            items: orderObject.items,
            covers: orderObject.covers || 0,
            stato: table.status,
          };
        }
      } else if (appState.currentOrderType === "takeaway") {
        const takeaway = appState.takeaways.find(
          (t) => t.id === appState.currentOrderId
        );
        if (takeaway) {
          orderData = {
            id: appState.currentOrderId,
            type: appState.currentOrderType,
            tavolo: `Asporto #${takeaway.number}`,
            items: orderObject.items,
            covers: orderObject.covers || 0,
            stato: takeaway.status,
          };
        }
      } else if (appState.currentOrderType === "delivery") {
        const delivery = appState.deliveries.find(
          (d) => d.id === appState.currentOrderId
        );
        if (delivery) {
          api.socket.emit("delivery_aggiornato", {
            deliveryId: appState.currentOrderId,
            delivery: delivery,
          });
          return;
        }
      }

      if (orderData) {
        api.socket.emit("ordine_modificato", orderData);
        console.log("📡 Quantità aggiornata, evento emesso:", orderData);
      }
    }
  }
}

function addItemToOrder(menuItem, selectedVariant = null) {
  // Controllo validità menuItem
  if (!menuItem || !menuItem.name) {
    console.error("❌ Tentativo di aggiungere item non valido:", menuItem);
    return;
  }

  // Se il prodotto ha varianti e non ne è stata selezionata una, mostra il modal di selezione
  if (menuItem.variants && menuItem.variants.length > 0 && !selectedVariant) {
    showVariantSelectionModal(menuItem);
    return;
  }

  let orderObject;

  if (appState.currentOrderType === "table") {
    const table = appState.tables.find((t) => t.id === appState.currentOrderId);
    if (!table || table.status === "closed") return;
    orderObject = table.order;
  } else if (appState.currentOrderType === "takeaway") {
    const takeaway = appState.takeaways.find(
      (t) => t.id === appState.currentOrderId
    );
    if (!takeaway || takeaway.status === "closed") return;
    orderObject = takeaway.order;
  } else if (appState.currentOrderType === "delivery") {
    const delivery = appState.deliveries.find(
      (d) => d.id === appState.currentOrderId
    );
    if (!delivery || delivery.status === "delivered") return;
    orderObject = delivery.order;
  } else {
    return;
  }

  // Determina il prezzo e il nome da usare
  let itemPrice = menuItem.price;
  let variantName = "";

  if (selectedVariant) {
    itemPrice = selectedVariant.price;
    variantName = selectedVariant.name;
  } else if (menuItem.defaultVariant && menuItem.variants) {
    // Se non è stata selezionata una variante ma c'è una default
    const defaultVar = menuItem.variants.find(
      (v) => v.name === menuItem.defaultVariant
    );
    if (defaultVar) {
      itemPrice = defaultVar.price;
      variantName = defaultVar.name;
    }
  }

  // Crea un nuovo item per l'ordine
  const orderItem = {
    name: menuItem.name,
    basePrice: itemPrice,
    quantity: 1,
    discount: 0,
    isComplement: false,
    isFamily: false,
    notes: "",
    additions: [],
    removals: [],
    // NUOVO: Aggiungi informazioni sulla variante se presente
    variant: variantName,
  };

  // Aggiungi l'item all'ordine
  orderObject.items.push(orderItem);
  saveData();

  // Emetti evento WebSocket con il nome corretto
  if (api && api.socket && api.socket.connected) {
    let tableOrTakeaway;
    if (appState.currentOrderType === "table") {
      tableOrTakeaway = appState.tables.find(
        (t) => t.id === appState.currentOrderId
      );
    } else {
      tableOrTakeaway = appState.takeaways.find(
        (t) => t.id === appState.currentOrderId
      );
    }

    if (tableOrTakeaway) {
      const orderData = {
        id: appState.currentOrderId,
        type: appState.currentOrderType,
        tavolo:
          appState.currentOrderType === "table"
            ? `Tavolo ${tableOrTakeaway.prefix || ""} ${
                tableOrTakeaway.number || tableOrTakeaway.customName || ""
              }`
            : `Asporto #${tableOrTakeaway.number}`,
        items: orderObject.items,
        covers: orderObject.covers || 0,
        stato: tableOrTakeaway.status,
      };

      // Usa 'ordine_modificato' che il server ascolta
      api.socket.emit("ordine_modificato", orderData);
      console.log("📡 Evento ordine_modificato emesso:", orderData);
    }
  }

  // Aggiorna la visualizzazione dell'ordine
  renderOrderDetails();

  // Se è una pizza o una schiacciata, apri automaticamente il modal per modificarla
  const isPizza =
    menuItem.categoryId === "pizze-classiche" ||
    menuItem.categoryId === "pizze-speciali" ||
    menuItem.categoryId === "pizze-create" ||
    menuItem.categoryId === "schiacciate" ||
    menuItem.name.toLowerCase().includes("pizza") ||
    menuItem.name.toLowerCase().includes("margherita") ||
    menuItem.name.toLowerCase().includes("diavola") ||
    menuItem.name.toLowerCase().includes("romana") ||
    menuItem.name.toLowerCase().includes("calzone");

  if (isPizza) {
    showEditOrderItemModal(orderObject.items.length - 1);
  }
  // Emetti evento WebSocket con il nome corretto
  if (api && api.socket && api.socket.connected) {
    let orderEntity;
    let orderData;

    if (appState.currentOrderType === "table") {
      orderEntity = appState.tables.find(
        (t) => t.id === appState.currentOrderId
      );
      if (orderEntity) {
        orderData = {
          id: appState.currentOrderId,
          type: appState.currentOrderType,
          tavolo: `Tavolo ${orderEntity.prefix || ""} ${
            orderEntity.number || orderEntity.customName || ""
          }`,
          items: orderObject.items,
          covers: orderObject.covers || 0,
          stato: orderEntity.status,
        };
      }
    } else if (appState.currentOrderType === "takeaway") {
      orderEntity = appState.takeaways.find(
        (t) => t.id === appState.currentOrderId
      );
      if (orderEntity) {
        orderData = {
          id: appState.currentOrderId,
          type: appState.currentOrderType,
          tavolo: `Asporto #${orderEntity.number}`,
          items: orderObject.items,
          covers: orderObject.covers || 0,
          stato: orderEntity.status,
        };
      }
    } else if (appState.currentOrderType === "delivery") {
      orderEntity = appState.deliveries.find(
        (d) => d.id === appState.currentOrderId
      );
      if (orderEntity) {
        // Emetti evento specifico per delivery
        api.socket.emit("delivery_aggiornato", {
          deliveryId: appState.currentOrderId,
          delivery: orderEntity,
        });
        console.log("📦 Evento delivery_aggiornato emesso:", orderEntity);
        return; // Esci qui per i delivery
      }
    }

    // Per tavoli e asporti usa ordine_modificato
    if (orderData) {
      api.socket.emit("ordine_modificato", orderData);
      console.log("📡 Evento ordine_modificato emesso:", orderData);
    }
  }
}

// 2. NUOVA FUNZIONE per mostrare il modal di selezione variante
function showVariantSelectionModal(menuItem) {
  // Crea il modal HTML
  const modalHtml = `
    <div id="variantModal" class="modal active">
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3>Seleziona formato - ${menuItem.name}</h3>
          <button onclick="closeVariantModal()" class="btn btn-icon">×</button>
        </div>
        <div class="modal-body">
          <div class="variant-options">
            ${menuItem.variants
              .map(
                (variant) => `
              <button class="variant-btn ${
                variant.name === menuItem.defaultVariant ? "selected" : ""
              }" 
                      onclick="selectVariant('${menuItem.id}', '${
                  variant.name
                }', ${variant.price})">
                <span class="variant-name">${variant.name}</span>
                <span class="variant-price">€${formatPrice(
                  variant.price
                )}</span>
              </button>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    </div>
  `;

  // Aggiungi il modal al DOM
  document.body.insertAdjacentHTML("beforeend", modalHtml);
}
// 3. FUNZIONE per chiudere il modal varianti
function closeVariantModal() {
  const modal = document.getElementById("variantModal");
  if (modal) {
    modal.remove();
  }
}

// 4. FUNZIONE per selezionare una variante
function selectVariant(menuItemId, variantName, variantPrice) {
  const menuItem = appState.menu.items.find((item) => item.id === menuItemId);
  if (menuItem) {
    const selectedVariant = {
      name: variantName,
      price: variantPrice,
    };
    addItemToOrder(menuItem, selectedVariant);
  }
  closeVariantModal();
}
function showVariantSelectionModal(menuItem) {
  // Crea il modal HTML
  const modalHtml = `
    <div id="variantModal" class="modal active">
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3>Seleziona formato - ${menuItem.name}</h3>
          <button onclick="closeVariantModal()" class="btn btn-icon modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="variant-options">
            ${menuItem.variants
              .map(
                (variant, index) => `
              <button class="variant-btn ${
                variant.name === menuItem.defaultVariant ? "selected" : ""
              }" 
                      onclick="selectVariant('${menuItem.id}', '${
                  variant.name
                }', ${variant.price})"
                      style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 15px 20px; margin-bottom: 10px; background: ${
                        variant.name === menuItem.defaultVariant
                          ? "#3498db"
                          : "#f5f5f5"
                      }; color: ${
                  variant.name === menuItem.defaultVariant ? "white" : "black"
                }; border: 2px solid ${
                  variant.name === menuItem.defaultVariant ? "#3498db" : "#ddd"
                }; border-radius: 8px; cursor: pointer; font-size: 16px;">
                <span style="font-weight: 500;">${variant.name}</span>
                <span style="font-weight: 600;">€${formatPrice(
                  variant.price
                )}</span>
              </button>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    </div>
  `;

  // Aggiungi il modal al DOM
  document.body.insertAdjacentHTML("beforeend", modalHtml);
}

// 7. FUNZIONI per gestire il modal varianti
function closeVariantModal() {
  const modal = document.getElementById("variantModal");
  if (modal) {
    modal.remove();
  }
}

function selectVariant(menuItemId, variantName, variantPrice) {
  const menuItem = appState.menu.items.find((item) => item.id === menuItemId);
  if (menuItem) {
    const selectedVariant = {
      name: variantName,
      price: variantPrice,
    };
    addItemToOrder(menuItem, selectedVariant);
  }
  closeVariantModal();
}
// 1. FUNZIONE PRINCIPALE PER MOSTRARE IL MODAL MEZZE FAMILIARI
function showHalfFamilyModal(editIndex = null) {
  let editingItem = null;

  // Se stiamo modificando, recupera l'item
  if (editIndex !== null) {
    let orderObject;
    if (appState.currentOrderType === "table") {
      const table = appState.tables.find(
        (t) => t.id === appState.currentOrderId
      );
      if (table) orderObject = table.order;
    } else if (appState.currentOrderType === "takeaway") {
      const takeaway = appState.takeaways.find(
        (t) => t.id === appState.currentOrderId
      );
      if (takeaway) orderObject = takeaway.order;
    } else if (appState.currentOrderType === "delivery") {
      const delivery = appState.deliveries.find(
        (d) => d.id === appState.currentOrderId
      );
      if (delivery) orderObject = delivery.order;
    }

    if (orderObject && orderObject.items[editIndex]) {
      editingItem = orderObject.items[editIndex];
    }
  }

  // Crea o aggiorna il modal
  let modal = document.getElementById("halfFamilyModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "halfFamilyModal";
    modal.className = "modal";
    document.body.appendChild(modal);
  }

  // HTML ottimizzato per touch
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 900px;">
      <div class="modal-header">
        <h3 class="modal-title">${
          editingItem ? "Modifica" : "Nuova"
        } Pizza 1/2 e 1/2 Familiare</h3>
        <button class="modal-close touch-button" onclick="closeHalfFamilyModal()">&times;</button>
      </div>
      <div class="modal-body">
        <!-- Prima metà -->
        <div class="half-section" style="margin-bottom: 30px;">
          <h4 style="color: #3498db; margin-bottom: 15px;">🍕 Prima Metà</h4>
          <div class="form-group">
            <label class="form-label">Seleziona Pizza</label>
            <select class="form-control touch-select" id="firstHalf" style="font-size: 18px; padding: 15px;">
              <option value="">-- Seleziona --</option>
            </select>
          </div>
          
          <div id="firstHalfOptions" style="display: none; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h5 style="margin-bottom: 15px;">Modifica ingredienti</h5>
            <div style="display: flex; gap: 15px; margin-bottom: 15px;">
              <button type="button" class="btn btn-success touch-btn" onclick="showIngredientModalForHalf('addition', 'first')">
                <span style="font-size: 20px;">➕</span> Aggiungi
              </button>
              <button type="button" class="btn btn-danger touch-btn" onclick="showIngredientModalForHalf('removal', 'first')">
                <span style="font-size: 20px;">➖</span> Rimuovi
              </button>
            </div>
            <div id="firstHalfModifications" class="modifications-list"></div>
          </div>
        </div>
        
        <!-- Seconda metà -->
        <div class="half-section">
          <h4 style="color: #e74c3c; margin-bottom: 15px;">🍕 Seconda Metà</h4>
          <div class="form-group">
            <label class="form-label">Seleziona Pizza</label>
            <select class="form-control touch-select" id="secondHalf" style="font-size: 18px; padding: 15px;">
              <option value="">-- Seleziona --</option>
            </select>
          </div>
          
          <div id="secondHalfOptions" style="display: none; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h5 style="margin-bottom: 15px;">Modifica ingredienti</h5>
            <div style="display: flex; gap: 15px; margin-bottom: 15px;">
              <button type="button" class="btn btn-success touch-btn" onclick="showIngredientModalForHalf('addition', 'second')">
                <span style="font-size: 20px;">➕</span> Aggiungi
              </button>
              <button type="button" class="btn btn-danger touch-btn" onclick="showIngredientModalForHalf('removal', 'second')">
                <span style="font-size: 20px;">➖</span> Rimuovi
              </button>
            </div>
            <div id="secondHalfModifications" class="modifications-list"></div>
          </div>
        </div>
        
        <!-- Prezzo -->
        <div class="price-section" style="margin-top: 30px; padding: 20px; background: #333; color: white; border-radius: 8px;">
          <label class="form-label" style="color: white;">Prezzo Finale</label>
          <div class="price-control" style="display: flex; align-items: center; gap: 20px;">
            <button type="button" class="btn touch-price-btn" onclick="adjustPrice(-1)" style="width: 60px; height: 60px; font-size: 30px;">−</button>
            <input type="number" class="form-control" id="suggestedPrice" value="0" readonly style="width: 150px; text-align: center; font-size: 24px; font-weight: bold;">
            <button type="button" class="btn touch-price-btn" onclick="adjustPrice(1)" style="width: 60px; height: 60px; font-size: 30px;">+</button>
          </div>
          <small id="priceBreakdown" style="display: block; margin-top: 10px; color: #ddd;"></small>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline touch-btn" onclick="closeHalfFamilyModal()">Annulla</button>
        <button class="btn btn-primary touch-btn" onclick="saveHalfFamily(${editIndex})">${
    editingItem ? "Salva Modifiche" : "Aggiungi all'Ordine"
  }</button>
      </div>
    </div>
  `;

  // Aggiungi stili CSS per touch
  addTouchStyles();

  // Popola i select con le pizze
  populatePizzaSelects(editingItem);

  // Setup event listeners
  setupHalfFamilyEventListeners(editingItem);

  // Se stiamo modificando, carica i dati esistenti
  if (editingItem) {
    loadExistingHalfFamilyData(editingItem);
  }

  modal.classList.add("active");
}
// 2. FUNZIONE PER AGGIUNGERE STILI TOUCH-FRIENDLY
function addTouchStyles() {
  if (!document.getElementById("halfFamilyTouchStyles")) {
    const style = document.createElement("style");
    style.id = "halfFamilyTouchStyles";
    style.innerHTML = `
      .touch-button {
        min-width: 50px;
        min-height: 50px;
        font-size: 24px;
        cursor: pointer;
      }
      
      .touch-btn {
        min-height: 50px;
        padding: 10px 20px;
        font-size: 18px;
        font-weight: 500;
        border-radius: 8px;
        cursor: pointer;
      }
      
      .touch-select {
        min-height: 50px;
        font-size: 18px !important;
        cursor: pointer;
      }
      
      .touch-price-btn {
        background: white;
        color: #333;
        border: 2px solid #ddd;
        cursor: pointer;
      }
      
      .touch-price-btn:hover {
        background: #f0f0f0;
      }
      
      .modifications-list {
        max-height: 200px;
        overflow-y: auto;
      }
      
      .modification-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 16px;
      }
      
      .modification-item button {
        min-width: 45px;
        min-height: 45px;
        font-size: 20px;
        border: none;
        background: #dc3545;
        color: white;
        border-radius: 6px;
        cursor: pointer;
      }
      
      .modification-item button:hover {
        background: #c82333;
      }
      
      .half-section {
        padding: 20px;
        border: 2px solid #e0e0e0;
        border-radius: 10px;
      }
      
      @media (max-width: 768px) {
        .modal-content {
          max-width: 95% !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// 3. POPOLA I SELECT DELLE PIZZE
function populatePizzaSelects(editingItem) {
  const firstHalfSelect = document.getElementById("firstHalf");
  const secondHalfSelect = document.getElementById("secondHalf");

  // Filtra le pizze disponibili
  const pizzas = appState.menu.items.filter(
    (item) =>
      item.categoryId === "pizze-classiche" ||
      item.categoryId === "pizze-speciali" ||
      item.categoryId === "pizze-create"
  );

  // Ordina alfabeticamente
  pizzas.sort((a, b) => a.name.localeCompare(b.name));

  // Popola entrambi i select
  pizzas.forEach((pizza) => {
    const option1 = new Option(`${pizza.name} (€${pizza.price})`, pizza.id);
    option1.dataset.price = pizza.price;
    option1.dataset.name = pizza.name;
    firstHalfSelect.appendChild(option1);

    const option2 = new Option(`${pizza.name} (€${pizza.price})`, pizza.id);
    option2.dataset.price = pizza.price;
    option2.dataset.name = pizza.name;
    secondHalfSelect.appendChild(option2);
  });
}

// 4. SETUP EVENT LISTENERS
function setupHalfFamilyEventListeners(editingItem) {
  const firstHalfSelect = document.getElementById("firstHalf");
  const secondHalfSelect = document.getElementById("secondHalf");

  firstHalfSelect.addEventListener("change", function () {
    if (this.value) {
      document.getElementById("firstHalfOptions").style.display = "block";
      calculateHalfFamilyPrice();
    } else {
      document.getElementById("firstHalfOptions").style.display = "none";
    }
  });

  secondHalfSelect.addEventListener("change", function () {
    if (this.value) {
      document.getElementById("secondHalfOptions").style.display = "block";
      calculateHalfFamilyPrice();
    } else {
      document.getElementById("secondHalfOptions").style.display = "none";
    }
  });
}

// 5. MOSTRA MODAL INGREDIENTI PER METÀ SPECIFICA
function showIngredientModalForHalf(type, half) {
  // Recupera i dati temporanei dal data attribute del modal
  const modal = document.getElementById("halfFamilyModal");
  let tempData = modal.dataset.tempModifications
    ? JSON.parse(modal.dataset.tempModifications)
    : {
        first: { additions: [], removals: [] },
        second: { additions: [], removals: [] },
      };

  // Crea modal ingredienti touch-friendly
  const ingredientModal = document.createElement("div");
  ingredientModal.id = "halfIngredientModal";
  ingredientModal.className = "modal nested active";
  ingredientModal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h3>${
          type === "addition" ? "➕ Aggiungi" : "➖ Rimuovi"
        } Ingrediente - ${half === "first" ? "Prima" : "Seconda"} Metà</h3>
        <button class="modal-close touch-button" onclick="closeHalfIngredientModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="ingredients-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; max-height: 400px; overflow-y: auto;">
          ${getIngredientsForHalf(type, half, tempData)}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(ingredientModal);

  // Salva il contesto corrente
  ingredientModal.dataset.type = type;
  ingredientModal.dataset.half = half;
}

// 6. OTTIENI INGREDIENTI DISPONIBILI PER UNA METÀ
function getIngredientsForHalf(type, half, tempData) {
  const select = document.getElementById(
    half === "first" ? "firstHalf" : "secondHalf"
  );
  const pizzaId = select.value;

  if (!pizzaId) return "<p>Seleziona prima una pizza</p>";

  let availableIngredients = [];

  if (type === "addition") {
    // Per aggiunte, mostra tutti gli ingredienti
    availableIngredients = appState.ingredients;
  } else {
    // Per rimozioni, mostra solo gli ingredienti della pizza
    const pizza = appState.menu.items.find((item) => item.id === pizzaId);
    if (pizza && pizza.ingredients) {
      availableIngredients = appState.ingredients.filter((ing) =>
        pizza.ingredients.includes(ing.id)
      );

      // Aggiungi anche gli ingredienti già aggiunti
      tempData[half].additions.forEach((addition) => {
        if (!availableIngredients.find((ing) => ing.id === addition.id)) {
          availableIngredients.push(addition);
        }
      });
    }
  }

  // Genera i bottoni
  return availableIngredients
    .map(
      (ing) => `
    <button class="ingredient-btn ${
      type === "addition" ? "btn-success" : "btn-danger"
    }" 
            onclick="selectHalfIngredient('${ing.id}', '${ing.name}', ${
        ing.price || 0
      }, '${type}', '${half}')"
            style="padding: 15px; font-size: 16px; border-radius: 8px; cursor: pointer;">
      ${ing.name}
      ${
        type === "addition"
          ? `<br><small>+€${formatPrice(ing.price || 0)}</small>`
          : ""
      }
    </button>
  `
    )
    .join("");
}

// 7. SELEZIONA INGREDIENTE PER METÀ
function selectHalfIngredient(
  ingredientId,
  ingredientName,
  ingredientPrice,
  type,
  half
) {
  const halfFamilyModal = document.getElementById("halfFamilyModal");
  let tempData = halfFamilyModal.dataset.tempModifications
    ? JSON.parse(halfFamilyModal.dataset.tempModifications)
    : {
        first: { additions: [], removals: [] },
        second: { additions: [], removals: [] },
      };

  if (type === "addition") {
    // Permetti aggiunte multiple dello stesso ingrediente
    tempData[half].additions.push({
      id: ingredientId,
      name: ingredientName,
      price: ingredientPrice,
    });
  } else {
    // Permetti rimozioni multiple dello stesso ingrediente
    tempData[half].removals.push(ingredientName);
  }

  // Salva i dati temporanei
  halfFamilyModal.dataset.tempModifications = JSON.stringify(tempData);

  // Chiudi modal ingredienti
  closeHalfIngredientModal();

  // Aggiorna visualizzazione
  renderHalfModifications(half, tempData);
  calculateHalfFamilyPrice();
}

// 8. CHIUDI MODAL INGREDIENTI
function closeHalfIngredientModal() {
  const modal = document.getElementById("halfIngredientModal");
  if (modal) modal.remove();
}

// 9. RENDERIZZA MODIFICHE PER UNA METÀ
function renderHalfModifications(half, tempData) {
  const container = document.getElementById(`${half}HalfModifications`);
  container.innerHTML = "";

  // Aggiunte
  if (tempData[half].additions.length > 0) {
    // Raggruppa gli ingredienti
    const grouped = groupIngredients(tempData[half].additions);
    grouped.forEach((addition, idx) => {
      const div = document.createElement("div");
      div.className = "modification-item";
      div.innerHTML = `
        <span>➕ ${addition.name} ${
        addition.count > 1 ? "x" + addition.count : ""
      } (+€${formatPrice(addition.price * addition.count)})</span>
        <button onclick="removeHalfModification('${half}', 'additions', '${
        addition.id
      }')">🗑️</button>
      `;
      container.appendChild(div);
    });
  }

  // Rimozioni
  tempData[half].removals.forEach((removal, idx) => {
    const div = document.createElement("div");
    div.className = "modification-item";
    div.innerHTML = `
      <span>❌ NO ${removal}</span>
      <button onclick="removeHalfModification('${half}', 'removals', ${idx})">🗑️</button>
    `;
    container.appendChild(div);
  });
}

// 10. RIMUOVI MODIFICA
function removeHalfModification(half, type, idOrIndex) {
  const halfFamilyModal = document.getElementById("halfFamilyModal");
  let tempData = JSON.parse(halfFamilyModal.dataset.tempModifications || "{}");

  if (type === "additions") {
    // Per le aggiunzioni, rimuovi un'occorrenza dell'ingrediente
    const index = tempData[half].additions.findIndex((a) => a.id === idOrIndex);
    if (index !== -1) {
      tempData[half].additions.splice(index, 1);
    }
  } else {
    // Per le rimozioni, usa l'indice direttamente
    tempData[half].removals.splice(idOrIndex, 1);
  }

  halfFamilyModal.dataset.tempModifications = JSON.stringify(tempData);
  renderHalfModifications(half, tempData);
  calculateHalfFamilyPrice();
}

// 11. CALCOLA PREZZO SUGGERITO
function calculateHalfFamilyPrice() {
  const firstSelect = document.getElementById("firstHalf");
  const secondSelect = document.getElementById("secondHalf");

  if (!firstSelect.value || !secondSelect.value) return;

  const firstOption = firstSelect.options[firstSelect.selectedIndex];
  const secondOption = secondSelect.options[secondSelect.selectedIndex];

  const firstPrice = parseFloat(firstOption.dataset.price);
  const secondPrice = parseFloat(secondOption.dataset.price);
  const maxPrice = Math.max(firstPrice, secondPrice);

  let totalPrice = maxPrice * 2; // Prezzo familiare della pizza più costosa

  // Aggiungi prezzo aggiunzioni
  const tempData = JSON.parse(
    document.getElementById("halfFamilyModal").dataset.tempModifications || "{}"
  );

  if (tempData.first && tempData.first.additions) {
    tempData.first.additions.forEach((add) => {
      totalPrice += add.price;
    });
  }

  if (tempData.second && tempData.second.additions) {
    tempData.second.additions.forEach((add) => {
      totalPrice += add.price;
    });
  }

  document.getElementById("suggestedPrice").value = totalPrice.toFixed(2);

  // Mostra breakdown
  const breakdown = `Base: ${
    maxPrice > firstPrice ? secondOption.dataset.name : firstOption.dataset.name
  } familiare (€${(maxPrice * 2).toFixed(2)})`;
  document.getElementById("priceBreakdown").textContent = breakdown;
}

// 12. AGGIUSTA PREZZO MANUALMENTE
function adjustPrice(delta) {
  const priceInput = document.getElementById("suggestedPrice");
  const currentPrice = parseFloat(priceInput.value);
  const newPrice = Math.max(0, currentPrice + delta);
  priceInput.value = newPrice.toFixed(2);
}

// 13. SALVA MEZZA FAMILIARE
function saveHalfFamily(editIndex) {
  const firstSelect = document.getElementById("firstHalf");
  const secondSelect = document.getElementById("secondHalf");

  if (!firstSelect.value || !secondSelect.value) {
    alert("Seleziona entrambe le metà della pizza");
    return;
  }

  const firstOption = firstSelect.options[firstSelect.selectedIndex];
  const secondOption = secondSelect.options[secondSelect.selectedIndex];
  const price = parseFloat(document.getElementById("suggestedPrice").value);

  // Recupera i dati temporanei
  const tempData = JSON.parse(
    document.getElementById("halfFamilyModal").dataset.tempModifications || "{}"
  );

  // Trova l'ordine corrente
  let orderObject;
  if (appState.currentOrderType === "table") {
    const table = appState.tables.find((t) => t.id === appState.currentOrderId);
    if (table) orderObject = table.order;
  } else if (appState.currentOrderType === "takeaway") {
    const takeaway = appState.takeaways.find(
      (t) => t.id === appState.currentOrderId
    );
    if (takeaway) orderObject = takeaway.order;
  } else if (appState.currentOrderType === "delivery") {
    const delivery = appState.deliveries.find(
      (d) => d.id === appState.currentOrderId
    );
    if (delivery) orderObject = delivery.order;
  }

  if (!orderObject) return;

  // Crea l'oggetto item
  const halfFamilyItem = {
    name: `1/2 ${firstOption.dataset.name} + 1/2 ${secondOption.dataset.name}`,
    basePrice: price,
    quantity: 1,
    discount: 0,
    isComplement: false,
    isHalfFamily: true,
    firstHalf: {
      id: firstSelect.value,
      name: firstOption.dataset.name,
      additions: tempData.first ? tempData.first.additions : [],
      removals: tempData.first ? tempData.first.removals : [],
    },
    secondHalf: {
      id: secondSelect.value,
      name: secondOption.dataset.name,
      additions: tempData.second ? tempData.second.additions : [],
      removals: tempData.second ? tempData.second.removals : [],
    },
    notes: "",
  };

  // Salva o aggiorna
  if (editIndex !== null) {
    orderObject.items[editIndex] = halfFamilyItem;
  } else {
    orderObject.items.push(halfFamilyItem);
  }

  saveData();
  renderOrderDetails();
  closeHalfFamilyModal();

  // Emetti evento WebSocket
  emitOrderUpdate();
}

// 14. CHIUDI MODAL MEZZA FAMILIARE
function closeHalfFamilyModal() {
  const modal = document.getElementById("halfFamilyModal");
  if (modal) {
    modal.classList.remove("active");
    // Pulisci dati temporanei
    delete modal.dataset.tempModifications;
  }
}

// 15. CARICA DATI ESISTENTI (per modifica)
function loadExistingHalfFamilyData(item) {
  if (!item.isHalfFamily) return;

  // Seleziona le pizze
  document.getElementById("firstHalf").value = item.firstHalf.id;
  document.getElementById("secondHalf").value = item.secondHalf.id;

  // Mostra le opzioni
  document.getElementById("firstHalfOptions").style.display = "block";
  document.getElementById("secondHalfOptions").style.display = "block";

  // Imposta il prezzo
  document.getElementById("suggestedPrice").value = item.basePrice;

  // Carica le modifiche esistenti
  const tempData = {
    first: {
      additions: item.firstHalf.additions || [],
      removals: item.firstHalf.removals || [],
    },
    second: {
      additions: item.secondHalf.additions || [],
      removals: item.secondHalf.removals || [],
    },
  };

  document.getElementById("halfFamilyModal").dataset.tempModifications =
    JSON.stringify(tempData);

  // Renderizza le modifiche
  renderHalfModifications("first", tempData);
  renderHalfModifications("second", tempData);

  calculateHalfFamilyPrice();
}
function groupIngredients(additions) {
  const grouped = {};

  additions.forEach((addition) => {
    if (!grouped[addition.id]) {
      grouped[addition.id] = {
        id: addition.id,
        name: addition.name,
        price: addition.price,
        count: 1,
      };
    } else {
      grouped[addition.id].count++;
    }
  });

  return Object.values(grouped);
}

function removeItemFromOrder(index) {
  let orderObject;

  if (appState.currentOrderType === "table") {
    const table = appState.tables.find((t) => t.id === appState.currentOrderId);
    if (!table || table.status === "closed") return;
    orderObject = table.order;
  } else if (appState.currentOrderType === "takeaway") {
    const takeaway = appState.takeaways.find(
      (t) => t.id === appState.currentOrderId
    );
    if (!takeaway || takeaway.status === "closed") return;
    orderObject = takeaway.order;
  } else if (appState.currentOrderType === "delivery") {
    const delivery = appState.deliveries.find(
      (d) => d.id === appState.currentOrderId
    );
    if (!delivery || delivery.status === "delivered") return;
    orderObject = delivery.order;
  } else {
    return;
  }

  // Rimuovi l'item dall'ordine
  orderObject.items.splice(index, 1);
  saveData();

  // Emetti evento WebSocket
  emitOrderUpdate();

  // Aggiorna la visualizzazione dell'ordine
  renderOrderDetails();
}

function updateOrderTotals() {
  let orderObject;

  if (appState.currentOrderType === "table") {
    const table = appState.tables.find((t) => t.id === appState.currentOrderId);
    if (!table) return;
    orderObject = table.order;
  } else if (appState.currentOrderType === "takeaway") {
    const takeaway = appState.takeaways.find(
      (t) => t.id === appState.currentOrderId
    );
    if (!takeaway) return;
    orderObject = takeaway.order;
  } else if (appState.currentOrderType === "delivery") {
    const delivery = appState.deliveries.find(
      (d) => d.id === appState.currentOrderId
    );
    if (!delivery) return;
    orderObject = delivery.order;
  } else {
    return;
  }

  // Calcola il subtotale
  let subtotal = 0;

  // Aggiungi il costo dei coperti se è un tavolo
  if (appState.currentOrderType === "table" && orderObject.covers > 0) {
    subtotal += orderObject.covers * appState.settings.coverCharge;
  }

  // Aggiungi il costo di tutti gli items
  if (orderObject.items) {
    orderObject.items.forEach((item) => {
      // Calcola il prezzo base
      let itemPrice = item.basePrice;

      // Applica il fattore moltiplicativo per pizze familiari
      if (item.isFamily) {
        itemPrice *= 2;
      }

      // Gestione speciale per le mezze familiari
      if (item.isHalfFamily) {
        // Il prezzo base è già quello impostato dall'utente (già include il calcolo familiare)
        // Non moltiplicare per 2 perché è già incluso nel basePrice

        // Le aggiunzioni per le mezze familiari hanno prezzo singolo
        if (item.firstHalf && item.firstHalf.additions) {
          const grouped = groupIngredients(item.firstHalf.additions);
          grouped.forEach((addition) => {
            itemPrice += addition.price * addition.count; // IMPORTANTE: moltiplica per count
          });
        }
        if (item.secondHalf && item.secondHalf.additions) {
          const grouped = groupIngredients(item.secondHalf.additions);
          grouped.forEach((addition) => {
            itemPrice += addition.price * addition.count; // IMPORTANTE: moltiplica per count
          });
        }
      }

      // Aggiungi costi per aggiunzioni normali
      if (item.additions && item.additions.length > 0) {
        const grouped = groupIngredients(item.additions);
        grouped.forEach((addition) => {
          // Per le pizze familiari, anche le aggiunte costano il doppio
          let additionPrice = addition.price * addition.count;
          if (item.isFamily) {
            additionPrice *= 2;
          }
          itemPrice += additionPrice;
        });
      }

      // Applica sconto se presente
      let finalPrice = itemPrice;
      if (item.discount > 0) {
        finalPrice = itemPrice * (1 - item.discount / 100);
      }

      // Se è un omaggio, il prezzo è 0
      if (item.isComplement) {
        finalPrice = 0;
      }

      // Moltiplica per la quantità
      subtotal += finalPrice * item.quantity;
    });
  }

  // Calcola l'importo dello sconto
  let discountAmount = 0;
  if (orderObject.discount > 0) {
    if (orderObject.discountType === "percentage") {
      discountAmount = subtotal * (orderObject.discount / 100);
    } else if (orderObject.discountType === "fixed") {
      discountAmount = Math.min(orderObject.discount, subtotal); // Lo sconto non può essere maggiore del subtotale
    }
  }

  // Calcola il totale finale
  const total = subtotal - discountAmount;

  // Aggiorna l'interfaccia
  document.getElementById("subtotal").textContent = `€${formatPrice(subtotal)}`;

  if (discountAmount > 0) {
    document.getElementById("discountsRow").classList.remove("hidden");
    document.getElementById("discounts").textContent = `-€${formatPrice(
      discountAmount
    )}`;
  } else {
    document.getElementById("discountsRow").classList.add("hidden");
  }

  document.getElementById("total").textContent = `€${formatPrice(total)}`;
}

// Funzioni per i modal
function setupModalEventListeners() {
  // Chiusura modals
  document
    .querySelectorAll('.modal-close, [data-dismiss="modal"]')
    .forEach((button) => {
      button.addEventListener("click", (e) => {
        // Trova il modal padre più vicino
        const modal = e.target.closest(".modal");
        if (modal) {
          modal.classList.remove("active");

          // Se è un modal annidato, rimuovi anche la classe nested
          if (modal.classList.contains("nested")) {
            modal.classList.remove("nested");
            // Rimuovi anche la classe parent-modal dai modal genitori
            document
              .querySelectorAll(".parent-modal")
              .forEach((parentModal) => {
                parentModal.classList.remove("parent-modal");
              });
          }
        }
      });
    });

  // Modal tavolo
  document.getElementById("saveTableBtn").addEventListener("click", saveTable);

  // Modal prodotto menu
  document
    .getElementById("saveItemBtn")
    .addEventListener("click", saveMenuItem);

  // Modal categoria
  document
    .getElementById("saveCategoryBtn")
    .addEventListener("click", saveCategory);

  // Modal prodotto ordine
  document
    .getElementById("saveOrderItemBtn")
    .addEventListener("click", saveOrderItem);

  // Modal sconto
  document
    .getElementById("saveDiscountBtn")
    .addEventListener("click", saveDiscount);

  // Modal conferma chiusura
  document
    .getElementById("confirmCloseBtn")
    .addEventListener("click", closeOrder);

  // Modal ingrediente
  document
    .getElementById("saveIngredientBtn")
    .addEventListener("click", saveIngredient);
  // Modal coperti
  document
    .getElementById("saveCoversBtn")
    .addEventListener("click", saveCovers);

  // Controlli + e - per il modal coperti
  document.getElementById("increaseCoversBtn").addEventListener("click", () => {
    const input = document.getElementById("coversCount");
    input.value = parseInt(input.value) + 1;
  });

  document.getElementById("decreaseCoversBtn").addEventListener("click", () => {
    const input = document.getElementById("coversCount");
    const currentValue = parseInt(input.value);
    if (currentValue > 0) {
      input.value = currentValue - 1;
    }
  });
  // Modal impostazioni
  document
    .getElementById("saveSettingsBtn")
    .addEventListener("click", saveSettings);
  // Chiusura dei modal quando si fa click all'esterno
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      // Chiudi il modal solo se il click è sul backdrop (non sul contenuto)
      if (e.target === this) {
        this.classList.remove("active");
        // Se è un modal annidato, rimuovi anche la classe nested
        if (this.classList.contains("nested")) {
          this.classList.remove("nested");
          // Rimuovi anche la classe parent-modal dai modal genitori
          document.querySelectorAll(".parent-modal").forEach((parentModal) => {
            parentModal.classList.remove("parent-modal");
          });
        }
      }
    });
  });
  function removeModalListeners() {
    document
      .getElementById("addAdditionBtn")
      .removeEventListener("click", showIngredientModal);
    document
      .getElementById("addRemovalBtn")
      .removeEventListener("click", showIngredientModal);
  }

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("hidden", removeModalListeners);
  });
}

function showEditItemModal(item) {
  document.getElementById("menuItemModalTitle").textContent =
    "Modifica Prodotto";
  document.getElementById("itemName").value = item.name;
  document.getElementById("itemPrice").value = item.price;
  document.getElementById("itemDescription").value = item.description || "";

  // Popola le opzioni per le categorie
  const categorySelect = document.getElementById("itemCategory");
  categorySelect.innerHTML = "";

  appState.menu.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });

  categorySelect.value = item.categoryId;

  // NUOVO: Pulisci e popola le varianti
  const variantsContainer = document.getElementById("variantsContainer");
  if (variantsContainer) {
    variantsContainer.innerHTML = "";

    // Se il prodotto ha varianti, aggiungile
    if (item.variants && item.variants.length > 0) {
      item.variants.forEach((variant) => {
        addVariantRow(variant.name, variant.price);
      });
    }
  }

  // Salva l'ID dell'item da modificare come attributo del pulsante salva
  document.getElementById("saveItemBtn").setAttribute("data-id", item.id);

  // Mostra il modal
  document.getElementById("menuItemModal").classList.add("active");
}

function showAddItemModal() {
  document.getElementById("menuItemModalTitle").textContent = "Nuovo Prodotto";
  document.getElementById("itemName").value = "";
  document.getElementById("itemPrice").value = "";
  document.getElementById("itemDescription").value = "";

  // Popola le opzioni per le categorie
  const categorySelect = document.getElementById("itemCategory");
  categorySelect.innerHTML = "";

  appState.menu.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });

  // Seleziona la prima categoria per default
  if (appState.menu.categories.length > 0) {
    categorySelect.value = appState.menu.categories[0].id;
  }

  // NUOVO: Pulisci le varianti
  const variantsContainer = document.getElementById("variantsContainer");
  if (variantsContainer) {
    variantsContainer.innerHTML = "";
  }

  // Rimuovi l'ID dell'item da modificare
  document.getElementById("saveItemBtn").removeAttribute("data-id");

  // Mostra il modal
  document.getElementById("menuItemModal").classList.add("active");
}
function addVariantRow(name = "", price = "") {
  const container = document.getElementById("variantsContainer");
  if (!container) {
    console.error("Container varianti non trovato");
    return;
  }

  const variantRow = document.createElement("div");
  variantRow.className = "variant-row";
  variantRow.style.cssText =
    "display: flex; gap: 10px; margin-bottom: 10px; align-items: center;";
  variantRow.innerHTML = `
    <input type="text" class="form-control variant-name-input" placeholder="Nome (es. Piccole)" value="${name}" style="flex: 1;">
    <input type="number" class="form-control variant-price-input" placeholder="Prezzo" step="0.01" value="${price}" style="width: 100px;">
    <button type="button" onclick="removeVariantRow(this)" class="btn btn-danger btn-sm" style="width: 40px;">×</button>
  `;
  container.appendChild(variantRow);
}

function removeVariantRow(button) {
  button.parentElement.remove();
}
function showAddTableModal() {
  document.getElementById("tableModalTitle").textContent = "Nuovo Tavolo";
  document.getElementById("tablePrefix").value = "";
  document.getElementById("tableNumber").value = "";
  document.getElementById("tableCustomName").value = "";
  document.getElementById("tableStatus").value = "new";

  // Rimuovi l'ID del tavolo da modificare
  document.getElementById("saveTableBtn").removeAttribute("data-id");

  // Mostra il modal
  document.getElementById("tableModal").classList.add("active");
}

async function showAddTakeawayModal() {
  // Trova il numero progressivo più alto
  let maxNumber = 0;
  appState.takeaways.forEach((takeaway) => {
    if (takeaway.number > maxNumber) {
      maxNumber = takeaway.number;
    }
  });

  // Crea un nuovo asporto
  const newTakeaway = {
    id: generateId(),
    number: maxNumber + 1,
    status: "new",
    order: {
      items: [],
      discount: 0,
      discountType: "percentage",
      discountReason: "",
      customerName: "",
      customerPhone: "",
      createdAt: new Date().toISOString(),
    },
  };

  appState.takeaways.push(newTakeaway);
  saveData();
  renderTakeaways();

  // NUOVO: Emetti evento per sincronizzare
  if (api && api.socket && api.socket.connected) {
    api.socket.emit("nuovo_tavolo_asporto", {
      type: "takeaway",
      data: newTakeaway,
    });
    console.log("📡 Nuovo asporto emesso:", newTakeaway);
  }
}

function showEditOrderItemModal(itemIndex) {
  let orderObject;

  if (appState.currentOrderType === "table") {
    const table = appState.tables.find((t) => t.id === appState.currentOrderId);
    if (!table) return;
    orderObject = table.order;
  } else if (appState.currentOrderType === "takeaway") {
    const takeaway = appState.takeaways.find(
      (t) => t.id === appState.currentOrderId
    );
    if (!takeaway) return;
    orderObject = takeaway.order;
  } else if (appState.currentOrderType === "delivery") {
    const delivery = appState.deliveries.find(
      (d) => d.id === appState.currentOrderId
    );
    if (!delivery) return;
    orderObject = delivery.order;
  } else {
    return;
  }

  const item = orderObject.items[itemIndex]; // FIX: usa itemIndex non index
  if (!item) return;

  // Pulisci eventuali pulsanti di modifica mezze familiari
  const existingEditBtn = document.getElementById("editHalfFamilyBtn");
  if (existingEditBtn) {
    existingEditBtn.remove();
  }

  document.getElementById(
    "orderItemModalTitle"
  ).textContent = `Modifica ${item.name}`;
  document.getElementById("orderItemQuantity").value = item.quantity;
  document.getElementById("orderItemDiscount").value = item.discount;
  document.getElementById("orderItemComplement").checked = item.isComplement;
  document.getElementById("orderItemNotes").value = item.notes || "";

  // Trova il prodotto corrispondente nel menu per determinare la categoria
  const menuItem = appState.menu.items.find(
    (menuItem) => menuItem.name === item.name
  );

  // Determina se è una pizza o schiacciata in base alla categoria o al nome
  const isPizzaCategory =
    menuItem &&
    (menuItem.categoryId === "pizze-classiche" ||
      menuItem.categoryId === "pizze-speciali" ||
      menuItem.categoryId === "pizze-create" ||
      menuItem.categoryId === "schiacciate" ||
      item.name.toLowerCase().includes("pizza") ||
      item.name.toLowerCase().includes("margherita") ||
      item.name.toLowerCase().includes("diavola") ||
      item.name.toLowerCase().includes("romana") ||
      item.name.toLowerCase().includes("calzone"));

  // Gestione opzione pizza familiare
  if (isPizzaCategory) {
    document.getElementById("familyOptionContainer").classList.remove("hidden");
    document.getElementById("orderItemFamily").checked = item.isFamily || false;

    // Mostra anche le opzioni per gli ingredienti delle pizze
    document.getElementById("pizzaOptionsContainer").classList.remove("hidden");

    // Popola contenitori aggiunzioni e rimozioni
    const additionsContainer = document.getElementById("additionsContainer");
    const removalsContainer = document.getElementById("removalsContainer");

    additionsContainer.innerHTML = "";
    removalsContainer.innerHTML = "";

    // Popola le aggiunzioni esistenti
    if (item.additions && item.additions.length > 0) {
      item.additions.forEach((addition, i) => {
        const additionRow = document.createElement("div");
        additionRow.className = "flex items-center justify-between";
        additionRow.innerHTML = `
                    <span>${addition.name} (+€${formatPrice(
          addition.price
        )})</span>
                    <button class="btn btn-sm btn-icon btn-danger remove-addition" data-index="${i}">🗑️</button>
                `;
        additionsContainer.appendChild(additionRow);
      });
    }

    // Popola le rimozioni esistenti
    if (item.removals && item.removals.length > 0) {
      item.removals.forEach((removal, i) => {
        const removalRow = document.createElement("div");
        removalRow.className = "flex items-center justify-between";
        removalRow.innerHTML = `
                    <span>${removal}</span>
                    <button class="btn btn-sm btn-icon btn-danger remove-removal" data-index="${i}">🗑️</button>
                `;
        removalsContainer.appendChild(removalRow);
      });
    }

    // Event listener per rimuovere aggiunzioni
    document.querySelectorAll(".remove-addition").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const removalIndex = parseInt(button.getAttribute("data-index"));
        item.additions.splice(removalIndex, 1);
        showEditOrderItemModal(itemIndex); // FIX: usa itemIndex
      });
    });

    // Event listener per rimuovere rimozioni
    document.querySelectorAll(".remove-removal").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const removalIndex = parseInt(button.getAttribute("data-index"));
        item.removals.splice(removalIndex, 1);
        showEditOrderItemModal(itemIndex); // FIX: usa itemIndex
      });
    });

    // Event listener per aggiungere ingredienti
    const addAdditionBtn = document.getElementById("addAdditionBtn");
    if (addAdditionBtn) {
      // Rimuovi eventuali listener precedenti per evitare duplicazioni
      const newAddAdditionBtn = addAdditionBtn.cloneNode(true);
      addAdditionBtn.parentNode.replaceChild(newAddAdditionBtn, addAdditionBtn);
      newAddAdditionBtn.addEventListener("click", () => {
        showIngredientModal("addition", itemIndex); // FIX: usa itemIndex
      });
    }

    // Event listener per rimuovere ingredienti
    const addRemovalBtn = document.getElementById("addRemovalBtn");
    if (addRemovalBtn) {
      // Rimuovi eventuali listener precedenti per evitare duplicazioni
      const newAddRemovalBtn = addRemovalBtn.cloneNode(true);
      addRemovalBtn.parentNode.replaceChild(newAddRemovalBtn, addRemovalBtn);
      newAddRemovalBtn.addEventListener("click", () => {
        showIngredientModal("removal", itemIndex); // FIX: usa itemIndex
      });
    }
  } else {
    document.getElementById("familyOptionContainer").classList.add("hidden");
    document.getElementById("pizzaOptionsContainer").classList.add("hidden");
  }

  // Gestione speciale per le mezze familiari
  if (item.isHalfFamily) {
    // Nascondi l'opzione famiglia normale
    document.getElementById("familyOptionContainer").classList.add("hidden");

    // Aggiungi listener per il pulsante di modifica completa
    const editFullBtn = document.createElement("button");
    editFullBtn.className = "btn btn-outline mb-2";
    editFullBtn.id = "editHalfFamilyBtn";
    editFullBtn.textContent = "Modifica selezione pizze";
    editFullBtn.style.width = "100%";
    editFullBtn.onclick = () => {
      document.getElementById("orderItemModal").classList.remove("active");
      showHalfFamilyModal(itemIndex);
    };

    // Inserisci il pulsante all'inizio del modal body
    const modalBody = document.querySelector("#orderItemModal .modal-body");
    modalBody.insertBefore(editFullBtn, modalBody.firstChild);
  }
  // Salva l'indice dell'item da modificare come attributo del pulsante salva
  document
    .getElementById("saveOrderItemBtn")
    .setAttribute("data-index", itemIndex); // FIX: usa itemIndex

  // Mostra il modal
  document.getElementById("orderItemModal").classList.add("active");
}

function showIngredientModal(type, orderItemIndex) {
  // Prima di mostrare il modal ingredienti, applica la classe parent-modal al modal ordine
  document.getElementById("orderItemModal").classList.add("parent-modal");

  const isAddition = type === "addition";

  // NUOVO: Ottieni l'item corrente per sapere quali ingredienti ha
  let orderObject;
  let currentItem = null;

  if (appState.currentOrderType === "table") {
    const table = appState.tables.find((t) => t.id === appState.currentOrderId);
    if (table) orderObject = table.order;
  } else if (appState.currentOrderType === "takeaway") {
    const takeaway = appState.takeaways.find(
      (t) => t.id === appState.currentOrderId
    );
    if (takeaway) orderObject = takeaway.order;
  } else if (appState.currentOrderType === "delivery") {
    const delivery = appState.deliveries.find(
      (d) => d.id === appState.currentOrderId
    );
    if (delivery) orderObject = delivery.order;
  }

  if (orderObject && orderObject.items && orderObject.items[orderItemIndex]) {
    currentItem = orderObject.items[orderItemIndex];
  }

  // Imposta il titolo del modal
  document.getElementById("ingredientModalTitle").textContent = isAddition
    ? "Aggiungi Ingrediente"
    : "Rimuovi Ingrediente";

  // Mostra/nascondi il campo prezzo in base al tipo
  document.getElementById("additionPriceGroup").style.display = isAddition
    ? "block"
    : "none";

  // Reset dei campi
  if (!isAddition) {
    // MODIFICA: Per le rimozioni, usa un SELECT con ingredienti filtrati
    const ingredientNameLabel = document.querySelector(
      "label[for='ingredientName']"
    );
    if (ingredientNameLabel) {
      ingredientNameLabel.textContent = "Nome Ingrediente da Rimuovere";
    }

    const parentNode = document.querySelector(
      "label[for='ingredientName']"
    ).parentNode;

    // Crea un SELECT invece di un input
    const select = document.createElement("select");
    select.id = "ingredientSelect";
    select.className = "form-control";

    // NUOVO: Filtra gli ingredienti in base a quelli presenti nella pizza
    let availableIngredients = [];

    if (currentItem) {
      // Gestisci il caso delle mezze familiari
      if (window.currentHalfEdit && window.currentHalfEdit.half) {
        const half = window.currentHalfEdit.half;
        const pizzaName = currentItem[half + "Half"]?.name;

        if (pizzaName) {
          const menuItem = appState.menu.items.find(
            (m) => m.name === pizzaName
          );

          if (
            menuItem &&
            menuItem.ingredients &&
            menuItem.ingredients.length > 0
          ) {
            availableIngredients = appState.ingredients.filter((ing) =>
              menuItem.ingredients.includes(ing.id)
            );

            // Aggiungi ingredienti già aggiunti a questa metà
            const halfData = currentItem[half + "Half"];
            if (
              halfData &&
              halfData.additions &&
              halfData.additions.length > 0
            ) {
              halfData.additions.forEach((addition) => {
                if (
                  !availableIngredients.find((ing) => ing.id === addition.id)
                ) {
                  const addedIngredient = appState.ingredients.find(
                    (ing) => ing.id === addition.id
                  );
                  if (addedIngredient) {
                    availableIngredients.push(addedIngredient);
                  }
                }
              });
            }
          }
        }
      } else {
        // Pizza normale (non mezza familiare)
        const menuItem = appState.menu.items.find(
          (m) => m.name === currentItem.name
        );

        if (
          menuItem &&
          menuItem.ingredients &&
          menuItem.ingredients.length > 0
        ) {
          // Prendi solo gli ingredienti che sono effettivamente nella pizza
          availableIngredients = appState.ingredients.filter((ing) =>
            menuItem.ingredients.includes(ing.id)
          );

          // Aggiungi anche gli ingredienti che sono stati aggiunti come modifiche
          if (currentItem.additions && currentItem.additions.length > 0) {
            currentItem.additions.forEach((addition) => {
              if (!availableIngredients.find((ing) => ing.id === addition.id)) {
                const addedIngredient = appState.ingredients.find(
                  (ing) => ing.id === addition.id
                );
                if (addedIngredient) {
                  availableIngredients.push(addedIngredient);
                }
              }
            });
          }
        }
      }
    }

    // Se non abbiamo trovato ingredienti o la pizza non ha ingredienti definiti, mostra tutti
    if (availableIngredients.length === 0) {
      availableIngredients = appState.ingredients;
    }

    // Aggiungi un'opzione vuota iniziale
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "-- Seleziona ingrediente da rimuovere --";
    select.appendChild(emptyOption);

    // Aggiungi le opzioni al select
    availableIngredients.forEach((ingredient) => {
      const option = document.createElement("option");
      option.value = ingredient.name; // Per le rimozioni usiamo il nome
      option.textContent = ingredient.name;
      select.appendChild(option);
    });

    // Sostituisci l'elemento esistente
    const oldElement =
      document.getElementById("ingredientSelect") ||
      document.getElementById("ingredientName");
    if (oldElement) {
      parentNode.replaceChild(select, oldElement);
    }
  } else {
    // Per le aggiunzioni, mantieni il comportamento esistente
    const ingredientNameLabel = document.querySelector(
      "label[for='ingredientName']"
    );
    if (ingredientNameLabel) {
      ingredientNameLabel.textContent = "Nome Ingrediente";
    }

    const parentNode = document.querySelector(
      "label[for='ingredientName']"
    ).parentNode;

    const select = document.createElement("select");
    select.id = "ingredientSelect";
    select.className = "form-control";

    // Aggiungi le opzioni al select
    appState.ingredients.forEach((ingredient) => {
      const option = document.createElement("option");
      option.value = ingredient.id;
      option.textContent = `${ingredient.name} (+€${formatPrice(
        ingredient.price
      )})`;
      option.dataset.price = ingredient.price;
      select.appendChild(option);
    });

    // Sostituisci l'elemento esistente
    const oldElement =
      document.getElementById("ingredientSelect") ||
      document.getElementById("ingredientName");
    if (oldElement) {
      parentNode.replaceChild(select, oldElement);
    }

    // Imposta il prezzo iniziale
    if (appState.ingredients.length > 0) {
      document.getElementById("ingredientPrice").value =
        appState.ingredients[0].price;
    }

    // Event listener per aggiornare il prezzo quando si seleziona un ingrediente
    select.addEventListener("change", function () {
      const selectedOption = this.options[this.selectedIndex];
      const price = selectedOption.dataset.price;
      document.getElementById("ingredientPrice").value = price;
    });
  }

  // Salva l'indice dell'item e il tipo come attributi del pulsante salva
  document
    .getElementById("saveIngredientBtn")
    .setAttribute("data-index", orderItemIndex);
  document.getElementById("saveIngredientBtn").setAttribute("data-type", type);

  // Aggiungi classe nested al modal degli ingredienti
  const ingredientModal = document.getElementById("ingredientModal");
  ingredientModal.classList.add("nested");

  // Mostra il modal
  ingredientModal.classList.add("active");
}

/// Modifica questa funzione sostituendola completamente
function saveIngredient() {
  const orderItemIndex = parseInt(
    document.getElementById("saveIngredientBtn").getAttribute("data-index")
  );
  const type = document
    .getElementById("saveIngredientBtn")
    .getAttribute("data-type");

  let orderObject;

  if (appState.currentOrderType === "table") {
    const table = appState.tables.find((t) => t.id === appState.currentOrderId);
    if (!table || table.status === "closed") return;
    orderObject = table.order;
  } else if (appState.currentOrderType === "takeaway") {
    const takeaway = appState.takeaways.find(
      (t) => t.id === appState.currentOrderId
    );
    if (!takeaway || takeaway.status === "closed") return;
    orderObject = takeaway.order;
  } else if (appState.currentOrderType === "delivery") {
    // AGGIUNGI supporto delivery
    const delivery = appState.deliveries.find(
      (d) => d.id === appState.currentOrderId
    );
    if (!delivery || delivery.status === "delivered") return;
    orderObject = delivery.order;
  } else {
    return;
  }

  const item = orderObject.items[orderItemIndex];
  if (!item) return;

  if (type === "addition") {
    // Per le aggiunzioni, prendiamo l'ingrediente selezionato dal dropdown
    const selectElement = document.getElementById("ingredientSelect");
    if (!selectElement) return;

    const selectedIngredientId = selectElement.value;
    const selectedIngredient = appState.ingredients.find(
      (i) => i.id === selectedIngredientId
    );

    if (!selectedIngredient) return;

    // Inizializza l'array delle aggiunzioni se non esiste
    if (!item.additions) {
      item.additions = [];
    }

    // RIMUOVI IL CONTROLLO CHE BLOCCA L'AGGIUNTA MULTIPLA
    // Permetti di aggiungere lo stesso ingrediente più volte

    // Aggiungi l'ingrediente alle aggiunzioni
    item.additions.push({
      id: selectedIngredient.id,
      name: selectedIngredient.name,
      price:
        parseFloat(document.getElementById("ingredientPrice").value) ||
        selectedIngredient.price,
    });
  } else if (type === "removal") {
    // MODIFICA: Usa il select invece dell'input
    const selectElement = document.getElementById("ingredientSelect");

    if (!selectElement || !selectElement.value) {
      alert("Seleziona un ingrediente da rimuovere.");
      return;
    }

    const ingredientName = selectElement.value;

    // Inizializza l'array delle rimozioni se non esiste
    if (!item.removals) {
      item.removals = [];
    }

    // Permetti rimozioni multiple dello stesso ingrediente
    item.removals.push(ingredientName);
  }

  saveData();

  // Chiudi il modal degli ingredienti
  const ingredientModal = document.getElementById("ingredientModal");
  ingredientModal.classList.remove("active");
  ingredientModal.classList.remove("nested");

  // Rimuovi la classe parent-modal dal modal ordine
  document.getElementById("orderItemModal").classList.remove("parent-modal");

  // Riapri quello di modifica dell'item
  showEditOrderItemModal(orderItemIndex);
}

function showDiscountModal() {
  let orderObject;

  if (appState.currentOrderType === "table") {
    const table = appState.tables.find((t) => t.id === appState.currentOrderId);
    if (!table || table.status === "closed") return;
    orderObject = table.order;
  } else if (appState.currentOrderType === "takeaway") {
    const takeaway = appState.takeaways.find(
      (t) => t.id === appState.currentOrderId
    );
    if (!takeaway || takeaway.status === "closed") return;
    orderObject = takeaway.order;
  } else if (appState.currentOrderType === "delivery") {
    // AGGIUNGI QUESTO
    const delivery = appState.deliveries.find(
      (d) => d.id === appState.currentOrderId
    );
    if (!delivery || delivery.status === "delivered") return;
    orderObject = delivery.order;
  } else {
    return;
  }

  // Resto del codice...

  // Imposta il tipo di sconto
  document.getElementById("discountType").value =
    orderObject.discountType || "percentage";

  // Imposta il valore dello sconto
  document.getElementById("discountValue").value = orderObject.discount || 0;

  // Imposta la motivazione dello sconto
  document.getElementById("discountReason").value =
    orderObject.discountReason || "";

  // Mostra il modal
  document.getElementById("discountModal").classList.add("active");
}

function showConfirmCloseModal() {
  document.getElementById("confirmCloseModal").classList.add("active");
}

// Funzioni per salvare i dati dai modals
function saveTable() {
  const prefix = document.getElementById("tablePrefix").value.trim();
  const number = parseInt(document.getElementById("tableNumber").value);
  const customName = document.getElementById("tableCustomName").value.trim();
  const status = document.getElementById("tableStatus").value;

  // Verifica che sia stato inserito almeno un numero o un nome personalizzato
  if ((isNaN(number) || number <= 0) && customName === "") {
    alert(
      "Inserisci un numero valido per il tavolo oppure un nome personalizzato."
    );
    return;
  }

  // Controlla se stiamo modificando un tavolo esistente
  const tableId = document
    .getElementById("saveTableBtn")
    .getAttribute("data-id");

  let newTable = null; // Dichiarato fuori dall'if/else

  if (tableId) {
    // Stiamo modificando un tavolo esistente
    const tableIndex = appState.tables.findIndex((t) => t.id === tableId);
    if (tableIndex !== -1) {
      appState.tables[tableIndex].prefix = prefix;
      appState.tables[tableIndex].number = number;
      appState.tables[tableIndex].customName = customName;
      appState.tables[tableIndex].status = status;
    }
  } else {
    // Stiamo creando un nuovo tavolo
    newTable = {
      id: generateId(),
      prefix: prefix,
      number: number,
      customName: customName,
      status: status,
      order: {
        items: [],
        discount: 0,
        discountType: "percentage",
        discountReason: "",
        covers: 0,
        createdAt: new Date().toISOString(),
      },
    };

    appState.tables.push(newTable);
  }

  saveData();
  renderTables();

  // Emetti evento per sincronizzare il nuovo tavolo
  if (!tableId && newTable && api && api.socket && api.socket.connected) {
    api.socket.emit("nuovo_tavolo_asporto", {
      type: "table",
      data: newTable,
    });
    console.log("📡 Nuovo tavolo emesso:", newTable);
  }

  // Chiudi il modal
  document.getElementById("tableModal").classList.remove("active");
}

function saveMenuItem() {
  const name = document.getElementById("itemName").value.trim();
  const price = parseFloat(document.getElementById("itemPrice").value);
  const categoryId = document.getElementById("itemCategory").value;
  const description = document.getElementById("itemDescription").value.trim();

  if (name === "") {
    alert("Inserisci un nome per il prodotto.");
    return;
  }

  if (isNaN(price) || price < 0) {
    alert("Inserisci un prezzo valido per il prodotto.");
    return;
  }

  // NUOVO: Raccogli le varianti
  const variants = [];
  const variantRows = document.querySelectorAll(".variant-row");
  variantRows.forEach((row) => {
    const variantName = row.querySelector(".variant-name-input").value.trim();
    const variantPrice = parseFloat(
      row.querySelector(".variant-price-input").value
    );
    if (variantName && !isNaN(variantPrice) && variantPrice >= 0) {
      variants.push({ name: variantName, price: variantPrice });
    }
  });

  // Controlla se stiamo modificando un prodotto esistente
  const itemId = document.getElementById("saveItemBtn").getAttribute("data-id");

  if (itemId) {
    // Stiamo modificando un prodotto esistente
    const itemIndex = appState.menu.items.findIndex((i) => i.id === itemId);
    if (itemIndex !== -1) {
      appState.menu.items[itemIndex].name = name;
      appState.menu.items[itemIndex].price = price;
      appState.menu.items[itemIndex].categoryId = categoryId;
      appState.menu.items[itemIndex].description = description;

      // NUOVO: Salva le varianti
      if (variants.length > 0) {
        appState.menu.items[itemIndex].variants = variants;
        appState.menu.items[itemIndex].defaultVariant = variants[0].name;
      } else {
        // Rimuovi le varianti se sono state cancellate tutte
        delete appState.menu.items[itemIndex].variants;
        delete appState.menu.items[itemIndex].defaultVariant;
      }
    }
  } else {
    // Stiamo creando un nuovo prodotto
    const newItem = {
      id: generateId(),
      name: name,
      price: price,
      categoryId: categoryId,
      description: description,
    };

    // NUOVO: Aggiungi le varianti se presenti
    if (variants.length > 0) {
      newItem.variants = variants;
      newItem.defaultVariant = variants[0].name;
    }

    appState.menu.items.push(newItem);
  }

  // Salva i dati (chiamata una sola volta)
  saveData();

  // Se siamo nell'editor del menu, aggiorniamo la visualizzazione
  if (document.getElementById("menu-editor").classList.contains("active")) {
    // Trova la categoria attiva
    const activeCategory = document
      .querySelector("#editorCategoryTabs .category-tab.active")
      .getAttribute("data-category");
    renderMenuItemsForEditor(activeCategory);
  }

  // Chiudi il modal
  document.getElementById("menuItemModal").classList.remove("active");
}

function saveCategory() {
  const name = document.getElementById("categoryName").value.trim();

  if (name === "") {
    alert("Inserisci un nome per la categoria.");
    return;
  }

  // Crea un nuovo ID basato sul nome (lowercase e con trattini invece di spazi)
  const id = name.toLowerCase().replace(/\s+/g, "-");

  // Controlla se esiste già una categoria con lo stesso ID
  const categoryExists = appState.menu.categories.some((c) => c.id === id);

  if (categoryExists) {
    alert("Esiste già una categoria con questo nome.");
    return;
  }

  // Aggiungi la nuova categoria
  appState.menu.categories.push({
    id: id,
    name: name,
  });

  saveData();
  renderMenuEditor();

  // Chiudi il modal
  document.getElementById("categoryModal").classList.remove("active");
}

function saveOrderItem() {
  const index = parseInt(
    document.getElementById("saveOrderItemBtn").getAttribute("data-index")
  );
  let orderObject;

  if (appState.currentOrderType === "table") {
    const table = appState.tables.find((t) => t.id === appState.currentOrderId);
    if (!table || table.status === "closed") return;
    orderObject = table.order;
  } else if (appState.currentOrderType === "takeaway") {
    const takeaway = appState.takeaways.find(
      (t) => t.id === appState.currentOrderId
    );
    if (!takeaway || takeaway.status === "closed") return;
    orderObject = takeaway.order;
  } else if (appState.currentOrderType === "delivery") {
    // AGGIUNTO: Gestione per i domicili
    const delivery = appState.deliveries.find(
      (d) => d.id === appState.currentOrderId
    );
    if (!delivery || delivery.status === "delivered") return;
    orderObject = delivery.order;
  } else {
    return;
  }

  const item = orderObject.items[index];
  if (!item) return;

  // Aggiorna i dati dell'item
  item.quantity =
    parseInt(document.getElementById("orderItemQuantity").value) || 1;
  item.discount =
    parseFloat(document.getElementById("orderItemDiscount").value) || 0;
  item.isComplement = document.getElementById("orderItemComplement").checked;
  item.isFamily = document.getElementById("orderItemFamily").checked;
  item.notes = document.getElementById("orderItemNotes").value.trim();

  saveData();

  // Emetti evento WebSocket
  emitOrderUpdate();

  renderOrderDetails();

  // Chiudi il modal
  document.getElementById("orderItemModal").classList.remove("active");
}
async function createServerOrder(tableOrTakeaway, type) {
  if (!api) return;

  try {
    // Filtra items non validi prima di inviare al server
    const validItems = tableOrTakeaway.order.items.filter(
      (item) => item && item.name
    );

    const orderData = {
      numero_ordine: `${type}-${tableOrTakeaway.id}-${Date.now()}`,
      tavolo:
        type === "table"
          ? `${tableOrTakeaway.prefix || ""} ${
              tableOrTakeaway.number || tableOrTakeaway.customName || ""
            }`
          : `Asporto #${tableOrTakeaway.number}`,
      articoli: validItems.map((item) => ({
        nome: item.name,
        prezzo: item.basePrice || 0,
        quantita: item.quantity || 1,
        note: item.notes || "",
      })),
      note: tableOrTakeaway.order.notes || "",
    };

    console.log("📤 Invio ordine al server:", orderData);

    const result = await api.salvaOrdine(orderData);
    console.log("✅ Ordine salvato sul server:", result);

    // Salva l'ID dell'ordine del server nell'oggetto locale
    tableOrTakeaway.serverOrderId = result.ordine.id;

    return result;
  } catch (error) {
    console.error("❌ Errore creazione ordine sul server:", error);
    // Non bloccare la chiusura se il server non risponde
    return null;
  }
}

function setupTakeawayFilters() {
  const filterSelect = document.getElementById("takeawayStatusFilter");
  if (filterSelect) {
    filterSelect.addEventListener("change", () => {
      renderTakeaways(filterSelect.value);
    });
  }
}

// Sostituisci la funzione saveDiscount
function saveDiscount() {
  const discountType = document.getElementById("discountType").value;
  const discountValue =
    parseFloat(document.getElementById("discountValue").value) || 0;
  const discountReason = document.getElementById("discountReason").value.trim();

  if (
    discountType === "percentage" &&
    (discountValue < 0 || discountValue > 100)
  ) {
    alert("La percentuale di sconto deve essere compresa tra 0 e 100");
    return;
  }

  if (discountType === "fixed" && discountValue < 0) {
    alert("Lo sconto fisso non può essere negativo");
    return;
  }

  let orderObject;

  if (appState.currentOrderType === "table") {
    const table = appState.tables.find((t) => t.id === appState.currentOrderId);
    if (!table || table.status === "closed") return;
    orderObject = table.order;
  } else if (appState.currentOrderType === "takeaway") {
    const takeaway = appState.takeaways.find(
      (t) => t.id === appState.currentOrderId
    );
    if (!takeaway || takeaway.status === "closed") return;
    orderObject = takeaway.order;
  } else if (appState.currentOrderType === "delivery") {
    // AGGIUNGI QUESTO
    const delivery = appState.deliveries.find(
      (d) => d.id === appState.currentOrderId
    );
    if (!delivery || delivery.status === "delivered") return;
    orderObject = delivery.order;
  } else {
    return;
  }

  // Aggiorna i dati dello sconto
  orderObject.discountType = discountType;
  orderObject.discount = discountValue;
  orderObject.discountReason = discountReason;

  saveData();
  renderOrderDetails();

  // Chiudi il modal
  document.getElementById("discountModal").classList.remove("active");
}

async function closeOrder() {
  if (appState.currentOrderType === "delivery") {
    const delivery = appState.deliveries.find(
      (d) => d.id === appState.currentOrderId
    );
    if (!delivery) return;

    if (delivery.status === "pending") {
      // Se non ha ancora pagamento, apri modal pagamento
      if (!delivery.payment) {
        openPaymentModal(delivery.id);
      } else {
        // Se ha già pagamento, metti in consegna
        delivery.status = "delivering";
        saveData();
        renderDeliveries();
        showMainView();
      }
    } else if (delivery.status === "delivering") {
      // Completa la consegna
      completeDelivery(delivery.id);
    }

    // Chiudi il modal di conferma se aperto
    document.getElementById("confirmCloseModal").classList.remove("active");
    return;
  }
  if (appState.currentOrderType === "table") {
    const table = appState.tables.find((t) => t.id === appState.currentOrderId);
    if (!table || table.status === "closed") return;

    // Salva l'ordine sul server prima di chiuderlo
    await createServerOrder(table, "table");

    // Imposta lo stato del tavolo a 'closed'
    table.status = "closed";

    // Aggiungi la data di chiusura all'ordine
    table.order.closedAt = new Date().toISOString();
  } else if (appState.currentOrderType === "takeaway") {
    const takeaway = appState.takeaways.find(
      (t) => t.id === appState.currentOrderId
    );
    if (!takeaway || takeaway.status === "closed") return;

    // Salva l'ordine sul server prima di chiuderlo
    await createServerOrder(takeaway, "takeaway");

    // Imposta lo stato dell'asporto a 'closed'
    takeaway.status = "closed";

    // Aggiungi la data di chiusura all'ordine
    takeaway.order.closedAt = new Date().toISOString();
  } else {
    return;
  }

  saveData();

  // Emetti evento per sincronizzare la chiusura
  if (api && api.socket && api.socket.connected) {
    api.socket.emit("ordine_chiuso", {
      id: appState.currentOrderId,
      type: appState.currentOrderType,
      status: "closed",
    });
    console.log("📡 Ordine chiuso emesso");
  }

  // Chiudi il modal di conferma
  document.getElementById("confirmCloseModal").classList.remove("active");
  // Torna alla vista dei tavoli
  showTablesView();

  // Aggiorna la visualizzazione dei tavoli e degli asporti
  renderTables();
  renderTakeaways();
}

function saveSettings() {
  appState.settings.restaurantName = document
    .getElementById("restaurantName")
    .value.trim();
  appState.settings.coverCharge =
    parseFloat(document.getElementById("coverCharge").value) || 0;

  saveData();
  updateUI();

  // Chiudi il modal
  document.getElementById("settingsModal").classList.remove("active");
}

// Funzioni per la stampa
function printOrder() {
  let orderObject;
  let orderTitle;

  if (appState.currentOrderType === "table") {
    const table = appState.tables.find((t) => t.id === appState.currentOrderId);
    if (!table) return;
    orderObject = table.order;

    // Gestione del nome del tavolo per la stampa comanda
    if (table.customName) {
      orderTitle = `Tavolo ${table.prefix ? table.prefix + " " : ""}${
        table.customName
      }`;
    } else {
      orderTitle = `Tavolo ${table.prefix ? table.prefix + " " : ""}${
        table.number
      }`;
    }
  } else if (appState.currentOrderType === "takeaway") {
    const takeaway = appState.takeaways.find(
      (t) => t.id === appState.currentOrderId
    );
    if (!takeaway) return;
    orderObject = takeaway.order;
    orderTitle = `Asporto #${takeaway.number}`;
  } else if (appState.currentOrderType === "delivery") {
    const delivery = appState.deliveries.find(
      (d) => d.id === appState.currentOrderId
    );
    if (!delivery) return;
    orderObject = delivery.order;
    orderTitle = `Domicilio - ${delivery.customerName}`;
  } else {
    return;
  }

  // Crea una finestra di stampa
  const printWindow = window.open("", "_blank");

  // Genera il contenuto della comanda
  let content = `
        <html>
        <head>
            <title>Comanda - ${orderTitle}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-weight: bold; }
                h1 { font-size: 18px; text-align: center; margin-bottom: 10px; }
                h2 { font-size: 16px; margin-bottom: 10px; }
                .date { text-align: center; font-size: 12px; margin-bottom: 20px; }
                .item { margin-bottom: 5px; }
                .item-name { font-weight: bold; }
                .item-options { margin-left: 20px; font-size: 12px; }
                .notes { font-style: italic; margin-top: 10px; }
                .section-divider { border-top: 1px dashed #000; margin: 15px 0; }
                .riepilogo { background-color: #f0f0f0; padding: 10px; margin: 10px 0; }
                .payment-info { background: #ffeeee; border: 2px solid #ff0000; padding: 15px; margin: 20px 0; }
                .payment-info table { width: 100%; }
                .payment-info td { padding: 5px 0; }
                .resto-row { background: #ff0000; color: white; font-weight: bold; }
                h1 { font-size: 18px; text-align: center; margin-bottom: 10px; font-weight: bold; }
h2 { font-size: 16px; margin-bottom: 10px; font-weight: bold; }
.date { text-align: center; font-size: 12px; margin-bottom: 20px; font-weight: bold; }
.item { margin-bottom: 5px; font-weight: bold; }
.item-options { margin-left: 20px; font-size: 12px; font-weight: bold; }
.notes { font-style: italic; margin-top: 10px; font-weight: bold; }
.riepilogo { background-color: #f0f0f0; padding: 10px; margin: 10px 0; font-weight: bold; }
.payment-info { background: #ffeeee; border: 2px solid #ff0000; padding: 15px; margin: 20px 0; font-weight: bold; }
.payment-info td { padding: 5px 0; font-weight: bold; }
h3 { font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>${appState.settings.restaurantName}</h1>
            <h2>Comanda - ${orderTitle}</h2>
            <div class="date">${new Date().toLocaleString()}</div>
    `;

  // INFO CONSEGNA PER DOMICILIO - VERSIONE MIGLIORATA CON RESTO
  if (appState.currentOrderType === "delivery") {
    const delivery = appState.deliveries.find(
      (d) => d.id === appState.currentOrderId
    );
    if (delivery && delivery.address) {
      content += `<div style="background: #f0f0f0; padding: 10px; margin-bottom: 20px; border-radius: 5px; border: 2px solid #333;font-weight: bold;">`;
      content += `<strong style="font-size: 16px;">CONSEGNA A DOMICILIO</strong><br><br>`;

      // ORARIO RICHIESTO - Prima di tutto, in grassetto e nero
      if (delivery.deliveryTime && delivery.deliveryTime.type === "asap") {
        content += `<strong style="color: #000; font-size: 18px;">APPENA POSSIBILE</strong><br><br>`;
      } else if (delivery.scheduledTime) {
        content += `<strong style="color: #000; font-size: 18px;">ORARIO: ${delivery.scheduledTime}</strong><br><br>`;
      }

      content += `<strong>Cliente:</strong> ${delivery.customerName}<br>`;
      content += `<strong>Indirizzo:</strong> ${delivery.address}<br>`;
      if (delivery.phone)
        content += `<strong>Tel:</strong> ${delivery.phone}<br>`;
      if (delivery.notes)
        content += `<strong>Note:</strong> ${delivery.notes}<br>`;

      // SEZIONE PAGAMENTO CON RESTO
      if (delivery.payment) {
        content += `<br><div style="border-top: 1px solid #333; padding-top: 10px;">`;
        content += `<strong style="font-size: 14px;">PAGAMENTO: ${
          delivery.payment.method === "cash" ? "CONTANTI" : "POS"
        }</strong><br>`;

        if (delivery.payment.method === "cash" && delivery.payment.cashGiven) {
          // Usa la stessa logica di calcolo delle altre funzioni
          let total = 0;

          // Calcola il totale dell'ordine
          if (delivery.order && delivery.order.items) {
            delivery.order.items.forEach((item) => {
              let itemPrice = item.basePrice;

              // Prezzo doppio per le pizze familiari
              if (item.isFamily) {
                itemPrice *= 2;
              }

              // Calcola il prezzo delle aggiunzioni per le mezze familiari
              if (item.isHalfFamily) {
                if (item.firstHalf && item.firstHalf.additions) {
                  item.firstHalf.additions.forEach((addition) => {
                    itemPrice += addition.price;
                  });
                }
                if (item.secondHalf && item.secondHalf.additions) {
                  item.secondHalf.additions.forEach((addition) => {
                    itemPrice += addition.price;
                  });
                }
              }

              // Aggiungi il prezzo delle aggiunzioni normali
              if (item.additions && item.additions.length > 0) {
                item.additions.forEach((addition) => {
                  let additionPrice = addition.price;
                  if (item.isFamily) {
                    additionPrice *= 2;
                  }
                  itemPrice += additionPrice;
                });
              }

              // Applica sconto se presente
              let finalPrice = itemPrice;
              if (item.discount > 0) {
                finalPrice = itemPrice * (1 - item.discount / 100);
              }

              // Se è un omaggio, il prezzo è 0
              if (item.isComplement) {
                finalPrice = 0;
              }

              // Moltiplica per la quantità
              total += finalPrice * item.quantity;
            });
          }

          // Calcola l'importo dello sconto sull'ordine
          if (delivery.order.discount > 0) {
            let discountAmount = 0;
            if (delivery.order.discountType === "percentage") {
              discountAmount = total * (delivery.order.discount / 100);
            } else if (delivery.order.discountType === "fixed") {
              discountAmount = Math.min(delivery.order.discount, total);
            }
            total -= discountAmount;
          }

          const change = delivery.payment.cashGiven - total;

          content += `<div class="payment-info" style="margin-top: 10px;">`;
          content += `<table style="width: 100%; font-size: 14px;">`;
          content += `<tr><td><strong>Totale ordine:</strong></td><td style="text-align: right;"><strong>€${total.toFixed(
            2
          )}</strong></td></tr>`;
          content += `<tr><td>Ricevuto dal cliente:</td><td style="text-align: right;">€${delivery.payment.cashGiven.toFixed(
            2
          )}</td></tr>`;
          content += `<tr class="resto-row" style="font-size: 16px;"><td style="padding: 10px;">RESTO DA DARE:</td><td style="text-align: right; padding: 10px;">€${change.toFixed(
            2
          )}</td></tr>`;
          content += `</table>`;
          content += `</div>`;
        }
        content += `</div>`;
      }

      if (delivery.rider) {
        content += `<br><strong>RIDER:</strong> ${delivery.rider.name}`;
      }

      content += `</div>`;
    }
  }

  // Aggiungi i coperti se è un tavolo
  if (appState.currentOrderType === "table" && orderObject.covers > 0) {
    content += `<div class="item"><span class="item-name">Coperti: ${orderObject.covers}</span></div>`;
  }

  // Prepara le categorie degli items
  const antipasti = [];
  const pizzeNormali = [];
  const pizzeFamiliari = [];
  const schiacciate = [];
  const altriProdotti = [];

  if (orderObject.items && orderObject.items.length > 0) {
    orderObject.items.forEach((item) => {
      // Trova il prodotto nel menu per determinare la categoria
      const menuItem = appState.menu.items.find(
        (menuItem) => menuItem.name === item.name
      );

      if (menuItem && menuItem.categoryId === "antipasti") {
        antipasti.push(item);
      } else if (menuItem && menuItem.categoryId === "schiacciate") {
        schiacciate.push(item);
      } else if (item.isHalfFamily) {
        // Le mezze familiari vanno sempre nelle pizze familiari
        pizzeFamiliari.push(item);
      } else if (
        menuItem &&
        (menuItem.categoryId === "pizze-classiche" ||
          menuItem.categoryId === "pizze-speciali" ||
          menuItem.categoryId === "pizze-create")
      ) {
        if (item.isFamily) {
          pizzeFamiliari.push(item);
        } else {
          pizzeNormali.push(item);
        }
      } else {
        altriProdotti.push(item);
      }
    });
  }

  // Gestione speciale per le mezze familiari nella stampa
  const printHalfFamilyItem = (item) => {
    let itemContent = `<div class="item">`;
    itemContent += `<span class="item-name">${item.quantity} x FAMILIARE 1/2 e 1/2</span>`;
    itemContent += `<div class="item-options" style="margin-left: 20px;">`;

    // Prima metà
    itemContent += `<div><strong>1/2 ${item.firstHalf.name}</strong></div>`;
    if (item.firstHalf.additions && item.firstHalf.additions.length > 0) {
      // Raggruppa ingredienti duplicati
      const grouped = groupIngredients(item.firstHalf.additions);
      const additionsList = grouped
        .map((a) => `+ ${a.name}${a.count > 1 ? " x" + a.count : ""}`)
        .join(", ");
      itemContent += `<div style="margin-left: 20px;">${additionsList}</div>`;
    }
    if (item.firstHalf.removals && item.firstHalf.removals.length > 0) {
      const removalsList = item.firstHalf.removals
        .map((r) => `NO ${r}`)
        .join(", ");
      itemContent += `<div style="margin-left: 20px;">${removalsList}</div>`;
    }

    // Seconda metà
    itemContent += `<div><strong>1/2 ${item.secondHalf.name}</strong></div>`;
    if (item.secondHalf.additions && item.secondHalf.additions.length > 0) {
      // Raggruppa ingredienti duplicati
      const grouped = groupIngredients(item.secondHalf.additions);
      const additionsList = grouped
        .map((a) => `+ ${a.name}${a.count > 1 ? " x" + a.count : ""}`)
        .join(", ");
      itemContent += `<div style="margin-left: 20px;">${additionsList}</div>`;
    }
    if (item.secondHalf.removals && item.secondHalf.removals.length > 0) {
      const removalsList = item.secondHalf.removals
        .map((r) => `NO ${r}`)
        .join(", ");
      itemContent += `<div style="margin-left: 20px;">${removalsList}</div>`;
    }

    itemContent += `</div>`;

    if (item.notes) {
      itemContent += `<div class="item-options">Note: ${item.notes}</div>`;
    }

    itemContent += "</div>";
    return itemContent;
  };

  // Aggiungi riepilogo pizze
  content += '<div class="riepilogo">';
  content += "<strong>RIEPILOGO PIZZE:</strong><br>";

  const totalePizzeNormali = pizzeNormali.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const totalePizzeFamiliari = pizzeFamiliari.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const totaleSchiacciate = schiacciate.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  if (totalePizzeNormali > 0) {
    content += `Pizze Normali: ${totalePizzeNormali}<br>`;
  }
  if (totalePizzeFamiliari > 0) {
    content += `Pizze Familiari: ${totalePizzeFamiliari}<br>`;
  }
  if (totaleSchiacciate > 0) {
    content += `Schiacciate: ${totaleSchiacciate}<br>`;
  }
  if (
    totalePizzeNormali === 0 &&
    totalePizzeFamiliari === 0 &&
    totaleSchiacciate === 0
  ) {
    content += "Nessuna pizza nell'ordine<br>";
  }
  content += "</div>";

  // Funzione helper per stampare un item
  const printItem = (item) => {
    let itemContent = `<div class="item">`;

    // Costruisci il nome con quantità
    let itemName = `${item.quantity} x `;
    if (item.isFamily) {
      itemName += `FAMILIARE ${item.name}`;
    } else {
      itemName += item.name;
    }
    // Aggiungi la variante se presente
    if (item.variant) {
      itemName += ` (${item.variant})`;
    }

    itemContent += `<span class="item-name">${itemName}</span>`;

    // Mostra opzioni pizza se presenti
    if (
      (item.additions && item.additions.length > 0) ||
      (item.removals && item.removals.length > 0)
    ) {
      itemContent += '<div class="item-options">';

      if (item.additions && item.additions.length > 0) {
        // Raggruppa ingredienti duplicati
        const grouped = groupIngredients(item.additions);
        const additionsList = grouped
          .map((a) => `+ ${a.name}${a.count > 1 ? " x" + a.count : ""}`)
          .join(", ");
        itemContent += `<div>${additionsList}</div>`;
      }

      if (item.removals && item.removals.length > 0) {
        const removalsList = item.removals.map((r) => `NO ${r}`).join(", ");
        itemContent += `<div>${removalsList}</div>`;
      }

      itemContent += "</div>";
    }

    // Mostra note se presenti
    if (item.notes) {
      itemContent += `<div class="item-options">Note: ${item.notes}</div>`;
    }

    itemContent += "</div>";
    return itemContent;
  };

  // Stampa antipasti
  if (antipasti.length > 0) {
    content += '<div class="section-divider"></div>';
    content += "<h3>ANTIPASTI</h3>";
    antipasti.forEach((item) => {
      content += printItem(item);
    });
  }

  /// Stampa pizze
  if (pizzeNormali.length > 0 || pizzeFamiliari.length > 0) {
    content += '<div class="section-divider"></div>';
    content += "<h3>PIZZE</h3>";

    // Prima le pizze normali
    pizzeNormali.forEach((item) => {
      if (item.isHalfFamily) {
        content += printHalfFamilyItem(item);
      } else {
        content += printItem(item);
      }
    });

    // Poi le pizze familiari
    pizzeFamiliari.forEach((item) => {
      if (item.isHalfFamily) {
        content += printHalfFamilyItem(item);
      } else {
        content += printItem(item);
      }
    });
  }
  // Stampa schiacciate
  if (schiacciate.length > 0) {
    content += '<div class="section-divider"></div>';
    content += "<h3>SCHIACCIATE</h3>";
    schiacciate.forEach((item) => {
      content += printItem(item);
    });
  }
  // Stampa altri prodotti
  if (altriProdotti.length > 0) {
    content += '<div class="section-divider"></div>';
    content += "<h3>ALTRI PRODOTTI</h3>";
    altriProdotti.forEach((item) => {
      content += printItem(item);
    });
  }

  // Aggiungi eventuali note generali
  if (orderObject.notes) {
    content += `<div class="notes">Note: ${orderObject.notes}</div>`;
  }

  content += `
        </body>
        </html>
    `;

  // Scrivi il contenuto nella finestra di stampa
  printWindow.document.write(content);
  printWindow.document.close();

  // Attendi il caricamento e stampa
  printWindow.onload = function () {
    printWindow.print();
    printWindow.close();
  };
}

function printReceipt() {
  let orderObject;
  let orderTitle;

  if (appState.currentOrderType === "table") {
    const table = appState.tables.find((t) => t.id === appState.currentOrderId);
    if (!table) return;
    orderObject = table.order;

    // Gestione del nome del tavolo per la stampa
    if (table.customName) {
      orderTitle = `Tavolo ${table.prefix ? table.prefix + " " : ""}Pers.`;
    } else {
      orderTitle = `Tavolo ${table.prefix ? table.prefix + " " : ""}${
        table.number
      }`;
    }
  } else if (appState.currentOrderType === "takeaway") {
    const takeaway = appState.takeaways.find(
      (t) => t.id === appState.currentOrderId
    );
    if (!takeaway) return;
    orderObject = takeaway.order;
    orderTitle = `Asporto #${takeaway.number}`;
  } else if (appState.currentOrderType === "delivery") {
    const delivery = appState.deliveries.find(
      (d) => d.id === appState.currentOrderId
    );
    if (!delivery) return;
    orderObject = delivery.order;
    orderTitle = `Domicilio`;
  } else {
    return;
  }

  // Calcola il subtotale
  let subtotal = 0;

  // Aggiungi il costo dei coperti se è un tavolo
  let coverCharge = 0;
  if (appState.currentOrderType === "table" && orderObject.covers > 0) {
    coverCharge = orderObject.covers * appState.settings.coverCharge;
    subtotal += coverCharge;
  }

  // Aggiungi il costo di tutti gli items
  const itemsWithPrice = [];

  if (orderObject.items) {
    orderObject.items.forEach((item) => {
      // Calcola il prezzo base con aggiunzioni
      let itemPrice = item.basePrice;
      let itemDescription = item.name;
      if (item.variant) {
        itemDescription += ` (${item.variant})`;
      }

      // Prezzo doppio per le pizze familiari
      if (item.isFamily) {
        itemPrice *= 2;
        itemDescription += " (Familiare)";
      }

      // Descrizione per mezze familiari
      if (item.isHalfFamily) {
        // Calcola il prezzo delle aggiunzioni per le mezze familiari
        if (item.firstHalf && item.firstHalf.additions) {
          item.firstHalf.additions.forEach((addition) => {
            itemPrice += addition.price;
          });
        }
        if (item.secondHalf && item.secondHalf.additions) {
          item.secondHalf.additions.forEach((addition) => {
            itemPrice += addition.price;
          });
        }

        itemDescription = `Familiare: (1/2 + 1/2)`;

        // Aggiungi dettagli delle due metà
        if (item.firstHalf) {
          itemDescription += ` - ${item.firstHalf.name}`;
          if (item.firstHalf.additions && item.firstHalf.additions.length > 0) {
            const grouped = groupIngredients(item.firstHalf.additions);
            itemDescription += ` (${grouped
              .map((a) => `+${a.name}${a.count > 1 ? " x" + a.count : ""}`)
              .join(", ")})`;
          }
          if (item.firstHalf.removals && item.firstHalf.removals.length > 0) {
            itemDescription += ` (${item.firstHalf.removals
              .map((r) => `NO ${r}`)
              .join(", ")})`;
          }
        }

        if (item.secondHalf) {
          itemDescription += ` + ${item.secondHalf.name}`;
          if (
            item.secondHalf.additions &&
            item.secondHalf.additions.length > 0
          ) {
            const grouped = groupIngredients(item.secondHalf.additions);
            itemDescription += ` (${grouped
              .map((a) => `+${a.name}${a.count > 1 ? " x" + a.count : ""}`)
              .join(", ")})`;
          }
          if (item.secondHalf.removals && item.secondHalf.removals.length > 0) {
            itemDescription += ` (${item.secondHalf.removals
              .map((r) => `NO ${r}`)
              .join(", ")})`;
          }
        }
      }

      // Descrizione per aggiunzioni
      if (item.additions && item.additions.length > 0) {
        const grouped = groupIngredients(item.additions);
        const additionsList = grouped
          .map((a) => `${a.name}${a.count > 1 ? " x" + a.count : ""}`)
          .join(", ");
        itemDescription += ` (+ ${additionsList})`;

        item.additions.forEach((addition) => {
          // Per le pizze familiari, anche le aggiunte costano il doppio
          let additionPrice = addition.price;
          if (item.isFamily) {
            additionPrice *= 2;
          }
          itemPrice += additionPrice;
        });
      }

      // Descrizione per rimozioni
      if (item.removals && item.removals.length > 0) {
        const removalsList = item.removals.map((r) => `NO ${r}`).join(", ");
        itemDescription += ` (${removalsList})`;
      }

      // Applica sconto se presente
      let finalPrice = itemPrice;
      let discountDescription = "";

      if (item.discount > 0) {
        finalPrice = itemPrice * (1 - item.discount / 100);
        discountDescription = ` (-${item.discount}%)`;
      }

      // Se è un omaggio, il prezzo è 0
      if (item.isComplement) {
        finalPrice = 0;
        discountDescription = " (Omaggio)";
      }

      // Moltiplica per la quantità
      const totalPrice = finalPrice * item.quantity;
      subtotal += totalPrice;

      itemsWithPrice.push({
        description: `${itemDescription}${discountDescription} x ${item.quantity}`,
        price: totalPrice,
      });
    });
  }

  // Calcola l'importo dello sconto
  let discountAmount = 0;
  let discountDescription = "";

  if (orderObject.discount > 0) {
    if (orderObject.discountType === "percentage") {
      discountAmount = subtotal * (orderObject.discount / 100);
      discountDescription = `Sconto ${orderObject.discount}%`;
    } else if (orderObject.discountType === "fixed") {
      discountAmount = Math.min(orderObject.discount, subtotal); // Lo sconto non può essere maggiore del subtotale
      discountDescription = `Sconto €${formatPrice(orderObject.discount)}`;
    }

    if (orderObject.discountReason) {
      discountDescription += ` (${orderObject.discountReason})`;
    }
  }

  // Calcola il totale finale
  const total = subtotal - discountAmount;

  // Crea una finestra di stampa
  const printWindow = window.open("", "_blank");

  // Genera il contenuto dello scontrino
  let content = `
        <html>
        <head>
            <title>Scontrino - ${orderTitle}</title>
            <style>
                body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; width: 80mm; font-weight: bold; }
                h1 { font-size: 18px; text-align: center; margin-bottom: 10px; }
                h2 { font-size: 16px; text-align: center; margin-bottom: 10px; }
                .date { text-align: center; font-size: 12px; margin-bottom: 20px; }
                .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .item-description { flex: 1; padding-right: 10px; }
                .item-price { text-align: right; white-space: nowrap; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .subtotal { display: flex; justify-content: space-between; margin-top: 10px; }
                .discount { display: flex; justify-content: space-between; color: #d32f2f; }
                .total { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-top: 10px; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; }
                .payment-section { background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px; }
                .resto { background: #333; color: white; padding: 5px; font-weight: bold; }
            h1 { font-size: 18px; text-align: center; margin-bottom: 10px; font-weight: bold; }
h2 { font-size: 16px; text-align: center; margin-bottom: 10px; font-weight: bold; }
.date { text-align: center; font-size: 12px; margin-bottom: 20px; font-weight: bold; }
.item { display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: bold; }
.item-description { flex: 1; padding-right: 10px; font-weight: bold; }
.item-price { text-align: right; white-space: nowrap; font-weight: bold; }
.subtotal { display: flex; justify-content: space-between; margin-top: 10px; font-weight: bold; }
.discount { display: flex; justify-content: space-between; color: #d32f2f; font-weight: bold; }
.footer { margin-top: 30px; text-align: center; font-size: 12px; font-weight: bold; }
.payment-section { background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px; font-weight: bold; }
                </style>
        </head>
        <body>
            <h1>${appState.settings.restaurantName}</h1>
            <h2>${orderTitle}</h2>
            <div class="date">${formatDateTime(new Date().toISOString())}</div>
            <div class="divider"></div>
    `;

  // Aggiungi i coperti se è un tavolo
  if (appState.currentOrderType === "table" && orderObject.covers > 0) {
    content += `
            <div class="item">
                <div class="item-description">Coperto x ${
                  orderObject.covers
                }</div>
                <div class="item-price">€${formatPrice(coverCharge)}</div>
            </div>
        `;
  }

  // Aggiungi gli items dell'ordine
  itemsWithPrice.forEach((item) => {
    content += `
            <div class="item">
                <div class="item-description">${item.description}</div>
                <div class="item-price">€${formatPrice(item.price)}</div>
            </div>
        `;
  });

  content += '<div class="divider"></div>';

  // Aggiungi subtotale, sconto e totale
  content += `
        <div class="subtotal">
            <div>Subtotale</div>
            <div>€${formatPrice(subtotal)}</div>
        </div>
    `;

  if (discountAmount > 0) {
    content += `
            <div class="discount">
                <div>${discountDescription}</div>
                <div>-€${formatPrice(discountAmount)}</div>
            </div>
        `;
  }

  content += `
        <div class="total">
            <div>TOTALE</div>
            <div>€${formatPrice(total)}</div>
        </div>
    `;

  // SEZIONE PAGAMENTO CON RESTO - NUOVA
  if (appState.currentOrderType === "delivery") {
    const delivery = appState.deliveries.find(
      (d) => d.id === appState.currentOrderId
    );

    if (delivery && delivery.payment) {
      content += '<div class="divider"></div>';
      content += '<div class="payment-section">';

      if (delivery.payment.method === "cash" && delivery.payment.cashGiven) {
        content += `
          <div class="subtotal">
            <div>Pagato con:</div>
            <div>€${formatPrice(delivery.payment.cashGiven)}</div>
          </div>
          <div class="resto">
            <div>RESTO:</div>
            <div>€${formatPrice(delivery.payment.cashGiven - total)}</div>
          </div>
        `;
      } else {
        content += `
          <div style="text-align: center;">
            <strong>Pagamento con POS</strong>
          </div>
        `;
      }

      content += "</div>";
    }
  }

  content += `
        <div class="footer">
            <p>Grazie per averci scelto!</p>
            <p>Vi aspettiamo presto</p>
        </div>
        
        <div class="divider"></div>
        <div style="text-align: center; font-size: 10px;">
            <p>Documento non fiscale</p>
            <p>Questo non è uno scontrino fiscale</p>
        </div>
    </body>
    </html>
    `;

  // Scrivi il contenuto nella finestra di stampa
  printWindow.document.write(content);
  printWindow.document.close();

  // Attendi il caricamento e stampa
  printWindow.onload = function () {
    printWindow.print();
    printWindow.close();
  };
}
//stampa chiusura giornaliera

function printDailyReport() {
  // Funzione helper per calcolare il totale di un ordine
  function calculateOrderTotal(order, isTable = false) {
    let subtotal = 0;

    // Aggiungi il costo dei coperti se è un tavolo
    if (isTable && order.covers > 0) {
      const coverCharge = order.covers * appState.settings.coverCharge;
      subtotal += coverCharge;
    }

    // Aggiungi il costo di tutti gli items
    if (order.items) {
      order.items.forEach((item) => {
        // Calcola il prezzo base con aggiunzioni
        let itemPrice = item.basePrice;

        // Prezzo doppio per le pizze familiari
        if (item.isFamily) {
          itemPrice *= 2;
        }

        // Calcola il prezzo delle aggiunzioni per le mezze familiari
        if (item.isHalfFamily) {
          if (item.firstHalf && item.firstHalf.additions) {
            item.firstHalf.additions.forEach((addition) => {
              itemPrice += addition.price;
            });
          }
          if (item.secondHalf && item.secondHalf.additions) {
            item.secondHalf.additions.forEach((addition) => {
              itemPrice += addition.price;
            });
          }
        }

        // Aggiungi il prezzo delle aggiunzioni normali
        if (item.additions && item.additions.length > 0) {
          item.additions.forEach((addition) => {
            // Per le pizze familiari, anche le aggiunte costano il doppio
            let additionPrice = addition.price;
            if (item.isFamily) {
              additionPrice *= 2;
            }
            itemPrice += additionPrice;
          });
        }

        // Applica sconto se presente
        let finalPrice = itemPrice;
        if (item.discount > 0) {
          finalPrice = itemPrice * (1 - item.discount / 100);
        }

        // Se è un omaggio, il prezzo è 0
        if (item.isComplement) {
          finalPrice = 0;
        }

        // Moltiplica per la quantità
        const totalPrice = finalPrice * item.quantity;
        subtotal += totalPrice;
      });
    }

    // Calcola l'importo dello sconto sull'ordine
    let discountAmount = 0;
    if (order.discount > 0) {
      if (order.discountType === "percentage") {
        discountAmount = subtotal * (order.discount / 100);
      } else if (order.discountType === "fixed") {
        discountAmount = Math.min(order.discount, subtotal);
      }
    }

    // Calcola il totale finale
    return subtotal - discountAmount;
  }

  // Calcola i totali per gli asporti
  let totalTakeawayAmount = 0;
  let totalTakeawayOrders = 0;

  appState.takeaways.forEach((takeaway) => {
    if (
      takeaway.order &&
      takeaway.order.items &&
      takeaway.order.items.length > 0
    ) {
      const orderTotal = calculateOrderTotal(takeaway.order, false);
      if (orderTotal > 0) {
        totalTakeawayAmount += orderTotal;
        totalTakeawayOrders++;
      }
    }
  });
  // Calcola i totali per i domicili
  let totalDeliveryAmount = 0;
  let totalDeliveryOrders = 0;

  appState.deliveries.forEach((delivery) => {
    if (
      delivery.status === "delivered" &&
      delivery.order &&
      delivery.order.items &&
      delivery.order.items.length > 0
    ) {
      const orderTotal = calculateOrderTotal(delivery.order, false);
      if (orderTotal > 0) {
        totalDeliveryAmount += orderTotal;
        totalDeliveryOrders++;
      }
    }
  });
  // Calcola i totali per i tavoli
  let totalTableAmount = 0;
  let totalTableOrders = 0;

  appState.tables.forEach((table) => {
    if (table.order && table.order.items && table.order.items.length > 0) {
      const orderTotal = calculateOrderTotal(table.order, true);
      if (orderTotal > 0) {
        totalTableAmount += orderTotal;
        totalTableOrders++;
      }
    }
  });

  // Calcola il totale giornaliero
  const totalDaily =
    totalTakeawayAmount + totalTableAmount + totalDeliveryAmount;

  // Crea la finestra di stampa
  const printWindow = window.open("", "_blank");

  // Data e ora correnti
  const now = new Date();
  const dateString = now.toLocaleDateString("it-IT");
  const timeString = now.toLocaleTimeString("it-IT");

  // Genera il contenuto del report
  let content = `
    <html>
    <head>
      <title>Chiusura Giornaliera - ${dateString}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          max-width: 300px;
          font-weight: bold;
        }
        h1 { 
          font-size: 20px; 
          text-align: center; 
          margin-bottom: 10px; 
        }
        h2 { 
          font-size: 18px; 
          text-align: center;
          margin-bottom: 20px;
        }
        .date-time { 
          text-align: center; 
          font-size: 14px; 
          margin-bottom: 30px; 
        }
        .section { 
          margin-bottom: 15px;
          padding: 10px;
          background-color: #f5f5f5;
          border-radius: 5px;
        }
        .section-title { 
          font-weight: bold; 
          font-size: 16px;
          margin-bottom: 5px;
        }
        .amount { 
          font-size: 18px;
          color: #2563eb;
        }
        .orders-count {
          font-size: 14px;
          color: #666;
        }
        .divider { 
          border-top: 2px dashed #000; 
          margin: 20px 0; 
        }
        .total-section {
          background-color: #f5f5f5;
          color: black;
          padding: 15px;
          border-radius: 5px;
          text-align: center;
        }
        .total-label {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .total-amount {
          font-size: 24px;
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
          h1 { 
  font-size: 20px; 
  text-align: center; 
  margin-bottom: 10px; 
  font-weight: bold;
}
h2 { 
  font-size: 18px; 
  text-align: center;
  margin-bottom: 20px;
  font-weight: bold;
}
.date-time { 
  text-align: center; 
  font-size: 14px; 
  margin-bottom: 30px; 
  font-weight: bold;
}
.section { 
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f5f5;
  color: black;
  border-radius: 5px;
  font-weight: bold;
}
.amount { 
  font-size: 18px;
  color: black;
  font-weight: bold;
}
.orders-count {
  font-size: 14px;
  color: black;
  font-weight: bold;
}
.footer {
  margin-top: 30px;
  text-align: center;
  font-size: 12px;
  color: #666;
  font-weight: bold;
}
      </style>
    </head>
    <body>
      <h1>${appState.settings.restaurantName}</h1>
      <h2>CHIUSURA GIORNALIERA</h2>
      
      <div class="date-time">
        <div>Data: ${dateString}</div>
        <div>Ora: ${timeString}</div>
      </div>
      
      <div class="section">
        <div class="section-title">TOTALE ASPORTO</div>
        <div class="amount">€ ${totalTakeawayAmount.toFixed(2)}</div>
        <div class="orders-count">(${totalTakeawayOrders} ordini)</div>
      </div>
      
      <div class="section">
        <div class="section-title">TOTALE TAVOLI</div>
        <div class="amount">€ ${totalTableAmount.toFixed(2)}</div>
        <div class="orders-count">(${totalTableOrders} ordini)</div>
      </div>
      <div class="section">
  <div class="section-title">TOTALE DOMICILIO</div>
  <div class="amount">€ ${totalDeliveryAmount.toFixed(2)}</div>
  <div class="orders-count">(${totalDeliveryOrders} ordini)</div>
</div>
      
      <div class="divider"></div>
      
      <div class="total-section">
        <div class="total-label">TOTALE GIORNALIERO</div>
        <div class="total-amount">€ ${totalDaily.toFixed(2)}</div>
      </div>
      
      <div class="footer">
        --- Fine Report ---
      </div>
    </body>
    </html>
  `;

  // Scrivi il contenuto e stampa
  printWindow.document.write(content);
  printWindow.document.close();

  // Attendi il caricamento e stampa
  printWindow.onload = function () {
    printWindow.print();
    printWindow.close();
  };
}

// Export e import dei dati
function exportData() {
  const data = {
    menu: appState.menu,
    tables: appState.tables,
    takeaways: appState.takeaways,
    settings: appState.settings,
    ingredients: appState.ingredients,
    deliveries: appState.deliveries,
    riders: appState.riders,
    exportDate: new Date().toISOString(),
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

  const exportFileDefaultName = `pizzeria_ximenes_backup_${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();
}
function formatDateTime(dateString) {
  const date = new Date(dateString);
  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleString("it-IT", options);
}
// Sostituisci la funzione importData
function importData() {
  const fileInput = document.getElementById("importData");
  const file = fileInput.files[0];

  if (!file) {
    alert("Seleziona un file da importare.");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);

      // Verifica che il file contenga i dati necessari
      if (!data.menu || !data.tables || !data.takeaways || !data.settings) {
        throw new Error(
          "Il file non contiene dati validi per il gestionale pizzeria."
        );
      }

      // Verifica la struttura dei dati più in dettaglio
      if (
        !Array.isArray(data.menu.categories) ||
        !Array.isArray(data.menu.items)
      ) {
        throw new Error("La struttura del menu non è valida.");
      }

      if (!Array.isArray(data.tables) || !Array.isArray(data.takeaways)) {
        throw new Error(
          "La struttura dei tavoli o degli asporti non è valida."
        );
      }

      // Aggiorna lo stato dell'applicazione
      appState.menu = data.menu;
      appState.tables = data.tables;
      appState.takeaways = data.takeaways;
      appState.settings = data.settings;

      // Aggiorna gli ingredienti se presenti
      if (data.ingredients) {
        appState.ingredients = data.ingredients;
      }
      if (data.deliveries) {
        appState.deliveries = data.deliveries;
      }
      if (data.riders) {
        appState.riders = data.riders;
      }
      saveData();

      // Aggiorna l'interfaccia
      renderTables();
      renderTakeaways();
      renderMenuEditor();
      updateUI();

      alert("Dati importati con successo.");

      // Chiudi il modal
      document.getElementById("settingsModal").classList.remove("active");
    } catch (error) {
      alert("Errore durante l'importazione dei dati: " + error.message);
    }
  };

  reader.readAsText(file);
}

// Funzione per pulire i dati di tavoli e asporto
function clearTablesAndTakeaways() {
  // Manteniamo gli elementi del menu ma cancelliamo tavoli, asporto e domicili
  appState.tables = [];
  appState.takeaways = [];
  appState.deliveries = []; // AGGIUNTO: pulisci anche i domicili

  // Salviamo i dati aggiornati
  saveData();

  // Aggiorniamo la visualizzazione
  renderTables();
  renderTakeaways();
  renderDeliveries(); // AGGIUNTO: aggiorna anche la vista domicili

  // Mostriamo una conferma all'utente
  alert(
    "Tutti i tavoli, gli ordini da asporto e i domicili sono stati rimossi con successo."
  );

  // Chiudiamo il modal impostazioni
  document.getElementById("settingsModal").classList.remove("active");
}
function renderMenuEditor() {
  // Render delle categorie nel menu editor
  const editorCategoryTabs = document.getElementById("editorCategoryTabs");
  editorCategoryTabs.innerHTML = "";

  appState.menu.categories.forEach((category, index) => {
    const categoryTab = document.createElement("button");
    categoryTab.className = `category-tab ${index === 0 ? "active" : ""}`;
    categoryTab.textContent = category.name;
    categoryTab.setAttribute("data-category", category.id);

    categoryTab.addEventListener("click", () => {
      document
        .querySelectorAll("#editorCategoryTabs .category-tab")
        .forEach((tab) => {
          tab.classList.remove("active");
        });
      categoryTab.classList.add("active");

      // Reset della ricerca quando si cambia categoria
      document.getElementById("menuSearchInput").value = "";

      renderMenuItemsForEditor(category.id);
    });

    editorCategoryTabs.appendChild(categoryTab);
  });

  // Render degli items per la prima categoria
  if (appState.menu.categories.length > 0) {
    renderMenuItemsForEditor(appState.menu.categories[0].id);
  }
}
// Event listeners principali
function setupEventListeners() {
  // Tab di navigazione
  renderTabs();
  // Ricerca nel menu
  document
    .getElementById("menuSearchInput")
    .addEventListener("input", searchMenuItems);
  document.getElementById("clearSearchBtn").addEventListener("click", () => {
    document.getElementById("menuSearchInput").value = "";
    const activeCategory = document
      .querySelector("#editorCategoryTabs .category-tab.active")
      .getAttribute("data-category");
    renderMenuItemsForEditor(activeCategory);
  });

  // Pulsanti principali
  document
    .getElementById("addTableBtn")
    .addEventListener("click", showAddTableModal);
  document
    .getElementById("addTakeawayBtn")
    .addEventListener("click", showAddTakeawayModal);
  document.getElementById("addCategoryBtn").addEventListener("click", () => {
    document.getElementById("categoryModal").classList.add("active");
  });
  document
    .getElementById("addItemBtn")
    .addEventListener("click", showAddItemModal);

  // Pulsanti nella vista ordine
  document
    .getElementById("applyDiscountBtn")
    .addEventListener("click", showDiscountModal);
  document
    .getElementById("printOrderBtn")
    .addEventListener("click", printOrder);
  document
    .getElementById("printReceiptBtn")
    .addEventListener("click", printReceipt);
  document
    .getElementById("closeOrderBtn")
    .addEventListener("click", showConfirmCloseModal);

  // Pulsante impostazioni
  document.getElementById("settingsBtn").addEventListener("click", () => {
    document.getElementById("settingsModal").classList.add("active");
  });

  // Esporta/Importa dati
  document
    .getElementById("exportDataBtn")
    .addEventListener("click", exportData);
  document.getElementById("importData").addEventListener("change", importData);

  // Setup dei modal
  setupModalEventListeners();
  // Pulsante pulizia dati
  document.getElementById("clearDataBtn").addEventListener("click", () => {
    if (
      confirm(
        "Sei sicuro di voler eliminare tutti i tavoli, gli ordini da asporto e i domicili? Questa operazione non può essere annullata."
      )
    ) {
      clearTablesAndTakeaways();
    }
  });
  // Aggiungi questa riga alla fine della funzione setupEventListeners
  setupTableFilters();
}

// ========== FUNZIONI DOMICILIO - GRUPPO 1: INIZIALIZZAZIONE E RENDERING ==========

// Inizializza gli eventi per il domicilio
function initializeDeliveryEvents() {
  // Event listener per il pulsante nuovo domicilio
  const addDeliveryBtn = document.getElementById("addDeliveryBtn");
  if (addDeliveryBtn) {
    addDeliveryBtn.addEventListener("click", showAddDeliveryModal);
  }

  // Event listener per il pulsante gestione rider
  const manageRidersBtn = document.getElementById("manageRidersBtn");
  if (manageRidersBtn) {
    manageRidersBtn.addEventListener("click", showRiderManagementModal);
  }
}
// Event listener per mostrare/nascondere campo contanti
document.getElementById("paymentCash").addEventListener("change", (e) => {
  if (e.target.checked) {
    document.getElementById("cashSection").style.display = "block";
    // Focus sul campo importo
    document.getElementById("cashGiven").focus();
  }
});

document.getElementById("paymentPos").addEventListener("change", (e) => {
  if (e.target.checked) {
    document.getElementById("cashSection").style.display = "none";
    document.getElementById("cashGiven").value = "";
    document.getElementById("changeAmount").textContent = "€ 0.00";
  }
});

// Event listener per calcolare il resto
document.getElementById("cashGiven").addEventListener("input", calculateChange);
// Aggiungi questo dopo initializeDeliveryEvents()
document.getElementById("deliveryAsap").addEventListener("change", function () {
  if (this.checked) {
    document.getElementById("deliveryTimeInputContainer").style.display =
      "none";
  }
});

document
  .getElementById("deliveryScheduled")
  .addEventListener("change", function () {
    if (this.checked) {
      document.getElementById("deliveryTimeInputContainer").style.display =
        "block";

      // Popola le ore se non già fatto
      const hourSelect = document.getElementById("deliveryHour");
      if (hourSelect.options.length === 0) {
        for (let h = 0; h < 24; h++) {
          const option = document.createElement("option");
          option.value = h.toString().padStart(2, "0");
          option.textContent = h.toString().padStart(2, "0");
          hourSelect.appendChild(option);
        }
        hourSelect.value = "19"; // Default alle 19:00
      }
    }
  });

// Event listener per chiudere il modal
document
  .getElementById("saveDeliveryBtn")
  .addEventListener("click", createDelivery);

// Renderizza la lista dei domicili
// Sostituisci la funzione createDelivery con questa versione corretta
function createDelivery() {
  console.log("1. Inizio createDelivery");

  const customerName = document
    .getElementById("deliveryCustomerName")
    .value.trim();
  const address = document.getElementById("deliveryAddress").value.trim();
  const phone = document.getElementById("deliveryPhone").value.trim();

  console.log("2. Dati letti:", { customerName, address, phone });

  // Gestisci l'orario programmato
  let deliveryTime = {
    type: "asap", // Default
  };

  if (document.getElementById("deliveryScheduled").checked) {
    const hour = document.getElementById("deliveryHour").value;
    const minute = document.getElementById("deliveryMinute").value;
    deliveryTime = {
      type: "scheduled",
      time: `${hour}:${minute}`,
    };
  }

  if (!customerName || !address) {
    alert("Nome cliente e indirizzo sono obbligatori");
    return;
  }

  console.log("3. Validazione passata");

  const delivery = {
    id: generateId(),
    customerName,
    address,
    phone,
    notes: "",
    deliveryTime: deliveryTime, // Aggiungi questo oggetto strutturato
    scheduledTime: deliveryTime.type === "scheduled" ? deliveryTime.time : null,
    deliveryFee: appState.settings.defaultDeliveryFee || 0.0,
    orderTime: new Date().toISOString(),
    status: "pending",
    order: {
      items: [],
      discount: 0,
      discountType: "percentage",
    },
    rider: null,
    payment: null,
  };

  console.log("4. Delivery creato:", delivery);

  appState.deliveries.push(delivery);
  console.log("5. Aggiunto all'array");

  saveData();
  console.log("6. Dati salvati");

  renderDeliveries();
  console.log("7. Render completato");

  // Chiudi il modal
  document.getElementById("deliveryModal").classList.remove("active");
  console.log("8. Modal chiuso");

  // Apri subito l'ordine per aggiungere items
  selectDelivery(delivery.id);
  console.log("9. selectDelivery chiamato");
}
// Funzione helper per renderizzare un gruppo di domicili
// Sostituisci la funzione renderDeliveryGroup con questa:
function renderDeliveryGroup(deliveries, container, emptyMessage) {
  if (deliveries.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>${emptyMessage}</p>
      </div>
    `;
    return;
  }

  deliveries.forEach((delivery) => {
    const div = document.createElement("div");
    div.className = `delivery-card ${delivery.status}`;

    // Gestisci l'orario di consegna
    let deliveryTimeText = "Appena possibile";
    if (delivery.deliveryTime && delivery.deliveryTime.type === "scheduled") {
      deliveryTimeText = `Ore ${delivery.deliveryTime.time}`;
    } else if (delivery.scheduledTime) {
      deliveryTimeText = `Ore ${delivery.scheduledTime}`;
    }

    div.innerHTML = `
      <div class="delivery-header">
        <h3>${delivery.customerName}</h3>
        <span class="delivery-time">${new Date(
          delivery.orderTime
        ).toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        })}</span>
      </div>
      <div class="delivery-address">${delivery.address}</div>
      ${
        delivery.phone
          ? `<div class="delivery-phone">📞 ${delivery.phone}</div>`
          : ""
      }
      <div class="delivery-info">
        <span class="delivery-items">${
          delivery.order.items.length
        } articoli</span>
        <span class="delivery-total">€${calculateDeliveryTotal(
          delivery
        ).toFixed(2)}</span>
      </div>
      <div class="delivery-scheduled">
        ⏰ ${deliveryTimeText}
      </div>
      ${
        delivery.rider
          ? `
        <div class="delivery-rider">
          🛵 ${delivery.rider.name}
        </div>
      `
          : ""
      }
      <div class="delivery-status">${getDeliveryStatusText(
        delivery.status
      )}</div>
      <div class="delivery-actions">
        <button onclick="selectDelivery('${
          delivery.id
        }')" class="btn btn-primary btn-sm">
          ${delivery.status === "delivered" ? "Visualizza" : "Gestisci"}
        </button>
      </div>
    `;

    container.appendChild(div);
  });
}

// Aggiungi questa funzione helper per il testo dello stato
function getDeliveryStatusText(status) {
  const statusTexts = {
    pending: "In attesa",
    preparing: "In preparazione",
    ready: "Pronto",
    delivering: "In consegna",
    delivered: "Consegnato",
  };
  return statusTexts[status] || status;
}

// Ottieni il testo dello stato
function getStatusText(status) {
  const statusTexts = {
    pending: "In attesa",
    preparing: "In preparazione",
    ready: "Pronto",
    delivering: "In consegna",
    delivered: "Consegnato",
  };
  return statusTexts[status] || status;
}

// Genera i pulsanti azione per un domicilio
function getDeliveryActions(delivery) {
  let actions = "";

  switch (delivery.status) {
    case "pending":
      actions += `<button onclick="selectDelivery('${delivery.id}')" class="btn-primary">Gestisci Ordine</button>`;
      actions += `<button onclick="updateDeliveryStatus('${delivery.id}', 'preparing')" class="btn-secondary">Inizia Preparazione</button>`;
      break;
    case "preparing":
      actions += `<button onclick="selectDelivery('${delivery.id}')" class="btn-primary">Modifica Ordine</button>`;
      actions += `<button onclick="updateDeliveryStatus('${delivery.id}', 'ready')" class="btn-success">Ordine Pronto</button>`;
      break;
    case "ready":
      actions += `<button onclick="showAssignRiderModal('${delivery.id}')" class="btn-primary">Assegna Rider</button>`;
      if (delivery.rider) {
        actions += `<button onclick="updateDeliveryStatus('${delivery.id}', 'delivering')" class="btn-warning">Invia in Consegna</button>`;
      }
      break;
    case "delivering":
      actions += `<button onclick="showDeliveryPaymentModal('${delivery.id}')" class="btn-success">Registra Consegna</button>`;
      break;
    case "delivered":
      actions += `<button onclick="viewDeliveryReceipt('${delivery.id}')" class="btn-secondary">Vedi Scontrino</button>`;
      break;
  }

  return actions;
}

// Calcola il totale di un ordine domicilio
function calculateDeliveryTotal(delivery) {
  let total = 0;

  if (delivery.order && delivery.order.items) {
    delivery.order.items.forEach((item) => {
      let itemPrice = item.basePrice;

      if (item.isFamily) {
        itemPrice *= 2;
      }

      // NUOVO: Calcola il prezzo delle aggiunzioni per le mezze familiari
      if (item.isHalfFamily) {
        if (item.firstHalf && item.firstHalf.additions) {
          item.firstHalf.additions.forEach((addition) => {
            itemPrice += addition.price;
          });
        }
        if (item.secondHalf && item.secondHalf.additions) {
          item.secondHalf.additions.forEach((addition) => {
            itemPrice += addition.price;
          });
        }
      }

      // Aggiunzioni normali
      if (item.additions && item.additions.length > 0) {
        item.additions.forEach((addition) => {
          let additionPrice = addition.price;
          if (item.isFamily) {
            additionPrice *= 2;
          }
          itemPrice += additionPrice;
        });
      }

      let finalPrice = itemPrice;
      if (item.discount > 0) {
        finalPrice = itemPrice * (1 - item.discount / 100);
      }

      if (item.isComplement) {
        finalPrice = 0;
      }

      total += finalPrice * item.quantity;
    });
  }

  // Applica sconto ordine se presente
  if (delivery.order.discount > 0) {
    if (delivery.order.discountType === "percentage") {
      total = total * (1 - delivery.order.discount / 100);
    } else {
      total = Math.max(0, total - delivery.order.discount);
    }
  }

  // Aggiungi costo di consegna se presente
  if (delivery.deliveryFee) {
    total += delivery.deliveryFee;
  }

  return total;
}

// ========== FUNZIONI DOMICILIO - GRUPPO 2: GESTIONE ORDINI ==========

// Mostra il modal per aggiungere un nuovo domicilio
function showAddDeliveryModal() {
  const modal = document.getElementById("deliveryModal");
  if (!modal) {
    console.error("Modal domicilio non trovato");
    return;
  }

  // Reset del form con i campi che esistono
  document.getElementById("deliveryCustomerName").value = "";
  document.getElementById("deliveryAddress").value = "";
  document.getElementById("deliveryPhone").value = "";

  // Reset radio button orario
  document.getElementById("deliveryAsap").checked = true;
  document.getElementById("deliveryScheduled").checked = false;
  document
    .getElementById("deliveryTimeInputContainer")
    .classList.remove("active");

  // Reset selettori orario
  document.getElementById("deliveryHour").value = "19";
  document.getElementById("deliveryMinute").value = "00";

  modal.classList.add("active");
}

// Aggiorna lo stato di un domicilio
function updateDeliveryStatus(deliveryId, newStatus) {
  const delivery = appState.deliveries.find((d) => d.id === deliveryId);
  if (!delivery) return;

  // Validazioni specifiche per stato
  if (newStatus === "delivering" && !delivery.rider) {
    alert("Devi assegnare un rider prima di inviare in consegna");
    return;
  }

  if (newStatus === "delivered" && delivery.status !== "delivering") {
    alert("Puoi registrare la consegna solo per ordini in consegna");
    return;
  }

  delivery.status = newStatus;

  // Se passa a "delivering", registra l'ora di partenza
  if (newStatus === "delivering") {
    delivery.departureTime = new Date().toISOString();
  }

  // Se passa a "delivered", registra l'ora di consegna
  if (newStatus === "delivered") {
    delivery.deliveryTime = new Date().toISOString();
  }

  saveData();
  renderDeliveries();
}

// Mostra il modal per assegnare un rider
function showAssignRiderModal(deliveryId) {
  const delivery = appState.deliveries.find((d) => d.id === deliveryId);
  if (!delivery) return;

  const modal = document.getElementById("assignRiderModal");
  if (!modal) {
    console.error("Modal assegnazione rider non trovato");
    return;
  }

  // Salva l'ID del domicilio corrente
  modal.setAttribute("data-delivery-id", deliveryId);

  // Popola la select dei rider
  const select = document.getElementById("riderSelect");
  select.innerHTML = '<option value="">Seleziona un rider...</option>';

  // Mostra solo i rider disponibili
  const availableRiders = appState.riders.filter(
    (r) => r.isActive && r.isAvailable
  );
  availableRiders.forEach((rider) => {
    const option = document.createElement("option");
    option.value = rider.id;
    option.textContent = rider.name;
    select.appendChild(option);
  });

  // Preseleziona il rider se già assegnato
  if (delivery.rider) {
    select.value = delivery.rider.id;
  }

  modal.classList.add("active");
}

// Assegna un rider a un domicilio
function assignRider() {
  const modal = document.getElementById("assignRiderModal");
  const deliveryId = modal.getAttribute("data-delivery-id");
  const riderId = document.getElementById("riderSelect").value;

  if (!riderId) {
    alert("Seleziona un rider");
    return;
  }

  const delivery = appState.deliveries.find((d) => d.id === deliveryId);
  const rider = appState.riders.find((r) => r.id === riderId);

  if (!delivery || !rider) return;

  delivery.rider = {
    id: rider.id,
    name: rider.name,
  };

  saveData();
  renderDeliveries();
  modal.classList.remove("active");
}

// Chiudi il modal di assegnazione rider
function closeAssignRiderModal() {
  document.getElementById("assignRiderModal").classList.remove("active");
}

// Chiudi il modal domicilio
function closeDeliveryModal() {
  document.getElementById("deliveryModal").classList.remove("active");
}

// Funzione coperti
function promptCovers(tableId) {
  const table = appState.tables.find((t) => t.id === tableId);
  if (!table) return;

  // Mostra il dialogo solo se è un nuovo tavolo che diventa attivo
  if (table.status === "active" && table.order.covers === 0) {
    showCoversModal(tableId);
  }
}
function showCoversModal(tableId) {
  const table = appState.tables.find((t) => t.id === tableId);
  if (!table) return;

  // Imposta il valore corrente
  document.getElementById("coversCount").value = table.order.covers || 0;

  // Salva l'ID del tavolo per riferimento
  document
    .getElementById("saveCoversBtn")
    .setAttribute("data-table-id", tableId);

  // Mostra il modal
  document.getElementById("coversModal").classList.add("active");
}

function saveCovers() {
  const tableId = document
    .getElementById("saveCoversBtn")
    .getAttribute("data-table-id");
  const covers = parseInt(document.getElementById("coversCount").value) || 0;

  const table = appState.tables.find((t) => t.id === tableId);
  if (!table) return;

  table.order.covers = covers;
  saveData();

  // Se siamo nella vista ordine, aggiorna la visualizzazione
  if (appState.currentOrderId === tableId) {
    // Emetti evento WebSocket
    emitOrderUpdate();
    renderOrderDetails();
  }

  // Chiudi il modal
  document.getElementById("coversModal").classList.remove("active");
}
function renderCoverItem(orderObject, orderItemsContainer) {
  if (appState.currentOrderType === "table" && orderObject.covers >= 0) {
    const coverItem = document.createElement("div");
    coverItem.className = "order-item";
    coverItem.innerHTML = `
            <div class="order-item-details">
                <div class="order-item-name">Coperto</div>
            </div>
            <div class="order-item-price">€${formatPrice(
              orderObject.covers * appState.settings.coverCharge
            )}</div>
            <div class="covers-control">
                <button class="btn btn-sm btn-icon btn-outline decrease-cover" title="Diminuisci">−</button>
                <span class="covers-display">x ${orderObject.covers}</span>
                <button class="btn btn-sm btn-icon btn-outline increase-cover" title="Aumenta">+</button>
            </div>
        `;

    // Event listeners per i pulsanti + e -
    coverItem.querySelector(".decrease-cover").addEventListener("click", () => {
      if (orderObject.covers > 0) {
        orderObject.covers--;
        saveData();
        renderOrderDetails();
      }
    });

    coverItem.querySelector(".increase-cover").addEventListener("click", () => {
      orderObject.covers++;
      saveData();
      renderOrderDetails();
    });

    orderItemsContainer.appendChild(coverItem);
  }
}
// Funzione per pulire completamente il localStorage
function resetAllData() {
  if (
    confirm(
      "ATTENZIONE: Stai per cancellare tutti i dati salvati (menu, tavoli, asporto, impostazioni). Questa operazione non può essere annullata. Vuoi continuare?"
    )
  ) {
    localStorage.clear();
    alert("Dati cancellati con successo. La pagina verrà ricaricata.");
    location.reload();
  }
}

// Aggiungi pulsante di reset al modal impostazioni
document.addEventListener("DOMContentLoaded", function () {
  // Ottieni il container dove inserire il pulsante
  const settingsSection = document.querySelector(
    "#settingsModal .settings-section:last-child"
  );

  if (settingsSection) {
    // Crea una nuova sezione per il reset
    const resetSection = document.createElement("div");
    resetSection.className = "settings-section";
    resetSection.innerHTML = `
    <h4 class="settings-section-title">Reset Completo</h4>
    <div class="form-group">
    <button class="btn btn-danger mb-1" id="resetAllDataBtn">
    Reset Completo Dati
        </button>
        <p class="mb-1">
        ATTENZIONE: Questa operazione cancellerà tutti i dati salvati, inclusi ingredienti, menu, tavoli e asporto. Utilizzare solo se necessario.
        </p>
        </div>
        `;

    // Inserisci prima della sezione del footer
    const modalFooter = document.querySelector("#settingsModal .modal-footer");
    modalFooter.parentNode.insertBefore(resetSection, modalFooter);

    // Aggiungi l'event listener al pulsante di reset
    document
      .getElementById("resetAllDataBtn")
      .addEventListener("click", resetAllData);
  }
});

// Aggiungi questa funzione per gestire i filtri dei tavoli
function setupTableFilters() {
  const filterSelect = document.getElementById("tableStatusFilter");
  if (filterSelect) {
    filterSelect.addEventListener("change", () => {
      renderTables(filterSelect.value);
    });
  }
}

// Modifica la funzione renderTables per accettare un filtro
function renderTables(statusFilter = "all") {
  const tablesContainer = document.getElementById("tablesContainer");
  tablesContainer.innerHTML = "";

  // Filtra i tavoli in base allo stato selezionato
  const filteredTables =
    statusFilter === "all"
      ? appState.tables
      : appState.tables.filter((table) => table.status === statusFilter);

  filteredTables.forEach((table) => {
    const tableCard = document.createElement("div");
    tableCard.className = `table-card ${table.status}`;

    // Determina cosa mostrare: se c'è un nome personalizzato usa quello, altrimenti numero
    let tableDisplay = "";
    if (table.customName) {
      tableDisplay = `${table.prefix ? table.prefix + " " : ""}${
        table.customName
      }`;
    } else {
      tableDisplay = `${table.prefix ? table.prefix + " " : ""}${table.number}`;
    }

    tableCard.innerHTML = `
            <div class="table-number">${tableDisplay}</div>
            <div class="table-status ${table.status}">${getStatusText(
      table.status
    )}</div>
        `;

    tableCard.addEventListener("click", () => {
      if (table.status === "closed") {
        // Per i tavoli chiusi, apri in modalità di sola lettura
        showOrderView(table.id, "table");
        // Disabilita i pulsanti di modifica
        document.getElementById("printOrderBtn").disabled = false;
        document.getElementById("printReceiptBtn").disabled = false;
        document.getElementById("closeOrderBtn").disabled = true;
        document.getElementById("applyDiscountBtn").disabled = true;
      } else {
        // Per i tavoli attivi o nuovi
        if (table.status === "new") {
          // Inizializza un nuovo ordine per i tavoli nuovi
          table.status = "active";
          table.order = {
            items: [],
            discount: 0,
            discountType: "percentage",
            discountReason: "",
            covers: 0,
            createdAt: new Date().toISOString(),
          };
          saveData();

          // Dopo aver aperto la vista dell'ordine, chiedi i coperti
          setTimeout(() => {
            promptCovers(table.id);
          }, 100);
        }

        showOrderView(table.id, "table");
        // Abilita tutti i pulsanti
        document.getElementById("printOrderBtn").disabled = false;
        document.getElementById("printReceiptBtn").disabled = false;
        document.getElementById("closeOrderBtn").disabled = false;
        document.getElementById("applyDiscountBtn").disabled = false;
      }
    });

    tablesContainer.appendChild(tableCard);
  });

  // Mostra un messaggio se non ci sono tavoli con il filtro selezionato
  if (filteredTables.length === 0) {
    tablesContainer.innerHTML =
      '<div class="text-center p-3">Nessun tavolo trovato con il filtro selezionato.</div>';
  }
}
async function syncExistingOrders() {
  if (!api || !api.socket) return;

  console.log("🔄 Richiedo stato aggiornato dal server...");

  // Non inviare dati locali, solo richiedi lo stato del server
  api.socket.emit("sync_request", {
    clientId: api.socket.id,
    requestTime: new Date().toISOString(),
  });
}
function getCurrentOrderItem(index) {
  let orderObject;
  if (appState.currentOrderType === "table") {
    const table = appState.tables.find((t) => t.id === appState.currentOrderId);
    if (!table) return null;
    orderObject = table.order;
  } else if (appState.currentOrderType === "takeaway") {
    const takeaway = appState.takeaways.find(
      (t) => t.id === appState.currentOrderId
    );
    if (!takeaway) return null;
    orderObject = takeaway.order;
  }
  return orderObject?.items[index];
}
function cleanupCorruptedOrders() {
  // Pulisci tavoli
  appState.tables.forEach((table) => {
    if (table.order && table.order.items) {
      table.order.items = table.order.items.filter((item) => item && item.name);
    }
  });

  // Pulisci asporti
  appState.takeaways.forEach((takeaway) => {
    if (takeaway.order && takeaway.order.items) {
      takeaway.order.items = takeaway.order.items.filter(
        (item) => item && item.name
      );
    }
  });

  saveData();
  console.log("✅ Ordini puliti");
}

// 1. INIZIALIZZAZIONE DOMICILI
// Aggiungi questa funzione per inizializzare gli eventi dei domicili
function initializeDeliveryEvents() {
  // Bottone nuovo domicilio
  document.getElementById("addDeliveryBtn").addEventListener("click", () => {
    openDeliveryModal();
  });

  // Gestione tipo orario consegna
  document.getElementById("deliveryAsap").addEventListener("change", (e) => {
    if (e.target.checked) {
      document.getElementById("deliveryTimeInputContainer").style.display =
        "none";
    }
  });

  document
    .getElementById("deliveryScheduled")
    .addEventListener("change", (e) => {
      if (e.target.checked) {
        document.getElementById("deliveryTimeInputContainer").style.display =
          "block";
      }
    });

  // Popola le ore nel select
  const hourSelect = document.getElementById("deliveryHour");
  for (let h = 18; h <= 23; h++) {
    const option = document.createElement("option");
    option.value = h.toString().padStart(2, "0");
    option.textContent = h.toString().padStart(2, "0");
    hourSelect.appendChild(option);
  }

  // Salva domicilio
  // Non serve qui perché l'event listener è già nel DOM ready più in basso

  // Filtro stato domicili
  document
    .getElementById("deliveryStatusFilter")
    .addEventListener("change", (e) => {
      renderDeliveries(e.target.value);
    });

  // Eventi modal pagamento
  document.getElementById("paymentCash").addEventListener("change", (e) => {
    if (e.target.checked) {
      document.getElementById("cashSection").style.display = "block";
      document.getElementById("cashSection").classList.add("active");
      calculateChange();
    }
  });

  document.getElementById("paymentPos").addEventListener("change", (e) => {
    if (e.target.checked) {
      document.getElementById("cashSection").classList.remove("active");
    }
  });

  // Calcola resto
  document
    .getElementById("cashGiven")
    .addEventListener("input", calculateChange);

  // Bottone aggiungi rider
  document.getElementById("addRiderBtn").addEventListener("click", () => {
    document.getElementById("riderModal").classList.add("active");
  });

  // Salva rider
  document
    .getElementById("saveRiderBtn")
    .addEventListener("click", saveNewRider);

  // Salva pagamento e assegna rider
  document
    .getElementById("saveDeliveryPaymentBtn")
    .addEventListener("click", saveDeliveryPayment);
}

// 2. FUNZIONE PER APRIRE IL MODAL NUOVO DOMICILIO
function openDeliveryModal(deliveryId = null) {
  const modal = document.getElementById("deliveryModal");
  const title = document.getElementById("deliveryModalTitle");

  if (deliveryId) {
    const delivery = appState.deliveries.find((d) => d.id === deliveryId);
    if (delivery) {
      title.textContent = "Modifica Domicilio";
      document.getElementById("deliveryCustomerName").value =
        delivery.customerName;
      document.getElementById("deliveryAddress").value = delivery.address || "";
      document.getElementById("deliveryPhone").value = delivery.phone || "";

      // Imposta orario
      if (delivery.deliveryTime.type === "asap") {
        document.getElementById("deliveryAsap").checked = true;
        document.getElementById("deliveryTimeInputContainer").style.display =
          "none";
      } else {
        document.getElementById("deliveryScheduled").checked = true;
        document.getElementById("deliveryTimeInputContainer").style.display =
          "block";
        const [hour, minute] = delivery.deliveryTime.time.split(":");
        document.getElementById("deliveryHour").value = hour;
        document.getElementById("deliveryMinute").value = minute;
      }
    }
  } else {
    title.textContent = "Nuovo Domicilio";
    document.getElementById("deliveryCustomerName").value = "";
    document.getElementById("deliveryAddress").value = "";
    document.getElementById("deliveryPhone").value = "";
    document.getElementById("deliveryAsap").checked = true;
    document.getElementById("deliveryTimeInputContainer").style.display =
      "none";
  }

  modal.classList.add("active");
}

// 4. FUNZIONE PER RENDERIZZARE I DOMICILI
function renderDeliveries(filter = "all") {
  const pendingContainer = document.getElementById("deliveryPendingContainer");
  const deliveringContainer = document.getElementById(
    "deliveryDeliveringContainer"
  );
  const deliveredContainer = document.getElementById(
    "deliveryDeliveredContainer"
  );

  // Pulisci i container
  pendingContainer.innerHTML = "";
  deliveringContainer.innerHTML = "";
  deliveredContainer.innerHTML = "";

  // Filtra i domicili
  let filteredDeliveries = appState.deliveries;
  if (filter !== "all") {
    filteredDeliveries = appState.deliveries.filter((d) => d.status === filter);
  }

  // Raggruppa per stato
  const pending = filteredDeliveries.filter((d) => d.status === "pending");
  const delivering = filteredDeliveries.filter(
    (d) => d.status === "delivering"
  );
  const delivered = filteredDeliveries.filter((d) => d.status === "delivered");

  // Usa renderDeliveryGroup invece di createDeliveryCard
  renderDeliveryGroup(pending, pendingContainer, "Nessun ordine da preparare");
  renderDeliveryGroup(
    delivering,
    deliveringContainer,
    "Nessun ordine in consegna"
  );
  renderDeliveryGroup(
    delivered,
    deliveredContainer,
    "Nessun ordine consegnato"
  );
}

// 6. FUNZIONE PER CALCOLARE IL TOTALE DI UN ORDINE DOMICILIO
function calculateOrderTotal(order) {
  let subtotal = 0;

  if (order.items) {
    order.items.forEach((item) => {
      let itemPrice = item.basePrice;

      // Gestisci pizze familiari
      if (item.isFamily) {
        itemPrice *= 2;
      }

      // NUOVO: Calcola il prezzo delle aggiunzioni per le mezze familiari
      if (item.isHalfFamily) {
        if (item.firstHalf && item.firstHalf.additions) {
          item.firstHalf.additions.forEach((addition) => {
            itemPrice += addition.price;
          });
        }
        if (item.secondHalf && item.secondHalf.additions) {
          item.secondHalf.additions.forEach((addition) => {
            itemPrice += addition.price;
          });
        }
      }

      // Aggiungi prezzo aggiunzioni normali
      if (item.additions && item.additions.length > 0) {
        item.additions.forEach((addition) => {
          let additionPrice = addition.price;
          if (item.isFamily) {
            additionPrice *= 2;
          }
          itemPrice += additionPrice;
        });
      }

      // Applica sconto item
      let finalPrice = itemPrice;
      if (item.discount > 0) {
        finalPrice = itemPrice * (1 - item.discount / 100);
      }

      if (item.isComplement) {
        finalPrice = 0;
      }

      subtotal += finalPrice * item.quantity;
    });
  }

  // Applica sconto ordine
  let discountAmount = 0;
  if (order.discount > 0) {
    if (order.discountType === "percentage") {
      discountAmount = subtotal * (order.discount / 100);
    } else if (order.discountType === "fixed") {
      discountAmount = Math.min(order.discount, subtotal);
    }
  }

  return subtotal - discountAmount;
}

// 7. FUNZIONE PER SELEZIONARE UN DOMICILIO
function selectDelivery(deliveryId) {
  const delivery = appState.deliveries.find((d) => d.id === deliveryId);
  if (!delivery) return;

  // Imposta lo stato corrente
  appState.currentOrderId = deliveryId;
  appState.currentOrderType = "delivery";
  appState.currentDeliveryId = deliveryId;

  // Mostra la vista ordine
  document.getElementById("orderView").classList.remove("hidden");
  document.querySelector("main").classList.add("hidden");

  // Aggiorna il titolo e lo stato
  document.getElementById(
    "orderTitle"
  ).textContent = `Domicilio - ${delivery.customerName}`;

  // Aggiorna lo stato visivo
  const statusElement = document.getElementById("orderStatus");
  statusElement.className = "table-status";

  switch (delivery.status) {
    case "pending":
      statusElement.textContent = "Da preparare";
      statusElement.classList.add("active");
      break;
    case "delivering":
      statusElement.textContent = "In consegna";
      statusElement.style.backgroundColor = "#ffc107";
      break;
    case "delivered":
      statusElement.textContent = "Consegnato";
      statusElement.style.backgroundColor = "#4caf50";
      break;
  }

  // Mostra/nascondi bottoni in base allo stato
  const closeOrderBtn = document.getElementById("closeOrderBtn");
  const printOrderBtn = document.getElementById("printOrderBtn");
  const printReceiptBtn = document.getElementById("printReceiptBtn");

  if (delivery.status === "delivered") {
    closeOrderBtn.classList.remove("active");
    printOrderBtn.classList.remove("active");
    printReceiptBtn.classList.remove("active");
  } else {
    closeOrderBtn.classList.add("active");
    printOrderBtn.classList.add("active");
    printReceiptBtn.classList.add("active");

    // Cambia testo del bottone in base allo stato
    if (delivery.status === "pending" && delivery.payment) {
      closeOrderBtn.textContent = "Metti in Consegna";
    } else if (delivery.status === "delivering") {
      closeOrderBtn.textContent = "Consegna Completata";
    } else {
      closeOrderBtn.textContent = "Imposta Pagamento";
    }
  }

  // Nascondi il bottone sconti per i domicili (opzionale)
  document.getElementById("applyDiscountBtn").classList.add("active");

  // Renderizza i prodotti
  renderOrderDetails();
  renderMenuCategories();
}

// 8. FUNZIONE PER APRIRE IL MODAL PAGAMENTO
function openPaymentModal(deliveryId) {
  const delivery = appState.deliveries.find((d) => d.id === deliveryId);
  if (!delivery) return;

  appState.currentDeliveryId = deliveryId;

  // Reset form
  document.getElementById("paymentCash").checked = false;
  document.getElementById("paymentPos").checked = false;
  document.getElementById("cashSection").classList.remove("active");
  document.getElementById("cashGiven").value = "";
  document.getElementById("changeAmount").textContent = "€ 0.00";

  // Renderizza i rider
  renderRiders();

  // Mostra modal
  document.getElementById("deliveryPaymentModal").classList.add("active");
}

// 9. FUNZIONE PER RENDERIZZARE I RIDER
function renderRiders() {
  const container = document.getElementById("ridersContainer");
  container.innerHTML = "";

  appState.riders.forEach((rider) => {
    if (rider.active) {
      const riderDiv = document.createElement("div");
      riderDiv.className = "rider-option";
      riderDiv.innerHTML = `
        <input type="radio" name="selectedRider" value="${rider.id}" id="rider_${rider.id}">
        <label for="rider_${rider.id}" style="cursor: pointer; flex: 1;">
          ${rider.name}
        </label>
      `;
      container.appendChild(riderDiv);
    }
  });
}

// 10. FUNZIONE PER CALCOLARE IL RESTO
function calculateChange() {
  const delivery = appState.deliveries.find(
    (d) => d.id === appState.currentDeliveryId
  );
  if (!delivery) return;

  const total = calculateDeliveryTotal(delivery);
  const cashGiven = parseFloat(document.getElementById("cashGiven").value) || 0;
  const change = Math.max(0, cashGiven - total);

  document.getElementById("changeAmount").textContent = `€ ${formatPrice(
    change
  )}`;
}

// 11. FUNZIONE PER SALVARE NUOVO RIDER
function saveNewRider() {
  const riderName = document.getElementById("riderName").value.trim();

  if (!riderName) {
    alert("Inserisci il nome del rider");
    return;
  }

  const newRider = {
    id: Date.now(),
    name: riderName,
    active: true,
  };

  appState.riders.push(newRider);
  saveData();

  // Chiudi modal e aggiorna lista
  document.getElementById("riderModal").classList.remove("active");
  document.getElementById("riderName").value = "";
  renderRiders();
}

// 12. FUNZIONE PER SALVARE PAGAMENTO E RIDER
function saveDeliveryPayment() {
  const delivery = appState.deliveries.find(
    (d) => d.id === appState.currentDeliveryId
  );
  if (!delivery) return;

  // Verifica metodo pagamento
  const paymentMethod = document.querySelector(
    'input[name="paymentMethod"]:checked'
  );
  if (!paymentMethod) {
    alert("Seleziona un metodo di pagamento");
    return;
  }

  // Verifica rider
  const selectedRider = document.querySelector(
    'input[name="selectedRider"]:checked'
  );
  if (!selectedRider) {
    alert("Seleziona un rider");
    return;
  }

  // Calcola totale
  const total = calculateDeliveryTotal(delivery);

  // Salva pagamento
  delivery.payment = {
    method: paymentMethod.value,
    amount: total,
  };

  // Se contanti, salva info resto
  if (paymentMethod.value === "cash") {
    const cashGiven =
      parseFloat(document.getElementById("cashGiven").value) || 0;
    if (cashGiven < total) {
      alert("L'importo pagato deve essere almeno pari al totale");
      return;
    }
    delivery.payment.cashGiven = cashGiven;
    delivery.payment.change = cashGiven - total;
  }

  // Salva rider
  const riderId = parseInt(selectedRider.value);
  const rider = appState.riders.find((r) => r.id === riderId);
  if (rider) {
    delivery.rider = {
      id: rider.id,
      name: rider.name,
    };
  }

  // Aggiorna stato a "in consegna"
  delivery.status = "delivering";

  saveData();
  renderDeliveries();

  // Chiudi modal
  document.getElementById("deliveryPaymentModal").classList.remove("active");

  // Aggiorna vista se è l'ordine corrente
  if (appState.currentOrderId === delivery.id) {
    selectDelivery(delivery.id);
  }
}

// 13. FUNZIONE PER COMPLETARE LA CONSEGNA
function completeDelivery(deliveryId) {
  const delivery = appState.deliveries.find((d) => d.id === deliveryId);
  if (!delivery) return;

  if (confirm("Confermi che l'ordine è stato consegnato?")) {
    delivery.status = "delivered";
    delivery.deliveredAt = new Date().toISOString();

    saveData();
    renderDeliveries();

    // Se è l'ordine corrente, aggiorna la vista
    if (appState.currentOrderId === deliveryId) {
      selectDelivery(deliveryId);
    }
  }
}

// Inizializzazione dell'app
document.addEventListener("DOMContentLoaded", async () => {
  await initializeApp();
});
// Inizializzazione eventi domicilio quando il DOM è pronto
document.addEventListener("DOMContentLoaded", function () {
  // Collega eventi domicilio
  const addDeliveryBtn = document.getElementById("addDeliveryBtn");
  if (addDeliveryBtn) {
    addDeliveryBtn.addEventListener("click", showAddDeliveryModal);
    console.log("✅ Event listener domicilio collegato");
  }

  // Eventi per radio button orario
  const deliveryAsap = document.getElementById("deliveryAsap");
  const deliveryScheduled = document.getElementById("deliveryScheduled");

  if (deliveryAsap) {
    deliveryAsap.addEventListener("change", function () {
      if (this.checked) {
        document.getElementById("deliveryTimeInputContainer").style.display =
          "none";
      }
    });
  }

  if (deliveryScheduled) {
    deliveryScheduled.addEventListener("change", function () {
      if (this.checked) {
        document.getElementById("deliveryTimeInputContainer").style.display =
          "block";

        // Popola le ore se non già fatto
        const hourSelect = document.getElementById("deliveryHour");
        if (hourSelect.options.length === 0) {
          for (let h = 0; h < 24; h++) {
            const option = document.createElement("option");
            option.value = h.toString().padStart(2, "0");
            option.textContent = h.toString().padStart(2, "0");
            hourSelect.appendChild(option);
          }
          hourSelect.value = "19";
        }
      }
    });
  }

  // Event listener per salvare domicilio
  const saveDeliveryBtn = document.getElementById("saveDeliveryBtn");
  if (saveDeliveryBtn) {
    saveDeliveryBtn.addEventListener("click", createDelivery);
  }

  // Event listener per chiudere modal
  const closeButtons = document.querySelectorAll(
    '#deliveryModal .modal-close, #deliveryModal [data-dismiss="modal"]'
  );
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      document.getElementById("deliveryModal").classList.remove("active");
    });
  });
});
function calculateChange() {
  const delivery = appState.deliveries.find(
    (d) => d.id === appState.currentDeliveryId
  );
  if (!delivery) return;

  const total = calculateOrderTotal(delivery.order);
  const cashGiven = parseFloat(document.getElementById("cashGiven").value) || 0;
  const change = cashGiven - total;

  document.getElementById("changeAmount").textContent = `€ ${change.toFixed(
    2
  )}`;
  // Aggiungi l'event listener per il pulsante salva ingrediente
  document
    .getElementById("saveIngredientBtn")
    .addEventListener("click", saveIngredient);
  // Colora in rosso se l'importo è insufficiente
  if (change < 0) {
    document.getElementById("changeAmount").style.color = "#dc2626";
  } else {
    document.getElementById("changeAmount").style.color = "#2563eb";
  }
}
