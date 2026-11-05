import assert from "node:assert/strict";
import test from "node:test";
import schema from "../src/appmeta/settings.json" with { type: "json" };
import { AppModel } from "../src/model.ts";
import { schemaDefaults, type Settings } from "../src/lib.ts";
const NOW = 1700000000000;
const make = (values: Settings = {}, saved: Settings = {}, now = NOW) =>
  new AppModel({ ...schemaDefaults(schema.fields), ...values }, saved, now);

test("export remains distinguishable from consumption", () => {
  const a = make();
  a.receive({ consumption_w: 500, generation_w: 1500, daily_kwh: 3 }, NOW);
  assert.equal(a.view(NOW).title, "Grid export");
  assert.equal(a.view(NOW).value, "1.00 kW");
});
test("missing sensor values are rejected rather than zeroed", () => {
  const a = make();
  assert.throws(() =>
    a.receive({ consumption_w: 500, generation_w: null, daily_kwh: 3 }, NOW),
  );
  assert.equal(a.items.length, 0);
});
