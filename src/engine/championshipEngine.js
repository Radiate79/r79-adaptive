import { cars } from "../data/cars.js";
import { tracks } from "../data/tracks.js";

const SCORE_FIELDS = ["topSpeed", "traction", "fuel", "tyres", "stability"];

export function scoreCarForTrack(car, track) {
  return SCORE_FIELDS.reduce((total, field) => {
    const carValue = Number(car?.[field] ?? 0);
    const trackValue = Number(track?.[field] ?? 0);
    const closeness = 10 - Math.abs(carValue - trackValue);
    return total + Math.max(closeness, 0);
  }, 0);
}

export function scoreCarForChampionship(car, championshipTracks) {
  if (!Array.isArray(championshipTracks) || championshipTracks.length === 0) {
    return 0;
  }

  const total = championshipTracks.reduce((sum, track) => {
    return sum + scoreCarForTrack(car, track);
  }, 0);

  return Number((total / championshipTracks.length).toFixed(2));
}

function resolveTracksByIds(selectedTrackIds) {
  if (!Array.isArray(selectedTrackIds)) {
    return [];
  }

  return selectedTrackIds
    .map((trackId) => tracks.find((track) => track.id === trackId) ?? null)
    .filter(Boolean);
}

function normalizeClass(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isCarInClass(car, carClass) {
  if (!carClass) {
    return true;
  }

  const requestedClass = normalizeClass(carClass);
  const carClassFields = [
    car.class,
    car.carClass,
    car.category,
    car.group,
    car.name,
  ].map(normalizeClass);

  return carClassFields.some((value) => value.includes(requestedClass));
}

export function recommendCarsForChampionship(selectedTrackIds, carClass) {
  const championshipTracks = resolveTracksByIds(selectedTrackIds);
  const candidateCars = cars.filter((car) => isCarInClass(car, carClass));

  return candidateCars
    .map((car) => ({
      ...car,
      score: scoreCarForChampionship(car, championshipTracks),
    }))
    .sort((a, b) => b.score - a.score);
}

export function rankCarsForChampionship(championshipTracks, availableCars = cars) {
  const resolvedTracks = championshipTracks;

  return [...availableCars]
    .map((car) => ({
      ...car,
      score: scoreCarForChampionship(car, resolvedTracks),
    }))
    .sort((a, b) => b.score - a.score);
}

export function recommendBestCarForChampionship(
  championshipTracks,
  availableCars = cars,
) {
  const rankedCars = rankCarsForChampionship(championshipTracks, availableCars);
  return rankedCars[0] ?? null;
}
