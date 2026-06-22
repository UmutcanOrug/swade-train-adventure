const MODULE_ID = "swade-dominion-train";
const DATA_SETTING = "worldData";
const CLIENT_SETTING = "clientState";
const SOCKET_NAME = `module.${MODULE_ID}`;
const TEMPLATE_PATH = `modules/${MODULE_ID}/templates/train-panel.hbs`;
const ACTION_CONFIRM_TIMEOUT_MS = 6000;

const RESOURCE_KEYS = ["talion", "food", "water", "fuel", "amenities"];
const RESOURCE_LABELS = {
  talion: "Talion",
  food: "Food",
  water: "Water",
  fuel: "Fuel",
  amenities: "Amenities"
};

const RESOURCE_ICONS = {
  talion: "fa-coins",
  food: "fa-bowl-food",
  water: "fa-droplet",
  fuel: "fa-gas-pump",
  amenities: "fa-martini-glass-citrus"
};

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "fa-gauge-high" },
  { id: "wagons", label: "Wagons", icon: "fa-train" },
  { id: "people", label: "People", icon: "fa-users" },
  { id: "markets", label: "Markets", icon: "fa-store" },
  { id: "route", label: "Route", icon: "fa-route" },
  { id: "settings", label: "Settings", icon: "fa-sliders" }
];

const WAGON_TYPE_SUGGESTIONS = [
  "Locomotive",
  "Passenger Wagon",
  "Cargo Wagon",
  "Military Wagon",
  "Medical Wagon",
  "Dining Wagon",
  "Prisoner Wagon",
  "Luxury Wagon",
  "Fuel Wagon",
  "Command Wagon"
];

const CHAT_MODE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "gm", label: "GM Only" },
  { value: "public", label: "Public Summary" },
  { value: "both", label: "Both" }
];

let trainApp = null;
let refreshTimer = null;
const pendingActionRequests = new Map();

const uiState = {
  activeTab: "dashboard",
  selectedMarketId: ""
};

Hooks.once("init", () => {
  registerHandlebarsHelpers();
  registerSettings();
  registerKeybinding();
});

Hooks.once("ready", async () => {
  loadClientState();
  bindSocket();
  exposeApi();

  if (game.user.isGM && isResponsibleGM()) {
    await ensureWorldData();
  }
});

function registerSettings() {
  game.settings.register(MODULE_ID, DATA_SETTING, {
    name: "SWADE Dominion Train Data",
    scope: "world",
    config: false,
    type: Object,
    default: defaultWorldData()
  });

  game.settings.register(MODULE_ID, CLIENT_SETTING, {
    name: "SWADE Dominion Train Client State",
    scope: "client",
    config: false,
    type: Object,
    default: {}
  });
}

function registerKeybinding() {
  game.keybindings.register(MODULE_ID, "toggleTrainPanel", {
    name: "Dominion Train: Toggle Panel",
    hint: "Open or close the Dominion train management panel.",
    editable: [{ key: "KeyO" }],
    restricted: false,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
    onDown: () => {
      toggleTrainPanel();
      return true;
    }
  });
}

function registerHandlebarsHelpers() {
  const helpers = {
    eq: (a, b) => a === b,
    ne: (a, b) => a !== b,
    not: value => !value,
    and: (...args) => args.slice(0, -1).every(Boolean),
    or: (...args) => args.slice(0, -1).some(Boolean),
    checked: value => value ? "checked" : "",
    selected: (a, b) => a === b ? "selected" : ""
  };

  for (const [name, fn] of Object.entries(helpers)) {
    if (!Handlebars.helpers[name]) Handlebars.registerHelper(name, fn);
  }
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class DominionTrainApplication extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "swade-dominion-train",
    classes: ["dominion-train-window"],
    tag: "section",
    window: {
      title: "SWADE Dominion Train",
      icon: "fa-solid fa-train",
      resizable: true
    },
    position: {
      width: 1180,
      height: 760
    }
  };

  static PARTS = {
    body: {
      template: TEMPLATE_PATH
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    return Object.assign(context, buildContext(getWorldData()));
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    activateListeners(this.element);
  }
}

function exposeApi() {
  globalThis.DominionTrain = {
    open: openTrainPanel,
    close: closeTrainPanel,
    toggle: toggleTrainPanel,
    getData: getWorldData
  };
}

function openTrainPanel() {
  const data = getWorldData();
  if (!game.user.isGM && !data.settings.playersCanOpenPanel) {
    ui.notifications.warn("Players cannot open the Dominion train panel right now.");
    return false;
  }

  if (!trainApp) {
    trainApp = new DominionTrainApplication({
      position: defaultPanelPosition()
    });
  }
  return trainApp.render(true);
}

function defaultPanelPosition() {
  const width = Math.min(1180, Math.max(900, (globalThis.innerWidth || 1280) - 40));
  const height = Math.min(760, Math.max(650, (globalThis.innerHeight || 820) - 40));
  return { width, height };
}

async function closeTrainPanel() {
  if (!trainApp?.rendered) return;
  await trainApp.close();
}

function toggleTrainPanel() {
  if (trainApp?.rendered) return closeTrainPanel();
  return openTrainPanel();
}

