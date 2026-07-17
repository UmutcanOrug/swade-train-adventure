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
vm.runInContext(`${source}\n;globalThis.__radioTest = { normalizeRadioBroadcast, radioSignalAtFrequency, radioSignalPresentation, radioPoweredOffPresentation, ensureRadioPowered, ensureRadioSignalAligned, parseRadioResponses, normalizeRadioFrequency, normalizeRadioGain, radioDialAngle, radioActorOptions };`, context);

const radio = context.__radioTest;

function radioData(broadcast) {
  return {
    currentTurn: 5,
    route: { biomeId: "tundra" },
    radio: { poweredOn: true, gain: 3, broadcasts: [radio.normalizeRadioBroadcast(broadcast)] }
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
});
