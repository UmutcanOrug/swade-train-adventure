const MODULE_ID = "swade-dominion-train";
const DATA_SETTING = "worldData";
const CLIENT_SETTING = "clientState";
const SOCKET_NAME = `module.${MODULE_ID}`;
const TEMPLATE_PATH = `modules/${MODULE_ID}/templates/train-panel.hbs`;
const ACTION_CONFIRM_TIMEOUT_MS = 6000;
const CURRENT_EVENT_SCHEMA_VERSION = 5;
const RADIO_MIN_FREQUENCY = 80;
const RADIO_MAX_FREQUENCY = 120;
const RADIO_FREQUENCY_STEP = 0.1;
const RADIO_DEFAULT_FREQUENCY = 100;
const RADIO_DIAL_SWEEP_DEGREES = 280;
const RADIO_GAIN_MIN = 1;
const RADIO_GAIN_MAX = 5;
const RADIO_GAIN_STEP = 0.01;
const RADIO_DEFAULT_GAIN = 3;
const RADIO_DEFAULT_GAIN_TOLERANCE = 0.05;
const RADIO_SIGNAL_FEATHER_RANGE = 2.5;
const RADIO_DEFAULT_STABILIZATION_SECONDS = 3;
const RADIO_DEFAULT_AUDIO = {
  noiseSoundUrl: `modules/${MODULE_ID}/sounds/radio/radio-tier-1-static.mp3`,
  approachSoundUrl: `modules/${MODULE_ID}/sounds/radio/radio-tier-2-close.mp3`,
  foundSoundUrl: `modules/${MODULE_ID}/sounds/radio/radio-tier-3-understandable.mp3`
};
const RADIO_LOG_LIMIT = 50;
const RADIO_REQUEST_LIMIT = 20;
const PLAYER_RADIO_ACTIONS = new Set([
  "tuneRadio",
  "adjustRadioGain",
  "requestRadioLock",
  "performRadioLock",
  "transmitRadioResponse"
]);

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
  { id: "scavenge", label: "Scavenge", icon: "fa-binoculars" },
  { id: "radio", label: "Radio", icon: "fa-radio" },
  { id: "route", label: "Route", icon: "fa-route" },
  { id: "events", label: "Events", icon: "fa-table-list" },
  { id: "settings", label: "Settings", icon: "fa-sliders" }
];

const WAGON_ROLES = [
  { value: "population", label: "Population Wagon", capacityLabel: "Population Cap" },
  { value: "storage", label: "Storage Wagon", capacityLabel: "Storage Cap" },
  { value: "fuel", label: "Fuel Wagon", capacityLabel: "Fuel Cap" },
  { value: "special", label: "Special Wagon", capacityLabel: "Notes Only" }
];

const CHAT_MODE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "gm", label: "GM Only" },
  { value: "public", label: "Public Summary" },
  { value: "both", label: "Both" }
];

const DEFAULT_BIOMES = [
  { id: "plains", name: "Plains", imageUrl: "", foodMultiplier: 1, waterMultiplier: 1, fuelMultiplier: 1, amenitiesMultiplier: 1 },
  { id: "desert", name: "Desert", imageUrl: "", foodMultiplier: 1, waterMultiplier: 1.5, fuelMultiplier: 1.1, amenitiesMultiplier: 1 },
  { id: "snow", name: "Snow", imageUrl: "", foodMultiplier: 1.1, waterMultiplier: 1.15, fuelMultiplier: 1.25, amenitiesMultiplier: 1.05 },
  { id: "tundra", name: "Tundra", imageUrl: "", foodMultiplier: 1.05, waterMultiplier: 1.1, fuelMultiplier: 1.15, amenitiesMultiplier: 1 },
  { id: "industrial", name: "Industrial Wastes", imageUrl: "", foodMultiplier: 1, waterMultiplier: 1.2, fuelMultiplier: 1.2, amenitiesMultiplier: 1.1 }
];

const HUNTING_ACTIONS = [
  { value: "hunt", label: "Hunt", defaultSkill: "Survival", resourceType: "food", fallbackDie: 6 },
  { value: "forage", label: "Forage", defaultSkill: "Survival", resourceType: "food", fallbackDie: 6 },
  { value: "scavenge", label: "Scavenge", defaultSkill: "Notice", resourceType: "amenities", fallbackDie: 6 },
  { value: "salvage", label: "Salvage Fuel", defaultSkill: "Repair", resourceType: "fuel", fallbackDie: 6 },
  { value: "findWater", label: "Find Water", defaultSkill: "Survival", resourceType: "water", fallbackDie: 6 },
  { value: "tradeScraps", label: "Trade Scraps", defaultSkill: "Persuasion", resourceType: "talion", fallbackDie: 6 }
];

const HUNTING_DIE_OPTIONS = [4, 6, 8, 10, 12];
const HUNTING_RESOURCE_KEYS = ["talion", "food", "water", "fuel", "amenities"];

const SCAVENGE_CATEGORIES = [
  { key: "food", label: "Food", resourceType: "food", defaultSkill: "Survival", defaultDie: 6, icon: "fa-bowl-food" },
  { key: "water", label: "Water", resourceType: "water", defaultSkill: "Survival", defaultDie: 6, icon: "fa-droplet" },
  { key: "fuel", label: "Fuel", resourceType: "fuel", defaultSkill: "Repair", defaultDie: 6, icon: "fa-gas-pump" },
  { key: "goldAmenities", label: "Amenities", resourceType: "amenities", defaultSkill: "Notice", defaultDie: 6, icon: "fa-martini-glass-citrus" }
];

const SCAVENGE_REWARD_FORMULAS = {
  food: ["-4d6", "-3d6", "0", "2d6", "3d6", "5d6", "8d6", "5x3d10", "6x4d10", "10x6d10"],
  water: ["-4d6", "-3d6", "0", "2d6", "3d6", "5d6", "8d6", "5x3d10", "6x4d10", "10x6d10"],
  fuel: ["-2d6", "-1d10", "0", "1d6", "2d6", "3d6", "4d8", "5d8", "6d8", "8d10"],
  goldAmenities: ["-3d6", "-2d6", "0", "2d6", "3d8", "5d8", "7d8", "5x3d10", "6x4d10", "10x6d10"]
};

const DEFAULT_RAISE_EXTRA_DICE = 1;
const DEFAULT_RAISE_EVERY = 2;
const STORAGE_RESOURCE_KEYS = ["food", "water", "amenities"];
const UNSKILLED_DIE = 4;
const UNSKILLED_MODIFIER = -2;

let trainApp = null;
let refreshTimer = null;
const pendingActionRequests = new Map();
let liveRadioFrequency = null;
let liveRadioGain = null;
let liveRadioTunedBy = "";
let liveRadioStamp = 0;
let radioBroadcastTimer = null;
let queuedRadioFrequency = null;
let radioTuneCommitTimer = null;
let radioGainBroadcastTimer = null;
let queuedRadioGain = null;
let radioGainCommitTimer = null;
const radioAmbientTracks = new Map();
const radioOneShotAudio = new Map();
let radioStabilityTimer = null;
let radioStabilityState = {
  broadcastId: "",
  frequency: null,
  gain: null,
  startedAt: 0,
  ready: false
};