function buildContext(rawData) {
  const data = normalizeData(rawData);
  const isGM = Boolean(game.user?.isGM);
  const summary = buildSummary(data);
  const visibleSummary = summaryContext(data, summary, isGM);
  const tabs = visibleTabs(data, isGM).map(tab => ({
    ...tab,
    active: tab.id === uiState.activeTab
  }));

  if (!tabs.some(tab => tab.active)) {
    uiState.activeTab = "dashboard";
    tabs.forEach(tab => tab.active = tab.id === "dashboard");
  }

  const selectedMarket = getSelectedMarket(data);

  return {
    moduleId: MODULE_ID,
    isGM,
    readOnly: !isGM,
    activeTab: uiState.activeTab,
    tabs,
    resources: RESOURCE_KEYS.map(key => resourceContext(data, key, isGM)),
    resourcePurchaseOptions: RESOURCE_KEYS
      .filter(key => key !== "talion")
      .map(key => ({ key, label: RESOURCE_LABELS[key] })),
    wagonTypeSuggestions: WAGON_TYPE_SUGGESTIONS,
    chatModeOptions: CHAT_MODE_OPTIONS,
    wagons: data.wagons,
    groups: data.groups.map(group => ({
      ...group,
      assignedWagonName: wagonLabel(data, group.assignedWagon)
    })),
    markets: data.markets.map(market => ({
      ...market,
      active: selectedMarket?.id === market.id
    })),
    selectedMarket,
    route: routeContext(data, isGM),
    settings: data.settings,
    summary: visibleSummary,
    warnings: buildWarnings(data, summary, isGM),
    wagonOptions: data.wagons.map(wagon => ({
      id: wagon.id,
      name: wagon.name || "Unnamed Wagon"
    }))
  };
}

function visibleTabs(data, isGM) {
  return TABS.filter(tab => {
    if (tab.id === "settings") return isGM;
    if (isGM) return true;
    if (tab.id === "wagons") return data.settings.playersSeeWagonList;
    if (tab.id === "people") return data.settings.playersSeePassengerGroups;
    if (tab.id === "markets") return false;
    return true;
  });
}

function resourceContext(data, key, isGM) {
  const value = Number(data.resources[key] || 0);
  const exactVisible = isGM || data.settings.playersSeeExactResources;
  const talionVisible = isGM || key !== "talion" || data.settings.showTalionToPlayers;
  const status = resourceStatus(value);
  return {
    key,
    label: RESOURCE_LABELS[key],
    icon: RESOURCE_ICONS[key],
    value: formatNumber(value),
    rawValue: value,
    display: talionVisible ? (exactVisible ? formatNumber(value) : status.label) : "Hidden",
    status: status.id,
    masked: !talionVisible || !exactVisible
  };
}

function routeContext(data, isGM) {
  const canSeeProgress = isGM || data.settings.playersSeeRouteProgress;
  return {
    ...data.route,
    remainingDisplay: canSeeProgress ? formatNumber(data.route.remainingTurns) : "Unknown",
    remainingInput: canSeeProgress ? data.route.remainingTurns : "",
    movementLabel: data.route.moving ? "Moving" : "Stopped"
  };
}

function buildSummary(data) {
  const activeWagons = data.wagons.filter(wagon => wagon.active);
  const population = data.groups.reduce((total, group) => total + Number(group.count || 0), 0);
  const capacity = activeWagons.reduce((total, wagon) => total + Number(wagon.capacity || 0), 0);
  const foodCost = roundResource(data.groups.reduce((total, group) => total + Number(group.count || 0) * Number(group.foodPerTurn || 0), 0));
  const waterCost = roundResource(data.groups.reduce((total, group) => total + Number(group.count || 0) * Number(group.waterPerTurn || 0), 0));
  const amenitiesCost = roundResource(data.groups.reduce((total, group) => total + Number(group.count || 0) * Number(group.amenitiesPerTurn || 0), 0));
  const fuelCost = shouldConsumeFuel(data) ? calculateFuelCost(data) : 0;

  return {
    currentTurn: Number(data.currentTurn || 1),
    activeWagons: activeWagons.length,
    population,
    capacity,
    overCapacity: capacity > 0 && population > capacity,
    foodCost: formatNumber(foodCost),
    waterCost: formatNumber(waterCost),
    amenitiesCost: formatNumber(amenitiesCost),
    fuelCost: formatNumber(fuelCost),
    fuelCostRaw: fuelCost,
    foodCostRaw: foodCost,
    waterCostRaw: waterCost,
    amenitiesCostRaw: amenitiesCost
  };
}

function summaryContext(data, summary, isGM) {
  const canSeeExactResources = isGM || data.settings.playersSeeExactResources;
  const canSeeWagons = isGM || data.settings.playersSeeWagonList;
  const canSeePeople = isGM || data.settings.playersSeePassengerGroups;

  return {
    ...summary,
    overCapacityVisible: summary.overCapacity && canSeeWagons && canSeePeople,
    activeWagonsDisplay: canSeeWagons ? summary.activeWagons : "Hidden",
    populationCapacityDisplay: `${canSeePeople ? summary.population : "Hidden"} / ${canSeeWagons ? summary.capacity : "Hidden"}`,
    fuelCostDisplay: canSeeExactResources && canSeeWagons ? summary.fuelCost : "Hidden",
    foodCostDisplay: canSeeExactResources && canSeePeople ? summary.foodCost : "Hidden",
    waterCostDisplay: canSeeExactResources && canSeePeople ? summary.waterCost : "Hidden",
    amenitiesCostDisplay: canSeeExactResources && canSeePeople ? summary.amenitiesCost : "Hidden"
  };
}

function buildWarnings(data, summary, isGM) {
  const warnings = [];

  if (!isGM) {
    if (data.settings.playersSeeWagonList && data.settings.playersSeePassengerGroups && summary.overCapacity) {
      warnings.push("Population exceeds wagon capacity.");
    }

    for (const key of ["food", "water", "fuel", "amenities"]) {
      if (Number(data.resources[key] || 0) <= 0) warnings.push(`${RESOURCE_LABELS[key]} is depleted.`);
    }

    if (data.settings.playersSeeRouteProgress && data.route.remainingTurns <= 0) warnings.push("Route destination reached.");
    if (!data.route.moving) warnings.push("Train is stopped.");
    return warnings;
  }

  if (summary.overCapacity) {
    warnings.push(`Population exceeds wagon capacity by ${formatNumber(summary.population - summary.capacity)}.`);
  }

  const checks = [
    ["food", summary.foodCostRaw],
    ["water", summary.waterCostRaw],
    ["amenities", summary.amenitiesCostRaw],
    ["fuel", summary.fuelCostRaw]
  ];

  for (const [key, cost] of checks) {
    const available = Number(data.resources[key] || 0);
    if (cost > 0 && available <= 0) warnings.push(`${RESOURCE_LABELS[key]} is depleted.`);
    else if (cost > 0 && available < cost) warnings.push(`${RESOURCE_LABELS[key]} shortage next turn: ${formatNumber(cost - available)}.`);
  }

  if (data.route.remainingTurns <= 0) warnings.push("Route destination reached.");
  if (!data.route.moving) warnings.push("Train is stopped.");
  return warnings;
}

