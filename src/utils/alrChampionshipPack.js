import JSZip from "jszip";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp"]);

/**
 * @typedef {Object} ChampionshipPackMetadata
 * @property {number} season
 * @property {number} tier
 * @property {'blue' | 'white' | undefined} division
 * @property {string} zipPath
 * @property {string} fileName
 */

/**
 * @typedef {ChampionshipPackMetadata & { file: File, path: string }} ChampionshipPackImage
 */

/**
 * @param {string} extension
 */
function getImageMimeType(extension) {
  switch (extension) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    default:
      return "image/jpeg";
  }
}

/**
 * Detect season, tier, and optional Blue/White division from a ZIP entry path.
 *
 * Examples:
 * - Season20/Tier1.jpg
 * - Season20/Tier2Blue.jpg
 * - Season21/Tier4Blue.png
 *
 * @param {string} zipPath
 * @returns {{
 *   season: number | null,
 *   tier: number | null,
 *   division: 'blue' | 'white' | undefined,
 *   zipPath: string,
 *   fileName: string,
 * }}
 */
export function parseChampionshipPackPath(zipPath) {
  const normalized = zipPath.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  const fileName = parts[parts.length - 1] ?? "";
  const baseName = fileName.replace(/\.[^.]+$/, "");

  let season = null;
  for (const part of parts) {
    const seasonMatch = part.match(/^season\s*(\d{1,2})$/i);
    if (seasonMatch) {
      season = Number(seasonMatch[1]);
      break;
    }
  }

  if (season === null) {
    const seasonInPath = normalized.match(/season\s*(\d{1,2})/i);
    if (seasonInPath) {
      season = Number(seasonInPath[1]);
    }
  }

  let tier = null;
  /** @type {'blue' | 'white' | undefined} */
  let division;

  const tierPatterns = [baseName, ...parts.slice(0, -1)];
  for (const segment of tierPatterns) {
    const tierMatch = segment.match(/tier\s*(\d)\s*(blue|white)?/i);
    if (tierMatch) {
      tier = Number(tierMatch[1]);
      if (tierMatch[2]) {
        division = tierMatch[2].toLowerCase();
      }
      break;
    }
  }

  return {
    season,
    tier,
    division,
    zipPath: normalized,
    fileName,
  };
}

/**
 * @param {ChampionshipPackImage} a
 * @param {ChampionshipPackImage} b
 */
function comparePackImages(a, b) {
  if (a.season !== b.season) {
    return a.season - b.season;
  }
  if (a.tier !== b.tier) {
    return a.tier - b.tier;
  }

  const divisionOrder = { blue: 0, white: 1 };
  const aDivision = a.division ? divisionOrder[a.division] : -1;
  const bDivision = b.division ? divisionOrder[b.division] : -1;
  if (aDivision !== bDivision) {
    return aDivision - bDivision;
  }

  return a.path.localeCompare(b.path);
}

/**
 * @param {File} zipFile
 */
export async function extractChampionshipPackImages(zipFile) {
  const zip = await JSZip.loadAsync(zipFile);
  /** @type {ChampionshipPackImage[]} */
  const images = [];
  /** @type {Array<{ path: string, reason: string }>} */
  const invalid = [];

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) {
      continue;
    }

    const path = entry.name.replace(/\\/g, "/");
    const extension = path.split(".").pop()?.toLowerCase();
    if (!extension || !IMAGE_EXTENSIONS.has(extension)) {
      continue;
    }

    const parsed = parseChampionshipPackPath(path);
    if (parsed.season === null || parsed.tier === null) {
      invalid.push({
        path,
        reason: "Could not detect season and tier from folder or filename.",
      });
      continue;
    }

    const blob = await entry.async("blob");
    const file = new File([blob], parsed.fileName, {
      type: getImageMimeType(extension),
    });

    images.push({
      ...parsed,
      season: parsed.season,
      tier: parsed.tier,
      file,
      path,
    });
  }

  images.sort(comparePackImages);

  return { images, invalid };
}
