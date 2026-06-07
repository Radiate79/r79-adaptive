import { useRef, useState } from "react";

import { GAME_CATALOG } from "./data/gameVersions.js";

import { GameVersionProvider, useGameVersion } from "./context/GameVersionContext.jsx";

import ALRDataEntry from "./components/ALRDataEntry.jsx";

import ALRHistoricalRankings from "./components/ALRHistoricalRankings.jsx";

import CarProfiles from "./components/CarProfiles.jsx";

import ChampionshipAdvisor from "./components/ChampionshipAdvisor.jsx";

import FounderConsole from "./components/FounderConsole.jsx";

import AIRaceEngineer from "./components/AIRaceEngineer.jsx";

import R79Archive from "./components/R79Archive.jsx";

import R79Labs from "./components/R79Labs.jsx";

import Membership from "./components/Membership.jsx";

import Pathfinder from "./components/Pathfinder.jsx";

import ThePromise from "./components/ThePromise.jsx";

import ALRCorner from "./components/ALRCorner.jsx";

import SettingsHub from "./components/SettingsHub.jsx";

import SplashScreen from "./components/SplashScreen.jsx";

import R79Emblem from "./components/branding/R79Emblem.jsx";

import TeamCarShortlistAdvisor from "./components/TeamCarShortlistAdvisor.jsx";

import TodaysRaceAdvisor from "./components/TodaysRaceAdvisor.jsx";

import WheelSettingsHub from "./components/WheelSettingsHub.jsx";

import { hasSeenSplash } from "./utils/splashStorage.js";



const PAGES = [
  { id: "todays-race", label: "Today's Race" },
  { id: "ai-engineer", label: "AI Race Engineer" },
  { id: "wheel-settings", label: "Wheel Settings" },
  { id: "advisor", label: "Championship Advisor" },
  { id: "shortlist", label: "Team Car Shortlist" },
  { id: "alr", label: "Race Archive" },
  { id: "rankings", label: "Historical Rankings" },
  { id: "profiles", label: "Car Profiles" },

  { id: "alr-corner", label: "ALR Corner" },

  { id: "archive", label: "R79 Archive" },

  { id: "labs", label: "R79 Labs" },

  { id: "promise", label: "The Promise" },

  { id: "membership", label: "Membership" },

  { id: "pathfinder", label: "Pathfinder" },

  { id: "settings", label: "Settings" },

];



const RACE_DATA_PAGES = new Set(["rankings", "alr"]);

const LOGO_CLICKS_REQUIRED = 5;

const LOGO_CLICK_RESET_MS = 3000;



function AppShell() {

  const [page, setPage] = useState("todays-race");
  const [settingsBootView, setSettingsBootView] = useState(null);
  const [wheelSettingsPrefill, setWheelSettingsPrefill] = useState(null);

  const [showSplash, setShowSplash] = useState(() => !hasSeenSplash());

  const [showFounderConsole, setShowFounderConsole] = useState(false);

  const logoClickCount = useRef(0);

  const logoClickTimer = useRef(null);

  const { gameVersion, setGameVersion, gameOptions } = useGameVersion();

  const showRaceDataNotice =
    RACE_DATA_PAGES.has(page) && gameVersion !== "gt7";

  const renderPage = () => {
    switch (page) {
      case "todays-race":
        return <TodaysRaceAdvisor />;
      case "ai-engineer":
        return (
          <AIRaceEngineer
            onOpenWheelSettings={(prefill) => {
              setWheelSettingsPrefill(prefill);
              setPage("wheel-settings");
            }}
          />
        );
      case "wheel-settings":
        return (
          <WheelSettingsHub
            prefill={wheelSettingsPrefill}
            onPrefillConsumed={() => setWheelSettingsPrefill(null)}
          />
        );
      case "advisor":
        return <ChampionshipAdvisor />;
      case "shortlist":
        return <TeamCarShortlistAdvisor />;
      case "rankings":
        return <ALRHistoricalRankings />;
      case "profiles":
        return <CarProfiles />;
      case "alr":
        return <ALRDataEntry />;
      case "alr-corner":
        return <ALRCorner />;
      case "archive":
        return (
          <R79Archive
            onNavigate={(view) => {
              if (view === "settings" || view === "about") {
                setPage("settings");
              }
            }}
          />
        );
      case "promise":
        return <ThePromise />;
      case "membership":
        return <Membership onOpenPathfinder={() => setPage("pathfinder")} />;
      case "pathfinder":
        return <Pathfinder />;
      case "labs":
        return (
          <R79Labs
            onOpenDataReports={() => {
              setSettingsBootView("dataReports");
              setPage("settings");
            }}
          />
        );
      case "settings":
        return (
          <SettingsHub
            bootView={settingsBootView}
            onBootViewConsumed={() => setSettingsBootView(null)}
          />
        );
      default:
        return null;
    }
  };

  const handleLogoClick = () => {

    if (logoClickTimer.current) {

      clearTimeout(logoClickTimer.current);

    }



    logoClickCount.current += 1;



    if (logoClickCount.current >= LOGO_CLICKS_REQUIRED) {

      logoClickCount.current = 0;

      setShowFounderConsole(true);

      return;

    }



    logoClickTimer.current = setTimeout(() => {

      logoClickCount.current = 0;

      logoClickTimer.current = null;

    }, LOGO_CLICK_RESET_MS);

  };



  return (

    <div style={styles.app}>

      <div style={styles.brandRow}>

        <button

          type="button"

          onClick={handleLogoClick}

          style={styles.logoButton}

          aria-label="R79"

          title="R79"

        >

          <R79Emblem size={40} />

        </button>

      </div>



      <div style={styles.topBar}>

        <nav style={styles.nav}>

          {PAGES.map((item) => {

            const isActive = page === item.id;

            return (

              <button

                key={item.id}

                type="button"

                onClick={() => setPage(item.id)}

                style={{

                  ...styles.navButton,

                  ...(isActive ? styles.navButtonActive : null),

                }}

              >

                {item.label}

              </button>

            );

          })}

        </nav>



        <div style={styles.gameSelector}>

          <span style={styles.gameSelectorLabel}>Game</span>

          <div style={styles.gameSelectorButtons}>

            {gameOptions.map((version) => {

              const entry = GAME_CATALOG[version];

              const isActive = gameVersion === version;

              return (

                <button

                  key={version}

                  type="button"

                  onClick={() => setGameVersion(version)}

                  style={{

                    ...styles.gameButton,

                    ...(isActive ? styles.gameButtonActive : null),

                  }}

                >

                  {entry.shortLabel}

                </button>

              );

            })}

          </div>

        </div>

      </div>



      {showRaceDataNotice ? (

        <p style={styles.alrNotice}>

          Race Archive data and OCR matching use the GT7 car database. Switch to

          GT7 for full import tooling, or continue viewing GT7-linked race data.

        </p>

      ) : null}



      {renderPage()}



      {showFounderConsole ? (

        <FounderConsole onClose={() => setShowFounderConsole(false)} />

      ) : null}

      {showSplash ? (
        <SplashScreen onEnter={() => setShowSplash(false)} />
      ) : null}

    </div>

  );

}



