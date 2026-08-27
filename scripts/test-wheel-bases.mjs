import {
  WHEEL_BASE_OPTIONS,
  getTemplateFamilyForWheelBase,
  getTemplateFieldsForWheelBase,
} from "../src/data/wheelBases.js";
import {
  formatWheelPlatformStatus,
  getWheelPlatformProfile,
} from "../src/data/wheelPlatformVersion.js";
import {
  findWheelSetup,
  buildWheelSetupPresentation,
} from "../src/engine/wheelSettingsEngine.js";
import { isInvalidWheelReason } from "../src/data/wheelFieldHelp.js";
import { findIllegalPresentationRows } from "../src/engine/wheelSchemaValidation.js";

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

  const expectedFields = getTemplateFieldsForWheelBase(option.id);
  if (rows[0]?.label !== expectedFields[0]?.label) {
    console.error(
      `FAIL ${option.label}: first field is ${rows[0]?.label}, expected ${expectedFields[0]?.label}`,
    );
    failures += 1;
    continue;
  }

  const allowedKeys = new Set(expectedFields.map((field) => field.key));
  const leaked = rows.find((row) => !allowedKeys.has(row.key));
  if (leaked) {
    console.error(
      `FAIL ${option.label}: leaked field ${leaked.key} (${leaked.label})`,
    );
    failures += 1;
    continue;
  }

  const illegal = findIllegalPresentationRows(option.id, rows);
  if (illegal.length) {
    console.error(
      `FAIL ${option.label}: illegal values ${illegal
        .map((item) => `${item.key}=${item.value}`)
        .join(", ")}`,
    );
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

  const platform = getWheelPlatformProfile(option.id);
  if (!platform?.manufacturer) {
    console.error(`FAIL ${option.label}: missing platform profile`);
    failures += 1;
    continue;
  }

  console.log(
    `OK ${option.label}: ${rows.length} fields · ${lookup.matchType} · first=${rows[0].label} · ${formatWheelPlatformStatus(option.id).summary}`,
  );
}

if (failures > 0) {
  console.error(`\n${failures} wheel base test(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${WHEEL_BASE_OPTIONS.length} wheel bases passed.`);

const rs50Option = WHEEL_BASE_OPTIONS.find((option) => option.id === "logitech_rs50");
if (!rs50Option) {
  console.error("FAIL RS50 is not selectable in WHEEL_BASE_OPTIONS.");
  process.exit(1);
}
console.log("OK RS50 is selectable.");

const switchChain = [
  "thrustmaster_t598",
  "logitech_rs50",
  "logitech_g_pro",
  "logitech_g923",
  "fanatec_gt_dd_pro",
  "thrustmaster_t598",
];

let previousFamily = null;
let previousFirstLabel = null;

for (const wheelBaseId of switchChain) {
  const lookup = findWheelSetup({ ...TEST_CASE, wheelBase: wheelBaseId });
  const family = getTemplateFamilyForWheelBase(wheelBaseId);
  const rows = buildWheelSetupPresentation(lookup.setup, {
    ...TEST_CASE,
    wheelBase: wheelBaseId,
  }).rows;
  const firstLabel = rows[0]?.label ?? null;
  const expectedFirst = getTemplateFieldsForWheelBase(wheelBaseId)[0]?.label;

  if (!lookup.setup) {
    console.error(`FAIL switch ${wheelBaseId}: no setup`);
    process.exit(1);
  }

  if (firstLabel !== expectedFirst) {
    console.error(
      `FAIL switch ${wheelBaseId}: schema first field ${firstLabel}, expected ${expectedFirst}`,
    );
    process.exit(1);
  }

  if (previousFamily != null && family !== previousFamily && firstLabel === previousFirstLabel) {
    console.error(
      `FAIL switch to ${wheelBaseId}: field layout did not change from previous wheel family`,
    );
    process.exit(1);
  }

  // Must not stick on T598 when another base is selected.
  if (wheelBaseId !== "thrustmaster_t598") {
    const selectedFamily = getTemplateFamilyForWheelBase(wheelBaseId);
    const resolvedFamily = getTemplateFamilyForWheelBase(lookup.setup.wheelBase);
    if (resolvedFamily === "t598" && selectedFamily !== "t598") {
      console.error(`FAIL switch ${wheelBaseId}: stuck on T598 profile`);
      process.exit(1);
    }
    if (firstLabel === "FFB" && selectedFamily !== "t598") {
      console.error(`FAIL switch ${wheelBaseId}: still showing T598 FFB field`);
      process.exit(1);
    }
  }

  previousFamily = family;
  previousFirstLabel = firstLabel;
  console.log(`OK switch → ${wheelBaseId} (${family}, first=${firstLabel})`);
}

console.log("OK wheel switch chain: T598 → RS50 → G PRO → G923 → GT DD Pro → T598");

const t598Values = findWheelSetup({
  ...TEST_CASE,
  wheelBase: "thrustmaster_t598",
}).setup?.values;
if (!t598Values?.ffb || !t598Values?.damper) {
  console.error("FAIL T598 settings were not preserved.");
  process.exit(1);
}
console.log("OK existing T598 settings preserved.");