function activateListeners(element) {
  const root = element.querySelector(".dt-root");
  if (!root) return;

  root.querySelectorAll("[data-tab]").forEach(button => {
    button.addEventListener("click", event => {
      uiState.activeTab = event.currentTarget.dataset.tab || "dashboard";
      persistClientState();
      renderTrainPanel();
    });
  });

  root.querySelector("[data-advance-turn]")?.addEventListener("click", async event => {
    event.preventDefault();
    await sendAction("advanceTurn", {});
  });

  root.querySelector("[data-add-wagon]")?.addEventListener("click", async event => {
    event.preventDefault();
    await sendAction("addWagon", {});
  });

  root.querySelector("[data-add-group]")?.addEventListener("click", async event => {
    event.preventDefault();
    await sendAction("addGroup", {});
  });

  root.querySelector("[data-add-market]")?.addEventListener("click", async event => {
    event.preventDefault();
    await sendAction("addMarket", {});
  });

  root.querySelector("[data-add-market-item]")?.addEventListener("click", async event => {
    event.preventDefault();
    await sendAction("addMarketItem", {
      marketId: event.currentTarget.dataset.addMarketItem || ""
    });
  });

  root.querySelectorAll("[data-select-market]").forEach(button => {
    button.addEventListener("click", event => {
      uiState.selectedMarketId = event.currentTarget.dataset.selectMarket || "";
      persistClientState();
      renderTrainPanel();
    });
  });

  root.querySelector("[data-resource-form]")?.addEventListener("submit", async event => {
    event.preventDefault();
    await sendAction("setResources", Object.fromEntries(new FormData(event.currentTarget).entries()));
  });

  root.querySelector("[data-route-form]")?.addEventListener("submit", async event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await sendAction("updateRoute", {
      currentRouteName: formData.get("currentRouteName"),
      destinationName: formData.get("destinationName"),
      remainingTurns: formData.get("remainingTurns"),
      moving: formData.has("moving"),
      notes: formData.get("notes")
    });
  });

  root.querySelector("[data-settings-form]")?.addEventListener("submit", async event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await sendAction("updateSettings", {
      baseFuelPerTurn: formData.get("baseFuelPerTurn"),
      fuelMultiplierPerWagon: formData.get("fuelMultiplierPerWagon"),
      allowNegativeResources: formData.has("allowNegativeResources"),
      consumeFuelWhileStopped: formData.has("consumeFuelWhileStopped"),
      defaultFoodPerPerson: formData.get("defaultFoodPerPerson"),
      defaultWaterPerPerson: formData.get("defaultWaterPerPerson"),
      defaultAmenitiesPerPerson: formData.get("defaultAmenitiesPerPerson"),
      playersCanOpenPanel: formData.has("playersCanOpenPanel"),
      showTalionToPlayers: formData.has("showTalionToPlayers"),
      playersSeeExactResources: formData.has("playersSeeExactResources"),
      playersSeeWagonList: formData.has("playersSeeWagonList"),
      playersSeePassengerGroups: formData.has("playersSeePassengerGroups"),
      playersSeeRouteProgress: formData.has("playersSeeRouteProgress"),
      chatOutputMode: formData.get("chatOutputMode")
    });
  });

  root.querySelectorAll("[data-wagon-form]").forEach(form => {
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      await sendAction("updateWagon", {
        id: event.currentTarget.dataset.wagonForm,
        name: formData.get("name"),
        type: formData.get("type"),
        active: formData.has("active"),
        capacity: formData.get("capacity"),
        notes: formData.get("notes"),
        gmNotes: formData.get("gmNotes")
      });
    });
  });

  root.querySelectorAll("[data-delete-wagon]").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      await sendAction("deleteWagon", { id: event.currentTarget.dataset.deleteWagon });
    });
  });

  root.querySelectorAll("[data-group-form]").forEach(form => {
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      await sendAction("updateGroup", {
        id: event.currentTarget.dataset.groupForm,
        name: formData.get("name"),
        count: formData.get("count"),
        assignedWagon: formData.get("assignedWagon"),
        foodPerTurn: formData.get("foodPerTurn"),
        waterPerTurn: formData.get("waterPerTurn"),
        amenitiesPerTurn: formData.get("amenitiesPerTurn"),
        notes: formData.get("notes"),
        gmNotes: formData.get("gmNotes")
      });
    });
  });

  root.querySelectorAll("[data-delete-group]").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      await sendAction("deleteGroup", { id: event.currentTarget.dataset.deleteGroup });
    });
  });

  root.querySelector("[data-market-form]")?.addEventListener("submit", async event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await sendAction("updateMarket", {
      id: event.currentTarget.dataset.marketForm,
      name: formData.get("name"),
      location: formData.get("location"),
      notes: formData.get("notes")
    });
  });

  root.querySelector("[data-delete-market]")?.addEventListener("click", async event => {
    event.preventDefault();
    await sendAction("deleteMarket", { id: event.currentTarget.dataset.deleteMarket });
  });

  root.querySelectorAll("[data-market-item-form]").forEach(form => {
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      await sendAction("updateMarketItem", {
        marketId: event.currentTarget.dataset.marketItemMarket,
        id: event.currentTarget.dataset.marketItemForm,
        name: formData.get("name"),
        description: formData.get("description"),
        cost: formData.get("cost"),
        resourceType: formData.get("resourceType"),
        amount: formData.get("amount"),
        stock: formData.get("stock")
      });
    });
  });

  root.querySelectorAll("[data-buy-market-item]").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      await sendAction("buyMarketItem", {
        marketId: event.currentTarget.dataset.buyMarket,
        itemId: event.currentTarget.dataset.buyMarketItem
      });
    });
  });

  root.querySelectorAll("[data-delete-market-item]").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      await sendAction("deleteMarketItem", {
        marketId: event.currentTarget.dataset.deleteMarket,
        itemId: event.currentTarget.dataset.deleteMarketItem
      });
    });
  });
}

