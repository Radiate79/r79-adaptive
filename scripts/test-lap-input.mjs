import {
  commitLapCountInput,
  formatLapsSummary,
} from "../src/utils/raceDistance.js";

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL ${message}`);
    failures += 1;
  } else {
    console.log(`OK ${message}`);
  }
}

assert(commitLapCountInput("") === 0, "empty commits to 0");
assert(commitLapCountInput("   ") === 0, "whitespace commits to 0");
assert(commitLapCountInput("-3") === 0, "negative commits to 0");
assert(commitLapCountInput("1") === 1, "1 commits to 1");
assert(commitLapCountInput("21") === 21, "21 commits to 21");
assert(commitLapCountInput("5.7") === 6, "decimal rounds to whole number");
assert(commitLapCountInput("0") === 0, "0 commits to 0");
assert(formatLapsSummary(0) === "Laps not set", "0 summary");
assert(formatLapsSummary(1) === "1 lap", "1 summary singular");
assert(formatLapsSummary(21) === "21 laps", "21 summary plural");

// Simulate edit sequence: 0 → delete → 1 → delete → 21 → 5 → delete
let stored = 0;
let draft = null;

function type(value) {
  draft = value;
  if (value !== "") {
    stored = commitLapCountInput(value);
  }
}

function blur() {
  stored = commitLapCountInput(draft !== null ? draft : stored);
  draft = null;
}

assert(stored === 0, "start at 0");
type("");
assert(draft === "", "can delete completely");
assert(stored === 0, "empty does not force 1 while editing");
type("1");
assert(stored === 1, "type 1");
type("");
assert(draft === "" && stored === 1, "delete after 1 keeps prior until blur");
blur();
assert(stored === 0 && draft === null, "blur empty resolves to 0");
type("21");
assert(stored === 21, "type 21");
type("5");
assert(stored === 5, "change 21 to 5");
type("");
blur();
assert(stored === 0, "final delete blur is 0 not 1");

if (failures > 0) {
  console.error(`\n${failures} lap input regression(s) failed.`);
  process.exit(1);
}

console.log("\nLap input regressions passed.");
