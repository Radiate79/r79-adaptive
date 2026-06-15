import { parseChampionshipPackPath } from "../src/utils/alrChampionshipPack.js";

const cases = [
  {
    path: "Season20/Tier1.jpg",
    season: 20,
    tier: 1,
    division: undefined,
  },
  {
    path: "Season20/Tier2Blue.jpg",
    season: 20,
    tier: 2,
    division: "blue",
  },
  {
    path: "Season20/Tier2White.jpg",
    season: 20,
    tier: 2,
    division: "white",
  },
  {
    path: "Season21/Tier4Blue.png",
    season: 21,
    tier: 4,
    division: "blue",
  },
  {
    path: "Season22/Tier6.jpg",
    season: 22,
    tier: 6,
    division: undefined,
  },
  {
    path: "Season22/Tier7.jpg",
    season: 22,
    tier: 7,
    division: undefined,
  },
  {
    path: "Season22/Tier10.jpg",
    season: 22,
    tier: 10,
    division: undefined,
  },
];

let failed = 0;

for (const testCase of cases) {
  const parsed = parseChampionshipPackPath(testCase.path);
  const ok =
    parsed.season === testCase.season &&
    parsed.tier === testCase.tier &&
    parsed.division === testCase.division;

  if (!ok) {
    failed += 1;
    console.error("FAIL", testCase.path, parsed);
  } else {
    console.log("OK", testCase.path);
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log(`All ${cases.length} championship pack path cases passed.`);
