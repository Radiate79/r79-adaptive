import { useEffect, useMemo, useState } from "react";
import {
  COMPLETED_MILESTONES,
  FOUNDER_NAME,
  PROJECT_STARTED_YEAR,
  UPCOMING_MILESTONES,
} from "../data/founderMeta.js";
import {
  BRAND_TAGLINE,
  R79_MOTTO,
} from "../data/brandingMeta.js";
import {
  PATHFINDER_DESCRIPTION,
  PATHFINDER_FOUNDER_CLARIFIER,
  PATHFINDER_TITLE,
} from "../data/pathfinderMeta.js";
import { getFounderStats } from "../utils/founderStats.js";
import BrandVersionLabel from "./branding/BrandVersionLabel.jsx";
import DataReports from "./DataReports.jsx";
import R79Archive from "./R79Archive.jsx";

const VIEWS = {
  settings: "settings",
  about: "about",
  archive: "archive",
  founder: "founder",
  dataReports: "dataReports",
};

/**
 * @param {{ bootView?: string | null, onBootViewConsumed?: () => void }} props
 */
export default function SettingsHub({ bootView = null, onBootViewConsumed }) {
  const [view, setView] = useState(
    bootView === VIEWS.dataReports ? VIEWS.dataReports : VIEWS.settings,
  );

  useEffect(() => {
    if (bootView !== VIEWS.dataReports) {
      return;
    }

    setView(VIEWS.dataReports);
    onBootViewConsumed?.();
  }, [bootView]);
  const stats = useMemo(() => getFounderStats(), [view]);

  if (view === VIEWS.archive) {
    return <R79Archive onNavigate={setView} />;
  }

  if (view === VIEWS.founder) {
    return (
      <section style={styles.shell}>
        <Breadcrumb
          items={[
            { label: "Settings", onClick: () => setView(VIEWS.settings) },
            { label: "About R79", onClick: () => setView(VIEWS.about) },
            { label: "Founder Mode", active: true },
          ]}
        />

        <div style={styles.header}>
          <h2 style={styles.title}>Founder Mode</h2>
          <p style={styles.subtitle}>Project intelligence — live stats and roadmap.</p>
        </div>

        <div style={styles.statsGrid}>
          <StatCard label="Founder" value={FOUNDER_NAME} />
          <StatCard label="Project Started" value={String(PROJECT_STARTED_YEAR)} />
          <StatCard
            label="Current Version"
            value={
              <BrandVersionLabel version={stats.currentVersion} compact />
            }
          />
          <StatCard label="Development Days" value={stats.developmentDays} />
          <StatCard label="Cars Indexed" value={stats.carsIndexed} live />
          <StatCard label="Tracks Supported" value={stats.tracksSupported} live />
          <StatCard label="Historical Records" value={stats.historicalRecords} live />
          <StatCard
            label="Championship Seasons Imported"
            value={stats.championshipSeasonsImported}
            live
          />
          <StatCard
            label="GT7 Support"
            value={stats.gt7Support ? "Active" : "Pending"}
            highlight={stats.gt7Support}
          />
          <StatCard
            label="GT8 Ready"
            value={
              stats.gt8Ready
                ? "Data Ready"
                : stats.gt8ArchitectureReady
                  ? "Architecture Ready"
                  : "Pending"
            }
            highlight={stats.gt8ArchitectureReady}
          />
        </div>

        <div style={styles.timelinePanel}>
          <h3 style={styles.panelTitle}>Timeline</h3>

          <p style={styles.timelineSectionLabel}>Completed milestones</p>
          <ul style={styles.timelineList}>
            {COMPLETED_MILESTONES.map((item) => (
              <li key={item.id} style={styles.timelineItemDone}>
                <span style={styles.timelineDotDone} aria-hidden="true" />
                <span style={styles.timelineText}>{item.label}</span>
                <span style={styles.timelineYear}>{item.year}</span>
              </li>
            ))}
          </ul>

          <p style={styles.timelineSectionLabel}>Upcoming</p>
          <ul style={styles.timelineList}>
            {UPCOMING_MILESTONES.map((item) => (
              <li key={item.id} style={styles.timelineItemUpcoming}>
                <span style={styles.timelineDotUpcoming} aria-hidden="true" />
                <span style={styles.timelineText}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p style={styles.founderNote}>
          GT7: {stats.gt7Cars} cars, {stats.gt7Tracks} tracks · GT8: {stats.gt8Cars}{" "}
          cars, {stats.gt8Tracks} tracks
        </p>
      </section>
    );
  }

  if (view === VIEWS.dataReports) {
    return (
      <section style={styles.shell}>
        <DataReports
          breadcrumb={
            <Breadcrumb
              items={[
                { label: "Settings", onClick: () => setView(VIEWS.settings) },
                { label: "Data Reports", active: true },
              ]}
            />
          }
          onBack={() => setView(VIEWS.settings)}
        />
      </section>
    );
  }

  if (view === VIEWS.about) {
    return (
      <section style={styles.shell}>
        <Breadcrumb
          items={[
            { label: "Settings", onClick: () => setView(VIEWS.settings) },
            { label: "About R79", active: true },
          ]}
        />

        <div style={styles.header}>
          <h2 style={styles.title}>About R79</h2>
          <p style={styles.subtitle}>
            Radiate79&apos;s Gran Turismo race engineering toolkit — championship
            analysis, ALR intelligence, and daily race strategy.
          </p>
        </div>

        <div style={styles.aboutIdentity}>
          <h3 style={styles.aboutIdentityTitle}>R79</h3>
          {R79_MOTTO.map((line) => (
            <p key={line} style={styles.aboutMottoLine}>
              {line}
            </p>
          ))}
          <p style={styles.aboutTagline}>{BRAND_TAGLINE}</p>
        </div>

        <div style={styles.aboutPanel}>
          <p style={styles.aboutText}>
            R79 combines track DNA analysis, historical ALR performance data, and
            multi-game architecture to help you pick the right car and strategy for
            every race.
          </p>
          <div style={styles.aboutMeta}>
            <BrandVersionLabel version={stats.currentVersion} />
            <span>Founder: {FOUNDER_NAME}</span>
            <span>Since {PROJECT_STARTED_YEAR}</span>
          </div>
        </div>

        <div style={styles.pathfinderPanel}>
          <h3 style={styles.pathfinderTitle}>{PATHFINDER_TITLE}</h3>
          {PATHFINDER_DESCRIPTION.map((paragraph) => (
            <p key={paragraph} style={styles.pathfinderText}>
              {paragraph}
            </p>
          ))}
          <p style={styles.pathfinderClarifier}>{PATHFINDER_FOUNDER_CLARIFIER}</p>
        </div>

        <div style={styles.aboutLinks}>
          <button
            type="button"
            onClick={() => setView(VIEWS.archive)}
            style={styles.archiveLink}
          >
            R79 Archive
          </button>
          <button
            type="button"
            onClick={() => setView(VIEWS.founder)}
            style={styles.founderLink}
          >
            Founder Mode
          </button>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.shell}>
      <div style={styles.header}>
        <h2 style={styles.title}>Settings</h2>
        <p style={styles.subtitle}>App preferences and project information.</p>
      </div>

      <button
        type="button"
        onClick={() => setView(VIEWS.about)}
        style={styles.settingsRow}
      >
        <span style={styles.settingsRowLabel}>About R79</span>
        <span style={styles.settingsRowHint}>Version, Pathfinder, founder</span>
        <span style={styles.chevron}>›</span>
      </button>

      <button
        type="button"
        onClick={() => setView(VIEWS.dataReports)}
        style={styles.settingsRow}
      >
        <span style={styles.settingsRowLabel}>Data Reports</span>
        <span style={styles.settingsRowHint}>
          Review reported data issues locally
        </span>
        <span style={styles.chevron}>›</span>
      </button>
    </section>
  );
}

function Breadcrumb({ items }) {
  return (
    <nav style={styles.breadcrumb} aria-label="Settings navigation">
      {items.map((item, index) => (
        <span key={item.label} style={styles.breadcrumbItem}>
          {index > 0 ? <span style={styles.breadcrumbSep}>/</span> : null}
          {item.active ? (
            <span style={styles.breadcrumbActive}>{item.label}</span>
          ) : (
            <button type="button" onClick={item.onClick} style={styles.breadcrumbLink}>
              {item.label}
            </button>
          )}
        </span>
      ))}
    </nav>
  );
}

function StatCard({ label, value, live = false, highlight = false }) {
  return (
    <div
      style={{
        ...styles.statCard,
        ...(highlight ? styles.statCardHighlight : null),
      }}
    >
      <span style={styles.statLabel}>
        {label}
        {live ? <span style={styles.liveBadge}> live</span> : null}
      </span>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles = {
  shell: {
    background:
      "radial-gradient(circle at top, rgba(30, 63, 120, 0.45), rgba(9, 12, 20, 0.95))",
    border: "1px solid rgba(122, 150, 220, 0.35)",
    borderRadius: "16px",
    color: "#f3f6ff",
    fontFamily: "Inter, Segoe UI, Roboto, sans-serif",
    margin: "0 auto",
    maxWidth: "900px",
    padding: "20px",
    boxShadow: "0 16px 32px rgba(0, 0, 0, 0.35)",
  },
  breadcrumb: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    marginBottom: "14px",
    fontSize: "0.82rem",
  },
  breadcrumbItem: {
    alignItems: "center",
    display: "inline-flex",
    gap: "4px",
  },
  breadcrumbSep: {
    color: "rgba(155, 192, 255, 0.45)",
    margin: "0 2px",
  },
  breadcrumbLink: {
    background: "none",
    border: "none",
    color: "#9bc0ff",
    cursor: "pointer",
    fontSize: "0.82rem",
    padding: 0,
    textDecoration: "underline",
  },
  breadcrumbActive: {
    color: "#dce9ff",
    fontWeight: 600,
  },
  header: {
    marginBottom: "16px",
  },
  title: {
    fontSize: "1.4rem",
    letterSpacing: "0.02em",
    margin: 0,
  },
  subtitle: {
    color: "rgba(220, 228, 255, 0.85)",
    fontSize: "0.95rem",
    lineHeight: 1.45,
    margin: "6px 0 0",
  },
  settingsRow: {
    alignItems: "center",
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.3)",
    borderRadius: "12px",
    cursor: "pointer",
    display: "grid",
    gap: "2px",
    gridTemplateColumns: "1fr auto",
    padding: "14px 16px",
    textAlign: "left",
    width: "100%",
  },
  settingsRowLabel: {
    color: "#e8efff",
    fontSize: "1rem",
    fontWeight: 600,
    gridColumn: "1",
  },
  settingsRowHint: {
    color: "rgba(205, 217, 255, 0.7)",
    fontSize: "0.84rem",
    gridColumn: "1",
  },
  chevron: {
    color: "#9bc0ff",
    fontSize: "1.4rem",
    gridColumn: "2",
    gridRow: "1 / 3",
  },
  aboutIdentity: {
    background:
      "linear-gradient(180deg, rgba(28, 48, 92, 0.3), rgba(12, 18, 31, 0.88))",
    border: "1px solid rgba(132, 172, 255, 0.35)",
    borderRadius: "12px",
    marginBottom: "16px",
    padding: "18px 16px",
    textAlign: "center",
  },
  aboutIdentityTitle: {
    background: "linear-gradient(90deg, #dce9ff, #9bc0ff)",
    backgroundClip: "text",
    color: "transparent",
    fontSize: "1.35rem",
    fontWeight: 800,
    letterSpacing: "0.1em",
    margin: "0 0 10px",
  },
  aboutMottoLine: {
    color: "rgba(220, 228, 255, 0.9)",
    fontSize: "0.92rem",
    fontStyle: "italic",
    lineHeight: 1.55,
    margin: "0 0 4px",
  },
  aboutTagline: {
    color: "rgba(184, 205, 255, 0.82)",
    fontSize: "0.88rem",
    fontStyle: "italic",
    fontWeight: 600,
    margin: "10px 0 0",
  },
  aboutPanel: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.3)",
    borderRadius: "12px",
    marginBottom: "16px",
    padding: "14px",
  },
  aboutText: {
    color: "#dce8ff",
    fontSize: "0.92rem",
    lineHeight: 1.5,
    margin: "0 0 12px",
  },
  aboutMeta: {
    color: "#9bc0ff",
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.84rem",
    fontWeight: 600,
    gap: "12px",
  },
  pathfinderPanel: {
    background:
      "linear-gradient(180deg, rgba(28, 48, 92, 0.35), rgba(12, 18, 31, 0.88))",
    border: "1px solid rgba(132, 172, 255, 0.35)",
    borderRadius: "12px",
    marginBottom: "16px",
    padding: "14px",
  },
  pathfinderTitle: {
    color: "#f3f7ff",
    fontSize: "1.05rem",
    fontWeight: 700,
    margin: "0 0 10px",
  },
  pathfinderText: {
    color: "#dce8ff",
    fontSize: "0.92rem",
    lineHeight: 1.55,
    margin: "0 0 8px",
  },
  pathfinderClarifier: {
    borderTop: "1px solid rgba(124, 156, 222, 0.2)",
    color: "rgba(184, 205, 255, 0.85)",
    fontSize: "0.86rem",
    fontStyle: "italic",
    lineHeight: 1.5,
    margin: "10px 0 0",
    paddingTop: "10px",
  },
  aboutLinks: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  archiveLink: {
    background: "rgba(20, 28, 48, 0.65)",
    border: "1px solid rgba(141, 169, 233, 0.25)",
    borderRadius: "8px",
    color: "rgba(184, 205, 255, 0.85)",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: 600,
    padding: "8px 12px",
  },
  founderLink: {
    background: "rgba(20, 28, 48, 0.65)",
    border: "1px solid rgba(141, 169, 233, 0.25)",
    borderRadius: "8px",
    color: "rgba(184, 205, 255, 0.75)",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: 600,
    padding: "8px 12px",
  },
  statsGrid: {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    marginBottom: "16px",
  },
  statCard: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.3)",
    borderRadius: "10px",
    display: "grid",
    gap: "6px",
    padding: "12px",
  },
  statCardHighlight: {
    borderColor: "rgba(132, 172, 255, 0.45)",
    background: "rgba(20, 34, 68, 0.55)",
  },
  statLabel: {
    color: "#b8cdff",
    fontSize: "0.78rem",
    fontWeight: 600,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
  liveBadge: {
    color: "#7dffa8",
    fontSize: "0.68rem",
    fontWeight: 700,
    textTransform: "lowercase",
  },
  statValue: {
    color: "#9bc0ff",
    fontSize: "1.1rem",
    fontWeight: 700,
  },
  timelinePanel: {
    background: "rgba(9, 14, 24, 0.88)",
    border: "1px solid rgba(123, 153, 219, 0.3)",
    borderRadius: "12px",
    padding: "14px",
  },
  panelTitle: {
    color: "#e8efff",
    fontSize: "1rem",
    margin: "0 0 12px",
  },
  timelineSectionLabel: {
    color: "#b8cdff",
    fontSize: "0.82rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    margin: "0 0 8px",
    textTransform: "uppercase",
  },
  timelineList: {
    listStyle: "none",
    margin: "0 0 16px",
    padding: 0,
    display: "grid",
    gap: "8px",
  },
  timelineItemDone: {
    alignItems: "center",
    background: "rgba(20, 30, 52, 0.45)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "8px",
    display: "flex",
    gap: "10px",
    padding: "9px 10px",
  },
  timelineItemUpcoming: {
    alignItems: "center",
    background: "rgba(16, 22, 36, 0.45)",
    border: "1px dashed rgba(124, 156, 222, 0.25)",
    borderRadius: "8px",
    display: "flex",
    gap: "10px",
    padding: "9px 10px",
  },
  timelineDotDone: {
    background: "linear-gradient(90deg, #2b56c8, #3e79ff)",
    borderRadius: "50%",
    flexShrink: 0,
    height: "8px",
    width: "8px",
  },
  timelineDotUpcoming: {
    border: "2px solid rgba(155, 192, 255, 0.5)",
    borderRadius: "50%",
    flexShrink: 0,
    height: "8px",
    width: "8px",
  },
  timelineText: {
    color: "#dce8ff",
    flex: 1,
    fontSize: "0.88rem",
  },
  timelineYear: {
    color: "#9bc0ff",
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  founderNote: {
    color: "rgba(205, 217, 255, 0.65)",
    fontSize: "0.8rem",
    margin: "12px 0 0",
    textAlign: "center",
  },
};
