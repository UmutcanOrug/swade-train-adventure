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
vm.runInContext(`${source}\n;globalThis.__radioTest = { normalizeRadioBroadcast, radioSignalAtFrequency, radioSignalPresentation, parseRadioResponses, normalizeRadioFrequency };`, context);

const radio = context.__radioTest;

function radioData(broadcast) {
  return {
    currentTurn: 5,
    route: { biomeId: "tundra" },
    radio: { broadcasts: [radio.normalizeRadioBroadcast(broadcast)] }
  };
}

test("frequency is clamped and rounded to one decimal step", () => {
  assert.equal(radio.normalizeRadioFrequency(79.94), 80);
  assert.equal(radio.normalizeRadioFrequency(96.44), 96.4);
  assert.equal(radio.normalizeRadioFrequency(120.5), 120);
});

test("a nearby carrier reveals only its partial transmission", () => {
  const data = radioData({
    id: "signal",
    enabled: true,
    frequency: 96.4,
    signalRange: 2,
    lockTolerance: 0.2,
    biomeId: "tundra",
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

test("exact tuning enables lock only in the configured biome and turn window", () => {
  const data = radioData({
    id: "signal",
    enabled: true,
    frequency: 96.4,
    signalRange: 1.5,
    lockTolerance: 0.2,
    biomeId: "tundra",
    startTurn: 3,
    endTurn: 7,
    fullText: "Decoded transmission."
  });
  assert.equal(radio.radioSignalAtFrequency(data, 96.4)?.lockReady, true);
  data.route.biomeId = "desert";
  assert.equal(radio.radioSignalAtFrequency(data, 96.4), null);
  data.route.biomeId = "tundra";
  data.currentTurn = 8;
  assert.equal(radio.radioSignalAtFrequency(data, 96.4), null);
});

test("GM response lines retain labels and immediate outcomes", () => {
  const responses = radio.parseRadioResponses("Request route | Northern line opens\nRemain silent | No transmission");
  assert.equal(responses.length, 2);
  assert.equal(responses[0].label, "Request route");
  assert.equal(responses[0].outcome, "Northern line opens");
});
