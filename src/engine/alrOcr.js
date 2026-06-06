/**
 * OCR pipeline for ALR constructor standings screenshots.
 */

/** Narrow position column inside the right-hand constructors table. */
const POSITION_COLUMN = { start: 0.535, end: 0.565 };
/** Team column — starts after Total/Above/Lead/Points stats, before trailing PTS. */
const TEAM_COLUMN = { start: 0.74, end: 0.93 };

/** Temporary debug flag — shows raw OCR text per image in the UI. */
export const OCR_DEBUG_MODE = true;

const OCR_SCALE = 3;
const THRESHOLD_VALUE = 155;

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not read image file as data URL."));
    };

    reader.onerror = () => {
      reject(new Error("Could not read image file."));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * @param {string} dataUrl
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not decode image."));
    image.src = dataUrl;
  });
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} [threshold]
 */
export function preprocessGrayscaleThreshold(canvas, threshold = THRESHOLD_VALUE) {
  const context = canvas.getContext("2d");
  if (!context) {
    return canvas;
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  for (let index = 0; index < pixels.length; index += 4) {
    const gray =
      pixels[index] * 0.299 +
      pixels[index + 1] * 0.587 +
      pixels[index + 2] * 0.114;
    const value = gray >= threshold ? 255 : 0;
    pixels[index] = value;
    pixels[index + 1] = value;
    pixels[index + 2] = value;
    pixels[index + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * @param {HTMLImageElement | HTMLCanvasElement} source
 * @param {{ start: number, end: number }} region
 * @param {number} [scale]
 */
export function cropImageRegion(source, region, scale = OCR_SCALE) {
  const width = source.width;
  const height = source.height;
  const cropX = Math.floor(width * region.start);
  const cropEnd = Math.floor(width * region.end);
  const cropWidth = Math.max(1, cropEnd - cropX);

  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(cropWidth * scale);
  canvas.height = Math.floor(height * scale);

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare image canvas.");
  }

  context.imageSmoothingEnabled = false;
  context.drawImage(
    source,
    cropX,
    0,
    cropWidth,
    height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return preprocessGrayscaleThreshold(canvas);
}

/**
 * @param {HTMLImageElement | HTMLCanvasElement} source
 */
export function cropPositionColumn(source) {
  return cropImageRegion(source, POSITION_COLUMN);
}

/**
 * @param {HTMLImageElement | HTMLCanvasElement} source
 */
export function cropTeamColumn(source) {
  return cropImageRegion(source, TEAM_COLUMN);
}

/**
 * @param {HTMLCanvasElement} positionCanvas
 * @param {HTMLCanvasElement} teamCanvas
 */
export function stitchPositionAndTeamPreview(positionCanvas, teamCanvas) {
  const gap = 8;
  const canvas = document.createElement("canvas");
  canvas.width = positionCanvas.width + gap + teamCanvas.width;
  canvas.height = Math.max(positionCanvas.height, teamCanvas.height);

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not build combined preview.");
  }

  context.fillStyle = "#000000";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(positionCanvas, 0, 0);
  context.drawImage(teamCanvas, positionCanvas.width + gap, 0);
  return canvas;
}

/**
 * @param {import("tesseract.js").Word[]} words
 */
function normalizeOcrWords(words) {
  return (words ?? [])
    .map((word) => ({
      text: word.text?.trim() ?? "",
      bbox: word.bbox,
      confidence: word.confidence,
    }))
    .filter((word) => word.text.length > 0);
}

/**
 * @param {unknown} error
 */
export function formatOcrError(error) {
  if (error instanceof Error) {
    return error.message || error.name;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown OCR error.";
}

/**
 * @param {File} file
 * @param {string} dataUrl
 * @param {(progress: number, status: string) => void} [onProgress]
 */
export async function recognizeStandingsImage(file, dataUrl, onProgress) {
  const { createWorker, PSM } = await import("tesseract.js");
  const image = await loadImageFromDataUrl(dataUrl);

  const worker = await createWorker("eng", undefined, {
    logger: (message) => {
      if (
        message.status === "recognizing text" &&
        typeof message.progress === "number"
      ) {
        onProgress?.(message.progress, "Reading constructor columns…");
      }
    },
  });

  try {
    onProgress?.(0, "Scanning full image for season and tier…");
    const fullResult = await worker.recognize(file);
    const fullText = fullResult.data.text ?? "";

    onProgress?.(0.2, "Cropping position column…");
    const positionCanvas = cropPositionColumn(image);

    onProgress?.(0.35, "Reading position column…");
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_COLUMN,
    });
    const positionResult = await worker.recognize(positionCanvas);
    const positionText = positionResult.data.text ?? "";
    const positionWords = normalizeOcrWords(positionResult.data.words);

    onProgress?.(0.55, "Cropping Team column…");
    const teamCanvas = cropTeamColumn(image);

    onProgress?.(0.7, "Reading Team column…");
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    });
    const teamResult = await worker.recognize(teamCanvas);
    const teamText = teamResult.data.text ?? "";
    const teamWords = normalizeOcrWords(teamResult.data.words);

    const combinedPreview = stitchPositionAndTeamPreview(
      positionCanvas,
      teamCanvas,
    );

    return {
      fullText,
      positionText,
      teamText,
      combinedText: `${fullText}\n${positionText}\n${teamText}`,
      text: `${positionText}\n${teamText}`,
      positionWords,
      teamWords,
      positionWidth: positionCanvas.width,
      positionHeight: positionCanvas.height,
      teamWidth: teamCanvas.width,
      teamHeight: teamCanvas.height,
      positionPreviewUrl: positionCanvas.toDataURL("image/png"),
      teamPreviewUrl: teamCanvas.toDataURL("image/png"),
      previewUrl: combinedPreview.toDataURL("image/png"),
    };
  } catch (error) {
    throw new Error(formatOcrError(error));
  } finally {
    await worker.terminate();
  }
}
