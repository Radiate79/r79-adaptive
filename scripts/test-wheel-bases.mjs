import { WHEEL_BASE_OPTIONS, getTemplateFamilyForWheelBase } from "../src/data/wheelBases.js";
import {
  findWheelSetup,
  buildWheelSetupPresentation,
} from "../src/engine/wheelSettingsEngine.js";
import { isInvalidWheelReason } from "../src/data/wheelFieldHelp.js";

const TEST_CASE = {
  gameVersion: "gt7",
  carId: "mercedes_amg_gt3_20",
  trackId: "spa",
  tyreCompound: "M",
  bopOn: true,
  fuelMultiplier: 1,
  tyreMultiplier: 1,
  lapCount: 20,
};

let failures = 0;

for (const option of WHEEL_BASE_OPTIONS) {
  const filters = {
    ...TEST_CASE,
    wheelBase: option.id,
  };

  const lookup = findWheelSetup(filters);
  const setup = lookup.setup;

  if (!setup) {
    console.error(`FAIL ${option.label}: no setup returned`);
    failures += 1;
    continue;
  }

  if (setup.wheelBase !== option.id) {
    const setupFamily = getTemplateFamilyForWheelBase(setup.wheelBase);
    const selectedFamily = getTemplateFamilyForWheelBase(option.id);
    if (setupFamily !== selectedFamily) {
      console.error(
        `FAIL ${option.label}: setup wheelBase is ${setup.wheelBase}, expected ${option.id}`,
      );
      failures += 1;
      continue;
    }
  }

  const presentation = buildWheelSetupPresentation(setup, {
    ...filters,
    wheelBase: option.id,
  });
  const rows = presentation.rows;

  if (rows.length === 0) {
    console.error(`FAIL ${option.label}: no formatted rows`);
    failures += 1;
    continue;
  }

  const badReason = rows.find((row) =>
    isInvalidWheelReason(row.reason, row.label, row.value),
  );

  if (badReason) {
    console.error(
      `FAIL ${option.label}: reason repeats value for ${badReason.label}`,
    );
    failures += 1;
    continue;
  }

  const emptyReason = rows.filter((row) => row.value !== "—" && !row.reason);
  if (emptyReason.length > 0) {
    console.error(
      `FAIL ${option.label}: missing reason for ${emptyReason.map((row) => row.label).join(", ")}`,
    );
    failures += 1;
    continue;
  }

  console.log(
    `OK ${option.label}: ${rows.length} fields · ${lookup.matchType} · first=${rows[0].label}`,
  );
}

if (failures > 0) {
  console.error(`\n${failures} wheel base test(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${WHEEL_BASE_OPTIONS.length} wheel bases passed.`);

const t598 = findWheelSetup({
  ...TEST_CASE,
  wheelBase: "thrustmaster_t598",
});
const g923 = findWheelSetup({
  ...TEST_CASE,
  wheelBase: "logitech_g923",
});

if (t598.setup?.wheelBase === g923.setup?.wheelBase) {
  console.error("FAIL T598 vs G923: both resolved to the same wheel base profile.");
  process.exit(1);
}

const t598Rows = buildWheelSetupPresentation(t598.setup, {
  ...TEST_CASE,
  wheelBase: "thrustmaster_t598",
}).rows;
const g923Rows = buildWheelSetupPresentation(g923.setup, {
  ...TEST_CASE,
  wheelBase: "logitech_g923",
}).rows;

if (t598Rows[0]?.label === g923Rows[0]?.label) {
  console.error("FAIL T598 vs G923: displayed field layout did not change.");
  process.exit(1);
}

console.log("OK T598 vs G923 switch: different wheel base profiles and field layouts.");