const uiState = {
  activeTab: "dashboard",
  selectedMarketId: "",
  activeEventCategory: "food",
  activeEventBiome: "plains",
  activeEventTier: 0,
  radioGmTab: "broadcasts",
  expandedRadioBroadcastId: "",
  radioMuted: false
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
    editable: [{ key: "KeyI" }],
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

  async _onClose(options) {
    stopRadioAudio();
    await super._onClose(options);
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
  const currentBiome = getCurrentBiome(data);
  const eventCategory = getSelectedEventCategory(data);
  const eventBiome = getSelectedEventBiome(data);
  const radio = radioContext(data, isGM);

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
    wagonRoles: WAGON_ROLES,
    chatModeOptions: CHAT_MODE_OPTIONS,
    wagons: data.wagons.map(wagon => wagonContext(wagon)),
    groups: data.groups.map(group => ({
      ...group,
      assignedWagonName: wagonLabel(data, group.assignedWagon)
    })),
    markets: data.markets.map(market => ({
      ...market,
      active: selectedMarket?.id === market.id
    })),
    selectedMarket,
    currentBiome,
    biomes: data.settings.biomes,
    biomeOptions: data.settings.biomes.map(biome => ({
      id: biome.id,
      name: biome.name,
      selected: biome.id === data.route.biomeId
    })),
    scavengeCards: SCAVENGE_CATEGORIES.map(category => scavengeCardContext(category)),
    scavengeDieOptions: HUNTING_DIE_OPTIONS,
    scavengeActors: actorOptions(),
    scavengeLog: data.scavengeLog.map(huntingLogContext),
    radio,
    radioActors: radioActorOptions(isGM),
    radioUsers: radioUserContexts(data),
    radioRequests: radioRequestContexts(data),
    radioGmTab: uiState.radioGmTab,
    radioBroadcasts: data.radio.broadcasts.map(broadcast => radioBroadcastContext(broadcast, data)),
    radioLog: data.radio.log.map(entry => radioLogContext(entry, data, isGM)),
    eventCategories: SCAVENGE_CATEGORIES.map(category => ({
      ...category,
      active: category.key === eventCategory.key
    })),
    eventBiomes: data.settings.biomes.map(biome => ({
      ...biome,
      active: biome.id === eventBiome.id
    })),
    eventTierFilters: eventTierFilters(),
    selectedEventCategory: eventCategory,
    selectedEventBiome: eventBiome,
    selectedEventTiers: eventTierContext(data, eventCategory, eventBiome),
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
    if (tab.id === "settings" || tab.id === "events") return isGM;
    if (isGM) return true;
    if (tab.id === "wagons") return data.settings.playersSeeWagonList;
    if (tab.id === "people") return data.settings.playersSeePassengerGroups;
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

function scavengeCardContext(category) {
  return {
    ...category,
    resourceLabel: RESOURCE_LABELS[category.resourceType],
    dieOptions: HUNTING_DIE_OPTIONS.map(sides => ({
      sides,
      selected: sides === category.defaultDie
    }))
  };
}

function wagonContext(wagon) {
  const role = normalizeWagonRole(wagon.role || wagon.type);
  const roleConfig = wagonRoleConfig(role);
  return {
    ...wagon,
    role,
    roleLabel: roleConfig.label,
    capacityLabel: roleConfig.capacityLabel,
    roleOptions: WAGON_ROLES.map(option => ({
      ...option,
      selected: option.value === role
    }))
  };
}

function getSelectedEventCategory(data) {
  const category = SCAVENGE_CATEGORIES.find(candidate => candidate.key === uiState.activeEventCategory) || SCAVENGE_CATEGORIES[0];
  uiState.activeEventCategory = category.key;
  return category;
}

function getSelectedEventBiome(data) {
  const biome = data.settings.biomes.find(candidate => candidate.id === uiState.activeEventBiome) || getCurrentBiome(data);
  uiState.activeEventBiome = biome.id;
  return biome;
}

function eventTierContext(data, category, biome) {
  const table = getScavengeEventTable(data, category, biome);
  const tiers = Array.from({ length: 10 }, (_item, index) => {
    const tier = index + 1;
    const events = table.tiers?.[String(tier)] || table.tiers?.[tier] || [];
    return {
      tier,
      label: huntingMood(tier).label,
      rewardFormula: rewardFormulaForTable(table, category, tier),
      lines: serializeEventLines(events, category, tier, biome)
    };
  });
  return uiState.activeEventTier ? tiers.filter(tier => tier.tier === uiState.activeEventTier) : tiers;
}

function eventTierFilters() {
  const activeTier = clamp(Math.trunc(toNumber(uiState.activeEventTier, 0)), 0, 10);
  uiState.activeEventTier = activeTier;
  return [
    { tier: 0, label: "All", active: activeTier === 0 },
    ...Array.from({ length: 10 }, (_item, index) => {
      const tier = index + 1;
      return {
        tier,
        label: `Tier ${tier}`,
        mood: huntingMood(tier).label,
        active: activeTier === tier
      };
    })
  ];
}

function serializeEventLines(events, category, tier = 1, biome = normalizeBiome(DEFAULT_BIOMES[0])) {
  const fallback = defaultScavengeEventCategory(category, biome).tiers;
  const source = Array.isArray(events) && events.length ? events : fallback[String(tier)];
  return source.slice(0, 50).map((event, index) => {
    return `${String(index + 1).padStart(2, "0")}. ${event.title || "Event"} | ${event.text || ""}`;
  }).join("\n");
}

function getScavengeEventTable(data, category, biome) {
  const biomeId = typeof biome === "string" ? biome : biome?.id;
  const normalizedBiome = data.settings.biomes.find(candidate => candidate.id === biomeId) || data.settings.biomes[0] || normalizeBiome(DEFAULT_BIOMES[0]);
  const source = data.scavengeEvents?.[category.key];
  return source?.biomes?.[normalizedBiome.id] || (source?.tiers ? { ...source, biomeId: normalizedBiome.id, biomeName: normalizedBiome.name } : defaultScavengeEventCategory(category, normalizedBiome));
}

function huntingLogContext(entry) {
  const overage = Math.max(0, Math.trunc(toNumber(entry.tierOverage, 0)));
  const tierDisplay = overage ? `${entry.tier} +${overage}` : `${entry.tier}`;
  return {
    ...entry,
    amountDisplay: `${formatSigned(entry.amount)} ${entry.resourceLabel}`,
    secondaryDisplay: entry.secondaryResourceType ? `${formatSigned(entry.secondaryAmount)} ${entry.secondaryResourceLabel}` : "",
    rollDisplay: `${formatNumber(entry.roll?.total || 0)} / Tier ${tierDisplay} / d50 ${entry.eventRoll}${entry.rewardFormula ? ` / ${entry.rewardFormula}` : ""}`
  };
}

function radioContext(data, isGM) {
  const frequency = normalizeRadioFrequency(liveRadioFrequency ?? data.radio.frequency);
  const gain = normalizeRadioGain(liveRadioGain ?? data.radio.gain);
  const poweredOn = data.radio.poweredOn !== false;
  const signal = poweredOn ? radioSignalAtFrequency(data, frequency, gain) : null;
  const presentation = poweredOn ? radioSignalPresentation(signal) : radioPoweredOffPresentation();
  const permission = Boolean(data.radio.permissions?.[game.user?.id]);
  const requestPending = data.radio.requests.some(request => request.userId === game.user?.id);
  const attemptsUsed = data.radio.attempts.filter(attempt => attempt.turn === data.currentTurn).length;
  const attemptLimit = Math.max(0, Math.trunc(toNumber(data.radio.settings.lockAttemptsPerTurn, 2)));
  return {
    frequency: formatRadioFrequency(frequency),
    frequencyRaw: frequency,
    dialAngle: radioDialAngle(frequency),
    minFrequency: RADIO_MIN_FREQUENCY,
    maxFrequency: RADIO_MAX_FREQUENCY,
    frequencyStep: RADIO_FREQUENCY_STEP,
    gain: formatRadioGain(gain),
    gainRaw: gain,
    gainMin: RADIO_GAIN_MIN,
    gainMax: RADIO_GAIN_MAX,
    gainStep: RADIO_GAIN_STEP,
    tunedBy: liveRadioTunedBy || data.radio.lastTunedBy || "No operator",
    canLock: isGM || permission,
    requestPending,
    settings: data.radio.settings,
    signal: presentation,
    poweredOn,
    muted: uiState.radioMuted,
    attemptsUsed,
    attemptLimit,
    attemptsDisplay: attemptLimit ? `${attemptsUsed} / ${attemptLimit}` : `${attemptsUsed} / unlimited`
  };
}

function radioActorOptions(isGM) {
  const playerCharacterIds = new Set(
    users()
      .filter(user => !user.isGM)
      .map(user => cleanString(user.character?.id || user.character))
      .filter(Boolean)
  );
  return (game.actors?.contents || Array.from(game.actors || []))
    .filter(actor => isGM || actor.isOwner)
    .map(actor => ({
      id: actor.id,
      name: actor.name || "Unnamed Actor",
      img: actor.img || "",
      isPlayerCharacter: playerCharacterIds.has(actor.id),
      isPlayerOwned: Boolean(actor.hasPlayerOwner)
    }))
    .sort((a, b) => (
      Number(b.isPlayerCharacter) - Number(a.isPlayerCharacter)
      || Number(b.isPlayerOwned) - Number(a.isPlayerOwned)
      || a.name.localeCompare(b.name)
    ));
}

function radioUserContexts(data) {
  return users()
    .filter(user => !user.isGM)
    .map(user => ({
      id: user.id,
      name: user.name || "Unnamed Player",
      active: Boolean(user.active),
      canLock: Boolean(data.radio.permissions?.[user.id]),
      pending: data.radio.requests.some(request => request.userId === user.id)
    }))
    .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
}

function radioRequestContexts(data) {
  return data.radio.requests.map(request => ({
    ...request,
    frequencyDisplay: `${formatRadioFrequency(request.frequency)} MHz`,
    actorName: game.actors?.get(request.actorId)?.name || request.actorName || "Unknown Actor"
  }));
}

function radioBroadcastContext(broadcast) {
  return {
    ...broadcast,
    frequencyDisplay: formatRadioFrequency(broadcast.frequency),
    targetGainDisplay: formatRadioGain(broadcast.targetGain),
    gainToleranceDisplay: formatRadioGainTolerance(broadcast.gainTolerance),
    lockModeLabel: broadcast.requiresLock ? "Signal Lock" : "Open Broadcast",
    modifierDisplay: String(Math.trunc(toSignedNumber(broadcast.modifier, 0))),
    expanded: uiState.expandedRadioBroadcastId === broadcast.id,
    responseLines: serializeRadioResponses(broadcast.responses)
  };
}

function radioLogContext(entry, data, isGM) {
  const canRespond = !entry.responseSent && entry.responses.length > 0
    && (isGM || Boolean(data.radio.permissions?.[game.user?.id]));
  return {
    ...entry,
    broadcastTitle: isGM ? (entry.gmBroadcastTitle || entry.broadcastTitle) : entry.broadcastTitle,
    source: isGM ? (entry.gmSource || entry.source) : entry.source,
    frequencyDisplay: `${formatRadioFrequency(entry.frequency)} MHz`,
    rollDisplay: entry.roll ? `${formatNumber(entry.roll.total)} / ${entry.outcomeLabel}` : entry.outcomeLabel,
    canRespond,
    responses: entry.responses.map((response, index) => ({ ...response, index }))
  };
}

function buildSummary(data) {
  const activeWagons = data.wagons.filter(wagon => wagon.active);
  const biome = getCurrentBiome(data);
  const population = data.groups.reduce((total, group) => total + Number(group.count || 0), 0);
  const capacity = wagonCapacity(data, "population");
  const fuelCap = wagonCapacity(data, "fuel");
  const storageCap = wagonCapacity(data, "storage");
  const fuelStored = Number(data.resources.fuel || 0);
  const storageUsed = storageResourceTotal(data.resources);
  const baseFoodCost = data.groups.reduce((total, group) => total + Number(group.count || 0) * Number(group.foodPerTurn || 0), 0);
  const baseWaterCost = data.groups.reduce((total, group) => total + Number(group.count || 0) * Number(group.waterPerTurn || 0), 0);
  const baseAmenitiesCost = data.groups.reduce((total, group) => total + Number(group.count || 0) * Number(group.amenitiesPerTurn || 0), 0);
  const foodCost = roundResource(baseFoodCost * biome.foodMultiplier);
  const waterCost = roundResource(baseWaterCost * biome.waterMultiplier);
  const amenitiesCost = roundResource(baseAmenitiesCost * biome.amenitiesMultiplier);
  const fuelCost = shouldConsumeFuel(data) ? calculateFuelCost(data) : 0;

  return {
    currentTurn: Math.max(1, Math.trunc(toNumber(data.currentTurn, 1))),
    canAdvance: true,
    activeWagons: activeWagons.length,
    population,
    capacity,
    overCapacity: capacity > 0 && population > capacity,
    fuelCap,
    fuelStored,
    fuelOverCap: fuelCap > 0 && fuelStored > fuelCap,
    storageCap,
    storageUsed,
    storageOverCap: storageCap > 0 && storageUsed > storageCap,
    foodCost: formatNumber(foodCost),
    waterCost: formatNumber(waterCost),
    amenitiesCost: formatNumber(amenitiesCost),
    fuelCost: formatNumber(fuelCost),
    fuelCostRaw: fuelCost,
    foodCostRaw: foodCost,
    waterCostRaw: waterCost,
    amenitiesCostRaw: amenitiesCost,
    biomeName: biome.name,
    biomeFoodMultiplier: formatMultiplier(biome.foodMultiplier),
    biomeWaterMultiplier: formatMultiplier(biome.waterMultiplier),
    biomeFuelMultiplier: formatMultiplier(biome.fuelMultiplier),
    biomeAmenitiesMultiplier: formatMultiplier(biome.amenitiesMultiplier)
  };
}

function summaryContext(data, summary, isGM) {
  const canSeeExactResources = isGM || data.settings.playersSeeExactResources;
  const canSeeWagons = isGM || data.settings.playersSeeWagonList;
  const canSeePeople = isGM || data.settings.playersSeePassengerGroups;

  return {
    ...summary,
    overCapacityVisible: summary.overCapacity && canSeeWagons && canSeePeople,
    fuelOverCapVisible: summary.fuelOverCap && canSeeWagons && canSeeExactResources,
    storageOverCapVisible: summary.storageOverCap && canSeeWagons && canSeeExactResources,
    activeWagonsDisplay: canSeeWagons ? summary.activeWagons : "Hidden",
    populationCapacityDisplay: `${canSeePeople ? summary.population : "Hidden"} / ${canSeeWagons ? summary.capacity : "Hidden"}`,
    fuelCapLabel: canSeeWagons ? capLabel(summary.fuelCap) : "Hidden",
    storageCapLabel: canSeeWagons ? capLabel(summary.storageCap) : "Hidden",
    fuelCapacityDisplay: canSeeExactResources && canSeeWagons ? capacityDisplay(summary.fuelStored, summary.fuelCap) : "Hidden",
    storageCapacityDisplay: canSeeExactResources && canSeeWagons ? capacityDisplay(summary.storageUsed, summary.storageCap) : "Hidden",
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
  if (summary.fuelOverCap) {
    warnings.push(`Fuel exceeds fuel wagon capacity by ${formatNumber(summary.fuelStored - summary.fuelCap)}.`);
  }
  if (summary.storageOverCap) {
    warnings.push(`Storage exceeds wagon capacity by ${formatNumber(summary.storageUsed - summary.storageCap)}.`);
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
      const nextTab = event.currentTarget.dataset.tab || "dashboard";
      if (nextTab !== "radio") stopRadioAudio();
      uiState.activeTab = nextTab;
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

  root.querySelector("[data-clear-scavenge-log]")?.addEventListener("click", async event => {
    event.preventDefault();
    await sendAction("clearScavengeLog", {});
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

  root.querySelectorAll("[data-event-category]").forEach(button => {
    button.addEventListener("click", event => {
      uiState.activeEventCategory = event.currentTarget.dataset.eventCategory || "food";
      persistClientState();
      renderTrainPanel();
    });
  });

  root.querySelectorAll("[data-event-biome]").forEach(button => {
    button.addEventListener("click", event => {
      uiState.activeEventBiome = event.currentTarget.dataset.eventBiome || "plains";
      persistClientState();
      renderTrainPanel();
    });
  });

  root.querySelectorAll("[data-event-tier-filter]").forEach(button => {
    button.addEventListener("click", event => {
      uiState.activeEventTier = clamp(Math.trunc(toNumber(event.currentTarget.dataset.eventTierFilter, 0)), 0, 10);
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
      biomeId: formData.get("biomeId"),
      moving: formData.has("moving"),
      notes: formData.get("notes")
    });
  });

  root.querySelector("[data-settings-form]")?.addEventListener("submit", async event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const biomes = Array.from(event.currentTarget.querySelectorAll("[data-biome-row]")).map(row => ({
      id: row.dataset.biomeRow,
      name: row.querySelector("[name='biomeName']")?.value,
      imageUrl: row.querySelector("[name='biomeImageUrl']")?.value,
      foodMultiplier: row.querySelector("[name='biomeFoodMultiplier']")?.value,
      waterMultiplier: row.querySelector("[name='biomeWaterMultiplier']")?.value,
      fuelMultiplier: row.querySelector("[name='biomeFuelMultiplier']")?.value,
      amenitiesMultiplier: row.querySelector("[name='biomeAmenitiesMultiplier']")?.value
    }));
    await sendAction("updateSettings", {
      currentTurn: formData.get("currentTurn"),
      baseFuelPerTurn: formData.get("baseFuelPerTurn"),
      fuelMultiplierPerWagon: formData.get("fuelMultiplierPerWagon"),
      raiseExtraDice: formData.get("raiseExtraDice"),
      raiseEvery: formData.get("raiseEvery"),
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
      chatOutputMode: formData.get("chatOutputMode"),
      biomes
    });
  });

  root.querySelectorAll("[data-wagon-form]").forEach(form => {
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      await sendAction("updateWagon", {
        id: event.currentTarget.dataset.wagonForm,
        name: formData.get("name"),
        role: formData.get("role"),
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
        portraitUrl: formData.get("portraitUrl"),
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

  root.querySelectorAll("[data-scavenge-form]").forEach(form => {
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      await sendAction("performScavenge", {
        categoryKey: event.currentTarget.dataset.scavengeForm,
        actorId: formData.get("actorId"),
        skillName: formData.get("skillName"),
        rollDie: formData.get("rollDie"),
        useActorSkill: formData.has("useActorSkill"),
        modifier: formData.get("modifier")
      });
    });
  });

  root.querySelector("[data-events-form]")?.addEventListener("submit", async event => {
    event.preventDefault();
    const tiers = Array.from(event.currentTarget.querySelectorAll("[data-event-tier]")).map(textarea => ({
      tier: textarea.dataset.eventTier,
      rewardFormula: event.currentTarget.querySelector(`[data-event-reward-tier="${textarea.dataset.eventTier}"]`)?.value || "",
      lines: textarea.value
    }));
    await sendAction("updateScavengeEvents", {
      categoryKey: event.currentTarget.dataset.eventsForm,
      biomeId: event.currentTarget.dataset.eventsBiome,
      tiers
    });
  });

  activateRadioListeners(root);
}

function activateRadioListeners(root) {
  const receiver = root.querySelector("[data-radio-receiver]");
  if (receiver) {
    const slider = receiver.querySelector("[data-radio-frequency]");
    const gainSlider = receiver.querySelector("[data-radio-gain]");
    const actorSelect = receiver.querySelector("[name='radioActorId']");

    activateRadioDial(receiver, slider);
    activateRadioGain(receiver, gainSlider);
    activateRadioActorPicker(receiver, root);

    actorSelect?.addEventListener("change", () => updateRadioReceiverDom(root, liveRadioFrequency, liveRadioGain));

    receiver.querySelector("[data-request-radio-lock]")?.addEventListener("click", async event => {
      event.preventDefault();
      await sendAction("requestRadioLock", radioLockPayload(receiver));
    });

    receiver.querySelector("[data-perform-radio-lock]")?.addEventListener("click", async event => {
      event.preventDefault();
      await sendAction("performRadioLock", radioLockPayload(receiver));
    });

    updateRadioReceiverDom(root, liveRadioFrequency, liveRadioGain);
  } else {
    stopRadioAudio();
  }

  root.querySelector("[data-radio-mute]")?.addEventListener("click", event => {
    event.preventDefault();
    uiState.radioMuted = !uiState.radioMuted;
    persistClientState();
    const button = event.currentTarget;
    const icon = button.querySelector("i");
    const label = button.querySelector("span");
    button.classList.toggle("is-active", uiState.radioMuted);
    button.setAttribute("aria-pressed", String(uiState.radioMuted));
    button.title = uiState.radioMuted ? "Unmute Receiver Audio" : "Mute Receiver Audio";
    if (icon) icon.className = `fa-solid ${uiState.radioMuted ? "fa-volume-xmark" : "fa-volume-high"}`;
    if (label) label.textContent = uiState.radioMuted ? "Unmute" : "Mute";
    fadeRadioAudioForMute(uiState.radioMuted);
    if (!uiState.radioMuted) updateRadioReceiverDom(root, liveRadioFrequency, liveRadioGain);
  });

  root.querySelector("[data-toggle-radio-power]")?.addEventListener("click", async event => {
    event.preventDefault();
    await sendAction("setRadioPower", {
      poweredOn: event.currentTarget.dataset.radioPowered !== "true"
    });
  });

  root.querySelectorAll("[data-radio-gm-tab]").forEach(button => {
    button.addEventListener("click", event => {
      uiState.radioGmTab = event.currentTarget.dataset.radioGmTab || "broadcasts";
      persistClientState();
      renderTrainPanel();
    });
  });

  root.querySelector("[data-add-radio-broadcast]")?.addEventListener("click", async event => {
    event.preventDefault();
    const id = randomId();
    uiState.radioGmTab = "broadcasts";
    uiState.expandedRadioBroadcastId = id;
    persistClientState();
    await sendAction("addRadioBroadcast", { id });
  });

  root.querySelectorAll("[data-radio-broadcast-details]").forEach(details => {
    details.addEventListener("toggle", event => {
      if (event.currentTarget.open) uiState.expandedRadioBroadcastId = event.currentTarget.dataset.radioBroadcastDetails || "";
      else if (uiState.expandedRadioBroadcastId === event.currentTarget.dataset.radioBroadcastDetails) uiState.expandedRadioBroadcastId = "";
      persistClientState();
    });
  });

  root.querySelectorAll("[data-radio-broadcast-form]").forEach(form => {
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      await sendAction("updateRadioBroadcast", {
        id: event.currentTarget.dataset.radioBroadcastForm,
        title: formData.get("title"),
        enabled: formData.has("enabled"),
        frequency: formData.get("frequency"),
        signalRange: formData.get("signalRange"),
        lockTolerance: formData.get("lockTolerance"),
        targetGain: formData.get("targetGain"),
        gainTolerance: formData.get("gainTolerance"),
        requiresLock: formData.has("requiresLock"),
        source: formData.get("source"),
        startTurn: formData.get("startTurn"),
        endTurn: formData.get("endTurn"),
        skillName: formData.get("skillName"),
        modifier: formData.get("modifier"),
        partialText: formData.get("partialText"),
        fullText: formData.get("fullText"),
        raiseText: formData.get("raiseText"),
        audioUrl: formData.get("audioUrl"),
        responseLines: formData.get("responseLines"),
        oneShot: formData.has("oneShot")
      });
    });

    const lockToggle = form.querySelector("[data-radio-requires-lock]");
    const lockSettings = form.querySelector("[data-radio-lock-settings]");
    lockToggle?.addEventListener("change", () => {
      lockSettings?.classList.toggle("is-open-broadcast", !lockToggle.checked);
    });
  });

  root.querySelectorAll("[data-delete-radio-broadcast]").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      await sendAction("deleteRadioBroadcast", { id: event.currentTarget.dataset.deleteRadioBroadcast });
    });
  });

  root.querySelectorAll("[data-radio-permission]").forEach(input => {
    input.addEventListener("change", async event => {
      await sendAction("setRadioPermission", {
        userId: event.currentTarget.dataset.radioPermission,
        allowed: event.currentTarget.checked
      });
    });
  });

  root.querySelectorAll("[data-resolve-radio-request]").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      await sendAction("resolveRadioRequest", {
        requestId: event.currentTarget.dataset.resolveRadioRequest,
        grant: event.currentTarget.dataset.radioGrant === "true"
      });
    });
  });

  root.querySelector("[data-radio-settings-form]")?.addEventListener("submit", async event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await sendAction("updateRadioSettings", {
      lockAttemptsPerTurn: formData.get("lockAttemptsPerTurn"),
      stabilizationSeconds: formData.get("stabilizationSeconds"),
      volume: formData.get("volume"),
      noiseSoundUrl: formData.get("noiseSoundUrl"),
      approachSoundUrl: formData.get("approachSoundUrl"),
      foundSoundUrl: formData.get("foundSoundUrl")
    });
  });

  root.querySelectorAll("[data-radio-test-sound]").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      const field = event.currentTarget.dataset.radioTestSound;
      const control = event.currentTarget.closest("form")?.elements?.namedItem(field);
      await playRadioPreview(control?.value || "", field);
    });
  });

  root.querySelectorAll("[data-radio-file-picker]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      openRadioAudioPicker(event.currentTarget);
    });
  });

  root.querySelector("[data-clear-radio-log]")?.addEventListener("click", async event => {
    event.preventDefault();
    await sendAction("clearRadioLog", {});
  });

  root.querySelector("[data-reset-radio-attempts]")?.addEventListener("click", async event => {
    event.preventDefault();
    await sendAction("resetRadioAttempts", {});
  });

  root.querySelectorAll("[data-radio-response]").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      await sendAction("transmitRadioResponse", {
        logId: event.currentTarget.dataset.radioLog,
        responseIndex: event.currentTarget.dataset.radioResponse
      });
    });
  });
}

function activateRadioDial(receiver, slider) {
  const dial = receiver.querySelector("[data-radio-dial]");
  if (!dial || !slider || receiver.dataset.radioPowered !== "true") return;

  const applyFrequency = value => {
    const frequency = normalizeRadioFrequency(value);
    if (frequency === normalizeRadioFrequency(slider.value)) return frequency;
    slider.value = frequency;
    applyLiveRadioFrequency(frequency, game.user?.name || "Operator", Date.now());
    queueRadioFrequencyBroadcast(frequency);
    return frequency;
  };
  const commitFrequency = async () => {
    await sendAction("tuneRadio", { frequency: normalizeRadioFrequency(slider.value) });
  };
  const pointerAngle = event => {
    const rect = dial.getBoundingClientRect();
    return Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2)) * 180 / Math.PI;
  };
  const angleDelta = (next, previous) => {
    let delta = next - previous;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return delta;
  };
  let drag = null;

  dial.addEventListener("pointerdown", event => {
    event.preventDefault();
    dial.setPointerCapture?.(event.pointerId);
    drag = {
      pointerId: event.pointerId,
      angle: pointerAngle(event),
      frequency: normalizeRadioFrequency(slider.value)
    };
    dial.classList.add("is-turning");
  });

  dial.addEventListener("pointermove", event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const nextAngle = pointerAngle(event);
    const delta = angleDelta(nextAngle, drag.angle);
    const mhzPerDegree = (RADIO_MAX_FREQUENCY - RADIO_MIN_FREQUENCY) / RADIO_DIAL_SWEEP_DEGREES;
    drag.frequency = applyFrequency(drag.frequency + delta * mhzPerDegree);
    drag.angle = nextAngle;
  });

  const finishDrag = async event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag = null;
    dial.classList.remove("is-turning");
    dial.releasePointerCapture?.(event.pointerId);
    await commitFrequency();
  };
  dial.addEventListener("pointerup", finishDrag);
  dial.addEventListener("pointercancel", finishDrag);

  dial.addEventListener("wheel", async event => {
    event.preventDefault();
    const step = event.shiftKey ? 1 : RADIO_FREQUENCY_STEP;
    const frequency = applyFrequency(toNumber(slider.value, RADIO_DEFAULT_FREQUENCY) + (event.deltaY < 0 ? step : -step));
    if (radioTuneCommitTimer) clearTimeout(radioTuneCommitTimer);
    radioTuneCommitTimer = setTimeout(() => {
      radioTuneCommitTimer = null;
      sendAction("tuneRadio", { frequency });
    }, 180);
  }, { passive: false });

  dial.addEventListener("keydown", async event => {
    const direction = ["ArrowRight", "ArrowUp"].includes(event.key) ? 1 : ["ArrowLeft", "ArrowDown"].includes(event.key) ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    applyFrequency(toNumber(slider.value, RADIO_DEFAULT_FREQUENCY) + direction * (event.shiftKey ? 1 : RADIO_FREQUENCY_STEP));
    await commitFrequency();
  });
}

function activateRadioGain(receiver, slider) {
  if (!slider || receiver.dataset.radioPowered !== "true") return;

  const applyGain = value => {
    const gain = normalizeRadioGain(value);
    slider.value = gain;
    applyLiveRadioGain(gain, game.user?.name || "Operator", Date.now());
    queueRadioGainBroadcast(gain);
    return gain;
  };
  const commitGain = async gain => {
    if (radioGainCommitTimer) clearTimeout(radioGainCommitTimer);
    radioGainCommitTimer = null;
    await sendAction("adjustRadioGain", { gain: normalizeRadioGain(gain ?? slider.value) });
  };
  const scheduleCommit = gain => {
    if (radioGainCommitTimer) clearTimeout(radioGainCommitTimer);
    radioGainCommitTimer = setTimeout(() => {
      radioGainCommitTimer = null;
      sendAction("adjustRadioGain", { gain: normalizeRadioGain(gain) });
    }, 180);
  };

  slider.addEventListener("input", event => {
    const gain = applyGain(event.currentTarget.value);
    scheduleCommit(gain);
  });

  slider.addEventListener("change", async event => {
    await commitGain(event.currentTarget.value);
  });

  slider.addEventListener("wheel", event => {
    event.preventDefault();
    const step = event.shiftKey ? 0.1 : RADIO_GAIN_STEP;
    const gain = applyGain(toNumber(slider.value, RADIO_DEFAULT_GAIN) + (event.deltaY < 0 ? step : -step));
    scheduleCommit(gain);
  }, { passive: false });
}

