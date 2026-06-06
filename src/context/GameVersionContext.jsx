import { createContext, useContext, useMemo, useState } from "react";
import {
  DEFAULT_GAME_VERSION,
  GAME_CATALOG,
  GAME_VERSION_ORDER,
} from "../data/gameVersions.js";

/** @typedef {import("../data/gameVersions.js").GameVersion} GameVersion */

/** @type {import('react').Context<null | {
 *   gameVersion: GameVersion,
 *   setGameVersion: (value: GameVersion) => void,
 *   game: import("../data/gameVersions.js").GameCatalogEntry,
 *   gameOptions: typeof GAME_VERSION_ORDER,
 * }>} */
const GameVersionContext = createContext(null);

export function GameVersionProvider({ children }) {
  const [gameVersion, setGameVersion] = useState(
    /** @type {GameVersion} */ (DEFAULT_GAME_VERSION),
  );

  const value = useMemo(
    () => ({
      gameVersion,
      setGameVersion,
      game: GAME_CATALOG[gameVersion],
      gameOptions: GAME_VERSION_ORDER,
    }),
    [gameVersion],
  );

  return (
    <GameVersionContext.Provider value={value}>
      {children}
    </GameVersionContext.Provider>
  );
}

export function useGameVersion() {
  const context = useContext(GameVersionContext);

  if (!context) {
    throw new Error("useGameVersion must be used within GameVersionProvider");
  }

  return context;
}