function bindSocket() {
  game.socket.on(SOCKET_NAME, async packet => {
    if (!packet || typeof packet !== "object") return;

    if (packet.type === "refresh") {
      scheduleRefresh();
      return;
    }

    if (packet.type === "actionResult") {
      if (packet.targetUserId && packet.targetUserId !== game.user.id) return;
      resolvePendingAction(packet.requestId, true);
      return;
    }

    if (packet.type === "actionError") {
      if (packet.targetUserId && packet.targetUserId !== game.user.id) return;
      const handled = resolvePendingAction(packet.requestId, false, packet.message);
      if (!handled && packet.message) ui.notifications.warn(packet.message);
      return;
    }

    if (!packet.action) return;
    if (!game.user.isGM || !isResponsibleGM()) return;

    try {
      await processAction(packet.action, packet.payload || {}, packet.userId);
      game.socket.emit(SOCKET_NAME, {
        type: "actionResult",
        targetUserId: packet.userId,
        requestId: packet.requestId
      });
    } catch (error) {
      console.warn(`${MODULE_ID} | Rejected socket action`, error);
      game.socket.emit(SOCKET_NAME, {
        type: "actionError",
        targetUserId: packet.userId,
        requestId: packet.requestId,
        message: error.message || "Dominion train action rejected."
      });
    }
  });
}

function waitForActionConfirmation(requestId) {
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      pendingActionRequests.delete(requestId);
      ui.notifications.warn("Dominion Train could not confirm that action.");
      resolve(false);
    }, ACTION_CONFIRM_TIMEOUT_MS);

    pendingActionRequests.set(requestId, { resolve, timeout });
  });
}

function resolvePendingAction(requestId, success, message = "") {
  if (!requestId || !pendingActionRequests.has(requestId)) return false;

  const pending = pendingActionRequests.get(requestId);
  pendingActionRequests.delete(requestId);
  clearTimeout(pending.timeout);

  if (!success && message) ui.notifications.warn(message);
  pending.resolve(Boolean(success));
  return true;
}

async function sendAction(action, payload = {}) {
  if (!game.user.isGM) {
    ui.notifications.warn("Only a GM can update Dominion train data.");
    return false;
  }

  if (isResponsibleGM()) {
    try {
      return await processAction(action, payload, game.user.id);
    } catch (error) {
      ui.notifications.warn(error.message || "Dominion train action rejected.");
      throw error;
    }
  }

  if (!hasResponsibleGM()) {
    ui.notifications.warn("A GM must be connected to update Dominion train data.");
    return false;
  }

  const requestId = randomId();
  const confirmation = waitForActionConfirmation(requestId);
  try {
    game.socket.emit(SOCKET_NAME, {
      action,
      payload,
      userId: game.user.id,
      requestId,
      created: Date.now()
    });
  } catch (error) {
    resolvePendingAction(requestId, false, error.message || "Dominion Train could not send that action.");
  }
  return confirmation;
}

async function processAction(action, payload, userId) {
  const user = users().find(candidate => candidate.id === userId);
  if (!user?.isGM) throw new Error("This Dominion train action is GM only.");

  const data = getWorldData();
  switch (action) {
    case "setResources":
      setResources(data, payload);
      break;
    case "updateRoute":
      updateRoute(data, payload);
      break;
    case "updateSettings":
      updateSettings(data, payload);
      break;
    case "addWagon":
      data.wagons.push(defaultWagon(data));
      break;
    case "updateWagon":
      updateWagon(data, payload);
      break;
    case "deleteWagon":
      deleteById(data.wagons, payload.id);
      data.groups.forEach(group => {
        if (group.assignedWagon === payload.id) group.assignedWagon = "";
      });
      break;
    case "addGroup":
      data.groups.push(defaultGroup(data));
      break;
    case "updateGroup":
      updateGroup(data, payload);
      break;
    case "deleteGroup":
      deleteById(data.groups, payload.id);
      break;
    case "addMarket":
      data.markets.push(defaultMarket());
      uiState.selectedMarketId = data.markets.at(-1)?.id || "";
      break;
    case "updateMarket":
      updateMarket(data, payload);
      break;
    case "deleteMarket":
      deleteById(data.markets, payload.id);
      uiState.selectedMarketId = data.markets[0]?.id || "";
      break;
    case "addMarketItem":
      addMarketItem(data, payload);
      break;
    case "updateMarketItem":
      updateMarketItem(data, payload);
      break;
    case "deleteMarketItem":
      deleteMarketItem(data, payload);
      break;
    case "buyMarketItem":
      await buyMarketItem(data, payload);
      return true;
    case "advanceTurn":
      await advanceTurn(data);
      return true;
    default:
      throw new Error(`Unknown Dominion train action: ${action}`);
  }

  await saveWorldData(data, action);
  return true;
}

function setResources(data, payload) {
  for (const key of RESOURCE_KEYS) {
    const value = toNumber(payload[key], data.resources[key] || 0);
    data.resources[key] = data.settings.allowNegativeResources ? value : Math.max(0, value);
  }
}

