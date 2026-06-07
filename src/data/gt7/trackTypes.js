/** @typedef {'road' | 'street' | 'oval' | 'dirt' | 'snow' | 'rallycross'} TrackType */

/** @typedef {'tarmac' | 'dirt' | 'snow' | 'mixed'} TrackSurface */

/** @typedef {'technical' | 'high_speed' | 'balanced' | 'traction' | 'endurance' | 'rally'} DrivingStyle */

export const TRACK_TYPES = [
  "road",
  "street",
  "oval",
  "dirt",
  "snow",
  "rallycross",
];

export const TRACK_SURFACES = ["tarmac", "dirt", "snow", "mixed"];

export const DRIVING_STYLES = [
  "technical",
  "high_speed",
  "balanced",
  "traction",
  "endurance",
  "rally",
];

export const TRACK_TYPE_LABELS = {
  road: "Road Circuit",
  street: "Street Circuit",
  oval: "Oval",
  dirt: "Dirt",
  snow: "Snow",
  rallycross: "Rallycross",
};

export const TRACK_SURFACE_LABELS = {
  tarmac: "Tarmac",
  dirt: "Dirt",
  snow: "Snow",
  mixed: "Mixed Surface",
};

export const DRIVING_STYLE_LABELS = {
  technical: "Technical",
  high_speed: "High Speed",
  balanced: "Balanced",
  traction: "Traction",
  endurance: "Endurance",
  rally: "Rally",
};