export default function App() {

  return (

    <GameVersionProvider>

      <AppShell />

    </GameVersionProvider>

  );

}



const styles = {

  app: {

    fontFamily: "Inter, Segoe UI, Roboto, sans-serif",

    margin: "0 auto",

    maxWidth: "980px",

    padding: "20px 16px 32px",

  },

  brandRow: {

    marginBottom: "12px",

  },

  logoButton: {

    alignItems: "center",

    background: "rgba(12, 18, 31, 0.88)",

    border: "1px solid rgba(128, 160, 229, 0.3)",

    borderRadius: "999px",

    cursor: "pointer",

    display: "inline-flex",

    justifyContent: "center",

    padding: "6px",

  },

  topBar: {

    display: "grid",

    gap: "12px",

    marginBottom: "16px",

  },

  nav: {

    display: "flex",

    flexWrap: "wrap",

    gap: "10px",

  },

  navButton: {

    background: "rgba(20, 28, 48, 0.9)",

    border: "1px solid rgba(141, 169, 233, 0.35)",

    borderRadius: "999px",

    color: "#d8e3ff",

    cursor: "pointer",

    fontWeight: 600,

    padding: "8px 14px",

  },

  navButtonActive: {

    background: "linear-gradient(90deg, #2b56c8, #3e79ff)",

    borderColor: "#77a0ff",

    color: "#ffffff",

  },

  gameSelector: {

    alignItems: "center",

    background: "rgba(12, 18, 31, 0.88)",

    border: "1px solid rgba(128, 160, 229, 0.3)",

    borderRadius: "12px",

    display: "flex",

    flexWrap: "wrap",

    gap: "10px",

    padding: "10px 12px",

  },

  gameSelectorLabel: {

    color: "#b8cdff",

    fontSize: "0.82rem",

    fontWeight: 700,

    letterSpacing: "0.04em",

    textTransform: "uppercase",

  },

  gameSelectorButtons: {

    display: "flex",

    flexWrap: "wrap",

    gap: "8px",

  },

  gameButton: {

    background: "rgba(20, 28, 48, 0.9)",

    border: "1px solid rgba(141, 169, 233, 0.35)",

    borderRadius: "999px",

    color: "#d8e3ff",

    cursor: "pointer",

    fontWeight: 600,

    padding: "7px 14px",

  },

  gameButtonActive: {

    background: "linear-gradient(90deg, #2b56c8, #3e79ff)",

    borderColor: "#77a0ff",

    color: "#ffffff",

  },

  alrNotice: {

    background: "rgba(56, 44, 18, 0.45)",

    border: "1px solid rgba(220, 180, 90, 0.35)",

    borderRadius: "10px",

    color: "#ffe6a8",

    fontSize: "0.88rem",

    lineHeight: 1.45,

    margin: "0 0 14px",

    padding: "10px 12px",

  },

};