function updateRoute(data, payload) {
  data.route.currentRouteName = cleanString(payload.currentRouteName);
  data.route.destinationName = cleanString(payload.destinationName);
  data.route.remainingTurns = Math.max(0, toNumber(payload.remainingTurns, data.route.remainingTurns));
  data.route.moving = Boolean(payload.moving);
  data.route.notes = cleanString(payload.notes);
}

function updateSettings(data, payload) {
  data.settings.baseFuelPerTurn = Math.max(0, toNumber(payload.baseFuelPerTurn, data.settings.baseFuelPerTurn));
  data.settings.fuelMultiplierPerWagon = Math.max(0, toNumber(payload.fuelMultiplierPerWagon, data.settings.fuelMultiplierPerWagon));
  data.settings.allowNegativeResources = Boolean(payload.allowNegativeResources);
  data.settings.consumeFuelWhileStopped = Boolean(payload.consumeFuelWhileStopped);
  data.settings.defaultFoodPerPerson = Math.max(0, toNumber(payload.defaultFoodPerPerson, data.settings.defaultFoodPerPerson));
  data.settings.defaultWaterPerPerson = Math.max(0, toNumber(payload.defaultWaterPerPerson, data.settings.defaultWaterPerPerson));
  data.settings.defaultAmenitiesPerPerson = Math.max(0, toNumber(payload.defaultAmenitiesPerPerson, data.settings.defaultAmenitiesPerPerson));
  data.settings.playersCanOpenPanel = Boolean(payload.playersCanOpenPanel);
  data.settings.showTalionToPlayers = Boolean(payload.showTalionToPlayers);
  data.settings.playersSeeExactResources = Boolean(payload.playersSeeExactResources);
  data.settings.playersSeeWagonList = Boolean(payload.playersSeeWagonList);
  data.settings.playersSeePassengerGroups = Boolean(payload.playersSeePassengerGroups);
  data.settings.playersSeeRouteProgress = Boolean(payload.playersSeeRouteProgress);
  data.settings.chatOutputMode = CHAT_MODE_OPTIONS.some(option => option.value === payload.chatOutputMode) ? payload.chatOutputMode : data.settings.chatOutputMode;
}

function updateWagon(data, payload) {
  const wagon = data.wagons.find(candidate => candidate.id === payload.id);
  if (!wagon) throw new Error("Wagon not found.");
  wagon.name = cleanString(payload.name) || "Unnamed Wagon";
  wagon.type = cleanString(payload.type);
  wagon.active = Boolean(payload.active);
  wagon.capacity = Math.max(0, toNumber(payload.capacity, wagon.capacity));
  wagon.notes = cleanString(payload.notes);
  wagon.gmNotes = cleanString(payload.gmNotes);
}

function updateGroup(data, payload) {
  const group = data.groups.find(candidate => candidate.id === payload.id);
  if (!group) throw new Error("Passenger group not found.");
  group.name = cleanString(payload.name) || "Unnamed Group";
  group.count = Math.max(0, toNumber(payload.count, group.count));
  group.assignedWagon = data.wagons.some(wagon => wagon.id === payload.assignedWagon) ? payload.assignedWagon : "";
  group.foodPerTurn = Math.max(0, toNumber(payload.foodPerTurn, group.foodPerTurn));
  group.waterPerTurn = Math.max(0, toNumber(payload.waterPerTurn, group.waterPerTurn));
  group.amenitiesPerTurn = Math.max(0, toNumber(payload.amenitiesPerTurn, group.amenitiesPerTurn));
  group.notes = cleanString(payload.notes);
  group.gmNotes = cleanString(payload.gmNotes);
}

function updateMarket(data, payload) {
  const market = data.markets.find(candidate => candidate.id === payload.id);
  if (!market) throw new Error("Market not found.");
  market.name = cleanString(payload.name) || "Unnamed Market";
  market.location = cleanString(payload.location);
  market.notes = cleanString(payload.notes);
}

function addMarketItem(data, payload) {
  const market = data.markets.find(candidate => candidate.id === payload.marketId) || data.markets[0];
  if (!market) throw new Error("Market not found.");
  market.items.push(defaultMarketItem());
  uiState.selectedMarketId = market.id;
}

function updateMarketItem(data, payload) {
  const market = data.markets.find(candidate => candidate.id === payload.marketId);
  if (!market) throw new Error("Market not found.");
  const item = market.items.find(candidate => candidate.id === payload.id);
  if (!item) throw new Error("Market item not found.");
  item.name = cleanString(payload.name) || "Unnamed Item";
  item.description = cleanString(payload.description);
  item.cost = Math.max(0, toNumber(payload.cost, item.cost));
  item.resourceType = RESOURCE_KEYS.includes(payload.resourceType) && payload.resourceType !== "talion" ? payload.resourceType : item.resourceType;
  item.amount = Math.max(0, toNumber(payload.amount, item.amount));
  item.stock = Math.max(0, toNumber(payload.stock, item.stock));
}

function deleteMarketItem(data, payload) {
  const market = data.markets.find(candidate => candidate.id === payload.marketId);
  if (!market) throw new Error("Market not found.");
  deleteById(market.items, payload.itemId);
}

async function buyMarketItem(data, payload) {
  const market = data.markets.find(candidate => candidate.id === payload.marketId);
  if (!market) throw new Error("Market not found.");
  const item = market.items.find(candidate => candidate.id === payload.itemId);
  if (!item) throw new Error("Market item not found.");
  if (item.stock <= 0) throw new Error("That market item is out of stock.");
  if (!data.settings.allowNegativeResources && data.resources.talion < item.cost) {
    throw new Error("Not enough Talion.");
  }

  data.resources.talion = roundResource(data.resources.talion - item.cost);
  data.resources[item.resourceType] = roundResource((data.resources[item.resourceType] || 0) + item.amount);
  if (!data.settings.allowNegativeResources) data.resources.talion = Math.max(0, data.resources.talion);
  item.stock = Math.max(0, roundResource(item.stock - 1));
  await saveWorldData(data, "buyMarketItem");
  await createMarketChat(data, market, item);
  return true;
}

