/** @typedef {'road' | 'street' | 'oval' | 'dirt' | 'snow'} TrackType */

/** @typedef {'technical' | 'high_speed' | 'balanced' | 'traction' | 'endurance' | 'rally'} DrivingStyle */

export const TRACK_TYPES = ["road", "street", "oval", "dirt", "snow"];

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
};

export const DRIVING_STYLE_LABELS = {
  technical: "Technical",
  high_speed: "High Speed",
  balanced: "Balanced",
  traction: "Traction",
  endurance: "Endurance",
  rally: "Rally",
};
