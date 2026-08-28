import { lazy, Suspense, useRef, useState } from "react";


import { GameVersionProvider, useGameVersion } from "./context/GameVersionContext.jsx";

import AppErrorBoundary from "./components/AppErrorBoundary.jsx";
import R79AppNav from "./components/branding/R79AppNav.jsx";
import R79BrandBar from "./components/branding/R79BrandBar.jsx";
import R79MobileBottomNav from "./components/branding/R79MobileBottomNav.jsx";
import R79MobileMoreMenu from "./components/branding/R79MobileMoreMenu.jsx";
import R79ScrollToTop from "./components/branding/R79ScrollToTop.jsx";
import SplashScreen from "./components/SplashScreen.jsx";
import WheelSettingsHub from "./components/WheelSettingsHub.jsx";

import { hasSeenSplash } from "./utils/splashStorage.js";

const ChampionshipAdvisor = lazy(() => import("./components/ChampionshipAdvisor.jsx"));
const PitstopStrategy = lazy(() => import("./components/PitstopStrategy.jsx"));
const TodaysRaceAdvisor = lazy(() => import("./components/TodaysRaceAdvisor.jsx"));
const AIRaceEngineer = lazy(() => import("./components/AIRaceEngineer.jsx"));
const TeamCarShortlistAdvisor = lazy(() => import("./components/TeamCarShortlistAdvisor.jsx"));
const ALRPerformanceHub = lazy(() => import("./components/ALRPerformanceHub.jsx"));
const ALRDataEntry = lazy(() => import("./components/ALRDataEntry.jsx"));
const ALRHistoricalRankings = lazy(() => import("./components/ALRHistoricalRankings.jsx"));
const CarProfiles = lazy(() => import("./components/CarProfiles.jsx"));
const ALRCorner = lazy(() => import("./components/ALRCorner.jsx"));
const R79Archive = lazy(() => import("./components/R79Archive.jsx"));
const R79Labs = lazy(() => import("./components/R79Labs.jsx"));
const Membership = lazy(() => import("./components/Membership.jsx"));
const Pathfinder = lazy(() => import("./components/Pathfinder.jsx"));
const ThePromise = lazy(() => import("./components/ThePromise.jsx"));
const SettingsHub = lazy(() => import("./components/SettingsHub.jsx"));
const FounderConsole = lazy(() => import("./components/FounderConsole.jsx"));

function PageFallback({ label }) {
  return <p className="r79-notice">Loading {label}…</p>;
}




const PAGES = [
  { id: "wheel-settings", label: "Wheel Settings" },
  { id: "podium", label: "Podium" },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logoClickCount = useRef(0);

  const logoClickTimer = useRef(null);

  const { gameVersion, setGameVersion, gameOptions } = useGameVersion();

  const showRaceDataNotice =
    RACE_DATA_PAGES.has(page) && gameVersion !== "gt7";

  const renderPage = () => {
    const wrap = (label, node) => (
      <AppErrorBoundary key={label} label={label}>
        <Suspense fallback={<PageFallback label={label} />}>{node}</Suspense>
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
      case "podium":
        return (
          <AppErrorBoundary
            key={page === "podium" ? "Podium" : "Wheel Settings"}
            label={page === "podium" ? "Podium" : "Wheel Settings"}
          >
            <WheelSettingsHub
              prefill={wheelSettingsPrefill}
              onPrefillConsumed={() => setWheelSettingsPrefill(null)}
            />
          </AppErrorBoundary>
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
          moreOpen={mobileMenuOpen}
          onMoreOpenChange={setMobileMenuOpen}
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

      <R79MobileBottomNav
        page={page}
        setPage={setPage}
        moreOpen={mobileMenuOpen}
        onOpenMenu={() => setMobileMenuOpen((open) => !open)}
      />
      <R79MobileMoreMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        page={page}
        setPage={setPage}
        setSettingsBootView={setSettingsBootView}
        allPages={PAGES}
      />
      <R79ScrollToTop />



      {showFounderConsole ? (
        <Suspense fallback={null}>
          <FounderConsole onClose={() => setShowFounderConsole(false)} />
        </Suspense>
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





