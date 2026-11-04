/**
 * Build official GT7 1.72 catalogue snapshot from verified source markdown.
 * Development-only. Production uses the generated JSON snapshot.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const SOURCE = path.join(__dirname, "official-carlist-2026-10.source.md");
const OUT_DIR = path.join(ROOT, "src/data/gt7/1.72");
const OUT_JSON = path.join(OUT_DIR, "officialCarCatalogue.json");

const EXPECTED_COUNT = 580;
const SOURCE_VERSION = "1.72";
const SOURCE_DATE = "2026-10";
const SOURCE_URL = "https://www.gran-turismo.com/gb/gt7/carlist/";

function slugify(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function parseSource(text) {
  const countMatch = text.match(/No\.\s*of\s*Cars:\s*(\d+)/i);
  const dateMatch = text.match(/as of\s+([^\n]+)/i);
  const officialCount = countMatch ? Number(countMatch[1]) : null;
  const asOf = dateMatch ? dateMatch[1].trim() : null;

  /** @type {{ manufacturer: string, name: string }[]} */
  const rows = [];
  let manufacturer = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("### ")) {
      manufacturer = line.slice(4).trim();
      continue;
    }
    if (/^\d+\s+Car\(s\)$/i.test(line)) continue;
    if (line.startsWith("Gran Turismo 7")) continue;
    if (line.startsWith("No. of Cars")) continue;
    if (line.startsWith("as of ")) continue;
    if (!manufacturer) continue;
    rows.push({ manufacturer, name: line });
  }

  return { officialCount, asOf, rows };
}

/**
 * Name-derived HINT only — never authoritative GT7 class for selectors.
 * Official car list pages do not publish a verified class field for every car.
 * R79 racing-class assignment comes from verified car.class / gt7RacingClass.
 */
function inferClassHint(name) {
  const n = name.toLowerCase();
  if (/\bgr\.?\s*1\b|\(gr\.1\)/.test(n)) return "Gr.1";
  if (/\bgr\.?\s*2\b|\(gr\.2\)/.test(n)) return "Gr.2";
  if (/\bgr\.?\s*3\b|\(gr\.3\)/.test(n)) return "Gr.3";
  if (/\bgr\.?\s*4\b|\(gr\.4\)|gr4\b/.test(n)) return "Gr.4";
  if (/\bgr\.?\s*b\b/.test(n)) return "Gr.B";
  return null;
}

function buildCatalogue(rows) {
  const usedIds = new Set();
  return rows.map((row, index) => {
    const baseId = slugify(`${row.manufacturer}_${row.name}`);
    let id = baseId || `gt7_car_${index + 1}`;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${baseId}_${suffix++}`;
    }
    usedIds.add(id);
    return {
      id,
      manufacturer: row.manufacturer,
      name: row.name,
      displayName: `${row.manufacturer} ${row.name}`.replace(/\s+/g, " ").trim(),
      gt7: true,
      // class is intentionally null — do not treat name hints as verified class.
      class: null,
      classHint: inferClassHint(row.name),
      sourceVersion: SOURCE_VERSION,
      sourceDate: SOURCE_DATE,
      source: "OFFICIAL_GRAN_TURISMO_CAR_LIST",
      sourceUrl: SOURCE_URL,
      performanceDataStatus: "PENDING",
    };
  });
}

const sourceText = fs.readFileSync(SOURCE, "utf8");
const { officialCount, asOf, rows } = parseSource(sourceText);

if (officialCount !== EXPECTED_COUNT) {
  console.error(
    `STOP: Official page count is ${officialCount}, expected baseline ${EXPECTED_COUNT}.`,
  );
  console.error(`as of: ${asOf}`);
  process.exit(2);
}

if (rows.length !== EXPECTED_COUNT) {
  console.error(
    `STOP: Parsed ${rows.length} cars, expected ${EXPECTED_COUNT}.`,
  );
  process.exit(2);
}

const cars = buildCatalogue(rows);
const payload = {
  meta: {
    source: "OFFICIAL_GRAN_TURISMO_CAR_LIST",
    sourceUrl: SOURCE_URL,
    sourceVersion: SOURCE_VERSION,
    sourceDate: SOURCE_DATE,
    asOf,
    officialCountDeclared: officialCount,
    carCount: cars.length,
    generatedAt: "2026-11-04",
    catalogueVersion: "1.72.0",
      note:
      "Canonical GT7 availability snapshot. class is always null here; classHint is non-authoritative. Racing class for selectors comes from verified R79 car.class / gt7RacingClass only.",
  },
  cars,
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_JSON, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${cars.length} cars → ${path.relative(ROOT, OUT_JSON)}`);
console.log(`Official count: ${officialCount} (${asOf})`);
