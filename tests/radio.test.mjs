import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const modulePath = new URL("../scripts/dominion-train.js", import.meta.url);
const source = fs.readFileSync(modulePath, "utf8");
let idCounter = 0;

const context = {
  console,
  setTimeout,
  clearTimeout,
  performance,
  requestAnimationFrame: callback => setTimeout(() => callback(performance.now()), 0),
  cancelAnimationFrame: clearTimeout,
  Hooks: { once() {} },
  Handlebars: { helpers: {}, registerHelper() {} },
  foundry: {
    applications: {
      api: {
        ApplicationV2: class {},
        HandlebarsApplicationMixin: Base => class extends Base {
          async _prepareContext() { return {}; }
          async _onRender() {}
          async _onClose() {}
        }
      }
    },
    utils: {
      randomID: () => `test-id-${++idCounter}`,
      deepClone: value => structuredClone(value),
      escapeHTML: value => String(value)
    }
  },
  game: {
    actors: { contents: [], get: () => null },
    keybindings: { register() {} },
    settings: { register() {}, get: () => ({}), set: async () => {} },
    socket: { on() {}, emit() {} },
    time: { serverTime: 1_000_000 },
    user: { id: "gm", name: "GM", isGM: true },
    users: { contents: [] }
  },
  ui: { notifications: { warn() {}, info() {} } },
  CONST: {},
  ChatMessage: {},
  Audio: class {}
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(`${source}\n;globalThis.__radioTest = { normalizeRadioBroadcast, radioSignalAtFrequency, radioSignalPresentation, radioPoweredOffPresentation, ensureRadioPowered, ensureRadioSignalAligned, parseRadioResponses, normalizeRadioFrequency, normalizeRadioGain, radioDialAngle, radioActorOptions, radioTier3Source, radioTier3TrackConfig, syncRadioPlaybackSession, synchronizedRadioStartOffset, createLatestActionQueue };`, context);

const radio = context.__radioTest;

function radioData(broadcast) {
  const normalized = radio.normalizeRadioBroadcast(broadcast);
  return {
    currentTurn: 5,
    route: { biomeId: "tundra" },
    radio: {
      poweredOn: true,
      frequency: normalized.frequency,
      gain: 3,
      playbackSession: { id: "", connectionKey: "", position: 0, startedAt: 0 },
      settings: { foundSoundUrl: "modules/swade-dominion-train/sounds/radio/default-tier-3.mp3" },
      broadcasts: [normalized]
    }
  };
}

test("frequency is clamped and rounded to one decimal step", () => {
  assert.equal(radio.normalizeRadioFrequency(79.94), 80);
  assert.equal(radio.normalizeRadioFrequency(96.44), 96.4);
  assert.equal(radio.normalizeRadioFrequency(120.5), 120);
  assert.equal(radio.radioDialAngle(80), -140);
  assert.equal(radio.radioDialAngle(100), 0);
  assert.equal(radio.radioDialAngle(120), 140);
});

test("a nearby carrier reveals only its partial transmission", () => {
  const data = radioData({
    id: "signal",
    enabled: true,
    frequency: 96.4,
    signalRange: 2,
    lockTolerance: 0.2,
    startTurn: 1,
    endTurn: 0,
    partialText: "Fort Veyr western line do not approach",
    fullText: "This complete hidden message must not appear before the SWADE roll succeeds."
  });
  const signal = radio.radioSignalAtFrequency(data, 95.5);
  const presentation = radio.radioSignalPresentation(signal);
  assert.ok(signal);
  assert.equal(signal.lockReady, false);
  assert.match(presentation.snippet, /Fort Veyr/);
  assert.doesNotMatch(presentation.snippet, /complete hidden message/);
});

test("a feathered trace appears before the core signal range", () => {
  const data = radioData({
    id: "signal",
    enabled: true,
    frequency: 96.4,
    signalRange: 1,
    lockTolerance: 0.2,
    partialText: "Fort Veyr western line do not approach"
  });
  const signal = radio.radioSignalAtFrequency(data, 99.2);
  const presentation = radio.radioSignalPresentation(signal);
  assert.ok(signal);
  assert.equal(signal.lockReady, false);
  assert.ok(presentation.strength > 0);
  assert.match(presentation.snippet, /Fort/);
});

test("radio broadcasts ignore biome and respect their turn window", () => {
  const data = radioData({
    id: "signal",
    enabled: true,
    frequency: 96.4,
    signalRange: 1.5,
    lockTolerance: 0.2,
    biomeId: "desert",
    startTurn: 3,
    endTurn: 7,
    fullText: "Decoded transmission."
  });
  assert.equal(radio.radioSignalAtFrequency(data, 96.4)?.lockReady, true);
  data.route.biomeId = "desert";
  assert.equal(radio.radioSignalAtFrequency(data, 96.4)?.lockReady, true);
  data.currentTurn = 8;
  assert.equal(radio.radioSignalAtFrequency(data, 96.4), null);
});

test("a powered-off receiver exposes no carrier", () => {
  const data = radioData({
    id: "signal",
    enabled: true,
    frequency: 96.4,
    signalRange: 1.5,
    lockTolerance: 0.2,
    startTurn: 1,
    endTurn: 0
  });
  assert.ok(radio.radioSignalAtFrequency(data, 96.4));
  data.radio.poweredOn = false;
  assert.equal(radio.radioSignalAtFrequency(data, 96.4), null);
  assert.throws(() => radio.ensureRadioPowered(data), /currently powered off/);
  assert.equal(radio.radioPoweredOffPresentation().stabilityLabel, "POWER OFF");
});

test("exact tuning must stabilize before the roll becomes available", () => {
  const data = radioData({
    id: "signal",
    enabled: true,
    frequency: 96.4,
    signalRange: 1.5,
    lockTolerance: 0.2,
    skillName: "Electronics",
    modifier: 1
  });
  const signal = radio.radioSignalAtFrequency(data, 96.4);
  const tuning = radio.radioSignalPresentation(signal, { ready: false, progress: 0.55 });
  const stable = radio.radioSignalPresentation(signal, { ready: true, progress: 1 });
  assert.equal(tuning.stable, false);
  assert.equal(tuning.stabilityProgress, 55);
  assert.match(tuning.skillLabel, /Hold/);
  assert.equal(stable.stable, true);
  assert.match(stable.skillLabel, /Electronics/);
});

test("frequency and signal gain must both align before a lock", () => {
  const data = radioData({
    id: "gain-signal",
    enabled: true,
    frequency: 96.4,
    signalRange: 1.5,
    lockTolerance: 0.2,
    targetGain: 3.25,
    gainTolerance: 0.05
  });
  const lowGain = radio.radioSignalAtFrequency(data, 96.4, 2.1);
  const aligned = radio.radioSignalAtFrequency(data, 96.4, 3.25);

  assert.equal(lowGain.frequencyReady, true);
  assert.equal(lowGain.gainReady, false);
  assert.equal(lowGain.lockReady, false);
  assert.equal(radio.radioSignalPresentation(lowGain).gainStatusLabel, "GAIN LOW");
  assert.equal(aligned.gainReady, true);
  assert.equal(aligned.lockReady, true);
  assert.doesNotThrow(() => radio.ensureRadioSignalAligned(aligned));
  assert.throws(() => radio.ensureRadioSignalAligned(lowGain), /receiver gain/);
});

test("gain provides no clue before the carrier frequency is acquired", () => {
  const data = radioData({
    id: "hidden-gain-signal",
    enabled: true,
    frequency: 96.4,
    signalRange: 2,
    lockTolerance: 0.2,
    targetGain: 4.75,
    gainTolerance: 0.03
  });
  const low = radio.radioSignalAtFrequency(data, 95.5, 1);
  const high = radio.radioSignalAtFrequency(data, 95.5, 5);

  assert.equal(low.frequencyReady, false);
  assert.equal(high.frequencyReady, false);
  assert.equal(low.gainClarity, 0);
  assert.equal(high.gainClarity, 0);
  assert.equal(radio.radioSignalPresentation(low).gainStatusLabel, "NO CARRIER");
  assert.equal(radio.radioSignalPresentation(high).gainStatusLabel, "NO CARRIER");
});

test("broadcast audio replaces Tier 3 only after its carrier is acquired", () => {
  const data = radioData({
    id: "voice-signal",
    enabled: true,
    frequency: 96.4,
    signalRange: 2,
    lockTolerance: 0.2,
    targetGain: 3,
    audioUrl: "worlds/dominion/audio/fort-veyr-message.mp3"
  });
  const trace = radio.radioSignalAtFrequency(data, 95.5, 3);
  const carrier = radio.radioSignalAtFrequency(data, 96.4, 3);

  assert.equal(
    radio.radioTier3Source(data, trace),
    "modules/swade-dominion-train/sounds/radio/default-tier-3.mp3"
  );
  const session = radio.syncRadioPlaybackSession(data, () => 0.5, 1_000_000);
  assert.equal(radio.radioTier3Source(data, carrier), "worlds/dominion/audio/fort-veyr-message.mp3");
  assert.deepEqual(
    JSON.parse(JSON.stringify(radio.radioTier3TrackConfig(data, carrier))),
    {
      url: "worlds/dominion/audio/fort-veyr-message.mp3",
      connectionKey: `session:${session.id}`,
      synchronized: true,
      playbackPosition: 0.5,
      playbackStartedAt: 1_000_000
    }
  );

  carrier.broadcast.audioUrl = "";
  assert.equal(
    radio.radioTier3Source(data, carrier),
    "modules/swade-dominion-train/sounds/radio/default-tier-3.mp3"
  );
});

test("broadcast music uses one shared random position and server clock", () => {
  const firstClient = radio.synchronizedRadioStartOffset(240.8, 0.5, 1_000_000, 1_005_250);
  const secondClient = radio.synchronizedRadioStartOffset(240.8, 0.5, 1_000_000, 1_005_250);
  assert.equal(firstClient, 125.25);
  assert.equal(secondClient, firstClient);
  assert.equal(radio.synchronizedRadioStartOffset(Number.NaN, 0.5, 1_000_000, 1_005_250), 0);
  assert.equal(radio.synchronizedRadioStartOffset(0.8, 0.5, 1_000_000, 1_005_250), 0);
});

test("leaving and reconnecting creates a new shared playback session", () => {
  const data = radioData({
    id: "music-station",
    enabled: true,
    frequency: 104.7,
    audioUrl: "worlds/dominion/audio/music-station.mp3"
  });
  const first = radio.syncRadioPlaybackSession(data, () => 0.25, 1_000_000);
  const retained = radio.syncRadioPlaybackSession(data, () => 0.75, 1_010_000);
  assert.equal(retained.id, first.id);
  assert.equal(retained.position, 0.25);

  data.radio.frequency = 80;
  radio.syncRadioPlaybackSession(data, () => 0.5, 1_020_000);
  assert.equal(data.radio.playbackSession.id, "");

  data.radio.frequency = 104.7;
  const reconnected = radio.syncRadioPlaybackSession(data, () => 0.75, 1_030_000);
  assert.notEqual(reconnected.id, first.id);
  assert.equal(reconnected.position, 0.75);
  assert.equal(reconnected.startedAt, 1_030_000);
});

test("open broadcasts reveal their full transmission without a lock roll", () => {
  const data = radioData({
    id: "public-station",
    enabled: true,
    frequency: 101.2,
    signalRange: 1.5,
    lockTolerance: 0.2,
    targetGain: 4.2,
    gainTolerance: 0.05,
    requiresLock: false,
    partialText: "Auran Central public service",
    fullText: "Auran Central public service bulletin and scheduled music."
  });
  const misaligned = radio.radioSignalAtFrequency(data, 101.2, 3);
  const aligned = radio.radioSignalAtFrequency(data, 101.2, 4.2);
  const tuning = radio.radioSignalPresentation(misaligned);
  const open = radio.radioSignalPresentation(aligned);

  assert.equal(aligned.broadcast.requiresLock, false);
  assert.equal(tuning.requiresLock, false);
  assert.doesNotMatch(tuning.snippet, /scheduled music/);
  assert.equal(open.stable, true);
  assert.equal(open.stabilityLabel, "OPEN BROADCAST");
  assert.equal(open.skillLabel, "No signal lock required");
  assert.equal(open.snippet, "Auran Central public service bulletin and scheduled music.");
});

test("legacy invalid modifiers become zero and radio fallback dice are discarded", () => {
  const broadcast = radio.normalizeRadioBroadcast({
    id: "legacy",
    enabled: true,
    modifier: "- NaN",
    fallbackDie: 12
  });

  assert.equal(broadcast.modifier, 0);
  assert.equal(Object.hasOwn(broadcast, "fallbackDie"), false);
  assert.equal(radio.normalizeRadioGain(5.8), 5);
  assert.equal(radio.normalizeRadioGain(0.4), 1);
});

test("assigned player characters are prioritized in the radio actor list", () => {
  context.game.users.contents = [
    { id: "gm", isGM: true },
    { id: "player", isGM: false, character: { id: "pc" } }
  ];
  context.game.actors.contents = [
    { id: "npc", name: "Aardvark NPC", img: "", isOwner: true, hasPlayerOwner: false },
    { id: "owned", name: "Owned Ally", img: "", isOwner: true, hasPlayerOwner: true },
    { id: "pc", name: "Player Hero", img: "", isOwner: true, hasPlayerOwner: true }
  ];

  const actors = Array.from(radio.radioActorOptions(true));
  assert.deepEqual(actors.map(actor => actor.id), ["pc", "owned", "npc"]);
  assert.equal(actors[0].isPlayerCharacter, true);
});

test("GM response lines retain labels and immediate outcomes", () => {
  const responses = radio.parseRadioResponses("Request route | Northern line opens\nRemain silent | No transmission");
  assert.equal(responses.length, 2);
  assert.equal(responses[0].label, "Request route");
  assert.equal(responses[0].outcome, "Northern line opens");
  assert.deepEqual(Array.from(radio.parseRadioResponses("")), []);
});

test("rapid radio control writes keep only the latest queued value", async () => {
  const dispatched = [];
  const queue = radio.createLatestActionQueue(async (action, payload) => {
    dispatched.push({ action, payload: { ...payload } });
    return true;
  });

  for (let index = 1; index <= 30; index += 1) {
    queue.queue("adjustRadioGain", { gain: index / 10 }, 10);
  }
  await new Promise(resolve => setTimeout(resolve, 30));

  assert.deepEqual(dispatched, [{ action: "adjustRadioGain", payload: { gain: 3 } }]);
  assert.equal(queue.pendingCount(), 0);
});

test("radio control writes keep one latest value while confirmation is pending", async () => {
  const dispatched = [];
  let releaseFirst;
  const firstConfirmation = new Promise(resolve => {
    releaseFirst = resolve;
  });
  const queue = radio.createLatestActionQueue(async (action, payload) => {
    dispatched.push({ action, payload: { ...payload } });
    if (dispatched.length === 1) await firstConfirmation;
    return true;
  });

  queue.queue("adjustRadioGain", { gain: 1.5 }, 0);
  await new Promise(resolve => setTimeout(resolve, 5));
  queue.queue("adjustRadioGain", { gain: 2.5 }, 0);
  queue.queue("adjustRadioGain", { gain: 4.5 }, 0);
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.deepEqual(dispatched, [{ action: "adjustRadioGain", payload: { gain: 1.5 } }]);

  releaseFirst();
  await new Promise(resolve => setTimeout(resolve, 15));
  assert.deepEqual(dispatched, [
    { action: "adjustRadioGain", payload: { gain: 1.5 } },
    { action: "adjustRadioGain", payload: { gain: 4.5 } }
  ]);
  assert.equal(queue.pendingCount(), 0);
});
