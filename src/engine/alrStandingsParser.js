import { getReferenceStandings } from "../data/alrReferenceStandings.js";
import { matchCarFromText, normalizeCarText } from "./alrCarMatcher.js";

const HEADER_PATTERN =
  /^(pos|position|p|#|constructor|constructors|standings|vehicle|car|team|manufacturer|points|pts|tier|season|drivers?|cc|wins?|r\d+|total|above|lead)\b/i;

/** @typedef {{ text: string, bbox: { x0: number, y0: number, x1: number, y1: number }, confidence?: number }} OcrWord */

/**
 * @typedef {Object} RawConstructorRow
 * @property {number} constructorsPosition
 * @property {string} rawPositionText
 * @property {string} rawTeamText
 * @property {string} rawOcrLine
 * @property {number} yNorm
 */

/**
 * @param {string} text
 */
export function extractSeasonAndTier(text) {
  const seasonMatch =
    text.match(/season\s*[#: ]?\s*(\d{2})\b/i) ||
    text.match(/\bS(?:EASON)?\s*(\d{2})\b/i) ||
    text.match(/\bALR\s+(\d{2})\b/i);

  const tierMatch =
    text.match(/tier\s*[#: ]?\s*(\d)\b/i) ||
    text.match(/\bT(?:IER)?\s*(\d)\b/i) ||
    text.match(/\bTIER\s*(\d)\b/i);

  return {
    season: seasonMatch ? Number(seasonMatch[1]) : null,
    tier: tierMatch ? Number(tierMatch[1]) : null,
  };
}

/**
 * @param {string} value
 */
export function normalizeForComparison(value) {
  return normalizeCarText(value)
    .replace(/\./g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {OcrWord[]} words
 * @param {number} [tolerance]
 */
export function groupWordsIntoRows(words, tolerance = 14) {
  const sorted = [...words].sort(
    (a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0,
  );

  /** @type {{ yMid: number, words: OcrWord[] }[]} */
  const rows = [];

  for (const word of sorted) {
    const yMid = (word.bbox.y0 + word.bbox.y1) / 2;
    let row = rows.find((item) => Math.abs(item.yMid - yMid) <= tolerance);

    if (!row) {
      row = { yMid, words: [] };
      rows.push(row);
    }

    row.words.push(word);
  }

  return rows
    .map((row) => ({
      ...row,
      words: row.words.sort((a, b) => a.bbox.x0 - b.bbox.x0),
    }))
    .sort((a, b) => a.yMid - b.yMid);
}

/**
 * @param {OcrWord[]} words
 */
function extractPositionFromNarrowColumn(words) {
  for (const word of words) {
    const trimmed = word.text.trim();
    if (!/^\d{1,2}$/.test(trimmed)) {
      continue;
    }

    const position = Number(trimmed);
    if (position >= 1 && position <= 15) {
      return {
        position,
        rawPositionText: trimmed,
      };
    }
  }

  return null;
}

/**
 * Parse team OCR lines that include the constructor position prefix.
 * @param {string} line
 * @param {number} [yNorm]
 * @returns {RawConstructorRow | null}
 */
/**
 * @param {string} fragment
 */
function cleanTeamTextFragment(fragment) {
  return fragment
    .replace(/\s+\(\d{2,4}\)(?:\s+\w+)?\s*$/i, "")
    .replace(/\s+\d{3,4}\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function parsePrefixedTeamLine(line, yNorm = 0) {
  const trimmed = line.trim().replace(/^\|+/, "");
  if (!trimmed || HEADER_PATTERN.test(trimmed)) {
    return null;
  }

  const candidates = [...trimmed.matchAll(/\b([1-9]|1[0-5])\s+([A-Za-z].+)$/g)];
  const match = candidates.length > 0 ? candidates[candidates.length - 1] : null;

  if (!match) {
    const direct = trimmed.match(/^([1-9]|1[0-5])\s+([A-Za-z].+)$/);
    if (!direct) {
      return null;
    }

    const position = Number(direct[1]);
    const rawTeamText = cleanTeamTextFragment(direct[2]);
    if (!rawTeamText) {
      return null;
    }

    return {
      constructorsPosition: position,
      rawPositionText: direct[1],
      rawTeamText,
      rawOcrLine: `${position} ${rawTeamText}`,
      yNorm,
    };
  }

  const position = Number(match[1]);
  const rawTeamText = cleanTeamTextFragment(match[2]);
  if (!rawTeamText || !/[A-Za-z]/.test(rawTeamText)) {
    return null;
  }

  return {
    constructorsPosition: position,
    rawPositionText: match[1],
    rawTeamText,
    rawOcrLine: `${position} ${rawTeamText}`,
    yNorm,
  };
}

/**
 * When the position column is empty, read position + team from each team OCR line.
 * @param {string} teamText
 * @returns {RawConstructorRow[]}
 */
export function extractConstructorRowsFromPrefixedTeamLines(teamText) {
  const lines = teamText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line, index) =>
      parsePrefixedTeamLine(line, index / Math.max(lines.length, 1)),
    )
    .filter(Boolean);
}

/**
 * @param {OcrWord[]} teamWords
 * @param {number} teamHeight
 */
function extractTeamRows(teamWords, teamHeight) {
  const rowTolerance = Math.max(14, Math.floor(teamHeight * 0.012));

  return groupWordsIntoRows(teamWords, rowTolerance)
    .map((row) => ({
      yNorm: row.yMid / teamHeight,
      rawTeamText: row.words
        .map((word) => word.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    }))
    .filter(
      (row) =>
        row.rawTeamText &&
        /[A-Za-z]/.test(row.rawTeamText) &&
        !HEADER_PATTERN.test(row.rawTeamText),
    );
}

/**
 * @param {{ yNorm: number, position: number, rawPositionText: string }[]} positionRows
 * @param {{ yNorm: number, rawTeamText: string }[]} teamRows
 */
function pairPositionsWithTeams(positionRows, teamRows) {
  const sortedPositions = [...positionRows].sort((a, b) => a.yNorm - b.yNorm);
  const sortedTeams = [...teamRows].sort((a, b) => a.yNorm - b.yNorm);
  const usedTeams = new Set();

  /** @type {RawConstructorRow[]} */
  const paired = [];

  for (const posRow of sortedPositions) {
    let bestIndex = -1;
    let bestDistance = Infinity;

    sortedTeams.forEach((teamRow, index) => {
      if (usedTeams.has(index)) {
        return;
      }

      const distance = Math.abs(teamRow.yNorm - posRow.yNorm);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    if (bestIndex >= 0 && bestDistance <= 0.08) {
      usedTeams.add(bestIndex);
      const rawTeamText = sortedTeams[bestIndex].rawTeamText;
      paired.push({
        constructorsPosition: posRow.position,
        rawPositionText: posRow.rawPositionText,
        rawTeamText,
        rawOcrLine: `${posRow.position} ${rawTeamText}`,
        yNorm: posRow.yNorm,
      });
    }
  }

  if (paired.length > 0) {
    return paired;
  }

  return sortedPositions
    .map((posRow, index) => {
      const rawTeamText = sortedTeams[index]?.rawTeamText ?? "";
      return {
        constructorsPosition: posRow.position,
        rawPositionText: posRow.rawPositionText,
        rawTeamText,
        rawOcrLine: rawTeamText
          ? `${posRow.position} ${rawTeamText}`
          : `${posRow.position}`,
        yNorm: posRow.yNorm,
      };
    })
    .filter((row) => row.rawTeamText);
}

/**
 * @param {OcrWord[]} positionWords
 * @param {OcrWord[]} teamWords
 * @param {number} positionHeight
 * @param {number} teamHeight
 */
export function extractConstructorRows(
  positionWords,
  teamWords,
  positionHeight,
  teamHeight,
) {
  const rowTolerance = Math.max(14, Math.floor(positionHeight * 0.012));

  const positionRows = groupWordsIntoRows(positionWords, rowTolerance)
    .map((row) => {
      const extracted = extractPositionFromNarrowColumn(row.words);
      if (!extracted) {
        return null;
      }

      return {
        yNorm: row.yMid / positionHeight,
        position: extracted.position,
        rawPositionText: extracted.rawPositionText,
      };
    })
    .filter(Boolean);

  const teamRows = extractTeamRows(teamWords, teamHeight);

  if (positionRows.length === 0 && teamRows.length > 0) {
    const prefixedRows = teamRows
      .map((row) => parsePrefixedTeamLine(row.rawTeamText, row.yNorm))
      .filter(Boolean);

    if (prefixedRows.length > 0) {
      return prefixedRows;
    }
  }

  return pairPositionsWithTeams(positionRows, teamRows);
}

/**
 * Fallback when word-bbox pairing fails: align position and team lines by index.
 * @param {string} positionText
 * @param {string} teamText
 * @returns {RawConstructorRow[]}
 */
export function extractConstructorRowsFromColumnText(positionText, teamText) {
  const positions = positionText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => line.match(/^(\d{1,2})\b/)?.[1] ?? "")
    .filter(Boolean)
    .map(Number)
    .filter((value) => value >= 1 && value <= 15);

  const teams = teamText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        /[A-Za-z]/.test(line) &&
        !HEADER_PATTERN.test(line) &&
        !/^\d{1,2}$/.test(line),
    );

  const count = Math.min(positions.length, teams.length);

  return Array.from({ length: count }, (_, index) => {
    const position = positions[index];
    const rawTeamText = teams[index];
    return {
      constructorsPosition: position,
      rawPositionText: String(position),
      rawTeamText,
      rawOcrLine: `${position} ${rawTeamText}`,
      yNorm: index / Math.max(count, 1),
    };
  });
}

/**
 * @param {RawConstructorRow[]} rawRows
 * @param {number} season
 * @param {number} tier
 */
export function compareRowsToReference(rawRows, season, tier) {
  const reference = getReferenceStandings(season, tier);
  if (!reference) {
    return null;
  }

  return rawRows.map((row) => {
    const expected = reference[row.constructorsPosition - 1] ?? "";
    const ocrNorm = normalizeForComparison(row.rawTeamText);
    const expectedNorm = normalizeForComparison(expected);
    const matches =
      Boolean(expected) &&
      (ocrNorm === expectedNorm ||
        ocrNorm.includes(expectedNorm) ||
        expectedNorm.includes(ocrNorm));

    return {
      position: row.constructorsPosition,
      rawOcrLine: row.rawOcrLine,
      rawTeamText: row.rawTeamText,
      expectedTeamText: expected,
      matches,
    };
  });
}

/**
 * @param {RawConstructorRow[]} rawRows
 * @param {import("../data/cars.js").cars[number][]} carList
 * @param {number} season
 * @param {number} tier
 */
export function matchConstructorRows(rawRows, carList, season, tier) {
  return rawRows.map((row) => {
    const match = matchCarFromText(row.rawTeamText, carList);
    const warnings = [];

    if (!match.carId) {
      warnings.push("Car not matched — select manually.");
    } else if (match.confidence < 0.75) {
      warnings.push(`Low confidence match (${Math.round(match.confidence * 100)}%).`);
    }

    return {
      season,
      tier,
      constructorsPosition: row.constructorsPosition,
      car: match.carId,
      rawCarText: row.rawTeamText,
      rawOcrLine: row.rawOcrLine,
      confidence: match.confidence,
      warnings,
    };
  });
}

/**
 * @param {{
 *   text?: string,
 *   positionWords?: OcrWord[],
 *   teamWords?: OcrWord[],
 *   positionHeight?: number,
 *   teamHeight?: number,
 *   positionText?: string,
 *   teamText?: string,
 * }} ocrPayload
 * @param {import("../data/cars.js").cars[number][]} carList
 * @param {{ season?: number | null, tier?: number | null }} defaults
 */
export function parseConstructorStandings(ocrPayload, carList, defaults = {}) {
  const text =
    typeof ocrPayload === "string" ? ocrPayload : (ocrPayload.text ?? "");
  const positionWords =
    typeof ocrPayload === "string" ? [] : (ocrPayload.positionWords ?? []);
  const teamWords =
    typeof ocrPayload === "string" ? [] : (ocrPayload.teamWords ?? []);
  const positionHeight =
    typeof ocrPayload === "string" ? 0 : (ocrPayload.positionHeight ?? 0);
  const teamHeight =
    typeof ocrPayload === "string" ? 0 : (ocrPayload.teamHeight ?? 0);
  const positionText =
    typeof ocrPayload === "string" ? "" : (ocrPayload.positionText ?? "");
  const teamText =
    typeof ocrPayload === "string" ? "" : (ocrPayload.teamText ?? "");

  const meta = extractSeasonAndTier(text);
  const season = defaults.season ?? meta.season ?? 22;
  const tier = defaults.tier ?? meta.tier ?? 1;

  const hasPositionColumn =
    positionWords.length > 0 && positionHeight > 0 && positionText.trim().length > 0;
  const hasTeamColumn = teamWords.length > 0 && teamHeight > 0 && teamText.trim().length > 0;

  let rawConstructorRows =
    hasTeamColumn && (hasPositionColumn || positionHeight > 0)
      ? extractConstructorRows(
          positionWords,
          teamWords,
          positionHeight || teamHeight,
          teamHeight,
        )
      : [];

  if (rawConstructorRows.length === 0 && teamText.trim()) {
    rawConstructorRows = extractConstructorRowsFromPrefixedTeamLines(teamText);
  }

  if (rawConstructorRows.length === 0 && positionText.trim() && teamText.trim()) {
    rawConstructorRows = extractConstructorRowsFromColumnText(
      positionText,
      teamText,
    );
  }

  const comparisonRows = compareRowsToReference(
    rawConstructorRows,
    season,
    tier,
  );
  const rows = matchConstructorRows(rawConstructorRows, carList, season, tier);

  return {
    season,
    tier,
    rawConstructorRows,
    comparisonRows,
    rows,
    extractedCarNames: rawConstructorRows.map((row) => ({
      position: row.constructorsPosition,
      rawPositionText: row.rawPositionText,
      ocrTeamName: row.rawTeamText,
      rawOcrLine: row.rawOcrLine,
    })),
    rawText: text,
  };
}

/**
 * @param {string} text
 */
export function isMostlyNumericRow(text) {
  const tokens = normalizeCarText(text).split(" ").filter(Boolean);
  if (tokens.length === 0) {
    return true;
  }
  const numericCount = tokens.filter((token) => /^\d{1,4}$/.test(token)).length;
  return numericCount / tokens.length > 0.7;
}
