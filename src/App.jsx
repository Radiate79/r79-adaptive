import { useRef, useState } from "react";


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

import PitstopStrategy from "./components/PitstopStrategy.jsx";

import R79AppNav from "./components/branding/R79AppNav.jsx";
import R79BrandBar from "./components/branding/R79BrandBar.jsx";

import TeamCarShortlistAdvisor from "./components/TeamCarShortlistAdvisor.jsx";

import TodaysRaceAdvisor from "./components/TodaysRaceAdvisor.jsx";

import WheelSettingsHub from "./components/WheelSettingsHub.jsx";

import ALRPerformanceHub from "./components/ALRPerformanceHub.jsx";

import AppErrorBoundary from "./components/AppErrorBoundary.jsx";

import { hasSeenSplash } from "./utils/splashStorage.js";




const PAGES = [
  { id: "wheel-settings", label: "Wheel Settings" },
  { id: "todays-race", label: "Today's Race" },
  { id: "ai-engineer", label: "AI Race Engineer" },
  { id: "advisor", label: "Championship Advisor" },
  { id: "shortlist", label: "Team Car Shortlist" },
  { id: "alr-performance", label: "ALR Performance" },
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

  const [page, setPage] = useState("wheel-settings");
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
    const wrap = (label, node) => (
      <AppErrorBoundary key={label} label={label}>
        {node}
      </AppErrorBoundary>
    );

    switch (page) {
      case "todays-race":
        return wrap("Today's Race", <TodaysRaceAdvisor />);
      case "ai-engineer":
        return wrap(
          "AI Race Engineer",
          <AIRaceEngineer
            onOpenWheelSettings={(prefill) => {
              setWheelSettingsPrefill(prefill);
              setPage("wheel-settings");
            }}
          />,
        );
      case "wheel-settings":
        return wrap(
          "Wheel Settings",
          <WheelSettingsHub
            prefill={wheelSettingsPrefill}
            onPrefillConsumed={() => setWheelSettingsPrefill(null)}
          />,
        );
      case "advisor":
        return wrap("Championship Advisor", <ChampionshipAdvisor />);
      case "pitstop-strategy":
        return wrap("Pitstop Strategy", <PitstopStrategy />);
      case "shortlist":
        return wrap("Team Car Shortlist", <TeamCarShortlistAdvisor />);
      case "alr-performance":
        return wrap("ALR Performance", <ALRPerformanceHub />);
      case "rankings":
        return wrap("Historical Rankings", <ALRHistoricalRankings />);
      case "profiles":
        return wrap("Car Profiles", <CarProfiles />);
      case "alr":
        return wrap("Race Archive", <ALRDataEntry />);
      case "alr-corner":
        return wrap("ALR Corner", <ALRCorner />);
      case "archive":
        return wrap(
          "R79 Archive",
          <R79Archive
            onNavigate={(view) => {
              if (view === "settings" || view === "about") {
                setPage("settings");
              }
            }}
          />,
        );
      case "promise":
        return wrap("The Promise", <ThePromise />);
      case "membership":
        return wrap(
          "Membership",
          <Membership onOpenPathfinder={() => setPage("pathfinder")} />,
        );
      case "pathfinder":
        return wrap("Pathfinder", <Pathfinder />);
      case "labs":
        return wrap(
          "R79 Labs",
          <R79Labs
            onOpenDataReports={() => {
              setSettingsBootView("dataReports");
              setPage("settings");
            }}
          />,
        );
      case "settings":
        return wrap(
          "Settings",
          <SettingsHub
            bootView={settingsBootView}
            onBootViewConsumed={() => setSettingsBootView(null)}
          />,
        );
      default:
        return wrap(
          "Wheel Settings",
          <WheelSettingsHub
            prefill={wheelSettingsPrefill}
            onPrefillConsumed={() => setWheelSettingsPrefill(null)}
          />,
        );
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

    <div className="r79-app-shell">
      <div className="r79-app-chrome">
        <header className="r79-app-header">
          <R79BrandBar
            variant="app"
            showTagline
            onLogoClick={handleLogoClick}
          />
        </header>

        <R79AppNav
          page={page}
          setPage={setPage}
          gameVersion={gameVersion}
          setGameVersion={setGameVersion}
          gameOptions={gameOptions}
          allPages={PAGES}
        />
      </div>

      <main className="r79-app-main">
      {showRaceDataNotice ? (
        <p className="r79-notice r79-notice--wide">

          Race Archive data and OCR matching use the GT7 car database. Switch to

          GT7 for full import tooling, or continue viewing GT7-linked race data.

        </p>

      ) : null}



      {renderPage()}
      </main>



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
    <AppErrorBoundary label="R79 Application">
      <GameVersionProvider>
        <AppShell />
      </GameVersionProvider>
    </AppErrorBoundary>
  );
}