function activateRadioActorPicker(receiver, root) {
  const picker = receiver.querySelector("[data-radio-actor-picker]");
  const search = picker?.querySelector("[data-radio-actor-search]");
  const actorId = picker?.querySelector("[name='radioActorId']");
  const results = picker?.querySelector("[data-radio-actor-results]");
  const options = Array.from(results?.querySelectorAll("[data-radio-actor-option]") || []);
  if (!picker || !search || !actorId || !results) return;

  let activeIndex = -1;
  const visibleOptions = () => options.filter(option => !option.hidden);
  const setActive = index => {
    const visible = visibleOptions();
    activeIndex = visible.length ? (index + visible.length) % visible.length : -1;
    options.forEach(option => option.classList.remove("is-active"));
    if (activeIndex >= 0) {
      visible[activeIndex].classList.add("is-active");
      visible[activeIndex].scrollIntoView({ block: "nearest" });
    }
  };
  const close = () => {
    results.hidden = true;
    search.setAttribute("aria-expanded", "false");
    activeIndex = -1;
    options.forEach(option => option.classList.remove("is-active"));
  };
  const filter = () => {
    const query = cleanString(search.value).toLocaleLowerCase();
    let shown = 0;
    for (const option of options) {
      const matches = !query || cleanString(option.dataset.actorName).toLocaleLowerCase().includes(query);
      option.hidden = !matches || shown >= 12;
      if (matches && shown < 12) shown += 1;
    }
    results.hidden = shown === 0;
    search.setAttribute("aria-expanded", String(shown > 0));
    setActive(shown ? 0 : -1);
  };
  const choose = option => {
    if (!option) return;
    actorId.value = option.dataset.radioActorOption || "";
    search.value = option.dataset.actorName || option.textContent.trim();
    search.dataset.selectedActorName = search.value;
    actorId.dispatchEvent(new Event("change", { bubbles: true }));
    close();
  };

  search.addEventListener("focus", filter);
  search.addEventListener("input", () => {
    if (search.value !== search.dataset.selectedActorName) actorId.value = "";
    filter();
    updateRadioReceiverDom(root, liveRadioFrequency, liveRadioGain);
  });
  search.addEventListener("keydown", event => {
    const visible = visibleOptions();
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (results.hidden) filter();
      setActive(activeIndex + (event.key === "ArrowDown" ? 1 : -1));
      return;
    }
    if (event.key === "Enter" && visible.length) {
      event.preventDefault();
      choose(visible[Math.max(0, activeIndex)]);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  });
  search.addEventListener("blur", () => setTimeout(close, 120));
  options.forEach(option => {
    option.addEventListener("pointerdown", event => event.preventDefault());
    option.addEventListener("click", () => choose(option));
  });
}