async function advanceTurn(data) {
  const summary = buildSummary(data);
  const report = {
    turnBefore: data.currentTurn,
    turnAfter: Number(data.currentTurn || 1) + 1,
    routeBefore: data.route.remainingTurns,
    routeAfter: data.route.remainingTurns,
    moving: data.route.moving,
    consumed: {
      food: summary.foodCostRaw,
      water: summary.waterCostRaw,
      amenities: summary.amenitiesCostRaw,
      fuel: summary.fuelCostRaw
    },
    shortages: {},
    warnings: []
  };

  for (const [key, amount] of Object.entries(report.consumed)) {
    const result = spendResource(data, key, amount);
    if (result.shortage > 0) report.shortages[key] = result.shortage;
    if (amount > 0 && data.resources[key] <= 0) report.warnings.push(`${RESOURCE_LABELS[key]} is depleted.`);
  }

  data.currentTurn = report.turnAfter;
  if (data.route.moving && data.route.remainingTurns > 0) {
    data.route.remainingTurns = Math.max(0, roundResource(data.route.remainingTurns - 1));
    report.routeAfter = data.route.remainingTurns;
  }

  if (summary.overCapacity) report.warnings.push(`Population exceeds capacity by ${formatNumber(summary.population - summary.capacity)}.`);
  for (const [key, amount] of Object.entries(report.shortages)) {
    report.warnings.push(`Shortage: ${formatNumber(amount)} ${RESOURCE_LABELS[key]}.`);
  }
  if (!data.route.moving) report.warnings.push("Train is stopped; route did not progress.");
  if (data.route.moving && data.route.remainingTurns <= 0) report.warnings.push("Route destination reached.");

  await saveWorldData(data, "advanceTurn");
  await createTurnChat(data, report);
}

function spendResource(data, key, amount) {
  amount = Math.max(0, Number(amount || 0));
  const before = Number(data.resources[key] || 0);
  if (data.settings.allowNegativeResources) {
    data.resources[key] = roundResource(before - amount);
    return { before, after: data.resources[key], shortage: 0 };
  }

  const shortage = Math.max(0, amount - before);
  data.resources[key] = roundResource(Math.max(0, before - amount));
  return { before, after: data.resources[key], shortage };
}

function shouldConsumeFuel(data) {
  return Boolean(data.route.moving || data.settings.consumeFuelWhileStopped);
}

function calculateFuelCost(data) {
  const activeWagonCount = data.wagons.filter(wagon => wagon.active).length;
  const cost = data.settings.baseFuelPerTurn * (1 + data.settings.fuelMultiplierPerWagon * activeWagonCount);
  return roundResource(cost);
}

async function createTurnChat(data, report) {
  const mode = data.settings.chatOutputMode;
  if (mode === "none") return;

  if (mode === "gm" || mode === "both") {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ alias: "Dominion Train" }),
      whisper: ChatMessage.getWhisperRecipients("GM").map(user => user.id),
      content: renderGmTurnChat(data, report)
    });
  }

  if (mode === "public" || mode === "both") {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ alias: "Dominion Train" }),
      content: renderPublicTurnChat(data, report)
    });
  }
}

async function createMarketChat(data, market, item) {
  const mode = data.settings.chatOutputMode;
  if (mode === "none") return;

  const gmContent = `<div class="dt-chat-card"><h3>Dominion Market Purchase</h3><p><strong>${escapeHtml(item.name)}</strong> bought at ${escapeHtml(market.name)}.</p><ul><li>Cost: ${formatNumber(item.cost)} Talion</li><li>Gain: ${formatNumber(item.amount)} ${RESOURCE_LABELS[item.resourceType]}</li><li>Stock remaining: ${formatNumber(item.stock)}</li></ul></div>`;
  const publicContent = `<div class="dt-chat-card"><h3>Supply Purchase</h3><p>The train quartermaster secures new supplies at ${escapeHtml(market.location || market.name)}.</p></div>`;

  if (mode === "gm" || mode === "both") {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ alias: "Dominion Train" }),
      whisper: ChatMessage.getWhisperRecipients("GM").map(user => user.id),
      content: gmContent
    });
  }

  if (mode === "public" || mode === "both") {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ alias: "Dominion Train" }),
      content: publicContent
    });
  }
}

function renderGmTurnChat(data, report) {
  const warnings = report.warnings.length
    ? report.warnings.map(warning => `<li>${escapeHtml(warning)}</li>`).join("")
    : "<li>No warnings.</li>";

  return `
    <div class="dt-chat-card">
      <h3>Train Turn Advanced: Turn ${formatNumber(report.turnAfter)}</h3>
      <ul>
        <li>Food consumed: ${formatNumber(report.consumed.food)}</li>
        <li>Water consumed: ${formatNumber(report.consumed.water)}</li>
        <li>Amenities consumed: ${formatNumber(report.consumed.amenities)}</li>
        <li>Fuel consumed: ${formatNumber(report.consumed.fuel)}</li>
        <li>Remaining route turns: ${formatNumber(data.route.remainingTurns)}</li>
      </ul>
      <h4>Warnings</h4>
      <ul>${warnings}</ul>
    </div>
  `;
}

function renderPublicTurnChat(data, report) {
  const progress = data.settings.playersSeeRouteProgress
    ? `<p>Remaining route progress: ${formatNumber(data.route.remainingTurns)} turns.</p>`
    : "";
  const movement = data.route.moving
    ? "The train continues through the iron-grey wasteland."
    : "The train holds position while another hard travel turn passes.";

  return `
    <div class="dt-chat-card">
      <h3>Dominion Train</h3>
      <p>${movement}</p>
      <p>Another travel turn passes.</p>
      ${progress}
    </div>
  `;
}

async function ensureWorldData() {
  await saveWorldData(getWorldData(), "ready", { silent: true });
}

