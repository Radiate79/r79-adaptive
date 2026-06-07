import { useMemo, useRef, useState } from "react";
import { cars } from "../data/cars.js";
import { ALR_TIER_POINTS } from "../data/alrChampionshipWeighting.js";
import { tierUsesDivision } from "../data/alrImportSlots.js";
import {
  formatOcrError,
  OCR_DEBUG_MODE,
  readFileAsDataUrl,
  recognizeStandingsImage,
} from "../engine/alrOcr.js";
import { parseConstructorStandings } from "../engine/alrStandingsParser.js";
import { extractChampionshipPackImages } from "../utils/alrChampionshipPack.js";

const SEASONS = Array.from({ length: 16 }, (_, index) => 20 + index);
const TIERS = Object.keys(ALR_TIER_POINTS)
  .map(Number)
  .sort((a, b) => a - b);
const sortedCars = [...cars].sort((a, b) => a.name.localeCompare(b.name));

function createReviewId() {
  return `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {{
 *   season: number,
 *   tier: number,
 *   car: string,
 *   constructorsPosition: number,
 * }} row
 */
function reviewRowKey(row) {
  return `${row.season}-${row.tier}-${row.division ?? ""}-${row.car || "_"}-${row.constructorsPosition}`;
}

/**
 * @param {ReturnType<typeof mapParsedToReviewRows>} rows
 * @param {ReturnType<typeof mapParsedToReviewRows>[number]} row
 */
function isDuplicateReviewRow(rows, row) {
  const key = reviewRowKey(row);
  return rows.some((existing) => reviewRowKey(existing) === key);
}

/**
 * @param {{ rows: Array<{ season: number, tier: number, car: string, constructorsPosition: number, rawCarText: string, confidence: number, warnings: string[] }> }} parsed
 */
function mapParsedToReviewRows(parsed) {
  return parsed.rows.map((row) => ({
    id: createReviewId(),
    selected: Boolean(row.car),
    season: row.season,
    tier: row.tier,
    division: undefined,
    car: row.car,
    constructorsPosition: row.constructorsPosition,
    rawCarText: row.rawCarText,
    confidence: row.confidence,
    warnings: row.warnings,
  }));
}

/**
 * @param {ReturnType<typeof mapParsedToReviewRows>} existing
 * @param {ReturnType<typeof mapParsedToReviewRows>} incoming
 */
function mergeReviewRows(existing, incoming) {
  const merged = [...existing];
  let added = 0;
  let skipped = 0;

  for (const row of incoming) {
    if (isDuplicateReviewRow(merged, row)) {
      skipped += 1;
      continue;
    }
    merged.push(row);
    added += 1;
  }

  return { merged, added, skipped };
}

/**
 * @param {File} file
 * @param {{ season: number, tier: number }} defaults
 * @param {(progress: number, status: string) => void} [onOcrProgress]
 */
async function processScreenshotFile(file, defaults, onOcrProgress) {
  const dataUrl = await readFileAsDataUrl(file);
  const ocr = await recognizeStandingsImage(file, dataUrl, onOcrProgress);
  const parsed = parseConstructorStandings(ocr, cars, defaults);

  return {
    fileName: file.name,
    dataUrl,
    ocr,
    parsed,
  };
}

/**
 * @param {{
 *   onSaveRecords: (records: import("../utils/alrStorage.js").ALRPerformanceRecord[]) => void;
 * }} props
 */
export default function ALRImageUpload({ onSaveRecords }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState("");
  const [positionPreviewUrl, setPositionPreviewUrl] = useState("");
  const [teamPreviewUrl, setTeamPreviewUrl] = useState("");
  const [rawConstructorRows, setRawConstructorRows] = useState([]);
  const [comparisonRows, setComparisonRows] = useState([]);
  const [ocrDebugLogs, setOcrDebugLogs] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [defaultSeason, setDefaultSeason] = useState(22);
  const [defaultTier, setDefaultTier] = useState(1);
  const [defaultDivision, setDefaultDivision] = useState("");
  const [reviewRows, setReviewRows] = useState([]);
  const [packSummary, setPackSummary] = useState(null);
  const singleFileInputRef = useRef(null);
  const bulkFileInputRef = useRef(null);
  const zipFileInputRef = useRef(null);

  const carById = useMemo(
    () => new Map(cars.map((car) => [car.id, car])),
    [],
  );

  const selectedCount = reviewRows.filter((row) => row.selected).length;

  const updateRow = (id, patch) => {
    setReviewRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  /**
   * @param {{
   *   fileName: string,
   *   ocr: import("../engine/alrOcr.js").RecognizeStandingsResult,
   *   parsed: ReturnType<typeof parseConstructorStandings>,
   * }} result
   * @param {{
   *   season: number,
   *   tier: number,
   *   division?: 'blue' | 'white',
   *   zipPath?: string,
   * } | null} [metadata]
   */
  const buildResultArtifacts = (result, metadata = null) => {
    const { ocr, parsed } = result;
    const sourceLabel = metadata?.zipPath ?? result.fileName;
    const incomingRows = mapParsedToReviewRows(parsed).map((row) => {
      const tier = metadata?.tier ?? row.tier;
      const division = metadata
        ? metadata.division
        : tierUsesDivision(tier) && defaultDivision
          ? defaultDivision
          : undefined;

      return {
        ...row,
        season: metadata?.season ?? row.season,
        tier,
        division,
      };
    });
    const rawRows = (parsed.rawConstructorRows ?? []).map((row) => ({
      ...row,
      sourceImage: sourceLabel,
    }));
    const comparison = (parsed.comparisonRows ?? []).map((row) => ({
      ...row,
      sourceImage: sourceLabel,
    }));

    const debugEntry = {
      fileName: sourceLabel,
      positionText: ocr.positionText ?? "",
      teamText: ocr.teamText ?? "",
      positionWordCount: ocr.positionWords?.length ?? 0,
      teamWordCount: ocr.teamWords?.length ?? 0,
      extractedRowCount: parsed.rawConstructorRows?.length ?? 0,
      matchedRowCount: parsed.rows?.length ?? 0,
    };

    return { incomingRows, rawRows, comparison, ocr, parsed, debugEntry };
  };

  const applyPreviewFromResult = (result, parsed) => {
    setPreviewUrl(result.dataUrl);
    setOcrPreviewUrl(result.ocr.previewUrl);
    setPositionPreviewUrl(result.ocr.positionPreviewUrl ?? "");
    setTeamPreviewUrl(result.ocr.teamPreviewUrl ?? "");

    if (parsed.season) {
      setDefaultSeason(parsed.season);
    }
    if (parsed.tier) {
      setDefaultTier(parsed.tier);
    }
  };

  const mergeRawRows = (current, incoming) => {
    const merged = [...current];
    for (const row of incoming) {
      const key = `${row.sourceImage}-${row.constructorsPosition}-${row.rawTeamText}`;
      if (
        !merged.some(
          (existing) =>
            `${existing.sourceImage}-${existing.constructorsPosition}-${existing.rawTeamText}` ===
            key,
        )
      ) {
        merged.push(row);
      }
    }
    return merged;
  };

  const mergeComparisonRows = (current, incoming) => {
    const merged = [...current];
    for (const row of incoming) {
      const key = `${row.sourceImage}-${row.position}`;
      if (
        !merged.some(
          (existing) => `${existing.sourceImage}-${existing.position}` === key,
        )
      ) {
        merged.push(row);
      }
    }
    return merged;
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setStatus("Reading screenshot…");
    setError("");
    setPackSummary(null);
    setReviewRows([]);
    setOcrPreviewUrl("");
    setPositionPreviewUrl("");
    setTeamPreviewUrl("");
    setRawConstructorRows([]);
    setComparisonRows([]);
    setOcrDebugLogs([]);

    try {
      const result = await processScreenshotFile(
        file,
        { season: defaultSeason, tier: defaultTier },
        (value, message) => {
          setProgress(Math.round(value * 100));
          setStatus(message);
        },
      );

      const { incomingRows, rawRows, comparison, parsed, debugEntry } =
        buildResultArtifacts(result);
      applyPreviewFromResult(result, parsed);
      setRawConstructorRows(rawRows);
      setComparisonRows(comparison);
      setReviewRows(incomingRows);
      if (OCR_DEBUG_MODE) {
        setOcrDebugLogs([debugEntry]);
      }

      setStatus(
        incomingRows.length > 0
          ? `Extracted ${incomingRows.length} constructor row(s). Review raw OCR text before car matching and saving.`
          : "No constructor rows detected in position/team columns. Adjust season/tier or try another screenshot.",
      );
    } catch (caughtError) {
      setError(formatOcrError(caughtError));
      setStatus("");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleBulkFileChange = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) {
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError("");
    setPackSummary(null);

    let totalAdded = 0;
    let totalSkipped = 0;
    const errors = [];
    let accumulatedReview = [...reviewRows];
    let accumulatedRaw = [...rawConstructorRows];
    let accumulatedComparison = [...comparisonRows];
    let accumulatedDebug = [...ocrDebugLogs];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const imageNumber = index + 1;
      setStatus(`Processing image ${imageNumber} of ${files.length}…`);
      setProgress(Math.round((index / files.length) * 100));

      try {
        const result = await processScreenshotFile(
          file,
          { season: defaultSeason, tier: defaultTier },
          (_value, message) => {
            setStatus(`Processing image ${imageNumber} of ${files.length}… ${message}`);
          },
        );

        const { incomingRows, rawRows, comparison, parsed, debugEntry } =
          buildResultArtifacts(result);
        applyPreviewFromResult(result, parsed);

        if (OCR_DEBUG_MODE) {
          accumulatedDebug = [...accumulatedDebug, debugEntry];
          setOcrDebugLogs(accumulatedDebug);
        }

        const mergeResult = mergeReviewRows(accumulatedReview, incomingRows);
        accumulatedReview = mergeResult.merged;
        accumulatedRaw = mergeRawRows(accumulatedRaw, rawRows);
        accumulatedComparison = mergeComparisonRows(
          accumulatedComparison,
          comparison,
        );
        totalAdded += mergeResult.added;
        totalSkipped += mergeResult.skipped;
      } catch (caughtError) {
        errors.push(`${file.name}: ${formatOcrError(caughtError)}`);
      }
    }

    setReviewRows(accumulatedReview);
    setRawConstructorRows(accumulatedRaw);
    setComparisonRows(accumulatedComparison);
    setProgress(100);

    if (errors.length > 0) {
      setError(errors.join(" | "));
    }

    setStatus(
      `Processed ${files.length} image(s). Added ${totalAdded} record(s)${totalSkipped > 0 ? `, skipped ${totalSkipped} duplicate(s)` : ""}.`,
    );
    setIsProcessing(false);
    setProgress(0);
  };

  const handleZipFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError("");
    setPackSummary(null);

    let totalAdded = 0;
    let totalSkipped = 0;
    /** @type {Array<{ path: string, reason: string }>} */
    const failed = [];
    let accumulatedReview = [...reviewRows];
    let accumulatedRaw = [...rawConstructorRows];
    let accumulatedComparison = [...comparisonRows];
    let accumulatedDebug = [...ocrDebugLogs];

    try {
      setStatus("Extracting images from championship pack…");
      const { images, invalid } = await extractChampionshipPackImages(file);
      failed.push(...invalid);

      if (images.length === 0 && invalid.length === 0) {
        setError("No image files found in ZIP.");
        setStatus("");
        setIsProcessing(false);
        return;
      }

      for (let index = 0; index < images.length; index += 1) {
        const image = images[index];
        const imageNumber = index + 1;
        setStatus(`Processing image ${imageNumber} of ${images.length}…`);
        setProgress(Math.round((index / images.length) * 100));

        try {
          const result = await processScreenshotFile(
            image.file,
            { season: image.season, tier: image.tier },
            (_value, message) => {
              setStatus(
                `Processing image ${imageNumber} of ${images.length}… ${message}`,
              );
            },
          );

          const metadata = {
            season: image.season,
            tier: image.tier,
            division: image.division,
            zipPath: image.path,
          };
          const artifacts = buildResultArtifacts(
            { ...result, fileName: image.path },
            metadata,
          );
          applyPreviewFromResult(result, artifacts.parsed);
          setDefaultSeason(image.season);
          setDefaultTier(image.tier);
          setDefaultDivision(image.division ?? "");

          if (OCR_DEBUG_MODE) {
            accumulatedDebug = [...accumulatedDebug, artifacts.debugEntry];
            setOcrDebugLogs(accumulatedDebug);
          }

          const mergeResult = mergeReviewRows(
            accumulatedReview,
            artifacts.incomingRows,
          );
          accumulatedReview = mergeResult.merged;
          accumulatedRaw = mergeRawRows(accumulatedRaw, artifacts.rawRows);
          accumulatedComparison = mergeComparisonRows(
            accumulatedComparison,
            artifacts.comparison,
          );
          totalAdded += mergeResult.added;
          totalSkipped += mergeResult.skipped;
        } catch (caughtError) {
          failed.push({
            path: image.path,
            reason: formatOcrError(caughtError),
          });
        }
      }

      setReviewRows(accumulatedReview);
      setRawConstructorRows(accumulatedRaw);
      setComparisonRows(accumulatedComparison);
      setProgress(100);

      const summary = {
        totalImagesProcessed: images.length,
        recordsAdded: totalAdded,
        duplicatesSkipped: totalSkipped,
        failed,
      };
      setPackSummary(summary);

      if (failed.length > 0) {
        setError(
          failed.map((entry) => `${entry.path}: ${entry.reason}`).join(" | "),
        );
      }

      setStatus(
        `Championship pack import complete. Processed ${summary.totalImagesProcessed} image(s). Added ${summary.recordsAdded} record(s). Skipped ${summary.duplicatesSkipped} duplicate(s). ${summary.failed.length} failed.`,
      );
    } catch (caughtError) {
      setError(formatOcrError(caughtError));
      setStatus("");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleApplyDefaults = () => {
    setReviewRows((current) =>
      current.map((row) => ({
        ...row,
        season: defaultSeason,
        tier: defaultTier,
        division: tierUsesDivision(defaultTier) ? defaultDivision || undefined : undefined,
      })),
    );
    setStatus("Applied season, tier, and division to all review rows.");
  };

  const handleSaveReviewed = () => {
    const selected = reviewRows.filter((row) => row.selected);
    if (selected.length === 0) {
      setStatus("Select at least one row to save.");
      return;
    }

    const invalid = selected.find(
      (row) =>
        !row.car ||
        !Number.isInteger(row.constructorsPosition) ||
        row.constructorsPosition < 1 ||
        row.constructorsPosition > 15,
    );

    if (invalid) {
      setStatus("Each selected row needs a matched car and position 1–15.");
      return;
    }

    const records = selected.map((row) => ({
      season: Number(row.season),
      tier: Number(row.tier),
      car: row.car,
      constructorsPosition: Number(row.constructorsPosition),
      ...(tierUsesDivision(Number(row.tier)) && row.division
        ? { division: row.division }
        : {}),
    }));

    onSaveRecords(records);
    setStatus(`Saved ${records.length} record(s).`);
    setReviewRows([]);
    setRawConstructorRows([]);
    setComparisonRows([]);
    setOcrDebugLogs([]);
    setPreviewUrl("");
    setOcrPreviewUrl("");
    setPositionPreviewUrl("");
    setTeamPreviewUrl("");
  };

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Race Data Import (OCR)</h3>
      <p style={styles.subtitle}>
        Upload one screenshot, multiple images, or a race data pack ZIP. OCR
        reads position and Team columns, merges results into a single review
        list, and skips duplicates.
      </p>

      <div style={styles.defaultsRow}>
        <label style={styles.field}>
          Default Season
          <select
            value={defaultSeason}
            onChange={(event) => setDefaultSeason(Number(event.target.value))}
            style={styles.select}
            disabled={isProcessing}
          >
            {SEASONS.map((value) => (
              <option key={value} value={value}>
                Season {value}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.field}>
          Default Tier
          <select
            value={defaultTier}
            onChange={(event) => {
              const nextTier = Number(event.target.value);
              setDefaultTier(nextTier);
              if (!tierUsesDivision(nextTier)) {
                setDefaultDivision("");
              }
            }}
            style={styles.select}
            disabled={isProcessing}
          >
            {TIERS.map((value) => (
              <option key={value} value={value}>
                Tier {value}
              </option>
            ))}
          </select>
        </label>

        {tierUsesDivision(defaultTier) ? (
          <label style={styles.field}>
            Default Division
            <select
              value={defaultDivision}
              onChange={(event) => setDefaultDivision(event.target.value)}
              style={styles.select}
              disabled={isProcessing}
            >
              <option value="">— Select —</option>
              <option value="blue">Blue</option>
              <option value="white">White</option>
            </select>
          </label>
        ) : null}

        <div style={styles.uploadActions}>
          <input
            ref={singleFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isProcessing}
            style={styles.hiddenFileInput}
          />
          <input
            ref={bulkFileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleBulkFileChange}
            disabled={isProcessing}
            style={styles.hiddenFileInput}
          />
          <input
            ref={zipFileInputRef}
            type="file"
            accept=".zip,application/zip"
            onChange={handleZipFileChange}
            disabled={isProcessing}
            style={styles.hiddenFileInput}
          />
          <button
            type="button"
            onClick={() => singleFileInputRef.current?.click()}
            disabled={isProcessing}
            style={styles.secondaryButton}
          >
            Upload Screenshot
          </button>
          <button
            type="button"
            onClick={() => bulkFileInputRef.current?.click()}
            disabled={isProcessing}
            style={styles.primaryButton}
          >
            Upload Multiple Screenshots
          </button>
          <button
            type="button"
            onClick={() => zipFileInputRef.current?.click()}
            disabled={isProcessing}
            style={styles.primaryButton}
          >
            Import Race Data Pack (.zip)
          </button>
        </div>
      </div>

      {isProcessing ? (
        <div style={styles.progressBlock}>
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${Math.max(progress, 8)}%`,
              }}
            />
          </div>
          <p style={styles.status}>{status}</p>
        </div>
      ) : null}

      {error ? <p style={styles.error}>{error}</p> : null}
      {!isProcessing && status ? <p style={styles.status}>{status}</p> : null}

      {packSummary ? (
        <div style={styles.summaryPanel}>
          <h4 style={styles.summaryTitle}>Race Data Pack Import Summary</h4>
          <ul style={styles.summaryList}>
            <li style={styles.summaryItem}>
              Total images processed:{" "}
              <strong>{packSummary.totalImagesProcessed}</strong>
            </li>
            <li style={styles.summaryItem}>
              Records added: <strong>{packSummary.recordsAdded}</strong>
            </li>
            <li style={styles.summaryItem}>
              Duplicates skipped:{" "}
              <strong>{packSummary.duplicatesSkipped}</strong>
            </li>
            <li style={styles.summaryItem}>
              Failed images: <strong>{packSummary.failed.length}</strong>
            </li>
          </ul>
          {packSummary.failed.length > 0 ? (
            <ul style={styles.failedList}>
              {packSummary.failed.map((entry) => (
                <li key={entry.path} style={styles.failedItem}>
                  <span style={styles.failedPath}>{entry.path}</span>
                  <span style={styles.failedReason}>{entry.reason}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {(previewUrl || ocrPreviewUrl || positionPreviewUrl || teamPreviewUrl) && (
        <div style={styles.previewGrid}>
          {previewUrl ? (
            <figure style={styles.previewFigure}>
              <figcaption style={styles.previewCaption}>Original</figcaption>
              <img src={previewUrl} alt="Uploaded race standings" style={styles.previewImage} />
            </figure>
          ) : null}
          {ocrPreviewUrl ? (
            <figure style={styles.previewFigure}>
              <figcaption style={styles.previewCaption}>Pos + Team columns</figcaption>
              <img src={ocrPreviewUrl} alt="Position and Team columns" style={styles.previewImage} />
            </figure>
          ) : null}
          {positionPreviewUrl ? (
            <figure style={styles.previewFigure}>
              <figcaption style={styles.previewCaption}>Position column</figcaption>
              <img src={positionPreviewUrl} alt="Position column crop" style={styles.previewImage} />
            </figure>
          ) : null}
          {teamPreviewUrl ? (
            <figure style={styles.previewFigure}>
              <figcaption style={styles.previewCaption}>Team column</figcaption>
              <img src={teamPreviewUrl} alt="Team column crop" style={styles.previewImage} />
            </figure>
          ) : null}
        </div>
      )}

      {OCR_DEBUG_MODE && ocrDebugLogs.length > 0 ? (
        <div style={styles.debugPanel}>
          <h4 style={styles.extractedTitle}>OCR Debug (temporary)</h4>
          <p style={styles.extractedHint}>
            Raw column text for each image before constructor matching.
          </p>
          {ocrDebugLogs.map((entry) => (
            <div key={entry.fileName} style={styles.debugEntry}>
              <p style={styles.debugFileName}>{entry.fileName}</p>
              <p style={styles.debugMeta}>
                Position words: {entry.positionWordCount} | Team words:{" "}
                {entry.teamWordCount} | Extracted rows: {entry.extractedRowCount}{" "}
                | Matched rows: {entry.matchedRowCount}
              </p>
              <div style={styles.debugColumns}>
                <div style={styles.debugColumn}>
                  <span style={styles.debugLabel}>Raw position OCR output</span>
                  <pre style={styles.debugPre}>
                    {entry.positionText || "(empty)"}
                  </pre>
                </div>
                <div style={styles.debugColumn}>
                  <span style={styles.debugLabel}>Raw team OCR output</span>
                  <pre style={styles.debugPre}>{entry.teamText || "(empty)"}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {rawConstructorRows.length > 0 ? (
        <div style={styles.extractedPanel}>
          <h4 style={styles.extractedTitle}>Raw OCR Extraction (before car matching)</h4>
          <p style={styles.extractedHint}>
            Each row shows the position and Team column text read directly from OCR.
          </p>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Pos</th>
                  <th style={styles.th}>Raw Position OCR</th>
                  <th style={styles.th}>Raw Team OCR</th>
                  <th style={styles.th}>Combined Line</th>
                </tr>
              </thead>
              <tbody>
                {rawConstructorRows.map((row) => (
                  <tr
                    key={`raw-${row.sourceImage ?? "single"}-${row.constructorsPosition}-${row.rawTeamText}`}
                  >
                    <td style={styles.tdNumeric}>{row.constructorsPosition}</td>
                    <td style={styles.td}>{row.rawPositionText}</td>
                    <td style={styles.td}>{row.rawTeamText}</td>
                    <td style={styles.tdRaw}>{row.rawOcrLine}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {comparisonRows && comparisonRows.length > 0 ? (
        <div style={styles.comparisonPanel}>
          <h4 style={styles.extractedTitle}>
            OCR vs Constructor Table (Season {defaultSeason} Tier {defaultTier})
          </h4>
          <p style={styles.extractedHint}>
            Compares raw OCR Team text against the known standings for this season/tier.
          </p>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Pos</th>
                  <th style={styles.th}>OCR Team Text</th>
                  <th style={styles.th}>Expected Team</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr
                    key={`cmp-${row.sourceImage ?? "single"}-${row.position}`}
                    style={row.matches ? styles.matchRow : styles.mismatchRow}
                  >
                    <td style={styles.tdNumeric}>{row.position}</td>
                    <td style={styles.td}>{row.rawTeamText || "—"}</td>
                    <td style={styles.td}>{row.expectedTeamText || "—"}</td>
                    <td style={styles.td}>
                      {row.matches ? (
                        <span style={styles.statusOk}>Match</span>
                      ) : (
                        <span style={styles.statusBad}>Mismatch</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {reviewRows.length > 0 ? (
        <div style={styles.reviewBlock}>
          <div style={styles.reviewHeader}>
            <h4 style={styles.reviewTitle}>Car Matching & Save Review</h4>
            <div style={styles.reviewActions}>
              <button
                type="button"
                onClick={handleApplyDefaults}
                style={styles.secondaryButton}
              >
                Apply Season/Tier/Division to All
              </button>
              <button
                type="button"
                onClick={handleSaveReviewed}
                style={styles.primaryButton}
                disabled={selectedCount === 0}
              >
                Save {selectedCount} Selected
              </button>
            </div>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thCheck} />
                  <th style={styles.th}>Season</th>
                  <th style={styles.th}>Tier</th>
                  <th style={styles.th}>Div</th>
                  <th style={styles.th}>Car</th>
                  <th style={styles.th}>OCR Text</th>
                  <th style={styles.th}>Pos</th>
                </tr>
              </thead>
              <tbody>
                {reviewRows.map((row) => {
                  const car = carById.get(row.car);
                  const hasWarning = row.warnings.length > 0 || !row.car;
                  return (
                    <tr
                      key={row.id}
                      style={hasWarning ? styles.warningRow : undefined}
                    >
                      <td style={styles.tdCheck}>
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={(event) =>
                            updateRow(row.id, { selected: event.target.checked })
                          }
                        />
                      </td>
                      <td style={styles.td}>
                        <select
                          value={row.season}
                          onChange={(event) =>
                            updateRow(row.id, {
                              season: Number(event.target.value),
                            })
                          }
                          style={styles.tableSelect}
                        >
                          {SEASONS.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={styles.td}>
                        <select
                          value={row.tier}
                          onChange={(event) => {
                            const nextTier = Number(event.target.value);
                            updateRow(row.id, {
                              tier: nextTier,
                              division: tierUsesDivision(nextTier)
                                ? row.division
                                : undefined,
                            });
                          }}
                          style={styles.tableSelect}
                        >
                          {TIERS.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={styles.td}>
                        {tierUsesDivision(row.tier) ? (
                          <select
                            value={row.division ?? ""}
                            onChange={(event) =>
                              updateRow(row.id, {
                                division: event.target.value || undefined,
                              })
                            }
                            style={styles.tableSelect}
                          >
                            <option value="">—</option>
                            <option value="blue">Blue</option>
                            <option value="white">White</option>
                          </select>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={styles.td}>
                        <select
                          value={row.car}
                          onChange={(event) =>
                            updateRow(row.id, {
                              car: event.target.value,
                              warnings: [],
                            })
                          }
                          style={styles.tableSelect}
                        >
                          <option value="">— Select car —</option>
                          {sortedCars.map((carOption) => (
                            <option key={carOption.id} value={carOption.id}>
                              {carOption.name}
                            </option>
                          ))}
                        </select>
                        {car ? (
                          <span style={styles.carHint}>{car.class}</span>
                        ) : null}
                        {row.warnings.map((warning) => (
                          <span key={warning} style={styles.warningText}>
                            {warning}
                          </span>
                        ))}
                      </td>
                      <td style={styles.tdRaw}>{row.rawCarText}</td>
                      <td style={styles.td}>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          value={row.constructorsPosition}
                          onChange={(event) =>
                            updateRow(row.id, {
                              constructorsPosition: Number(event.target.value),
                            })
                          }
                          style={styles.tableInput}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  panel: {
    background: "rgba(9, 14, 24, 0.88)",
    border: "1px solid rgba(123, 153, 219, 0.3)",
    borderRadius: "12px",
    marginBottom: "14px",
    padding: "14px",
  },
  title: {
    margin: "0 0 6px",
    fontSize: "1rem",
    color: "#e8efff",
  },
  subtitle: {
    margin: "0 0 12px",
    color: "rgba(205, 217, 255, 0.8)",
    fontSize: "0.88rem",
  },
  defaultsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginBottom: "12px",
  },
  field: {
    color: "#dce9ff",
    display: "grid",
    gap: "6px",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  uploadLabel: {
    marginTop: "auto",
  },
  uploadActions: {
    alignItems: "end",
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    gridColumn: "1 / -1",
    justifyContent: "flex-start",
  },
  hiddenFileInput: {
    display: "none",
  },
  select: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "8px",
    color: "#dbe6ff",
    fontSize: "0.9rem",
    padding: "8px 10px",
  },
  fileInput: {
    color: "#dbe6ff",
    fontSize: "0.85rem",
  },
  progressBlock: {
    marginBottom: "12px",
  },
  progressTrack: {
    background: "rgba(20, 30, 52, 0.65)",
    borderRadius: "999px",
    height: "8px",
    overflow: "hidden",
  },
  progressFill: {
    background: "linear-gradient(90deg, #2b56c8, #3e79ff)",
    height: "100%",
    transition: "width 0.2s ease",
  },
  status: {
    margin: "10px 0 0",
    color: "#9bc0ff",
    fontSize: "0.88rem",
  },
  error: {
    margin: "10px 0 0",
    color: "#ffb8b8",
    fontSize: "0.88rem",
    fontWeight: 600,
  },
  summaryPanel: {
    background: "rgba(16, 24, 42, 0.65)",
    border: "1px solid rgba(113, 143, 209, 0.35)",
    borderRadius: "10px",
    marginBottom: "12px",
    padding: "12px",
  },
  summaryTitle: {
    color: "#e8efff",
    fontSize: "0.92rem",
    margin: "0 0 8px",
  },
  summaryList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  summaryItem: {
    color: "#d8e3ff",
    fontSize: "0.88rem",
    padding: "3px 0",
  },
  failedList: {
    listStyle: "none",
    margin: "10px 0 0",
    padding: 0,
  },
  failedItem: {
    borderTop: "1px solid rgba(130, 153, 210, 0.2)",
    display: "grid",
    gap: "4px",
    padding: "8px 0",
  },
  failedPath: {
    color: "#f3f7ff",
    fontSize: "0.84rem",
    fontWeight: 600,
  },
  failedReason: {
    color: "#ffb8b8",
    fontSize: "0.82rem",
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    marginBottom: "12px",
  },
  previewFigure: {
    margin: 0,
  },
  previewCaption: {
    color: "#b8cdff",
    fontSize: "0.8rem",
    marginBottom: "6px",
  },
  previewImage: {
    border: "1px solid rgba(130, 153, 210, 0.25)",
    borderRadius: "8px",
    maxHeight: "220px",
    objectFit: "contain",
    width: "100%",
    background: "rgba(0, 0, 0, 0.35)",
  },
  extractedPanel: {
    background: "rgba(16, 24, 42, 0.65)",
    border: "1px solid rgba(113, 143, 209, 0.35)",
    borderRadius: "10px",
    marginBottom: "12px",
    padding: "12px",
  },
  comparisonPanel: {
    background: "rgba(18, 28, 48, 0.65)",
    border: "1px solid rgba(113, 143, 209, 0.35)",
    borderRadius: "10px",
    marginBottom: "12px",
    padding: "12px",
  },
  debugPanel: {
    background: "rgba(28, 22, 48, 0.7)",
    border: "1px solid rgba(160, 130, 220, 0.4)",
    borderRadius: "10px",
    marginBottom: "12px",
    padding: "12px",
  },
  debugEntry: {
    borderTop: "1px solid rgba(130, 153, 210, 0.2)",
    marginTop: "10px",
    paddingTop: "10px",
  },
  debugFileName: {
    color: "#e8efff",
    fontSize: "0.88rem",
    fontWeight: 700,
    margin: "0 0 4px",
  },
  debugMeta: {
    color: "rgba(205, 217, 255, 0.7)",
    fontSize: "0.78rem",
    margin: "0 0 8px",
  },
  debugColumns: {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  },
  debugColumn: {
    display: "grid",
    gap: "6px",
  },
  debugLabel: {
    color: "#b8cdff",
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  debugPre: {
    background: "rgba(8, 12, 22, 0.9)",
    border: "1px solid rgba(130, 153, 210, 0.25)",
    borderRadius: "8px",
    color: "#dce8ff",
    fontFamily: "Consolas, Monaco, monospace",
    fontSize: "0.78rem",
    margin: 0,
    maxHeight: "220px",
    overflow: "auto",
    padding: "10px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  matchRow: {
    background: "rgba(30, 70, 40, 0.18)",
  },
  mismatchRow: {
    background: "rgba(80, 40, 40, 0.18)",
  },
  statusOk: {
    color: "#b8ffb8",
    fontWeight: 600,
  },
  statusBad: {
    color: "#ffb8b8",
    fontWeight: 600,
  },
  extractedTitle: {
    color: "#e8efff",
    fontSize: "0.95rem",
    margin: "0 0 6px",
  },
  extractedHint: {
    color: "rgba(205, 217, 255, 0.75)",
    fontSize: "0.82rem",
    margin: "0 0 10px",
  },
  extractedList: {
    display: "grid",
    gap: "6px",
    margin: 0,
    paddingLeft: "18px",
  },
  extractedItem: {
    alignItems: "baseline",
    color: "#dce8ff",
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.86rem",
    gap: "8px",
  },
  extractedPosition: {
    color: "#9bc0ff",
    fontWeight: 700,
    minWidth: "28px",
  },
  extractedOcr: {
    color: "#f3f7ff",
    fontWeight: 600,
  },
  extractedArrow: {
    color: "rgba(205, 217, 255, 0.55)",
  },
  extractedMatch: {
    color: "#b8ffb8",
    fontWeight: 600,
  },
  extractedUnmatched: {
    color: "#ffb8b8",
  },
  reviewBlock: {
    marginTop: "4px",
  },
  reviewHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  reviewTitle: {
    margin: 0,
    color: "#e8efff",
    fontSize: "0.95rem",
  },
  reviewActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  primaryButton: {
    background: "linear-gradient(90deg, #2b56c8, #3e79ff)",
    border: "1px solid #77a0ff",
    borderRadius: "999px",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 600,
    padding: "8px 16px",
  },
  secondaryButton: {
    background: "rgba(20, 28, 48, 0.9)",
    border: "1px solid rgba(141, 169, 233, 0.35)",
    borderRadius: "999px",
    color: "#d8e3ff",
    cursor: "pointer",
    fontWeight: 600,
    padding: "8px 16px",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    borderCollapse: "collapse",
    width: "100%",
    fontSize: "0.84rem",
  },
  th: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.35)",
    color: "#b8cdff",
    fontWeight: 600,
    padding: "8px 8px",
    textAlign: "left",
  },
  thCheck: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.35)",
    padding: "8px 4px",
    width: "28px",
  },
  td: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.2)",
    color: "#f3f7ff",
    padding: "8px 8px",
    verticalAlign: "top",
  },
  tdNumeric: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.2)",
    color: "#9bc0ff",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    padding: "8px 8px",
    verticalAlign: "top",
  },
  tdCheck: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.2)",
    padding: "8px 4px",
    verticalAlign: "top",
  },
  tdRaw: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.2)",
    color: "rgba(205, 217, 255, 0.7)",
    fontSize: "0.8rem",
    maxWidth: "180px",
    padding: "8px 8px",
    verticalAlign: "top",
    wordBreak: "break-word",
  },
  tableSelect: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "6px",
    color: "#dbe6ff",
    fontSize: "0.82rem",
    maxWidth: "220px",
    padding: "6px 8px",
    width: "100%",
  },
  tableInput: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "6px",
    color: "#dbe6ff",
    fontSize: "0.82rem",
    padding: "6px 8px",
    width: "64px",
  },
  warningRow: {
    background: "rgba(80, 40, 40, 0.18)",
  },
  warningText: {
    color: "#ffb8b8",
    display: "block",
    fontSize: "0.76rem",
    marginTop: "4px",
  },
  carHint: {
    color: "rgba(205, 217, 255, 0.65)",
    display: "block",
    fontSize: "0.76rem",
    marginTop: "4px",
  },
};