function openRadioAudioPicker(button) {
  const fieldName = cleanString(button.dataset.radioFilePicker);
  const input = button.closest("form")?.elements?.namedItem(fieldName);
  if (!input) return;

  const Picker = foundry?.applications?.apps?.FilePicker?.implementation
    || globalThis.FilePicker
    || foundry?.applications?.apps?.FilePicker;
  if (!Picker) {
    ui.notifications.warn("Foundry audio browser is not available. Paste an audio path into the field.");
    return;
  }

  const picker = new Picker({
    type: "audio",
    current: input.value || "",
    callback: path => {
      input.value = path;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  picker.render({ force: true });
}

function radioLockPayload(receiver) {
  return {
    actorId: receiver.querySelector("[name='radioActorId']")?.value || "",
    frequency: receiver.querySelector("[data-radio-frequency]")?.value || liveRadioFrequency || RADIO_DEFAULT_FREQUENCY,
    gain: receiver.querySelector("[data-radio-gain]")?.value || liveRadioGain || RADIO_DEFAULT_GAIN,
    stabilized: Boolean(radioStabilityState.ready)
  };
}

function bindSocket() {
  game.socket.on(SOCKET_NAME, async packet => {
    if (!packet || typeof packet !== "object") return;

    if (packet.type === "radioFrequency") {
      if (getWorldData().radio.poweredOn === false) return;
      const sender = users().find(user => user.id === packet.userId);
      if (!sender) return;
      applyLiveRadioFrequency(packet.frequency, sender.name || "Operator", packet.stamp);
      return;
    }

    if (packet.type === "radioGain") {
      if (getWorldData().radio.poweredOn === false) return;
      const sender = users().find(user => user.id === packet.userId);
      if (!sender) return;
      applyLiveRadioGain(packet.gain, sender.name || "Operator", packet.stamp);
      return;
    }

    if (packet.type === "radioCue") {
      if (packet.senderId === game.user.id) return;
      playRadioCue(packet.cue, packet.audioUrl);
      return;
    }

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
  if (!game.user.isGM && !PLAYER_RADIO_ACTIONS.has(action)) {
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
  if (!user) throw new Error("Dominion train user not found.");
  if (!user.isGM && !PLAYER_RADIO_ACTIONS.has(action)) throw new Error("This Dominion train action is GM only.");

  const data = getWorldData();
  if (PLAYER_RADIO_ACTIONS.has(action)) ensureRadioPowered(data);
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
      enforceResourceCaps(data);
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
    case "performHunting":
    case "performScavenge":
      await performScavenge(data, payload);
      return true;
    case "updateScavengeEvents":
      updateScavengeEvents(data, payload);
      await saveWorldData(data, "updateScavengeEvents");
      return true;
    case "clearScavengeLog":
      clearScavengeLog(data);
      break;
    case "tuneRadio":
      tuneRadio(data, payload, user);
      break;
    case "adjustRadioGain":
      adjustRadioGain(data, payload, user);
      break;
    case "requestRadioLock":
      requestRadioLock(data, payload, user);
      break;
    case "performRadioLock":
      await performRadioLock(data, payload, user);
      return true;
    case "transmitRadioResponse":
      await transmitRadioResponse(data, payload, user);
      return true;
    case "addRadioBroadcast": {
      const broadcast = defaultRadioBroadcast(data.radio.broadcasts.length);
      broadcast.id = cleanString(payload.id) || broadcast.id;
      data.radio.broadcasts.push(broadcast);
      break;
    }
    case "updateRadioBroadcast":
      updateRadioBroadcast(data, payload);
      break;
    case "deleteRadioBroadcast":
      deleteById(data.radio.broadcasts, payload.id);
      break;
    case "setRadioPermission":
      setRadioPermission(data, payload);
      break;
    case "resolveRadioRequest":
      resolveRadioRequest(data, payload);
      break;
    case "updateRadioSettings":
      updateRadioSettings(data, payload);
      break;
    case "setRadioPower":
      setRadioPower(data, payload);
      break;
    case "clearRadioLog":
      data.radio.log = [];
      break;
    case "resetRadioAttempts":
      data.radio.attempts = data.radio.attempts.filter(attempt => attempt.turn !== data.currentTurn);
      break;
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
  for (const key of ["talion", "fuel"]) {
    const value = toNumber(payload[key], data.resources[key] || 0);
    setResourceValue(data, key, value);
  }
  setStorageResources(data, payload);
}

function setStorageResources(data, payload) {
  const desired = {};
  for (const key of STORAGE_RESOURCE_KEYS) {
    const value = hasOwn(payload, key) ? toNumber(payload[key], data.resources[key] || 0) : data.resources[key] || 0;
    desired[key] = data.settings.allowNegativeResources ? roundResource(value) : Math.max(0, roundResource(value));
  }

  const cap = wagonCapacity(data, "storage");
  let remaining = cap;
  for (const key of STORAGE_RESOURCE_KEYS) {
    if (desired[key] < 0 && data.settings.allowNegativeResources) {
      data.resources[key] = desired[key];
      continue;
    }
    const next = Math.min(Math.max(0, desired[key]), remaining);
    data.resources[key] = roundResource(next);
    remaining = Math.max(0, roundResource(remaining - next));
  }
}

function updateRoute(data, payload) {
  data.route.currentRouteName = cleanString(payload.currentRouteName);
  data.route.destinationName = cleanString(payload.destinationName);
  data.route.remainingTurns = Math.max(0, toNumber(payload.remainingTurns, data.route.remainingTurns));
  data.route.biomeId = data.settings.biomes.some(biome => biome.id === payload.biomeId) ? payload.biomeId : data.route.biomeId;
  data.route.moving = Boolean(payload.moving);
  data.route.notes = cleanString(payload.notes);
}

function updateSettings(data, payload) {
  data.currentTurn = Math.max(1, Math.trunc(toNumber(payload.currentTurn, data.currentTurn)));
  data.settings.baseFuelPerTurn = Math.max(0, toNumber(payload.baseFuelPerTurn, data.settings.baseFuelPerTurn));
  data.settings.fuelMultiplierPerWagon = Math.max(0, toNumber(payload.fuelMultiplierPerWagon, data.settings.fuelMultiplierPerWagon));
  data.settings.raiseExtraDice = clamp(Math.trunc(toNumber(payload.raiseExtraDice, data.settings.raiseExtraDice)), 0, 20);
  data.settings.raiseEvery = clamp(Math.trunc(toNumber(payload.raiseEvery, data.settings.raiseEvery)), 1, 20);
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
  if (Array.isArray(payload.biomes)) {
    data.settings.biomes = normalizeBiomes(payload.biomes);
    if (!data.settings.biomes.some(biome => biome.id === data.route.biomeId)) data.route.biomeId = data.settings.biomes[0]?.id || "plains";
    data.scavengeEvents = normalizeScavengeEvents(data.scavengeEvents, data.settings.biomes);
  }
}

function updateWagon(data, payload) {
  const wagon = data.wagons.find(candidate => candidate.id === payload.id);
  if (!wagon) throw new Error("Wagon not found.");
  wagon.name = cleanString(payload.name) || "Unnamed Wagon";
  wagon.role = normalizeWagonRole(payload.role || wagon.role || wagon.type);
  wagon.type = wagonRoleConfig(wagon.role).label;
  wagon.active = Boolean(payload.active);
  wagon.capacity = Math.max(0, toNumber(payload.capacity, wagon.capacity));
  wagon.notes = cleanString(payload.notes);
  wagon.gmNotes = cleanString(payload.gmNotes);
  enforceResourceCaps(data);
}

function updateGroup(data, payload) {
  const group = data.groups.find(candidate => candidate.id === payload.id);
  if (!group) throw new Error("Passenger group not found.");
  group.name = cleanString(payload.name) || "Unnamed Group";
  group.count = Math.max(0, toNumber(payload.count, group.count));
  group.portraitUrl = cleanString(payload.portraitUrl);
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

  const currentResource = Number(data.resources[item.resourceType] || 0);
  const maxResource = maxResourceValue(data, item.resourceType);
  if (Number.isFinite(maxResource) && currentResource + item.amount > maxResource) {
    throw new Error(`Not enough ${item.resourceType === "fuel" ? "fuel" : "storage"} capacity.`);
  }

  setResourceValue(data, "talion", Number(data.resources.talion || 0) - item.cost);
  setResourceValue(data, item.resourceType, currentResource + item.amount);
  item.stock = Math.max(0, roundResource(item.stock - 1));
  await saveWorldData(data, "buyMarketItem");
  await createMarketChat(data, market, item);
  return true;
}

function clearScavengeLog(data) {
  data.scavengeLog = [];
  data.huntingLog = [];
}

function tuneRadio(data, payload, user) {
  ensureRadioPowered(data);
  data.radio.frequency = normalizeRadioFrequency(payload.frequency);
  data.radio.lastTunedBy = user.name || "Operator";
  liveRadioFrequency = data.radio.frequency;
  liveRadioTunedBy = data.radio.lastTunedBy;
}

function adjustRadioGain(data, payload, user) {
  ensureRadioPowered(data);
  data.radio.gain = normalizeRadioGain(payload.gain);
  data.radio.lastTunedBy = user.name || "Operator";
  liveRadioGain = data.radio.gain;
  liveRadioTunedBy = data.radio.lastTunedBy;
}

function requestRadioLock(data, payload, user) {
  ensureRadioPowered(data);
  if (user.isGM || data.radio.permissions[user.id]) throw new Error("You already have permission to lock a signal.");
  if (!payload.stabilized) throw new Error("Hold the carrier steady before requesting a lock.");
  const frequency = normalizeRadioFrequency(payload.frequency);
  const gain = normalizeRadioGain(payload.gain);
  const signal = radioSignalAtFrequency(data, frequency, gain);
  ensureRadioSignalAligned(signal);
  if (signal.broadcast.requiresLock === false) throw new Error("This is an open broadcast and does not require a signal lock.");
  const actor = radioActorForUser(payload.actorId, user);

  data.radio.frequency = frequency;
  data.radio.gain = gain;
  data.radio.lastTunedBy = user.name || "Operator";
  data.radio.requests = data.radio.requests.filter(request => request.userId !== user.id);
  data.radio.requests.unshift({
    id: randomId(),
    userId: user.id,
    userName: user.name || "Player",
    actorId: actor.id,
    actorName: actor.name || "Unknown Actor",
    frequency,
    created: Date.now()
  });
  data.radio.requests = data.radio.requests.slice(0, RADIO_REQUEST_LIMIT);
  ui.notifications.info(`${user.name || "A player"} requested permission to lock ${formatRadioFrequency(frequency)} MHz.`);
}

function setRadioPermission(data, payload) {
  const target = users().find(user => user.id === cleanString(payload.userId) && !user.isGM);
  if (!target) throw new Error("Radio operator not found.");
  data.radio.permissions[target.id] = Boolean(payload.allowed);
  if (payload.allowed) data.radio.requests = data.radio.requests.filter(request => request.userId !== target.id);
}

function resolveRadioRequest(data, payload) {
  const request = data.radio.requests.find(candidate => candidate.id === payload.requestId);
  if (!request) throw new Error("Radio lock request not found.");
  if (payload.grant) data.radio.permissions[request.userId] = true;
  data.radio.requests = data.radio.requests.filter(candidate => candidate.id !== request.id);
}

function updateRadioSettings(data, payload) {
  data.radio.settings.lockAttemptsPerTurn = clamp(Math.trunc(toNumber(payload.lockAttemptsPerTurn, data.radio.settings.lockAttemptsPerTurn)), 0, 20);
  data.radio.settings.stabilizationSeconds = clamp(toNumber(payload.stabilizationSeconds, data.radio.settings.stabilizationSeconds), 0.5, 10);
  data.radio.settings.volume = clamp(toNumber(payload.volume, data.radio.settings.volume), 0, 1);
  data.radio.settings.noiseSoundUrl = cleanString(payload.noiseSoundUrl);
  data.radio.settings.approachSoundUrl = cleanString(payload.approachSoundUrl);
  data.radio.settings.foundSoundUrl = cleanString(payload.foundSoundUrl);
}

function setRadioPower(data, payload) {
  data.radio.poweredOn = Boolean(payload.poweredOn);
}

function ensureRadioPowered(data) {
  if (data.radio.poweredOn === false) throw new Error("Receiver is currently powered off.");
}

function updateRadioBroadcast(data, payload) {
  const broadcast = data.radio.broadcasts.find(candidate => candidate.id === payload.id);
  if (!broadcast) throw new Error("Radio broadcast not found.");
  const normalized = normalizeRadioBroadcast({ ...broadcast, ...payload, responses: parseRadioResponses(payload.responseLines) });
  Object.assign(broadcast, normalized, { id: broadcast.id });
}

async function performRadioLock(data, payload, user) {
  ensureRadioPowered(data);
  if (!user.isGM && !data.radio.permissions[user.id]) throw new Error("The GM has not granted you signal-lock permission.");
  if (!payload.stabilized) throw new Error("The carrier has not stabilized yet.");
  const frequency = normalizeRadioFrequency(payload.frequency);
  const gain = normalizeRadioGain(payload.gain);
  const signal = radioSignalAtFrequency(data, frequency, gain);
  ensureRadioSignalAligned(signal);
  if (signal.broadcast.requiresLock === false) throw new Error("This is an open broadcast and does not require a signal-lock roll.");
  const actor = radioActorForUser(payload.actorId, user);

  const attemptLimit = Math.max(0, Math.trunc(toNumber(data.radio.settings.lockAttemptsPerTurn, 2)));
  const attemptsUsed = data.radio.attempts.filter(attempt => attempt.turn === data.currentTurn).length;
  if (attemptLimit && attemptsUsed >= attemptLimit) throw new Error("No radio lock attempts remain this turn.");

  const broadcast = signal.broadcast;
  const skillName = broadcast.skillName || "Electronics";
  const actorTraitDie = findActorTraitDie(actor, skillName);
  const unskilled = !actorTraitDie;
  const traitDie = unskilled ? UNSKILLED_DIE : actorTraitDie;
  const baseModifier = Math.trunc(toSignedNumber(broadcast.modifier, 0));
  const modifier = baseModifier + (unskilled ? UNSKILLED_MODIFIER : 0);
  const roll = await rollSwadeTrait(traitDie, modifier);
  const criticalFailure = Number(roll.traitRolls?.[0]) === 1 && Number(roll.wildRolls?.[0]) === 1;
  const outcome = criticalFailure ? "critical" : roll.success ? (roll.raises > 0 ? "raise" : "success") : "failure";
  const outcomeLabel = radioOutcomeLabel(outcome);
  const message = roll.success ? broadcast.fullText : radioSignalPresentation(signal).snippet;
  const raiseText = roll.raises > 0 ? broadcast.raiseText : "";

  const entry = {
    id: randomId(),
    created: Date.now(),
    turn: data.currentTurn,
    broadcastId: broadcast.id,
    broadcastTitle: roll.success ? broadcast.title : "Unidentified Broadcast",
    source: roll.success ? broadcast.source : "Unknown",
    gmBroadcastTitle: broadcast.title,
    gmSource: broadcast.source,
    frequency,
    userId: user.id,
    userName: user.name || "Operator",
    actorId: actor.id,
    actorName: actor.name || "Unknown Actor",
    actorImg: actor.img || "",
    skillName,
    traitDie,
    baseModifier,
    modifier,
    unskilled,
    roll,
    outcome,
    outcomeLabel,
    message,
    raiseText,
    responses: roll.success ? clone(broadcast.responses) : [],
    responseSent: "",
    responseOutcome: ""
  };

  data.radio.frequency = frequency;
  data.radio.gain = gain;
  data.radio.lastTunedBy = user.name || "Operator";
  data.radio.attempts.push({ id: randomId(), turn: data.currentTurn, userId: user.id, broadcastId: broadcast.id });
  data.radio.attempts = data.radio.attempts.slice(-100);
  data.radio.requests = data.radio.requests.filter(request => request.userId !== user.id);
  data.radio.log.unshift(entry);
  data.radio.log = data.radio.log.slice(0, RADIO_LOG_LIMIT);
  if (roll.success && broadcast.oneShot) broadcast.enabled = false;

  await saveWorldData(data, "performRadioLock");
  await createRadioChat(entry, actor);
  return true;
}

async function transmitRadioResponse(data, payload, user) {
  ensureRadioPowered(data);
  if (!user.isGM && !data.radio.permissions[user.id]) throw new Error("The GM has not granted you transmission permission.");
  const entry = data.radio.log.find(candidate => candidate.id === payload.logId);
  if (!entry) throw new Error("Radio log entry not found.");
  if (entry.responseSent) throw new Error("A response has already been transmitted for this signal.");
  const response = entry.responses[clamp(Math.trunc(toNumber(payload.responseIndex, -1)), -1, entry.responses.length - 1)];
  if (!response) throw new Error("Radio response not found.");

  entry.responseSent = response.label;
  entry.responseOutcome = response.outcome;
  entry.responseUserId = user.id;
  entry.responseUserName = user.name || "Operator";
  await saveWorldData(data, "transmitRadioResponse");
  await createRadioResponseChat(entry, response);
  playRadioCue("transmit", "");
  game.socket.emit(SOCKET_NAME, { type: "radioCue", cue: "transmit", senderId: game.user.id, stamp: Date.now() });
  return true;
}

function radioActorForUser(actorId, user) {
  const actor = game.actors?.get(cleanString(actorId));
  if (!actor) throw new Error("Select an actor for the radio roll.");
  if (!user.isGM && typeof actor.testUserPermission === "function") {
    const ownerLevel = globalThis.CONST?.DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3;
    if (!actor.testUserPermission(user, ownerLevel)) throw new Error("You do not own that actor.");
  }
  return actor;
}

function radioOutcomeLabel(outcome) {
  if (outcome === "critical") return "Critical Failure";
  if (outcome === "failure") return "Signal Lost";
  if (outcome === "raise") return "Raise: Full Intelligence";
  return "Signal Decoded";
}

function ensureRadioSignalAligned(signal) {
  if (!signal?.frequencyReady) throw new Error("Tune closer to the carrier frequency.");
  if (!signal.gainReady) throw new Error("Align the receiver gain before locking the signal.");
}

function activeRadioBroadcasts(data) {
  if (data.radio.poweredOn === false) return [];
  return data.radio.broadcasts.filter(broadcast => {
    if (!broadcast.enabled) return false;
    if (broadcast.startTurn > data.currentTurn) return false;
    if (broadcast.endTurn > 0 && broadcast.endTurn < data.currentTurn) return false;
    return true;
  });
}

function radioSignalAtFrequency(data, frequency, gain = null) {
  const tunedFrequency = normalizeRadioFrequency(frequency);
  const tunedGain = normalizeRadioGain(gain ?? data.radio.gain);
  let best = null;
  for (const broadcast of activeRadioBroadcasts(data)) {
    const distance = Math.abs(tunedFrequency - broadcast.frequency);
    const coreRange = Math.max(broadcast.signalRange, RADIO_FREQUENCY_STEP);
    const traceRange = Math.min(10, coreRange + RADIO_SIGNAL_FEATHER_RANGE);
    if (distance > traceRange) continue;
    const intensity = distance <= coreRange
      ? 0.25 + 0.75 * (1 - distance / coreRange)
      : 0.25 * (1 - (distance - coreRange) / Math.max(RADIO_FREQUENCY_STEP, traceRange - coreRange));
    const frequencyReady = distance <= broadcast.lockTolerance;
    const targetGain = normalizeRadioGain(broadcast.targetGain);
    const gainTolerance = normalizeRadioGainTolerance(broadcast.gainTolerance);
    const gainDistance = Math.abs(tunedGain - targetGain);
    const gainReady = frequencyReady && gainDistance <= gainTolerance;
    const gainClarity = frequencyReady ? clamp(1 - gainDistance / 1.25, 0, 1) : 0;
    if (!best || intensity > best.intensity) {
      best = {
        broadcast,
        distance,
        intensity: clamp(intensity, 0, 1),
        frequencyReady,
        gain: tunedGain,
        targetGain,
        gainTolerance,
        gainDistance,
        gainDirection: gainReady ? 0 : tunedGain < targetGain ? -1 : 1,
        gainReady,
        gainClarity,
        lockReady: frequencyReady && gainReady
      };
    }
  }
  return best;
}

function radioSignalPresentation(signal, stability = null) {
  if (!signal) {
    return {
      strength: 0,
      strengthLabel: "NO CARRIER",
      snippet: "[STATIC]",
      lockReady: false,
      requiresLock: true,
      stable: false,
      stabilityProgress: 0,
      stabilityLabel: "SEARCHING",
      skillLabel: "Carrier not found",
      gainStatusLabel: "NO CARRIER",
      gainClarity: 0
    };
  }

  const strength = Math.round(signal.intensity * 100);
  const partial = signal.broadcast.partialText || deriveRadioPartial(signal.broadcast.fullText);
  const requiresLock = signal.broadcast.requiresLock !== false;
  const openReady = !requiresLock && signal.lockReady;
  const stable = openReady || Boolean(stability?.ready);
  const stabilityProgress = openReady
    ? 100
    : signal.lockReady ? Math.round(clamp(toNumber(stability?.progress, 0), 0, 1) * 100) : 0;
  const gainStatusLabel = !signal.frequencyReady
    ? "NO CARRIER"
    : signal.gainReady
      ? "GAIN ALIGNED"
      : signal.gainDirection < 0 ? "GAIN LOW" : "GAIN HIGH";
  return {
    strength,
    strengthLabel: openReady
      ? "OPEN CHANNEL"
      : stable
        ? "SIGNAL STABLE"
        : signal.lockReady
          ? "HOLD STEADY"
          : signal.frequencyReady
            ? "CARRIER ACQUIRED"
            : strength >= 65 ? "STRONG CARRIER" : strength >= 30 ? "WEAK CARRIER" : "TRACE SIGNAL",
    snippet: openReady ? signal.broadcast.fullText : revealRadioPartial(partial, signal.intensity),
    lockReady: signal.lockReady,
    requiresLock,
    frequencyReady: signal.frequencyReady,
    gainReady: signal.gainReady,
    gainStatusLabel,
    gainClarity: Math.round(signal.gainClarity * 100),
    stable,
    stabilityProgress,
    stabilityLabel: openReady
      ? "OPEN BROADCAST"
      : stable
        ? "LOCK READY"
        : signal.lockReady
          ? `STABILIZING ${stabilityProgress}%`
          : signal.frequencyReady ? "GAIN ALIGNMENT REQUIRED" : "FINE TUNE REQUIRED",
    skillLabel: !requiresLock
      ? (openReady ? "No signal lock required" : "Align the public carrier")
      : stable
        ? `${signal.broadcast.skillName} ${formatSigned(signal.broadcast.modifier)}`
        : signal.lockReady
          ? "Hold both controls steady"
          : signal.frequencyReady ? "Adjust signal gain" : "Tune closer to identify the carrier"
  };
}

function radioPoweredOffPresentation() {
  return {
    strength: 0,
    strengthLabel: "RECEIVER OFF",
    snippet: "Receiver is currently powered off.",
    lockReady: false,
    requiresLock: true,
    stable: false,
    stabilityProgress: 0,
    stabilityLabel: "POWER OFF",
    skillLabel: "Receiver unavailable",
    gainStatusLabel: "POWER OFF",
    gainClarity: 0
  };
}

function revealRadioPartial(text, intensity) {
  const words = cleanString(text).split(/\s+/).filter(Boolean);
  if (!words.length) return "[STATIC]";
  if (intensity < 0.04) return "[STATIC]";
  const readable = clamp((intensity - 0.04) / 0.68, 0, 1);
  const count = clamp(Math.ceil(words.length * readable), 1, words.length);
  return `[STATIC] ${words.slice(0, count).join(" ")}${count < words.length ? "..." : ""} [STATIC]`;
}

function deriveRadioPartial(text) {
  const words = cleanString(text).split(/\s+/).filter(Boolean);
  if (words.length <= 8) return words.join(" ");
  const middle = Math.floor(words.length / 2);
  return `${words.slice(0, 3).join(" ")} ... ${words.slice(middle, middle + 3).join(" ")} ... ${words.slice(-2).join(" ")}`;
}

function parseRadioResponses(value) {
  return cleanString(value).split(/\r?\n/).map(line => {
    const [label, ...outcomeParts] = line.split("|");
    return { label: cleanString(label), outcome: cleanString(outcomeParts.join("|")) };
  }).filter(response => response.label).slice(0, 8);
}

function serializeRadioResponses(responses) {
  return (Array.isArray(responses) ? responses : []).map(response => `${response.label}${response.outcome ? ` | ${response.outcome}` : ""}`).join("\n");
}

function normalizeRadioFrequency(value) {
  const frequency = clamp(toNumber(value, RADIO_DEFAULT_FREQUENCY), RADIO_MIN_FREQUENCY, RADIO_MAX_FREQUENCY);
  return Math.round(frequency / RADIO_FREQUENCY_STEP) * RADIO_FREQUENCY_STEP;
}

function normalizeRadioGain(value) {
  const gain = clamp(toNumber(value, RADIO_DEFAULT_GAIN), RADIO_GAIN_MIN, RADIO_GAIN_MAX);
  return Math.round(gain / RADIO_GAIN_STEP) * RADIO_GAIN_STEP;
}

function normalizeRadioGainTolerance(value) {
  return Math.round(clamp(toNumber(value, RADIO_DEFAULT_GAIN_TOLERANCE), RADIO_GAIN_STEP, 0.5) * 100) / 100;
}

function formatRadioFrequency(value) {
  return normalizeRadioFrequency(value).toFixed(1);
}

function formatRadioGain(value) {
  return normalizeRadioGain(value).toFixed(2);
}

function formatRadioGainTolerance(value) {
  return normalizeRadioGainTolerance(value).toFixed(2);
}

function radioDialAngle(value) {
  const ratio = (normalizeRadioFrequency(value) - RADIO_MIN_FREQUENCY) / (RADIO_MAX_FREQUENCY - RADIO_MIN_FREQUENCY);
  return Math.round((-RADIO_DIAL_SWEEP_DEGREES / 2 + ratio * RADIO_DIAL_SWEEP_DEGREES) * 10) / 10;
}

function queueRadioFrequencyBroadcast(frequency) {
  if (getWorldData().radio.poweredOn === false) return;
  queuedRadioFrequency = normalizeRadioFrequency(frequency);
  if (radioBroadcastTimer) return;
  radioBroadcastTimer = setTimeout(() => {
    radioBroadcastTimer = null;
    const next = queuedRadioFrequency;
    queuedRadioFrequency = null;
    game.socket.emit(SOCKET_NAME, {
      type: "radioFrequency",
      frequency: next,
      userId: game.user.id,
      stamp: Date.now()
    });
  }, 60);
}

function queueRadioGainBroadcast(gain) {
  if (getWorldData().radio.poweredOn === false) return;
  queuedRadioGain = normalizeRadioGain(gain);
  if (radioGainBroadcastTimer) return;
  radioGainBroadcastTimer = setTimeout(() => {
    radioGainBroadcastTimer = null;
    const next = queuedRadioGain;
    queuedRadioGain = null;
    game.socket.emit(SOCKET_NAME, {
      type: "radioGain",
      gain: next,
      userId: game.user.id,
      stamp: Date.now()
    });
  }, 60);
}

function applyLiveRadioFrequency(frequency, tunedBy = "", stamp = Date.now()) {
  if (getWorldData().radio.poweredOn === false) return;
  const nextStamp = toNumber(stamp, Date.now());
  liveRadioStamp = nextStamp;
  liveRadioFrequency = normalizeRadioFrequency(frequency);
  liveRadioTunedBy = cleanString(tunedBy) || liveRadioTunedBy;
  const root = trainApp?.element?.querySelector?.(".dt-root");
  if (root) updateRadioReceiverDom(root, liveRadioFrequency, liveRadioGain);
}

function applyLiveRadioGain(gain, tunedBy = "", stamp = Date.now()) {
  if (getWorldData().radio.poweredOn === false) return;
  const nextStamp = toNumber(stamp, Date.now());
  liveRadioStamp = nextStamp;
  liveRadioGain = normalizeRadioGain(gain);
  liveRadioTunedBy = cleanString(tunedBy) || liveRadioTunedBy;
  const root = trainApp?.element?.querySelector?.(".dt-root");
  if (root) updateRadioReceiverDom(root, liveRadioFrequency, liveRadioGain);
}

function updateRadioReceiverDom(root, frequency = null, gain = null) {
  const receiver = root?.querySelector?.("[data-radio-receiver]");
  if (!receiver) {
    stopRadioAudio();
    return;
  }

  const data = getWorldData();
  const poweredOn = data.radio.poweredOn !== false;
  const tunedFrequency = normalizeRadioFrequency(frequency ?? liveRadioFrequency ?? data.radio.frequency);
  const tunedGain = normalizeRadioGain(gain ?? liveRadioGain ?? data.radio.gain);
  liveRadioFrequency = tunedFrequency;
  liveRadioGain = tunedGain;
  const signal = poweredOn ? radioSignalAtFrequency(data, tunedFrequency, tunedGain) : null;
  const stability = poweredOn
    ? radioStabilityAt(signal, tunedFrequency, tunedGain, data.radio.settings.stabilizationSeconds)
    : { ready: false, progress: 0 };
  if (!poweredOn) resetRadioStability();
  const presentation = poweredOn ? radioSignalPresentation(signal, stability) : radioPoweredOffPresentation();
  const slider = receiver.querySelector("[data-radio-frequency]");
  if (slider) {
    slider.value = tunedFrequency;
    slider.disabled = !poweredOn;
  }
  const dial = receiver.querySelector("[data-radio-dial]");
  if (dial) {
    dial.style.setProperty("--dial-angle", `${radioDialAngle(tunedFrequency)}deg`);
    dial.setAttribute("aria-valuenow", formatRadioFrequency(tunedFrequency));
    dial.disabled = !poweredOn;
  }
  const display = receiver.querySelector("[data-radio-frequency-display]");
  if (display) display.textContent = `${formatRadioFrequency(tunedFrequency)} MHz`;
  const gainSlider = receiver.querySelector("[data-radio-gain]");
  if (gainSlider) {
    gainSlider.value = tunedGain;
    gainSlider.disabled = !poweredOn;
    gainSlider.setAttribute("aria-valuenow", formatRadioGain(tunedGain));
  }
  const gainDisplay = receiver.querySelector("[data-radio-gain-display]");
  if (gainDisplay) gainDisplay.textContent = formatRadioGain(tunedGain);
  const gainStatus = receiver.querySelector("[data-radio-gain-status]");
  if (gainStatus) gainStatus.textContent = presentation.gainStatusLabel;
  const gainClarity = receiver.querySelector("[data-radio-gain-clarity]");
  if (gainClarity) gainClarity.textContent = `CLARITY ${presentation.gainClarity}%`;
  const tunedBy = receiver.querySelector("[data-radio-tuned-by]");
  if (tunedBy) tunedBy.textContent = `Tuned by ${liveRadioTunedBy || data.radio.lastTunedBy || "No operator"}`;
  const meter = receiver.querySelector("[data-radio-strength-fill]");
  if (meter) meter.style.width = `${presentation.strength}%`;
  const strength = receiver.querySelector("[data-radio-strength-label]");
  if (strength) strength.textContent = `${presentation.strengthLabel} / ${presentation.strength}%`;
  const transcript = receiver.querySelector("[data-radio-transcript]");
  if (transcript) transcript.textContent = presentation.snippet;
  const skill = receiver.querySelector("[data-radio-skill]");
  if (skill) skill.textContent = presentation.skillLabel;
  const stabilityFill = receiver.querySelector("[data-radio-stability-fill]");
  if (stabilityFill) stabilityFill.style.width = `${presentation.stabilityProgress}%`;
  const stabilityLabel = receiver.querySelector("[data-radio-stability-label]");
  if (stabilityLabel) stabilityLabel.textContent = presentation.stabilityLabel;

  const actorSelect = receiver.querySelector("[name='radioActorId']");
  const requiresLock = presentation.requiresLock !== false;
  if (actorSelect) actorSelect.disabled = !poweredOn || !requiresLock;
  const actorSearch = receiver.querySelector("[data-radio-actor-search]");
  if (actorSearch) actorSearch.disabled = !poweredOn || !requiresLock;
  if (!poweredOn) {
    const actorResults = receiver.querySelector("[data-radio-actor-results]");
    if (actorResults) actorResults.hidden = true;
  }
  const actorSelected = Boolean(actorSelect?.value);
  receiver.querySelectorAll("[data-perform-radio-lock], [data-request-radio-lock]").forEach(button => {
    button.disabled = !poweredOn || !requiresLock || !presentation.stable || !actorSelected || button.dataset.requestPending === "true";
  });
  const lockRow = receiver.querySelector("[data-radio-lock-row]");
  if (lockRow) lockRow.classList.toggle("is-open-broadcast", !requiresLock);
  const rollLabel = receiver.querySelector("[data-radio-roll-label]");
  if (rollLabel) rollLabel.textContent = requiresLock ? "Required Roll" : "Open Broadcast";
  receiver.classList.toggle("is-powered-off", !poweredOn);
  receiver.classList.toggle("is-signal", Boolean(signal));
  receiver.classList.toggle("is-carrier-acquired", Boolean(signal?.frequencyReady));
  receiver.classList.toggle("is-gain-aligned", Boolean(signal?.gainReady));
  receiver.classList.toggle("is-stabilizing", presentation.lockReady && !presentation.stable);
  receiver.classList.toggle("is-lock-ready", presentation.stable);
  syncRadioAmbient(data, signal, presentation.stable);
}

function radioStabilityAt(signal, frequency, gain, holdSeconds) {
  if (signal?.broadcast?.requiresLock === false) {
    resetRadioStability();
    return {
      ready: Boolean(signal.lockReady),
      progress: signal.lockReady ? 1 : 0,
      elapsedMs: 0,
      requiredMs: 0
    };
  }

  if (!signal?.lockReady) {
    resetRadioStability();
    return { ready: false, progress: 0, elapsedMs: 0 };
  }

  const tunedFrequency = normalizeRadioFrequency(frequency);
  const tunedGain = normalizeRadioGain(gain);
  const broadcastId = signal.broadcast.id;
  if (
    radioStabilityState.broadcastId !== broadcastId
    || radioStabilityState.frequency !== tunedFrequency
    || radioStabilityState.gain !== tunedGain
  ) {
    radioStabilityState = {
      broadcastId,
      frequency: tunedFrequency,
      gain: tunedGain,
      startedAt: Date.now(),
      ready: false
    };
  }

  const requiredMs = clamp(toNumber(holdSeconds, RADIO_DEFAULT_STABILIZATION_SECONDS), 0.5, 10) * 1000;
  const elapsedMs = Math.max(0, Date.now() - radioStabilityState.startedAt);
  const progress = clamp(elapsedMs / requiredMs, 0, 1);
  radioStabilityState.ready = progress >= 1;

  if (radioStabilityState.ready) {
    clearRadioStabilityTimer();
  } else if (!radioStabilityTimer) {
    radioStabilityTimer = setInterval(() => {
      const root = trainApp?.element?.querySelector?.(".dt-root");
      if (!radioTabVisible() || !root) {
        resetRadioStability();
        return;
      }
      updateRadioReceiverDom(root, liveRadioFrequency, liveRadioGain);
    }, 100);
  }

  return { ready: radioStabilityState.ready, progress, elapsedMs, requiredMs };
}

function clearRadioStabilityTimer() {
  if (radioStabilityTimer) clearInterval(radioStabilityTimer);
  radioStabilityTimer = null;
}

function resetRadioStability() {
  clearRadioStabilityTimer();
  radioStabilityState = {
    broadcastId: "",
    frequency: null,
    gain: null,
    startedAt: 0,
    ready: false
  };
}

function radioTabVisible() {
  return Boolean(trainApp?.rendered && uiState.activeTab === "radio" && trainApp.element?.querySelector?.("[data-radio-receiver]"));
}

function syncRadioAmbient(data, signal, stable = false) {
  if (!radioTabVisible() || data.radio.poweredOn === false) {
    stopRadioAudio({ resetStability: data.radio.poweredOn === false || !radioTabVisible() });
    return;
  }

  const volume = clamp(toNumber(data.radio.settings.volume, 0.55), 0, 1);
  const intensity = signal?.intensity || 0;
  const gainClarity = signal?.frequencyReady ? clamp(toNumber(signal.gainClarity, 0), 0, 1) : 0;
  const targets = stable
    ? {
        noise: volume * 0.08,
        approach: volume * 0.22,
        found: volume * Math.max(0.5, intensity)
      }
    : signal?.frequencyReady
      ? {
          noise: volume * (0.34 - gainClarity * 0.16),
          approach: volume * (0.55 - gainClarity * 0.25),
          found: volume * (0.18 + gainClarity * 0.55)
        }
      : {
          noise: volume * Math.max(0.18, 1 - intensity * 0.82),
          approach: volume * intensity,
          found: 0
        };
  const sources = {
    noise: data.radio.settings.noiseSoundUrl,
    approach: data.radio.settings.approachSoundUrl,
    found: radioTier3Source(data, signal)
  };

  for (const [kind, source] of Object.entries(sources)) ensureRadioAmbientTrack(kind, source);
  crossfadeRadioTracks(targets, 450);
}

function radioTier3Source(data, signal) {
  if (signal?.frequencyReady) {
    const override = cleanString(signal.broadcast?.audioUrl);
    if (override) return override;
  }
  return cleanString(data.radio.settings.foundSoundUrl);
}

async function ensureRadioAmbientTrack(kind, source) {
  const url = cleanString(source);
  const current = radioAmbientTracks.get(kind);
  if (!url) {
    if (current) {
      current.disposed = true;
      current.sound?.stop?.().catch?.(() => {});
      radioAmbientTracks.delete(kind);
    }
    return;
  }
  if (current?.url === url) {
    if (current.sound?.loaded && !current.sound.playing) {
      current.sound.play({ loop: true, volume: uiState.radioMuted ? 0 : current.targetVolume || 0 }).catch(() => {});
    }
    return;
  }
  if (current) {
    current.disposed = true;
    current.sound?.stop?.().catch?.(() => {});
  }

  const SoundClass = foundry?.audio?.Sound;
  if (!SoundClass) return;
  const sound = new SoundClass(url, { context: game.audio?.interface });
  const track = { sound, url, targetVolume: 0, disposed: false };
  radioAmbientTracks.set(kind, track);
  try {
    await sound.load();
    if (track.disposed || radioAmbientTracks.get(kind) !== track || !radioTabVisible()) {
      await sound.stop();
      return;
    }
    await sound.play({ loop: true, volume: 0 });
    if (track.targetVolume > 0 && !uiState.radioMuted) await sound.fade(track.targetVolume, { duration: 450, type: "linear" });
  } catch (_error) {
    if (radioAmbientTracks.get(kind) === track) radioAmbientTracks.delete(kind);
  }
}

function crossfadeRadioTracks(targets, duration = 450) {
  for (const [kind, track] of radioAmbientTracks) {
    const target = clamp(toNumber(targets[kind], 0), 0, 1);
    track.targetVolume = target;
    const audibleTarget = uiState.radioMuted ? 0 : target;
    if (track.sound?.playing) track.sound.fade(audibleTarget, { duration, type: "linear" }).catch(() => {});
  }
}

function fadeRadioAudioForMute(muted) {
  for (const track of radioAmbientTracks.values()) {
    const target = muted ? 0 : track.targetVolume;
    if (track.sound?.playing) track.sound.fade(target, { duration: 180, type: "linear" }).catch(() => {});
  }
  for (const [sound, targetVolume] of radioOneShotAudio) {
    if (sound?.playing) sound.fade(muted ? 0 : targetVolume, { duration: 180, type: "linear" }).catch(() => {});
  }
}

function stopRadioAudio({ resetStability: shouldResetStability = true } = {}) {
  if (shouldResetStability) resetRadioStability();
  for (const track of radioAmbientTracks.values()) {
    track.disposed = true;
    track.sound?.stop?.().catch?.(() => {});
  }
  radioAmbientTracks.clear();
  for (const sound of radioOneShotAudio.keys()) {
    sound.stop?.().catch?.(() => {});
  }
  radioOneShotAudio.clear();
}

async function playRadioPreview(source, kind = "noiseSoundUrl") {
  if (uiState.radioMuted) {
    ui.notifications.warn("Receiver audio is muted.");
    return;
  }
  if (getWorldData().radio.poweredOn === false) {
    ui.notifications.warn("Receiver is currently powered off.");
    return;
  }
  if (!cleanString(source)) {
    ui.notifications.warn("Choose an audio file first.");
    return;
  }
  try {
    await playRadioOneShot(cleanString(source), clamp(toNumber(getWorldData().radio.settings.volume, 0.55), 0, 1));
  } catch (_error) {
    ui.notifications.warn(`Could not play ${kind}.`);
  }
}

async function playRadioCue(cue, audioUrl = "") {
  if (!radioTabVisible() || uiState.radioMuted) return;
  const data = getWorldData();
  if (data.radio.poweredOn === false) return;
  const source = cleanString(audioUrl);
  if (!source) return;
  try {
    await playRadioOneShot(source, clamp(toNumber(data.radio.settings.volume, 0.55), 0, 1));
  } catch (_error) {
    // A missing optional cue should not interrupt radio actions.
  }
}

async function playRadioOneShot(source, volume) {
  const SoundClass = foundry?.audio?.Sound;
  if (!SoundClass) throw new Error("Foundry Sound API is unavailable.");
  const sound = new SoundClass(source, { context: game.audio?.interface });
  const targetVolume = clamp(toNumber(volume, 0.55), 0, 1);
  radioOneShotAudio.set(sound, targetVolume);
  try {
    await sound.load();
    await sound.play({
      volume: uiState.radioMuted ? 0 : targetVolume,
      onended: () => radioOneShotAudio.delete(sound)
    });
    return sound;
  } catch (error) {
    radioOneShotAudio.delete(sound);
    throw error;
  }
}

async function performScavenge(data, payload) {
  const category = SCAVENGE_CATEGORIES.find(candidate => candidate.key === payload.categoryKey)
    || SCAVENGE_CATEGORIES.find(candidate => candidate.resourceType === payload.resourceType)
    || SCAVENGE_CATEGORIES[0];
  const actor = game.actors?.get(cleanString(payload.actorId));
  if (!actor) throw new Error("Select an actor for this scavenge roll.");

  const skillName = cleanString(payload.skillName) || category.defaultSkill;
  const rollDie = HUNTING_DIE_OPTIONS.includes(Number(payload.rollDie || payload.fallbackDie)) ? Number(payload.rollDie || payload.fallbackDie) : category.defaultDie;
  const useActorSkill = payload.useActorSkill !== false;
  const baseModifier = Math.trunc(toSignedNumber(payload.modifier, 0));
  const actorTraitDie = useActorSkill ? findActorTraitDie(actor, skillName) : null;
  const unskilled = useActorSkill && !actorTraitDie;
  const traitDie = unskilled ? UNSKILLED_DIE : (actorTraitDie || rollDie);
  const modifier = baseModifier + (unskilled ? UNSKILLED_MODIFIER : 0);
  const roll = await rollSwadeTrait(traitDie, modifier);
  const rawTier = Math.max(1, Math.floor(roll.total));
  const tier = clamp(rawTier, 1, 10);
  const tierOverage = Math.max(0, rawTier - 10);
  const eventRoll = randomInt(1, 50);
  const outcome = await scavengeOutcomeFromTable(data, category, tier, eventRoll, actor, tierOverage);

  const primaryChange = applyResourceDelta(data, outcome.resourceType, outcome.amount);
  outcome.appliedAmount = primaryChange.applied;
  outcome.capacityCapped = primaryChange.capped;
  if (outcome.secondaryResourceType && outcome.secondaryAmount) {
    const secondaryChange = applyResourceDelta(data, outcome.secondaryResourceType, outcome.secondaryAmount);
    outcome.appliedSecondaryAmount = secondaryChange.applied;
    outcome.secondaryCapacityCapped = secondaryChange.capped;
  }

  const entry = {
    id: randomId(),
    created: Date.now(),
    actionType: category.key,
    actionLabel: category.label,
    actorId: actor.id,
    actorName: actor.name || "Unknown Actor",
    actorImg: actor.img || "",
    skillName,
    traitDie,
    baseModifier,
    modifier,
    unskilled,
    resourceType: outcome.resourceType,
    resourceLabel: RESOURCE_LABELS[outcome.resourceType],
    amount: outcome.appliedAmount,
    rolledAmount: outcome.amount,
    capacityCapped: outcome.capacityCapped,
    secondaryResourceType: outcome.secondaryResourceType,
    secondaryResourceLabel: outcome.secondaryResourceType ? RESOURCE_LABELS[outcome.secondaryResourceType] : "",
    secondaryAmount: outcome.appliedSecondaryAmount ?? outcome.secondaryAmount,
    rolledSecondaryAmount: outcome.secondaryAmount,
    secondaryCapacityCapped: outcome.secondaryCapacityCapped,
    roll,
    rawTier,
    tier,
    tierOverage,
    eventRoll,
    rewardFormula: outcome.rewardFormula,
    rewardBaseFormula: outcome.rewardBaseFormula,
    rewardExtraDice: outcome.rewardExtraDice,
    rewardExtraEvery: outcome.rewardExtraEvery,
    rewardExtraSteps: outcome.rewardExtraSteps,
    rewardRoll: outcome.rewardRoll,
    eventTitle: outcome.title,
    eventText: outcome.text
  };

  data.scavengeLog.unshift(entry);
  data.scavengeLog = data.scavengeLog.slice(0, 20);
  data.huntingLog = data.scavengeLog.slice(0, 20);
  await saveWorldData(data, "performScavenge");
  await createHuntingChat(entry, actor);
  return true;
}

function applyResourceDelta(data, key, amount) {
  if (!RESOURCE_KEYS.includes(key)) return { before: 0, after: 0, applied: 0, capped: false };
  const before = Number(data.resources[key] || 0);
  const desired = roundResource(before + Number(amount || 0));
  const result = setResourceValue(data, key, desired);
  return {
    before,
    after: result.after,
    applied: roundResource(result.after - before),
    capped: result.capped
  };
}

function findActorTraitDie(actor, skillName) {
  const needle = cleanString(skillName).toLowerCase();
  if (!needle) return null;

  const skill = Array.from(actor.items || []).find(item => {
    const itemName = cleanString(item.name).toLowerCase();
    return item.type === "skill" && (itemName === needle || itemName.includes(needle));
  });

  const itemDie = extractDieSides(skill?.system?.die) || extractDieSides(skill?.system);
  if (itemDie) return itemDie;

  const attr = actor.system?.attributes?.[needle] || actor.system?.stats?.[needle] || actor.system?.[needle];
  return extractDieSides(attr?.die) || extractDieSides(attr);
}

function extractDieSides(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return HUNTING_DIE_OPTIONS.includes(value) ? value : null;
  if (typeof value === "string") {
    const match = value.match(/d(4|6|8|10|12)/i) || value.match(/^(4|6|8|10|12)$/);
    return match ? Number(match[1]) : null;
  }
  if (typeof value !== "object") return null;

  for (const key of ["sides", "value", "die", "dice"]) {
    const sides = extractDieSides(value[key]);
    if (sides) return sides;
  }
  return null;
}

async function rollSwadeTrait(traitDie, modifier = 0) {
  const trait = await rollAcingDie(traitDie);
  const wild = await rollAcingDie(6);
  const best = trait.total >= wild.total ? "trait" : "wild";
  const total = Math.max(trait.total, wild.total) + modifier;
  const raises = total >= 4 ? Math.floor((total - 4) / 4) : 0;
  return {
    traitDie,
    traitRolls: trait.rolls,
    traitTotal: trait.total,
    traitFormula: trait.formula,
    traitRollData: trait.rollData,
    wildRolls: wild.rolls,
    wildTotal: wild.total,
    wildFormula: wild.formula,
    wildRollData: wild.rollData,
    best,
    modifier,
    total,
    success: total >= 4,
    raises
  };
}

async function rollAcingDie(sides) {
  const formula = `1d${sides}x`;
  const foundryRoll = await evaluateFoundryRoll(formula, `Acing d${sides}`);
  if (foundryRoll) {
    return {
      formula,
      rolls: diceResultsFromRoll(foundryRoll),
      total: Math.round(foundryRoll.total || 0),
      rollData: rollToChatData(foundryRoll)
    };
  }

  const rolls = [];
  let total = 0;
  let guard = 0;
  do {
    const roll = randomInt(1, sides);
    rolls.push(roll);
    total += roll;
    guard += 1;
    if (roll !== sides) break;
  } while (guard < 20);
  return { formula, rolls, total, rollData: null };
}

async function evaluateFoundryRoll(formula, flavor = "") {
  const RollClass = globalThis.Roll || globalThis.foundry?.dice?.Roll;
  if (!RollClass) return null;
  try {
    const roll = await new RollClass(formula).evaluate({ allowInteractive: false });
    if (flavor) roll.options = { ...(roll.options || {}), flavor };
    return roll;
  } catch (error) {
    console.warn(`${MODULE_ID} | Roll failed for formula ${formula}`, error);
    return null;
  }
}

function rollToChatData(roll) {
  if (!roll) return null;
  try {
    return typeof roll.toJSON === "function" ? roll.toJSON() : roll;
  } catch (_error) {
    return null;
  }
}

function diceResultsFromRoll(roll) {
  const results = [];
  for (const term of roll?.terms || []) {
    for (const result of term.results || []) {
      if (result.active === false || result.discarded) continue;
      if (Number.isFinite(Number(result.result))) results.push(Number(result.result));
    }
  }
  return results.length ? results : [Math.round(roll?.total || 0)];
}

function defaultRewardFormula(category, tier) {
  const formulas = SCAVENGE_REWARD_FORMULAS[category.key] || SCAVENGE_REWARD_FORMULAS.food;
  return formulas[clamp(Math.trunc(toNumber(tier, 1)), 1, 10) - 1] || "0";
}

function rewardFormulaForTable(table, category, tier) {
  return normalizeRewardFormula(table?.rewards?.[String(tier)], defaultRewardFormula(category, tier));
}

function normalizeRewardFormula(value, fallback = "0") {
  const cleaned = cleanString(value)
    .replace(/\u00d7/g, "x")
    .replace(/\s+/g, "");
  if (!cleaned) return fallback;

  const atom = "(?:\\d*d\\d+|\\d+)";
  const product = `${atom}(?:[x*]${atom})*`;
  const pattern = new RegExp(`^[+-]?${product}(?:[+-]${product})*$`, "i");
  return pattern.test(cleaned) ? cleaned : fallback;
}

function buildRewardFormulaPlan(table, category, tier, tierOverage = 0, settings = {}) {
  const baseFormula = rewardFormulaForTable(table, category, tier);
  const extraDice = clamp(Math.trunc(toNumber(settings.raiseExtraDice, DEFAULT_RAISE_EXTRA_DICE)), 0, 20);
  const extraEvery = clamp(Math.trunc(toNumber(settings.raiseEvery, DEFAULT_RAISE_EVERY)), 1, 20);
  const overage = Math.max(0, Math.trunc(toNumber(tierOverage, 0)));
  const extraSteps = overage > 0 && extraDice > 0 ? Math.ceil(overage / extraEvery) : 0;
  const effectiveFormula = extraSteps > 0
    ? applyExtraDiceToRewardFormula(baseFormula, extraDice, extraSteps)
    : baseFormula;
  return {
    baseFormula,
    extraDice,
    extraEvery,
    extraSteps,
    effectiveFormula
  };
}

function applyExtraDiceToRewardFormula(baseFormula, extraDice, extraSteps) {
  const base = normalizeRewardFormula(baseFormula, "0");
  const dicePerStep = clamp(Math.trunc(toNumber(extraDice, DEFAULT_RAISE_EXTRA_DICE)), 0, 20);
  const steps = Math.max(0, Math.trunc(toNumber(extraSteps, 0)));
  if (dicePerStep <= 0 || steps <= 0) return base;

  const addCount = dicePerStep * steps;
  const pieces = base.match(/[+-]?[^+-]+/g) || ["0"];
  let applied = false;

  for (let pieceIndex = pieces.length - 1; pieceIndex >= 0 && !applied; pieceIndex--) {
    const piece = pieces[pieceIndex];
    if (piece.startsWith("-")) continue;

    const sign = piece.startsWith("+") ? "+" : "";
    const body = piece.replace(/^[+-]/, "");
    const factors = body.split(/[x*]/i).filter(Boolean);

    for (let factorIndex = factors.length - 1; factorIndex >= 0; factorIndex--) {
      const dice = parseSimpleDiceFormula(factors[factorIndex]);
      if (!dice) continue;
      factors[factorIndex] = `${dice.count + addCount}d${dice.sides}`;
      pieces[pieceIndex] = `${sign}${factors.join("x")}`;
      applied = true;
      break;
    }
  }

  return applied ? pieces.join("") : `${base}+${addCount}d10`;
}

function parseSimpleDiceFormula(value) {
  const match = cleanString(value).match(/^(\d*)d(\d+)$/i);
  if (!match) return null;
  return {
    count: clamp(Math.trunc(toNumber(match[1] || 1, 1)), 1, 100),
    sides: clamp(Math.trunc(toNumber(match[2], 6)), 2, 1000)
  };
}

async function rollRewardFormula(formula) {
  const normalized = normalizeRewardFormula(formula, "0");
  const foundryFormula = rewardFormulaToFoundryFormula(normalized);
  const foundryRoll = await evaluateFoundryRoll(foundryFormula, `Reward ${normalized}`);
  if (foundryRoll) {
    return {
      formula: normalized,
      rollFormula: foundryFormula,
      result: foundryRoll.result || "",
      total: Math.round(foundryRoll.total || 0),
      terms: [],
      rollData: rollToChatData(foundryRoll)
    };
  }

  const pieces = normalized.match(/[+-]?[^+-]+/g) || ["0"];
  const terms = [];
  let total = 0;

  for (const piece of pieces) {
    const sign = piece.startsWith("-") ? -1 : 1;
    const body = piece.replace(/^[+-]/, "");
    const factors = body.split(/[x*]/i).filter(Boolean);
    let termTotal = 1;
    const factorResults = [];

    for (const factor of factors) {
      const dice = factor.match(/^(\d*)d(\d+)$/i);
      if (dice) {
        const count = clamp(Math.trunc(toNumber(dice[1] || 1, 1)), 1, 100);
        const sides = clamp(Math.trunc(toNumber(dice[2], 6)), 2, 1000);
        const rolls = Array.from({ length: count }, () => randomInt(1, sides));
        const factorTotal = rolls.reduce((sum, roll) => sum + roll, 0);
        termTotal *= factorTotal;
        factorResults.push({ type: "dice", formula: `${count}d${sides}`, rolls, total: factorTotal });
      } else {
        const factorTotal = Math.max(0, toNumber(factor, 0));
        termTotal *= factorTotal;
        factorResults.push({ type: "number", formula: factor, total: factorTotal });
      }
    }

    const signedTotal = sign * termTotal;
    total += signedTotal;
    terms.push({ sign, formula: body, factors: factorResults, total: signedTotal });
  }

  return {
    formula: normalized,
    rollFormula: foundryFormula,
    total: Math.round(total),
    terms,
    rollData: null
  };
}

function rewardFormulaToFoundryFormula(formula) {
  const normalized = normalizeRewardFormula(formula, "0");
  const pieces = normalized.match(/[+-]?[^+-]+/g) || ["0"];
  return pieces.map(piece => {
    const sign = piece.startsWith("-") ? "-" : piece.startsWith("+") ? "+" : "";
    const body = piece.replace(/^[+-]/, "");
    return `${sign}${body.split(/[x*]/i).filter(Boolean).join("*")}`;
  }).join("");
}

function rewardRollSummary(rewardRoll) {
  if (rewardRoll?.result) return `${rewardRoll.formula} [${rewardRoll.result}] = ${formatNumber(rewardRoll.total)}`;
  if (!rewardRoll?.terms?.length) return "";
  return rewardRoll.terms.map(term => {
    const sign = term.sign < 0 ? "-" : "";
    const factors = term.factors.map(factor => {
      if (factor.type === "dice") return `${factor.formula} [${factor.rolls.join(", ")}]`;
      return factor.formula;
    }).join(" x ");
    return `${sign}${factors} = ${formatNumber(term.total)}`;
  }).join("; ");
}

async function scavengeOutcomeFromTable(data, category, tier, eventRoll, actor, tierOverage = 0) {
  const biome = getCurrentBiome(data);
  const table = getScavengeEventTable(data, category, biome);
  const events = table.tiers?.[String(tier)] || [];
  const fallback = defaultScavengeEventCategory(category, biome).tiers[String(tier)];
  const event = normalizeScavengeEvent(events[eventRoll - 1] || fallback[eventRoll - 1], category, tier, eventRoll, biome);
  const rewardPlan = buildRewardFormulaPlan(table, category, tier, tierOverage, data.settings);
  const rewardRoll = await rollRewardFormula(rewardPlan.effectiveFormula);
  const actorName = actor.name || "The scout";
  return {
    resourceType: event.resourceType,
    amount: rewardRoll.total,
    title: event.title,
    text: event.text.replaceAll("{actor}", actorName),
    secondaryResourceType: event.secondaryResourceType,
    secondaryAmount: event.secondaryAmount,
    rewardFormula: rewardPlan.effectiveFormula,
    rewardBaseFormula: rewardPlan.baseFormula,
    rewardExtraDice: rewardPlan.extraDice,
    rewardExtraEvery: rewardPlan.extraEvery,
    rewardExtraSteps: rewardPlan.extraSteps,
    rewardRoll
  };
}

function updateScavengeEvents(data, payload) {
  const category = SCAVENGE_CATEGORIES.find(candidate => candidate.key === payload.categoryKey);
  if (!category) throw new Error("Event category not found.");
  const biome = data.settings.biomes.find(candidate => candidate.id === payload.biomeId) || getCurrentBiome(data);

  if (!data.scavengeEvents) data.scavengeEvents = defaultScavengeEvents();
  if (!data.scavengeEvents[category.key]) data.scavengeEvents[category.key] = defaultScavengeEventCollection(category, data.settings.biomes);
  if (!data.scavengeEvents[category.key].biomes) {
    const legacy = data.scavengeEvents[category.key];
    data.scavengeEvents[category.key] = defaultScavengeEventCollection(category, data.settings.biomes, legacy);
  }

  const current = getScavengeEventTable(data, category, biome);
  const next = defaultScavengeEventCategory(category, biome);
  for (let tier = 1; tier <= 10; tier++) {
    const key = String(tier);
    const currentEvents = Array.isArray(current?.tiers?.[key]) ? current.tiers[key] : [];
    next.tiers[key] = Array.from({ length: 50 }, (_item, index) => (
      normalizeScavengeEvent(currentEvents[index] || next.tiers[key][index], category, tier, index + 1, biome)
    ));
    next.rewards[key] = normalizeRewardFormula(current?.rewards?.[key], next.rewards[key] || defaultRewardFormula(category, tier));
  }

  for (const tierPayload of payload.tiers || []) {
    const tier = clamp(Math.trunc(toNumber(tierPayload.tier, 1)), 1, 10);
    const key = String(tier);
    next.rewards[key] = normalizeRewardFormula(tierPayload.rewardFormula, defaultRewardFormula(category, tier));
    next.tiers[key] = parseEventLines(cleanString(tierPayload.lines), category, tier, biome);
  }
  data.scavengeEvents[category.key].biomes[biome.id] = next;
}

function parseEventLines(text, category, tier, biome = normalizeBiome(DEFAULT_BIOMES[0])) {
  const fallback = defaultScavengeEventCategory(category, biome).tiers[String(tier)];
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const events = lines.slice(0, 50).map((line, index) => parseEventLine(line, category, tier, index + 1, biome));
  while (events.length < 50) events.push(fallback[events.length]);
  return events.map((event, index) => normalizeScavengeEvent(event, category, tier, index + 1, biome));
}

function parseEventLine(line, category, tier, eventRoll, biome = normalizeBiome(DEFAULT_BIOMES[0])) {
  const stripped = line.replace(/^\d{1,2}\.\s*/, "");
  const parts = stripped.split("|").map(part => part.trim());
  const resourceMatch = (parts[0] || "").match(/^(gold|talion|food|water|fuel|amenity|amenities)\s+([+-]?\d+(?:\.\d+)?)/i);
  const amountMatch = (parts[0] || "").match(/^([+-]?\d+(?:\.\d+)?)/);
  const fallbackResource = category.resourceType;
  const parsedResource = resourceMatch ? normalizeResourceAlias(resourceMatch[1], fallbackResource) : fallbackResource;
  const resourceType = category.key === "goldAmenities" ? "amenities" : parsedResource;
  const hasInlineAmount = Boolean(resourceMatch || amountMatch);
  const amount = resourceMatch ? toNumber(resourceMatch[2], 0) : toNumber(amountMatch?.[1], 0);
  const titleIndex = hasInlineAmount ? 1 : 0;
  const textIndex = hasInlineAmount ? 2 : 1;
  return {
    resourceType,
    amount,
    title: cleanString(parts[titleIndex]) || `${huntingMood(tier).label}: ${RESOURCE_LABELS[resourceType]}`,
    text: cleanString(parts.slice(textIndex).join(" | ")) || defaultScavengeEvent(category, tier, eventRoll, biome).text,
    secondaryResourceType: "",
    secondaryAmount: 0
  };
}

function normalizeResourceAlias(value, fallback = "food") {
  const key = cleanString(value).toLowerCase();
  if (key === "gold") return "talion";
  if (key === "amenity") return "amenities";
  return HUNTING_RESOURCE_KEYS.includes(key) ? key : fallback;
}

function huntingOutcome(resourceType, tier, eventRoll, action, actor) {
  const amount = huntingAmount(resourceType, tier, eventRoll);
  const mood = huntingMood(tier);
  const place = huntingPlace(eventRoll);
  const detail = huntingDetail(resourceType, eventRoll);
  const twist = huntingTwist(eventRoll);
  const actorName = actor.name || "The scout";
  const label = RESOURCE_LABELS[resourceType];
  const title = `${mood.label}: ${label} ${amount >= 0 ? "+" : ""}${formatNumber(amount)}`;
  const text = `${actorName} ${mood.verb} while attempting ${action.label.toLowerCase()} in the ${place}. ${detail} ${twist} ${mood.note}`;
  const secondary = huntingSecondary(resourceType, tier, eventRoll);

  return {
    resourceType,
    amount,
    title,
    text,
    secondaryResourceType: secondary?.resourceType || "",
    secondaryAmount: secondary?.amount || 0
  };
}

function huntingAmount(resourceType, tier, eventRoll) {
  const baseByTier = [-24, -14, 0, 8, 14, 22, 34, 48, 66, 88];
  const scale = { talion: 1.1, food: 1.2, water: 1.15, fuel: 0.85, amenities: 0.65 }[resourceType] || 1;
  const wobble = ((eventRoll - 1) % 5) - 2;
  return Math.round((baseByTier[tier - 1] + wobble) * scale);
}

function huntingMood(tier) {
  if (tier <= 1) return { label: "Hard Complication", verb: "comes back hurt by the search", note: "Something useful was lost or spoiled." };
  if (tier <= 2) return { label: "Complication", verb: "finds trouble before supplies", note: "The result costs more than it gives." };
  if (tier <= 3) return { label: "Empty Lead", verb: "finds an empty lead", note: "No useful supplies are recovered." };
  if (tier <= 5) return { label: "Useful Find", verb: "turns up a modest find", note: "It is practical, if unimpressive." };
  if (tier <= 7) return { label: "Good Find", verb: "works the terrain well", note: "The train gains dependable supplies." };
  if (tier <= 9) return { label: "Strong Find", verb: "discovers a valuable opportunity", note: "The result is better than expected." };
  return { label: "Raise Cache", verb: "pulls off a remarkable haul", note: "The train crew will talk about this one." };
}

function huntingPlace(eventRoll) {
  const places = [
    "railside scrub", "abandoned siding", "signal hut", "dry culvert", "wrecked service cart",
    "old maintenance trench", "wind-buried camp", "collapsed depot", "frosted embankment", "smoke-stained ravine"
  ];
  return places[(eventRoll - 1) % places.length];
}

function biomePlace(biome, eventRoll) {
  const biomeId = cleanString(biome?.id) || "plains";
  const fallbackName = cleanString(biome?.name).toLowerCase() || "Dominion";
  const places = {
    plains: [
      "open rail prairie", "burned farm siding", "grass-cut service road", "low militia checkpoint", "grain station yard",
      "wide signal embankment", "abandoned ranch halt", "muddy convoy track", "field hospital spur", "old cavalry depot"
    ],
    desert: [
      "salt-flat railbed", "sand-choked station", "dry cistern yard", "sunken aqueduct marker", "heat-warped depot",
      "wind-buried checkpoint", "cracked fuel siding", "dune road underpass", "abandoned caravan halt", "glass-sand switchyard"
    ],
    snow: [
      "iced switchyard", "frozen customs hut", "snow-buried signal post", "whiteout service trench", "sealed heater shed",
      "drifted garrison stop", "frost-cracked bridge", "abandoned winter depot", "ice-cased pump house", "silent pine cutting"
    ],
    tundra: [
      "mossy signal mound", "peat-black service path", "bogged rail cutting", "old survey cairn", "cold marsh depot",
      "lichen-covered bunker", "wind-scoured relay post", "half-sunk supply cart", "remote hunter shelter", "permafrost culvert"
    ],
    industrial: [
      "slag canal", "smoke-stained factory spur", "ash-covered refinery yard", "dead machine hall", "rusted worker platform",
      "chemical runoff ditch", "collapsed boiler house", "blackened warehouse line", "pipe-choked maintenance tunnel", "abandoned party depot"
    ]
  };
  const list = places[biomeId] || [`${fallbackName} rail stop`, `${fallbackName} service yard`, `${fallbackName} convoy road`];
  return list[(eventRoll - 1) % list.length];
}

function biomeFactionBeat(biome, eventRoll, tier) {
  const biomeId = cleanString(biome?.id) || "plains";
  const localBeats = {
    plains: [
      "A grain-cooperative watchman claims the siding by custom rather than law.",
      "Farm families nearby pretend not to notice the train crew until a child points at the haul.",
      "A horse militia captain offers a stamped receipt nobody outside the valley respects.",
      "Old ranch hands say the depot belonged to their families before the Empire paved the road.",
      "A field medic from a dissolved Imperial company asks for a share for wounded veterans.",
      "A local rail boss wants the crew gone before rival villages hear about the find."
    ],
    desert: [
      "A well-keeper clan marks the cache with salt knots and demands water etiquette before trade.",
      "Caravan scouts circle at a distance, counting rifles and barrels before they speak.",
      "A sunburned toll gang claims every road between the dunes belongs to their grandfathers.",
      "Independent desert troopers offer directions in exchange for first pick of the salvage.",
      "A shrine guard warns that taking sealed supplies without a gift will sour every well ahead.",
      "Nomad mechanics can help move the load, but only if their engines are fueled first."
    ],
    snow: [
      "A winter lodge keeps silent watch from the trees, judging whether the crew wastes heat.",
      "A frost patrol from a broken Imperial border unit asks for medical supplies before papers.",
      "Local hunters read every footprint around the cache and know exactly who arrived first.",
      "A village furnace-master will trade labor for coal, blankets, or a promise of transport.",
      "Snowbound rail families claim the old station by survival rights rather than decree.",
      "A sled column of displaced soldiers wants a quiet bargain before the storm returns."
    ],
    tundra: [
      "A peat-cutting clan has marked the ground with bone stakes and expects strangers to ask.",
      "Bog scouts from an old survey regiment still enforce maps no capital office remembers.",
      "A tundra guide offers a safe path back if the crew respects local burial stones.",
      "Independent riflemen watch from low ridges, more hungry than political.",
      "A marsh radio post calls itself Imperial, though its uniforms have no matching badges.",
      "Local herders can move the find over soft ground if the crew pays in useful goods."
    ],
    industrial: [
      "A scrap-union foreman says the wreck is under local salvage rules, not capital decree.",
      "Factory wardens demand a cut for keeping the line lamps burning after the collapse.",
      "A soot-black worker militia offers muscle, then quietly asks who the train serves.",
      "Independent engine crews know which tanks are safe and which ones will poison the boiler.",
      "An old Imperial maintenance squad still keeps rosters in a flooded office.",
      "Local children have already stripped the easy parts and sell back what they hid."
    ]
  };
  const imperialRemnants = [
    "A former Imperial quartermaster recognizes the seal and offers to make the paperwork disappear.",
    "A detached Imperial platoon holds the road with obsolete orders and very real rifles.",
    "Veterans from three broken commands argue over who abandoned the cache first.",
    "An old army paymaster treats the find as unpaid wages for soldiers the capital forgot.",
    "A rail-security corporal still wears Imperial brass, but answers only to her own squad.",
    "A wounded standard-bearer asks the crew not to fly any faction colors near the site."
  ];
  const factionBeats = [
    "A faint CSD naval-cipher tag marks one crate, old enough that most locals treat it as bad luck rather than law.",
    "A Directorate audit seal appears on the manifest, making older clerks nervous and younger ones curious.",
    "A Caesarist field stamp is already on part of the salvage, and a Party runner insists it should be respected.",
    "A pre-war Imperial claim number predates the Emperor's death, so every serious claimant can argue over it."
  ];
  const pressures = {
    plains: "Open roads make any dispute visible long before the crew reaches the train.",
    desert: "Heat and distance make formal authority feel like a rumor.",
    snow: "Whiteout silence turns every negotiation into a risk.",
    tundra: "Old survey lines and local memory matter more than distant law.",
    industrial: "Factory gangs, wardens, and hungry crews all know the value of the same prize."
  };
  const localList = localBeats[biomeId] || localBeats.plains;
  const rollSlot = (eventRoll - 1) % 10;
  const beat = rollSlot === 9
    ? factionBeats[Math.floor((eventRoll - 1) / 10) % factionBeats.length]
    : rollSlot === 4
      ? imperialRemnants[Math.floor((eventRoll - 1) / 10) % imperialRemnants.length]
      : localList[(eventRoll + tier - 2) % localList.length];
  const pressure = pressures[biomeId] || "Dominion law feels thin this far from the capital.";
  const consequence = tier <= 2
    ? "They want payment, silence, or a favor before letting the crew leave."
    : tier >= 8
      ? "Handled well, this can become a contact instead of a fight."
      : "Most people here care more about survival than the capital's argument.";
  return `${beat} ${pressure} ${consequence}`;
}

function huntingDetail(resourceType, eventRoll) {
  const details = {
    talion: [
      "Loose pay chits and stamped coins are pulled from a forgotten strongbox.",
      "A broker buys scrap papers, seals, and salvage rights for quick Talion.",
      "Old Dominion payroll tags are traded at a nervous station desk.",
      "A hidden purse is recovered from the lining of a ruined kit bag.",
      "The crew turns minor salvage into spendable coin.",
      "A courier tube still carries redeemable ration scrip and officer tokens.",
      "A local cashier pays hush money for names left off a requisition sheet.",
      "Imperial tax stamps are peeled from crates and sold as proof of origin.",
      "A depot lockbox opens to reveal wages nobody came back to claim.",
      "Scrap rights are sold before a patrol can declare the site seized."
    ],
    food: [
      "A crate of ration tins is pried from a locked box.",
      "Preserved grain sacks are recovered before damp can ruin them.",
      "A field kitchen cache still has edible Dominion biscuits.",
      "Small game trails lead to a workable food source.",
      "A forgotten pantry hides more than dust.",
      "A militia cook cart still holds sealed meal bricks.",
      "A family cellar has dried vegetables wrapped against inspection raids.",
      "A quartermaster ledger points to misfiled ration crates.",
      "A cold ash pit hides foil-wrapped officer meals.",
      "A local guide trades preserved meat for a clean exit."
    ],
    water: [
      "A clean cistern is found under cracked stone.",
      "Condensation traps fill enough barrels to matter.",
      "A buried pipe still carries drinkable water.",
      "Snowmelt or runoff is filtered through canvas and charcoal.",
      "Sealed emergency canteens are gathered from old lockers.",
      "A pump house key is found inside a dead radio cabinet.",
      "A map of wartime wells proves accurate enough to use.",
      "A chapel basin has been kept clean by locals who ask no questions.",
      "A rail tanker still holds potable reserve behind a broken gauge.",
      "A cistern tally reveals which barrels were never collected."
    ],
    fuel: [
      "A rusted pump yields a few usable drums.",
      "Industrial sludge is refined enough for the engine.",
      "A wrecked tender still holds burnable fuel.",
      "Spare oil and pressure fluid are salvaged.",
      "A depot tank is tapped before patrols notice.",
      "An old boiler feed line still carries thick engine oil.",
      "A convoy wreck gives up sealed cans of military fuel.",
      "A refinery clerk sells off-spec fuel under the table.",
      "A maintenance ledger reveals where reserve drums were hidden.",
      "A pressure cart can be drained if the crew works fast."
    ],
    amenities: [
      "A luxury box survived with coffee, tobacco, and sweets.",
      "Useful comforts are traded out of a hidden stash.",
      "A passenger cache contains morale-saving little luxuries.",
      "Old officer stores still have sealed treats.",
      "The crew finds salvage that makes life aboard less grim.",
      "A station lounge cabinet holds cards, tea, and clean soap.",
      "A clerk trades cigarettes for silence about a missing manifest.",
      "A locked hamper has blankets, ink, and a bottle of decent spirits.",
      "A Party courtesy crate contains comforts meant for loyal cadres.",
      "A forgotten sleeper compartment has usable linens and small luxuries."
    ]
  };
  const list = details[resourceType] || details.food;
  return list[(eventRoll - 1) % list.length];
}

function huntingTwist(eventRoll) {
  const twists = [
    "The find is rushed before weather closes in.",
    "A nervous witness demands a quick favor in return.",
    "The crew must haul it back under poor visibility.",
    "The cache is marked with a half-erased Dominion warning.",
    "A rival scavenger trail is found nearby."
  ];
  return twists[Math.floor((eventRoll - 1) / 10) % twists.length];
}

function huntingSecondary(resourceType, tier, eventRoll) {
  if (tier < 8 || eventRoll % 10 !== 0) return null;
  const options = HUNTING_RESOURCE_KEYS.filter(key => key !== resourceType);
  const resource = options[(eventRoll / 10 - 1) % options.length];
  return {
    resourceType: resource,
    amount: Math.max(1, Math.round(huntingAmount(resource, Math.max(4, tier - 2), eventRoll) / 2))
  };
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
  return Boolean(data.route.moving);
}

function calculateFuelCost(data) {
  const activeWagonCount = data.wagons.filter(wagon => wagon.active).length;
  const cost = data.settings.baseFuelPerTurn * (1 + data.settings.fuelMultiplierPerWagon * activeWagonCount) * getCurrentBiome(data).fuelMultiplier;
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

async function createHuntingChat(entry, actor) {
  const messageData = {
    speaker: actor ? speakerForActor(actor) : ChatMessage.getSpeaker({ alias: entry.actorName || "Dominion Train" }),
    content: renderHuntingChat(entry),
    flavor: `${entry.actorName} / ${entry.skillName} / ${entry.actionLabel} Scavenge`,
    rolls: chatRollsForScavenge(entry),
    flags: {
      [MODULE_ID]: {
        scavengeRoll: true,
        actorId: entry.actorId,
        tier: entry.tier,
        eventRoll: entry.eventRoll,
        rewardFormula: entry.rewardFormula
      }
    }
  };

  const rollStyle = globalThis.CONST?.CHAT_MESSAGE_STYLES?.ROLL ?? globalThis.CONST?.CHAT_MESSAGE_TYPES?.ROLL;
  if (rollStyle !== undefined) messageData.style = rollStyle;

  const rollMode = game.settings.get("core", "rollMode") || "roll";
  const finalMessageData = ChatMessage.applyRollMode
    ? ChatMessage.applyRollMode(messageData, rollMode)
    : messageData;

  await ChatMessage.create(finalMessageData);
}

async function createRadioChat(entry, actor) {
  const messageData = {
    speaker: actor ? speakerForActor(actor) : ChatMessage.getSpeaker({ alias: entry.actorName || "Dominion Radio" }),
    content: renderRadioChat(entry),
    flavor: `${entry.actorName} / ${entry.skillName} / Radio Lock`,
    rolls: [entry.roll?.traitRollData, entry.roll?.wildRollData].filter(Boolean),
    flags: {
      [MODULE_ID]: {
        radioRoll: true,
        actorId: entry.actorId,
        broadcastId: entry.broadcastId,
        outcome: entry.outcome
      }
    }
  };
  const rollStyle = globalThis.CONST?.CHAT_MESSAGE_STYLES?.ROLL ?? globalThis.CONST?.CHAT_MESSAGE_TYPES?.ROLL;
  if (rollStyle !== undefined) messageData.style = rollStyle;
  const rollMode = game.settings.get("core", "rollMode") || "roll";
  const finalMessageData = ChatMessage.applyRollMode ? ChatMessage.applyRollMode(messageData, rollMode) : messageData;
  await ChatMessage.create(finalMessageData);
}

async function createRadioResponseChat(entry, response) {
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ alias: "Dominion Radio" }),
    content: `
      <div class="dt-chat-card">
        <h3>Radio Transmission</h3>
        <p><strong>${escapeHtml(entry.responseUserName || "Operator")}</strong> transmits on ${formatRadioFrequency(entry.frequency)} MHz:</p>
        <p>${escapeHtml(response.label)}</p>
        ${response.outcome ? `<h4>Response</h4><p>${escapeHtml(response.outcome)}</p>` : ""}
      </div>
    `
  });
}

function renderRadioChat(entry) {
  const unskilled = entry.unskilled
    ? `<li>Unskilled Attempt: d${UNSKILLED_DIE} ${formatSigned(UNSKILLED_MODIFIER)}</li>`
    : "";
  const modifier = Number(entry.modifier || 0) !== 0 ? `<li>Modifier: ${formatSigned(entry.modifier)}</li>` : "";
  const raise = entry.raiseText ? `<h4>Raise Intelligence</h4><p>${escapeHtml(entry.raiseText)}</p>` : "";
  return `
    <div class="dt-chat-card">
      <h3>Radio Signal Lock</h3>
      <p><strong>${escapeHtml(entry.actorName)}</strong> works the receiver at ${formatRadioFrequency(entry.frequency)} MHz.</p>
      <ul>
        ${unskilled}
        <li>Skill: ${escapeHtml(entry.skillName)} d${entry.traitDie}</li>
        <li>Trait: ${escapeHtml(entry.roll.traitRolls.join(" + "))} = ${formatNumber(entry.roll.traitTotal)}</li>
        <li>Wild: ${escapeHtml(entry.roll.wildRolls.join(" + "))} = ${formatNumber(entry.roll.wildTotal)}</li>
        ${modifier}
        <li>Total: ${formatNumber(entry.roll.total)}</li>
        <li>Result: ${escapeHtml(entry.outcomeLabel)}</li>
      </ul>
      <h4>${escapeHtml(entry.broadcastTitle)}</h4>
      <p>${escapeHtml(entry.message)}</p>
      ${raise}
    </div>
  `;
}

function speakerForActor(actor) {
  const token = actor?.getActiveTokens?.()[0];
  if (token) return ChatMessage.getSpeaker({ token });
  return {
    scene: null,
    token: null,
    actor: actor?.id || null,
    alias: actor?.name || "Unknown Actor"
  };
}

function chatRollsForScavenge(entry) {
  return [
    entry.roll?.traitRollData,
    entry.roll?.wildRollData,
    entry.rewardRoll?.rollData
  ].filter(Boolean);
}

function renderHuntingChat(entry) {
  const secondary = entry.secondaryResourceType
    ? `<li>Secondary: ${formatSigned(entry.secondaryAmount)} ${escapeHtml(entry.secondaryResourceLabel)}</li>`
    : "";
  const roll = entry.roll;
  const rewardSummary = rewardRollSummary(entry.rewardRoll);
  const overage = Math.max(0, Math.trunc(toNumber(entry.tierOverage, 0)));
  const tierDisplay = overage ? `${entry.tier} +${overage}` : `${entry.tier}`;
  const unskilled = entry.unskilled
    ? `<li>Unskilled Attempt: d${UNSKILLED_DIE} ${formatSigned(UNSKILLED_MODIFIER)}</li>`
    : "";
  const modifier = Number(entry.modifier || 0) !== 0 ? `<li>Modifier: ${formatSigned(entry.modifier)}</li>` : "";
  const reward = entry.rewardFormula
    ? `<li>Reward Roll: ${escapeHtml(entry.rewardFormula)} = ${formatSigned(entry.amount)} ${escapeHtml(entry.resourceLabel)}</li>`
    : `<li>Resource: ${formatSigned(entry.amount)} ${escapeHtml(entry.resourceLabel)}</li>`;
  const rewardDetails = rewardSummary ? `<li>Reward Dice: ${escapeHtml(rewardSummary)}</li>` : "";
  const capNote = entry.capacityCapped
    ? `<li>Capacity: ${formatSigned(entry.amount)} stored from ${formatSigned(entry.rolledAmount)} rolled.</li>`
    : "";
  return `
    <div class="dt-chat-card">
      <h3>${escapeHtml(entry.actionLabel)} Scavenge Result</h3>
      <p><strong>${escapeHtml(entry.actorName)}</strong> rolled ${escapeHtml(entry.skillName)} d${entry.traitDie} with Wild Die.</p>
      <ul>
        ${unskilled}
        <li>Trait: ${escapeHtml(roll.traitRolls.join(" + "))} = ${formatNumber(roll.traitTotal)}</li>
        <li>Wild: ${escapeHtml(roll.wildRolls.join(" + "))} = ${formatNumber(roll.wildTotal)}</li>
        ${modifier}
        <li>Total: ${formatNumber(roll.total)} / Tier ${tierDisplay} / d50 ${entry.eventRoll}</li>
        ${reward}
        ${rewardDetails}
        ${capNote}
        ${secondary}
      </ul>
      <h4>${escapeHtml(scavengeResultTitle(entry))}</h4>
      <p>${escapeHtml(entry.eventText)}</p>
    </div>
  `;
}

function scavengeResultTitle(entry) {
  const title = cleanScavengeEventTitle(entry.eventTitle, entry.resourceType) || entry.eventTitle;
  return `${title} ${formatSigned(entry.amount)}`;
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
    type: "Population Wagon",
    role: "population",
    active: true,
    capacity: 6,
    notes: "Dieselpunk workhorse engine.",
    gmNotes: ""
  };
  const passenger = {
    id: randomId(),
    name: "Civilian Passenger Wagon",
    type: "Population Wagon",
    role: "population",
    active: true,
    capacity: 48,
    notes: "Bench seating, luggage racks, too many rumors.",
    gmNotes: ""
  };
  const cargo = {
    id: randomId(),
    name: "Cargo Wagon",
    type: "Storage Wagon",
    role: "storage",
    active: true,
    capacity: 1000,
    notes: "Crates, tarps, chains, and spare rail tools.",
    gmNotes: ""
  };
  const fuel = {
    id: randomId(),
    name: "Fuel Tender",
    type: "Fuel Wagon",
    role: "fuel",
    active: true,
    capacity: 500,
    notes: "Armored tanks and pressure valves.",
    gmNotes: ""
  };

  return {
    currentTurn: 1,
    eventSchemaVersion: CURRENT_EVENT_SCHEMA_VERSION,
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
      biomeId: "plains",
      moving: true,
      notes: ""
    },
    wagons: [locomotive, passenger, cargo, fuel],
    groups: [
      {
        id: randomId(),
        name: "Civilians",
        count: 40,
        portraitUrl: "",
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
        portraitUrl: "",
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
        portraitUrl: "",
        assignedWagon: "",
        foodPerTurn: 1,
        waterPerTurn: 1,
        amenitiesPerTurn: 0,
        notes: "",
        gmNotes: ""
      }
    ],
    markets: [defaultStartingMarket()],
    huntingLog: [],
    scavengeLog: [],
    scavengeEvents: defaultScavengeEvents(),
    radio: defaultRadioData(),
    settings: defaultSettings()
  };
}

function defaultSettings() {
  return {
    baseFuelPerTurn: 10,
    fuelMultiplierPerWagon: 0.1,
    raiseExtraDice: DEFAULT_RAISE_EXTRA_DICE,
    raiseEvery: DEFAULT_RAISE_EVERY,
    allowNegativeResources: false,
    consumeFuelWhileStopped: false,
    defaultFoodPerPerson: 1,
    defaultWaterPerPerson: 1,
    defaultAmenitiesPerPerson: 0,
    biomes: DEFAULT_BIOMES.map(biome => ({ ...biome })),
    playersCanOpenPanel: true,
    showTalionToPlayers: false,
    playersSeeExactResources: false,
    playersSeeWagonList: true,
    playersSeePassengerGroups: false,
    playersSeeRouteProgress: true,
    chatOutputMode: "gm"
  };
}

function defaultRadioData() {
  return {
    frequency: RADIO_DEFAULT_FREQUENCY,
    gain: RADIO_DEFAULT_GAIN,
    lastTunedBy: "",
    poweredOn: true,
    permissions: {},
    requests: [],
    attempts: [],
    log: [],
    broadcasts: [defaultRadioBroadcast(0)],
    settings: {
      lockAttemptsPerTurn: 2,
      stabilizationSeconds: RADIO_DEFAULT_STABILIZATION_SECONDS,
      volume: 0.55,
      ...RADIO_DEFAULT_AUDIO,
      audioDefaultsApplied: true
    }
  };
}

function defaultRadioBroadcast(index = 0) {
  return {
    id: randomId(),
    title: index === 0 ? "Example Fort Veyr Distress Signal" : `New Broadcast ${index + 1}`,
    enabled: false,
    frequency: normalizeRadioFrequency(96.4 + index * 1.7),
    signalRange: 1.8,
    lockTolerance: 0.2,
    targetGain: RADIO_DEFAULT_GAIN,
    gainTolerance: RADIO_DEFAULT_GAIN_TOLERANCE,
    source: "Local / Unknown",
    startTurn: 1,
    endTurn: 0,
    requiresLock: true,
    skillName: "Electronics",
    modifier: 0,
    partialText: "Fort Veyr ... western line ... do not approach",
    fullText: "Fort Veyr calling all railway traffic. The western bridge has collapsed. Do not approach by the western line.",
    raiseText: "The background code identifies an old Imperial engineering unit operating the transmitter.",
    audioUrl: "",
    responses: [
      { label: "Request a safe route", outcome: "A weak reply marks a northern maintenance line on the train route." },
      { label: "Offer assistance", outcome: "The station asks the train to bring tools and medical supplies." },
      { label: "Remain silent", outcome: "The receiver returns to static without exposing the train." }
    ],
    oneShot: false
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
    type: "Population Wagon",
    role: "population",
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
    portraitUrl: "",
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

function defaultScavengeEvents(biomes = DEFAULT_BIOMES.map(normalizeBiome)) {
  return Object.fromEntries(SCAVENGE_CATEGORIES.map(category => [category.key, defaultScavengeEventCollection(category, biomes)]));
}

function defaultScavengeEventCollection(category, biomes = DEFAULT_BIOMES.map(normalizeBiome), legacy = null) {
  const biomeEntries = {};
  for (const biome of biomes) {
    biomeEntries[biome.id] = legacy?.tiers
      ? {
        key: category.key,
        label: category.label,
        biomeId: biome.id,
        biomeName: biome.name,
        tiers: legacy.tiers,
        rewards: defaultScavengeRewards(category)
      }
      : defaultScavengeEventCategory(category, biome);
  }
  return {
    key: category.key,
    label: category.label,
    biomes: biomeEntries
  };
}

function defaultScavengeEventCategory(category, biome = normalizeBiome(DEFAULT_BIOMES[0])) {
  const tiers = {};
  const rewards = {};
  for (let tier = 1; tier <= 10; tier++) {
    const key = String(tier);
    tiers[key] = Array.from({ length: 50 }, (_item, index) => defaultScavengeEvent(category, tier, index + 1, biome));
    rewards[key] = defaultRewardFormula(category, tier);
  }
  return {
    key: category.key,
    label: category.label,
    biomeId: biome.id,
    biomeName: biome.name,
    rewards,
    tiers
  };
}

function defaultScavengeRewards(category) {
  return Object.fromEntries(Array.from({ length: 10 }, (_item, index) => {
    const tier = index + 1;
    return [String(tier), defaultRewardFormula(category, tier)];
  }));
}

function defaultScavengeEvent(category, tier, eventRoll, biome = normalizeBiome(DEFAULT_BIOMES[0])) {
  const resourceType = category.resourceType;
  const mood = huntingMood(tier);
  const place = biomePlace(biome, eventRoll);
  const detail = huntingDetail(resourceType, eventRoll);
  const twist = huntingTwist(eventRoll);
  const faction = biomeFactionBeat(biome, eventRoll, tier);
  return {
    resourceType,
    amount: 0,
    title: `${mood.label}: ${RESOURCE_LABELS[resourceType]}`,
    text: `{actor} ${mood.verb} in the ${place}. ${detail} ${faction} ${twist} ${mood.note}`,
    secondaryResourceType: "",
    secondaryAmount: 0
  };
}

function normalizeData(raw) {
  const fallback = defaultWorldData();
  const source = clone(raw || {});
  const settings = { ...fallback.settings, ...(source.settings || {}) };
  settings.biomes = normalizeBiomes(source.settings?.biomes || fallback.settings.biomes);
  settings.chatOutputMode = CHAT_MODE_OPTIONS.some(option => option.value === settings.chatOutputMode) ? settings.chatOutputMode : fallback.settings.chatOutputMode;
  settings.raiseExtraDice = clamp(Math.trunc(toNumber(settings.raiseExtraDice, DEFAULT_RAISE_EXTRA_DICE)), 0, 20);
  settings.raiseEvery = clamp(Math.trunc(toNumber(settings.raiseEvery, DEFAULT_RAISE_EVERY)), 1, 20);

  const resources = {};
  for (const key of RESOURCE_KEYS) {
    const value = toNumber(source.resources?.[key], fallback.resources[key]);
    resources[key] = settings.allowNegativeResources ? value : Math.max(0, value);
  }

  const normalizedLog = Array.isArray(source.scavengeLog)
    ? source.scavengeLog.map(normalizeHuntingEntry).filter(Boolean).slice(0, 20)
    : (Array.isArray(source.huntingLog) ? source.huntingLog.map(normalizeHuntingEntry).filter(Boolean).slice(0, 20) : []);

  const data = {
    currentTurn: Math.max(1, Math.trunc(toNumber(source.currentTurn, fallback.currentTurn))),
    eventSchemaVersion: CURRENT_EVENT_SCHEMA_VERSION,
    resources,
    route: {
      currentRouteName: cleanString(source.route?.currentRouteName) || fallback.route.currentRouteName,
      destinationName: cleanString(source.route?.destinationName) || fallback.route.destinationName,
      remainingTurns: Math.max(0, toNumber(source.route?.remainingTurns, fallback.route.remainingTurns)),
      biomeId: settings.biomes.some(biome => biome.id === source.route?.biomeId) ? source.route.biomeId : fallback.route.biomeId,
      moving: source.route?.moving === undefined ? fallback.route.moving : Boolean(source.route.moving),
      notes: cleanString(source.route?.notes)
    },
    wagons: Array.isArray(source.wagons) ? source.wagons.map(normalizeWagon) : fallback.wagons,
    groups: Array.isArray(source.groups) ? source.groups.map(item => normalizeGroup(item, settings)) : fallback.groups,
    markets: Array.isArray(source.markets) ? source.markets.map(normalizeMarket) : fallback.markets,
    huntingLog: normalizedLog.slice(0, 20),
    scavengeLog: normalizedLog.slice(0, 20),
    scavengeEvents: normalizeScavengeEvents(source.scavengeEvents, settings.biomes, source.eventSchemaVersion),
    radio: normalizeRadioData(source.radio, fallback.radio),
    settings
  };

  if (!data.wagons.length) data.wagons.push(defaultWagon(data));
  if (!data.markets.length) data.markets.push(defaultStartingMarket());
  if (!data.settings.biomes.some(biome => biome.id === data.route.biomeId)) data.route.biomeId = data.settings.biomes[0]?.id || "plains";
  data.groups.forEach(group => {
    if (!data.wagons.some(wagon => wagon.id === group.assignedWagon)) group.assignedWagon = "";
  });
  return data;
}

function normalizeRadioData(raw, fallback = defaultRadioData()) {
  const source = raw && typeof raw === "object" ? raw : fallback;
  const fallbackSettings = fallback.settings || defaultRadioData().settings;
  const audioDefaultsApplied = Boolean(source.settings?.audioDefaultsApplied);
  const settings = {
    lockAttemptsPerTurn: clamp(Math.trunc(toNumber(source.settings?.lockAttemptsPerTurn, fallbackSettings.lockAttemptsPerTurn)), 0, 20),
    stabilizationSeconds: clamp(toNumber(source.settings?.stabilizationSeconds, fallbackSettings.stabilizationSeconds), 0.5, 10),
    volume: clamp(toNumber(source.settings?.volume, fallbackSettings.volume), 0, 1),
    noiseSoundUrl: audioDefaultsApplied ? cleanString(source.settings?.noiseSoundUrl) : cleanString(source.settings?.noiseSoundUrl) || RADIO_DEFAULT_AUDIO.noiseSoundUrl,
    approachSoundUrl: audioDefaultsApplied ? cleanString(source.settings?.approachSoundUrl) : cleanString(source.settings?.approachSoundUrl) || RADIO_DEFAULT_AUDIO.approachSoundUrl,
    foundSoundUrl: audioDefaultsApplied ? cleanString(source.settings?.foundSoundUrl) : cleanString(source.settings?.foundSoundUrl) || RADIO_DEFAULT_AUDIO.foundSoundUrl,
    audioDefaultsApplied: true
  };
  const permissions = {};
  for (const [userId, allowed] of Object.entries(source.permissions || {})) {
    if (cleanString(userId)) permissions[cleanString(userId)] = Boolean(allowed);
  }
  return {
    frequency: normalizeRadioFrequency(source.frequency),
    gain: normalizeRadioGain(source.gain),
    lastTunedBy: cleanString(source.lastTunedBy),
    poweredOn: source.poweredOn === undefined ? true : Boolean(source.poweredOn),
    permissions,
    requests: (Array.isArray(source.requests) ? source.requests : []).map(normalizeRadioRequest).filter(Boolean).slice(0, RADIO_REQUEST_LIMIT),
    attempts: (Array.isArray(source.attempts) ? source.attempts : []).map(normalizeRadioAttempt).filter(Boolean).slice(-100),
    log: (Array.isArray(source.log) ? source.log : []).map(normalizeRadioLogEntry).filter(Boolean).slice(0, RADIO_LOG_LIMIT),
    broadcasts: (Array.isArray(source.broadcasts) ? source.broadcasts : fallback.broadcasts).map(normalizeRadioBroadcast),
    settings
  };
}

function normalizeRadioBroadcast(item) {
  const fallback = defaultRadioBroadcast(1);
  return {
    id: cleanString(item?.id) || randomId(),
    title: cleanString(item?.title) || fallback.title,
    enabled: Boolean(item?.enabled),
    frequency: normalizeRadioFrequency(item?.frequency),
    signalRange: clamp(toNumber(item?.signalRange, fallback.signalRange), RADIO_FREQUENCY_STEP, 10),
    lockTolerance: clamp(toNumber(item?.lockTolerance, fallback.lockTolerance), RADIO_FREQUENCY_STEP, 2),
    targetGain: normalizeRadioGain(item?.targetGain),
    gainTolerance: normalizeRadioGainTolerance(item?.gainTolerance),
    source: cleanString(item?.source) || "Unknown",
    startTurn: Math.max(1, Math.trunc(toNumber(item?.startTurn, 1))),
    endTurn: Math.max(0, Math.trunc(toNumber(item?.endTurn, 0))),
    requiresLock: item?.requiresLock === undefined ? true : Boolean(item.requiresLock),
    skillName: cleanString(item?.skillName) || "Electronics",
    modifier: Math.trunc(toSignedNumber(item?.modifier, 0)),
    partialText: cleanString(item?.partialText),
    fullText: cleanString(item?.fullText) || fallback.fullText,
    raiseText: cleanString(item?.raiseText),
    audioUrl: cleanString(item?.audioUrl),
    responses: (Array.isArray(item?.responses) ? item.responses : []).map(normalizeRadioResponse).filter(Boolean).slice(0, 8),
    oneShot: Boolean(item?.oneShot)
  };
}

function normalizeRadioResponse(item) {
  if (!item || typeof item !== "object") return null;
  const label = cleanString(item.label);
  if (!label) return null;
  return { label, outcome: cleanString(item.outcome) };
}

function normalizeRadioRequest(item) {
  if (!item || typeof item !== "object" || !cleanString(item.userId)) return null;
  return {
    id: cleanString(item.id) || randomId(),
    userId: cleanString(item.userId),
    userName: cleanString(item.userName) || "Player",
    actorId: cleanString(item.actorId),
    actorName: cleanString(item.actorName),
    frequency: normalizeRadioFrequency(item.frequency),
    created: toNumber(item.created, Date.now())
  };
}

function normalizeRadioAttempt(item) {
  if (!item || typeof item !== "object") return null;
  return {
    id: cleanString(item.id) || randomId(),
    turn: Math.max(1, Math.trunc(toNumber(item.turn, 1))),
    userId: cleanString(item.userId),
    broadcastId: cleanString(item.broadcastId)
  };
}

function normalizeRadioLogEntry(item) {
  if (!item || typeof item !== "object") return null;
  const outcome = ["critical", "failure", "success", "raise"].includes(item.outcome) ? item.outcome : "failure";
  return {
    id: cleanString(item.id) || randomId(),
    created: toNumber(item.created, Date.now()),
    turn: Math.max(1, Math.trunc(toNumber(item.turn, 1))),
    broadcastId: cleanString(item.broadcastId),
    broadcastTitle: cleanString(item.broadcastTitle) || "Unknown Broadcast",
    source: cleanString(item.source) || "Unknown",
    gmBroadcastTitle: cleanString(item.gmBroadcastTitle),
    gmSource: cleanString(item.gmSource),
    frequency: normalizeRadioFrequency(item.frequency),
    userId: cleanString(item.userId),
    userName: cleanString(item.userName) || "Operator",
    actorId: cleanString(item.actorId),
    actorName: cleanString(item.actorName) || "Unknown Actor",
    actorImg: cleanString(item.actorImg),
    skillName: cleanString(item.skillName) || "Electronics",
    traitDie: HUNTING_DIE_OPTIONS.includes(Number(item.traitDie)) ? Number(item.traitDie) : 6,
    baseModifier: Math.trunc(toSignedNumber(item.baseModifier, 0)),
    modifier: Math.trunc(toSignedNumber(item.modifier, 0)),
    unskilled: Boolean(item.unskilled),
    roll: item.roll || null,
    outcome,
    outcomeLabel: cleanString(item.outcomeLabel) || radioOutcomeLabel(outcome),
    message: cleanString(item.message),
    raiseText: cleanString(item.raiseText),
    responses: (Array.isArray(item.responses) ? item.responses : []).map(normalizeRadioResponse).filter(Boolean).slice(0, 8),
    responseSent: cleanString(item.responseSent),
    responseOutcome: cleanString(item.responseOutcome),
    responseUserId: cleanString(item.responseUserId),
    responseUserName: cleanString(item.responseUserName)
  };
}

function normalizeWagon(item) {
  const role = normalizeWagonRole(item?.role || item?.type);
  const hasRole = Boolean(cleanString(item?.role));
  const rawCapacity = Math.max(0, toNumber(item?.capacity, 0));
  const migratedCapacity = !hasRole && rawCapacity <= 0 && role === "storage"
    ? 1000
    : !hasRole && rawCapacity <= 0 && role === "fuel"
      ? 500
      : rawCapacity;
  return {
    id: cleanString(item?.id) || randomId(),
    name: cleanString(item?.name) || "Unnamed Wagon",
    type: wagonRoleConfig(role).label,
    role,
    active: item?.active === undefined ? true : Boolean(item.active),
    capacity: migratedCapacity,
    notes: cleanString(item?.notes),
    gmNotes: cleanString(item?.gmNotes)
  };
}

function normalizeGroup(item, settings) {
  return {
    id: cleanString(item?.id) || randomId(),
    name: cleanString(item?.name) || "Unnamed Group",
    count: Math.max(0, toNumber(item?.count, 0)),
    portraitUrl: cleanString(item?.portraitUrl || item?.imageUrl),
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

function normalizeScavengeEvents(rawEvents, biomes = DEFAULT_BIOMES.map(normalizeBiome), schemaVersion = CURRENT_EVENT_SCHEMA_VERSION) {
  const normalizedBiomes = normalizeBiomes(biomes);
  const defaults = defaultScavengeEvents(normalizedBiomes);
  const shouldRefreshGeneratedEvents = toNumber(schemaVersion, 0) < CURRENT_EVENT_SCHEMA_VERSION;
  const result = {};
  for (const category of SCAVENGE_CATEGORIES) {
    const source = rawEvents?.[category.key];
    const collection = {
      key: category.key,
      label: category.label,
      biomes: {}
    };

    for (const biome of normalizedBiomes) {
      const sourceTable = source?.biomes?.[biome.id] || source;
      const fallback = defaults[category.key].biomes[biome.id] || defaultScavengeEventCategory(category, biome);
      const refreshTable = shouldRefreshGeneratedEvents && looksLikeGeneratedLegacyEvents(sourceTable);
      const tiers = {};
      const rewards = {};

      for (let tier = 1; tier <= 10; tier++) {
        const key = String(tier);
        const sourceEvents = !refreshTable && Array.isArray(sourceTable?.tiers?.[key]) ? sourceTable.tiers[key] : [];
        tiers[key] = Array.from({ length: 50 }, (_item, index) => (
          normalizeScavengeEvent(sourceEvents[index] || fallback.tiers[key][index], category, tier, index + 1, biome)
        ));
        rewards[key] = normalizeRewardFormula(!refreshTable ? sourceTable?.rewards?.[key] : "", fallback.rewards?.[key] || defaultRewardFormula(category, tier));
      }

      collection.biomes[biome.id] = {
        key: category.key,
        label: category.label,
        biomeId: biome.id,
        biomeName: biome.name,
        rewards,
        tiers
      };
    }

    result[category.key] = collection;
  }
  return result;
}

function looksLikeGeneratedLegacyEvents(table) {
  if (!table?.tiers) return false;
  const samples = [
    table.tiers?.["1"]?.[0],
    table.tiers?.["4"]?.[49],
    table.tiers?.["10"]?.[49]
  ].filter(Boolean);
  if (!samples.length) return false;

  const legacyPlaces = [
    "railside scrub", "abandoned siding", "signal hut", "dry culvert", "wrecked service cart",
    "old maintenance trench", "wind-buried camp", "collapsed depot", "frosted embankment", "smoke-stained ravine"
  ];
  const staleFactionMarkers = ["Dire" + "ktuar", "Sez" + "arist"];
  const generatedMarkers = [
    "The find is rushed before weather closes in.",
    "Nobody nearby wants to be seen choosing a side.",
    "The faction mark can be turned into leverage.",
    "Something useful was lost or spoiled.",
    "The train gains dependable supplies."
  ];
  return samples.some(event => {
    const text = cleanString(event?.text);
    if (!text) return false;
    const hasLegacyPlace = legacyPlaces.some(place => text.includes(`in the ${place}`));
    const hasStaleName = staleFactionMarkers.some(marker => text.includes(marker));
    const hasGeneratedMarker = generatedMarkers.some(marker => text.includes(marker));
    return hasLegacyPlace || hasStaleName || hasGeneratedMarker;
  });
}

function normalizeScavengeEvent(item, category, tier = 1, eventRoll = 1, biome = normalizeBiome(DEFAULT_BIOMES[0])) {
  const fallback = defaultScavengeEvent(category, tier, eventRoll, biome);
  const resourceType = category.key === "goldAmenities"
    ? "amenities"
    : item?.resourceType ? normalizeResourceAlias(item.resourceType, fallback.resourceType) : fallback.resourceType;
  const secondaryResourceType = category.key === "goldAmenities"
    ? ""
    : item?.secondaryResourceType ? normalizeResourceAlias(item.secondaryResourceType, "") : "";
  return {
    resourceType,
    amount: toNumber(item?.amount, fallback.amount),
    title: cleanScavengeEventTitle(cleanString(item?.title) || fallback.title, resourceType),
    text: cleanString(item?.text) || fallback.text,
    secondaryResourceType,
    secondaryAmount: secondaryResourceType ? toNumber(item?.secondaryAmount, 0) : 0
  };
}

function cleanScavengeEventTitle(title, resourceType) {
  const label = RESOURCE_LABELS[resourceType] || "";
  const cleaned = cleanString(title);
  if (!cleaned) return cleaned;
  if (label) {
    const labelPattern = new RegExp(`(:\\s*${escapeRegExp(label)})\\s+[+-]?\\d+(?:\\.\\d+)?$`, "i");
    return cleaned.replace(labelPattern, "$1").trim();
  }
  return cleaned.replace(/\s+[+-]?\d+(?:\.\d+)?$/, "").trim();
}

function normalizeHuntingEntry(item) {
  if (!item || typeof item !== "object") return null;
  const resourceType = HUNTING_RESOURCE_KEYS.includes(item.resourceType) ? item.resourceType : "food";
  const secondaryResourceType = HUNTING_RESOURCE_KEYS.includes(item.secondaryResourceType) ? item.secondaryResourceType : "";
  return {
    id: cleanString(item.id) || randomId(),
    created: toNumber(item.created, Date.now()),
    actionType: cleanString(item.actionType),
    actionLabel: cleanString(item.actionLabel) || "Scavenge",
    actorId: cleanString(item.actorId),
    actorName: cleanString(item.actorName) || "Unknown Actor",
    actorImg: cleanString(item.actorImg),
    skillName: cleanString(item.skillName) || "Survival",
    traitDie: toNumber(item.traitDie, 6),
    baseModifier: toNumber(item.baseModifier, toNumber(item.modifier, 0)),
    modifier: toNumber(item.modifier, 0),
    unskilled: Boolean(item.unskilled),
    resourceType,
    resourceLabel: RESOURCE_LABELS[resourceType],
    amount: toNumber(item.amount, 0),
    secondaryResourceType,
    secondaryResourceLabel: secondaryResourceType ? RESOURCE_LABELS[secondaryResourceType] : "",
    secondaryAmount: toNumber(item.secondaryAmount, 0),
    roll: item.roll || {},
    rawTier: Math.max(1, Math.trunc(toNumber(item.rawTier, item.tier || 1))),
    tier: clamp(Math.trunc(toNumber(item.tier, 1)), 1, 10),
    tierOverage: Math.max(0, Math.trunc(toNumber(item.tierOverage, 0))),
    eventRoll: clamp(Math.trunc(toNumber(item.eventRoll, 1)), 1, 50),
    rewardFormula: cleanString(item.rewardFormula),
    rewardBaseFormula: cleanString(item.rewardBaseFormula),
    rewardExtraDice: Math.max(0, Math.trunc(toNumber(item.rewardExtraDice, DEFAULT_RAISE_EXTRA_DICE))),
    rewardExtraEvery: Math.max(1, Math.trunc(toNumber(item.rewardExtraEvery, DEFAULT_RAISE_EVERY))),
    rewardExtraSteps: Math.max(0, Math.trunc(toNumber(item.rewardExtraSteps, 0))),
    rewardRoll: item.rewardRoll || null,
    eventTitle: cleanString(item.eventTitle),
    eventText: cleanString(item.eventText)
  };
}

function normalizeBiomes(items) {
  const source = Array.isArray(items) && items.length ? items : DEFAULT_BIOMES;
  const normalized = source.map(normalizeBiome).filter(biome => biome.name);
  return normalized.length ? normalized : DEFAULT_BIOMES.map(normalizeBiome);
}

function normalizeBiome(item) {
  const fallback = DEFAULT_BIOMES.find(biome => biome.id === item?.id) || DEFAULT_BIOMES[0];
  return {
    id: cleanString(item?.id) || randomId(),
    name: cleanString(item?.name) || fallback.name,
    imageUrl: cleanString(item?.imageUrl),
    foodMultiplier: Math.max(0, toNumber(item?.foodMultiplier, fallback.foodMultiplier)),
    waterMultiplier: Math.max(0, toNumber(item?.waterMultiplier, fallback.waterMultiplier)),
    fuelMultiplier: Math.max(0, toNumber(item?.fuelMultiplier, fallback.fuelMultiplier)),
    amenitiesMultiplier: Math.max(0, toNumber(item?.amenitiesMultiplier, fallback.amenitiesMultiplier))
  };
}

function getCurrentBiome(data) {
  return data.settings.biomes.find(biome => biome.id === data.route.biomeId) || data.settings.biomes[0] || normalizeBiome(DEFAULT_BIOMES[0]);
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

function wagonRoleConfig(role) {
  return WAGON_ROLES.find(option => option.value === role) || WAGON_ROLES[0];
}

function normalizeWagonRole(value) {
  const text = cleanString(value).toLowerCase();
  if (WAGON_ROLES.some(option => option.value === text)) return text;
  if (text.includes("fuel")) return "fuel";
  if (text.includes("storage") || text.includes("cargo") || text.includes("freight")) return "storage";
  if (text.includes("special") || text.includes("command") || text.includes("medical") || text.includes("dining") || text.includes("luxury")) return "special";
  return "population";
}

function wagonCapacity(data, role) {
  return roundResource(data.wagons
    .filter(wagon => wagon.active && normalizeWagonRole(wagon.role || wagon.type) === role)
    .reduce((total, wagon) => total + Math.max(0, Number(wagon.capacity || 0)), 0));
}

function storageResourceTotal(resources) {
  return roundResource(STORAGE_RESOURCE_KEYS.reduce((total, key) => total + Math.max(0, Number(resources?.[key] || 0)), 0));
}

function capacityDisplay(value, capacity) {
  return `${formatNumber(value)} / ${formatNumber(capacity || 0)}`;
}

function capLabel(capacity) {
  return formatNumber(capacity || 0);
}

function capForResource(data, key) {
  if (key === "fuel") return wagonCapacity(data, "fuel");
  if (STORAGE_RESOURCE_KEYS.includes(key)) return wagonCapacity(data, "storage");
  return 0;
}

function maxResourceValue(data, key) {
  const cap = capForResource(data, key);
  if (cap <= 0) return (key === "fuel" || STORAGE_RESOURCE_KEYS.includes(key)) ? 0 : Infinity;
  if (key === "fuel") return cap;
  if (!STORAGE_RESOURCE_KEYS.includes(key)) return Infinity;
  const others = STORAGE_RESOURCE_KEYS
    .filter(candidate => candidate !== key)
    .reduce((total, candidate) => total + Math.max(0, Number(data.resources[candidate] || 0)), 0);
  return Math.max(0, roundResource(cap - others));
}

function setResourceValue(data, key, value) {
  if (!RESOURCE_KEYS.includes(key)) return { before: 0, after: 0, capped: false };
  const before = Number(data.resources[key] || 0);
  let next = roundResource(Number(value || 0));
  if (!data.settings.allowNegativeResources) next = Math.max(0, next);
  const max = maxResourceValue(data, key);
  if (Number.isFinite(max) && next > max) next = max;
  data.resources[key] = roundResource(next);
  return { before, after: data.resources[key], capped: data.resources[key] !== roundResource(Number(value || 0)) };
}

function enforceResourceCaps(data) {
  setResourceValue(data, "fuel", data.resources.fuel);
  for (const key of STORAGE_RESOURCE_KEYS) {
    setResourceValue(data, key, data.resources[key]);
  }
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
  if (uiState.activeTab === "hunting") uiState.activeTab = "scavenge";
  uiState.selectedMarketId = cleanString(stored.selectedMarketId);
  uiState.activeEventCategory = cleanString(stored.activeEventCategory) || "food";
  uiState.activeEventBiome = cleanString(stored.activeEventBiome) || "plains";
  uiState.activeEventTier = clamp(Math.trunc(toNumber(stored.activeEventTier, 0)), 0, 10);
  uiState.radioGmTab = ["broadcasts", "receiver", "access"].includes(stored.radioGmTab) ? stored.radioGmTab : "broadcasts";
  uiState.expandedRadioBroadcastId = cleanString(stored.expandedRadioBroadcastId);
  uiState.radioMuted = Boolean(stored.radioMuted);
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

function actorOptions() {
  return (game.actors?.contents || Array.from(game.actors || []))
    .map(actor => ({
      id: actor.id,
      name: actor.name || "Unnamed Actor",
      img: actor.img || ""
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toSignedNumber(value, fallback = 0) {
  const cleaned = cleanString(value).replace(/\s+/g, "");
  if (!cleaned) return fallback;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roundResource(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function formatNumber(value) {
  const number = roundResource(value);
  return Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatMultiplier(value) {
  return `${formatNumber(toNumber(value, 1))}x`;
}

function formatSigned(value) {
  const number = roundResource(value);
  return `${number >= 0 ? "+" : ""}${formatNumber(number)}`;
}

function cleanString(value) {
  return String(value ?? "").trim();
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
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

function escapeRegExp(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
