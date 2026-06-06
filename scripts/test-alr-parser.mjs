import { cars } from "../src/data/cars.js";
import { getReferenceStandings } from "../src/data/alrReferenceStandings.js";
import {
  compareRowsToReference,
  extractConstructorRows,
  extractConstructorRowsFromPrefixedTeamLines,
  matchConstructorRows,
} from "../src/engine/alrStandingsParser.js";

const POSITION_HEIGHT = 600;
const TEAM_HEIGHT = 600;
const ROW_HEIGHT = 36;
const reference = getReferenceStandings(22, 1);

/** @type {import("../src/engine/alrStandingsParser.js").OcrWord[]} */
const positionWords = [];
/** @type {import("../src/engine/alrStandingsParser.js").OcrWord[]} */
const teamWords = [];

reference.forEach((teamName, index) => {
  const position = index + 1;
  const y = 80 + index * ROW_HEIGHT;

  positionWords.push({
    text: String(position),
    bbox: { x0: 10, y0: y, x1: 28, y1: y + 20 },
  });

  const tokens = teamName.split(" ");
  let x = 10;
  for (const token of tokens) {
    teamWords.push({
      text: token,
      bbox: { x0: x, y0: y, x1: x + token.length * 9, y1: y + 20 },
    });
    x += token.length * 9 + 6;
  }
});

const rawRows = extractConstructorRows(
  positionWords,
  teamWords,
  POSITION_HEIGHT,
  TEAM_HEIGHT,
);

console.log("Season 22 Tier 1 — Raw OCR Extraction (before car matching)\n");
for (const row of rawRows) {
  console.log(row.rawOcrLine);
}

const comparison = compareRowsToReference(rawRows, 22, 1) ?? [];
const matchCount = comparison.filter((row) => row.matches).length;

console.log(`\nReference comparison: ${matchCount}/${comparison.length} rows match\n`);

const matched = matchConstructorRows(rawRows, cars, 22, 1);
console.log("Car matching preview:\n");
for (const row of matched) {
  const carName = cars.find((car) => car.id === row.car)?.name ?? "Unmatched";
  console.log(`P${row.constructorsPosition}: ${row.rawCarText} → ${carName}`);
}

const prefixedTeamText = `1 AMG 20
2 Mazda RX Vision
3 Porsche 91122
4 Jaguar F-type
5 Subaru WRX
6 VW Beetle
7 Toyota GR Supra`;

const noisyTeamText = `Total Above Lead Points
48 123 3 Porsche 91122 (892) ddd
177 9 45 4 Audi R8 Evo 235
85 20 137 |8 McLaren 650s 112`;

console.log("\nPrefixed team-line fallback (empty position column):\n");
const prefixedRows = extractConstructorRowsFromPrefixedTeamLines(prefixedTeamText);
for (const row of prefixedRows) {
  console.log(`P${row.constructorsPosition}: ${row.rawTeamText}`);
}

console.log("\nNoisy team lines (stats columns still in OCR text):\n");
const noisyRows = extractConstructorRowsFromPrefixedTeamLines(noisyTeamText);
for (const row of noisyRows) {
  console.log(`P${row.constructorsPosition}: ${row.rawTeamText}`);
}
