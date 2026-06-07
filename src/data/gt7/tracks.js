import { enrichTrackRecords } from "./trackMetadata.js";
import { RAW_TRACK_LAYOUTS } from "./trackFamilies.js";

export const tracks = enrichTrackRecords(RAW_TRACK_LAYOUTS);