async function saveWorldData(data, reason, options = {}) {
  if (!game.user.isGM) throw new Error("Only a GM client can save Dominion train data.");
  await game.settings.set(MODULE_ID, DATA_SETTING, normalizeData(data));
  if (!options.silent) game.socket.emit(SOCKET_NAME, { type: "refresh", reason, stamp: Date.now() });
  scheduleRefresh();
}

function getWorldData() {
  return normalizeData(game.settings.get(MODULE_ID, DATA_SETTING) || defaultWorldData());
}

function defaultWorldData() {
  const locomotive = {
    id: randomId(),
    name: "Dominion Engine",
    type: "Locomotive",
    active: true,
    capacity: 6,
    notes: "Dieselpunk workhorse engine.",
    gmNotes: ""
  };
  const passenger = {
    id: randomId(),
    name: "Civilian Passenger Wagon",
    type: "Passenger Wagon",
    active: true,
    capacity: 48,
    notes: "Bench seating, luggage racks, too many rumors.",
    gmNotes: ""
  };
  const cargo = {
    id: randomId(),
    name: "Cargo Wagon",
    type: "Cargo Wagon",
    active: true,
    capacity: 0,
    notes: "Crates, tarps, chains, and spare rail tools.",
    gmNotes: ""
  };
  const fuel = {
    id: randomId(),
    name: "Fuel Tender",
    type: "Fuel Wagon",
    active: true,
    capacity: 0,
    notes: "Armored tanks and pressure valves.",
    gmNotes: ""
  };

  return {
    currentTurn: 1,
    resources: {
      talion: 500,
      food: 220,
      water: 220,
      fuel: 160,
      amenities: 40
    },
    route: {
      currentRouteName: "Avernus Industrial Line",
      destinationName: "Fort Veyr Station",
      remainingTurns: 5,
      moving: true,
      notes: ""
    },
    wagons: [locomotive, passenger, cargo, fuel],
    groups: [
      {
        id: randomId(),
        name: "Civilians",
        count: 40,
        assignedWagon: passenger.id,
        foodPerTurn: 1,
        waterPerTurn: 1,
        amenitiesPerTurn: 0,
        notes: "",
        gmNotes: ""
      },
      {
        id: randomId(),
        name: "Engine Crew",
        count: 6,
        assignedWagon: locomotive.id,
        foodPerTurn: 1,
        waterPerTurn: 1,
        amenitiesPerTurn: 0,
        notes: "",
        gmNotes: ""
      },
      {
        id: randomId(),
        name: "Imperial Soldiers",
        count: 12,
        assignedWagon: "",
        foodPerTurn: 1,
        waterPerTurn: 1,
        amenitiesPerTurn: 0,
        notes: "",
        gmNotes: ""
      }
    ],
    markets: [defaultStartingMarket()],
    settings: defaultSettings()
  };
}

function defaultSettings() {
  return {
    baseFuelPerTurn: 10,
    fuelMultiplierPerWagon: 0.1,
    allowNegativeResources: false,
    consumeFuelWhileStopped: false,
    defaultFoodPerPerson: 1,
    defaultWaterPerPerson: 1,
    defaultAmenitiesPerPerson: 0,
    playersCanOpenPanel: true,
    showTalionToPlayers: false,
    playersSeeExactResources: false,
    playersSeeWagonList: true,
    playersSeePassengerGroups: false,
    playersSeeRouteProgress: true,
    chatOutputMode: "gm"
  };
}

function defaultStartingMarket() {
  return {
    id: randomId(),
    name: "Station Quartermaster",
    location: "Local Depot",
    notes: "A practical supply table for the next Dominion stop.",
    items: [
      {
        id: randomId(),
        name: "Crated Field Rations",
        description: "Dry military-grade Dominion ration packs. Tasteless, but reliable.",
        cost: 30,
        resourceType: "food",
        amount: 50,
        stock: 3
      },
      {
        id: randomId(),
        name: "Water Barrels",
        description: "Sealed barrels stamped by the station authority.",
        cost: 20,
        resourceType: "water",
        amount: 40,
        stock: 4
      },
      {
        id: randomId(),
        name: "Refined Industrial Fuel",
        description: "Dense fuel mix for long-haul engines.",
        cost: 70,
        resourceType: "fuel",
        amount: 60,
        stock: 2
      },
      {
        id: randomId(),
        name: "Officer Luxury Crate",
        description: "Coffee, tobacco, preserved sweets, and polished comforts.",
        cost: 100,
        resourceType: "amenities",
        amount: 25,
        stock: 1
      }
    ]
  };
}

function defaultWagon(data) {
  return {
    id: randomId(),
    name: "New Wagon",
    type: "Passenger Wagon",
    active: true,
    capacity: 20,
    notes: "",
    gmNotes: ""
  };
}

function defaultGroup(data) {
  return {
    id: randomId(),
    name: "New Passenger Group",
    count: 10,
    assignedWagon: "",
    foodPerTurn: data.settings.defaultFoodPerPerson,
    waterPerTurn: data.settings.defaultWaterPerPerson,
    amenitiesPerTurn: data.settings.defaultAmenitiesPerPerson,
    notes: "",
    gmNotes: ""
  };
}

function defaultMarket() {
  return {
    id: randomId(),
    name: "New Local Market",
    location: "",
    notes: "",
    items: []
  };
}

function defaultMarketItem() {
  return {
    id: randomId(),
    name: "New Supply Lot",
    description: "",
    cost: 25,
    resourceType: "food",
    amount: 25,
    stock: 1
  };
}

function normalizeData(raw) {
  const fallback = defaultWorldData();
  const source = clone(raw || {});
  const settings = { ...fallback.settings, ...(source.settings || {}) };
  settings.chatOutputMode = CHAT_MODE_OPTIONS.some(option => option.value === settings.chatOutputMode) ? settings.chatOutputMode : fallback.settings.chatOutputMode;

  const resources = {};
  for (const key of RESOURCE_KEYS) {
    const value = toNumber(source.resources?.[key], fallback.resources[key]);
    resources[key] = settings.allowNegativeResources ? value : Math.max(0, value);
  }

  const data = {
    currentTurn: Math.max(1, toNumber(source.currentTurn, fallback.currentTurn)),
    resources,
    route: {
      currentRouteName: cleanString(source.route?.currentRouteName) || fallback.route.currentRouteName,
      destinationName: cleanString(source.route?.destinationName) || fallback.route.destinationName,
      remainingTurns: Math.max(0, toNumber(source.route?.remainingTurns, fallback.route.remainingTurns)),
      moving: source.route?.moving === undefined ? fallback.route.moving : Boolean(source.route.moving),
      notes: cleanString(source.route?.notes)
    },
    wagons: Array.isArray(source.wagons) ? source.wagons.map(normalizeWagon) : fallback.wagons,
    groups: Array.isArray(source.groups) ? source.groups.map(item => normalizeGroup(item, settings)) : fallback.groups,
    markets: Array.isArray(source.markets) ? source.markets.map(normalizeMarket) : fallback.markets,
    settings
  };

  if (!data.wagons.length) data.wagons.push(defaultWagon(data));
  if (!data.markets.length) data.markets.push(defaultStartingMarket());
  data.groups.forEach(group => {
    if (!data.wagons.some(wagon => wagon.id === group.assignedWagon)) group.assignedWagon = "";
  });
  return data;
}

function normalizeWagon(item) {
  return {
    id: cleanString(item?.id) || randomId(),
    name: cleanString(item?.name) || "Unnamed Wagon",
    type: cleanString(item?.type),
    active: item?.active === undefined ? true : Boolean(item.active),
    capacity: Math.max(0, toNumber(item?.capacity, 0)),
    notes: cleanString(item?.notes),
    gmNotes: cleanString(item?.gmNotes)
  };
}

function normalizeGroup(item, settings) {
  return {
    id: cleanString(item?.id) || randomId(),
    name: cleanString(item?.name) || "Unnamed Group",
    count: Math.max(0, toNumber(item?.count, 0)),
    assignedWagon: cleanString(item?.assignedWagon),
    foodPerTurn: Math.max(0, toNumber(item?.foodPerTurn, settings.defaultFoodPerPerson)),
    waterPerTurn: Math.max(0, toNumber(item?.waterPerTurn, settings.defaultWaterPerPerson)),
    amenitiesPerTurn: Math.max(0, toNumber(item?.amenitiesPerTurn, settings.defaultAmenitiesPerPerson)),
    notes: cleanString(item?.notes),
    gmNotes: cleanString(item?.gmNotes)
  };
}

function normalizeMarket(item) {
  return {
    id: cleanString(item?.id) || randomId(),
    name: cleanString(item?.name) || "Unnamed Market",
    location: cleanString(item?.location),
    notes: cleanString(item?.notes),
    items: Array.isArray(item?.items) ? item.items.map(normalizeMarketItem) : []
  };
}

function normalizeMarketItem(item) {
  const resourceType = RESOURCE_KEYS.includes(item?.resourceType) && item.resourceType !== "talion" ? item.resourceType : "food";
  return {
    id: cleanString(item?.id) || randomId(),
    name: cleanString(item?.name) || "Unnamed Item",
    description: cleanString(item?.description),
    cost: Math.max(0, toNumber(item?.cost, 0)),
    resourceType,
    amount: Math.max(0, toNumber(item?.amount, 0)),
    stock: Math.max(0, toNumber(item?.stock, 0))
  };
}

function getSelectedMarket(data) {
  const market = data.markets.find(candidate => candidate.id === uiState.selectedMarketId) || data.markets[0] || null;
  if (market) uiState.selectedMarketId = market.id;
  return market;
}

function wagonLabel(data, wagonId) {
  if (!wagonId) return "Unassigned";
  return data.wagons.find(wagon => wagon.id === wagonId)?.name || "Missing Wagon";
}

function resourceStatus(value) {
  if (value <= 0) return { id: "depleted", label: "Depleted" };
  if (value <= 20) return { id: "critical", label: "Critical" };
  if (value <= 60) return { id: "low", label: "Low" };
  return { id: "stable", label: "Stable" };
}

function deleteById(collection, id) {
  const index = collection.findIndex(item => item.id === id);
  if (index >= 0) collection.splice(index, 1);
}

function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => renderTrainPanel(), 75);
}

function renderTrainPanel() {
  if (trainApp?.rendered) trainApp.render({ force: true });
}

function loadClientState() {
  const stored = game.settings.get(MODULE_ID, CLIENT_SETTING) || {};
  uiState.activeTab = cleanString(stored.activeTab) || "dashboard";
  uiState.selectedMarketId = cleanString(stored.selectedMarketId);
}

function persistClientState() {
  game.settings.set(MODULE_ID, CLIENT_SETTING, clone(uiState));
}

function hasResponsibleGM() {
  return Boolean(responsibleGM());
}

function isResponsibleGM() {
  const gm = responsibleGM();
  return !gm || gm.id === game.user.id;
}

function responsibleGM() {
  return users().filter(user => user.isGM && user.active).sort((a, b) => a.id.localeCompare(b.id))[0] || null;
}

function users() {
  return game.users?.contents || Array.from(game.users || []);
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function roundResource(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function formatNumber(value) {
  const number = roundResource(value);
  return Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function cleanString(value) {
  return String(value ?? "").trim();
}

function randomId() {
  return foundry.utils.randomID?.() || Math.random().toString(36).slice(2, 12);
}

function clone(value) {
  if (foundry.utils.deepClone) return foundry.utils.deepClone(value);
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  if (foundry.utils.escapeHTML) return foundry.utils.escapeHTML(String(value ?? ""));
  const element = document.createElement("div");
  element.textContent = String(value ?? "");
  return element.innerHTML;
}
