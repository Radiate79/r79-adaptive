import { useMemo, useState } from "react";
import { CAPTAINS_LOG_HEADER } from "../data/brandingMeta.js";
import BrandVersionLabel from "./branding/BrandVersionLabel.jsx";
import {
  ARCHIVE_FOOTER,
  ARCHIVE_FOUNDER_NOTE,
  ARCHIVE_IDENTITY,
  ARCHIVE_INTRO,
  ARCHIVE_LEGACY,
  ARCHIVE_MISSION,
  ARCHIVE_ORIGINS,
  ARCHIVE_PHILOSOPHY,
  ARCHIVE_PROJECT,
  ARCHIVE_PROMISE,
  ARCHIVE_ROADMAP,
  ARCHIVE_TEAM_MOTTO,
  ARCHIVE_WALL,
  CAPTAINS_LOG_ENTRY_FOOTER,
  formatArchiveJournalDate,
  getArchiveCurrentFocus,
  getArchiveLastMilestone,
  getCaptainsLogEntryIcon,
} from "../data/archiveMeta.js";
import { getArchiveStats } from "../utils/archiveStats.js";
import {
  addArchiveJournalEntry,
  formatLogTags,
  loadArchiveJournalEntriesNewestFirst,
  parseLogTags,
  updateArchiveJournalEntry,
} from "../utils/archiveJournalStorage.js";
import R79PageHeader from "./branding/R79PageHeader.jsx";

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function R79Archive({ onNavigate }) {
  const [journalEntries, setJournalEntries] = useState(() =>
    loadArchiveJournalEntriesNewestFirst(),
  );
  const [journalDate, setJournalDate] = useState(() => todayIsoDate());
  const [journalTitle, setJournalTitle] = useState("");
  const [journalText, setJournalText] = useState("");
  const [journalBuildVersion, setJournalBuildVersion] = useState("");
  const [journalTags, setJournalTags] = useState("");
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalMessage, setJournalMessage] = useState("");
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  const stats = useMemo(() => getArchiveStats(), [journalEntries.length]);
  const currentJourney = useMemo(
    () => ({
      currentBuild: stats.buildLabel,
      daysBuilding: stats.developmentDays,
      logEntries: journalEntries.length,
      currentVersion: stats.currentVersion,
      lastMilestone: getArchiveLastMilestone(journalEntries),
      currentFocus: getArchiveCurrentFocus(),
    }),
    [stats, journalEntries],
  );

  const refreshJournal = () => {
    setJournalEntries(loadArchiveJournalEntriesNewestFirst());
  };

  const resetJournalForm = () => {
    setJournalDate(todayIsoDate());
    setJournalTitle("");
    setJournalText("");
    setJournalBuildVersion(getArchiveStats().currentVersion);
    setJournalTags("");
    setEditingEntryId(null);
    setJournalMessage("");
  };

  const closeJournalModal = () => {
    setShowJournalModal(false);
    resetJournalForm();
  };

  const openAddJournalModal = () => {
    resetJournalForm();
    setShowJournalModal(true);
  };

  const handleSaveJournalEntry = () => {
    const title = journalTitle.trim();
    const text = journalText.trim();

    if (!title) {
      setJournalMessage("Add a title before saving.");
      return;
    }

    if (!text) {
      setJournalMessage("Write something before saving.");
      return;
    }

    if (editingEntryId) {
      const updated = updateArchiveJournalEntry(editingEntryId, {
        date: journalDate,
        title,
        text,
        buildVersion: journalBuildVersion,
        tags: parseLogTags(journalTags),
      });

      if (!updated) {
        setJournalMessage("Could not update entry.");
        return;
      }

      refreshJournal();
      closeJournalModal();
      return;
    }

    const created = addArchiveJournalEntry({
      date: journalDate,
      title,
      text,
      buildVersion: journalBuildVersion,
      tags: parseLogTags(journalTags),
    });

    if (!created) {
      setJournalMessage("Could not save entry.");
      return;
    }

    refreshJournal();
    closeJournalModal();
  };

  const handleEditJournalEntry = (entry) => {
    setEditingEntryId(entry.id);
    setJournalDate(entry.date);
    setJournalTitle(entry.title);
    setJournalText(entry.text);
    setJournalBuildVersion(entry.buildVersion);
    setJournalTags(formatLogTags(entry.tags));
    setJournalMessage("");
    setShowJournalModal(true);
  };

  return (
    <section className="r79-page r79-page--wide">
      <Breadcrumb
        items={[
          { label: "Settings", onClick: () => onNavigate("settings") },
          { label: "About R79", onClick: () => onNavigate("about") },
          { label: "R79 Archive", active: true },
        ]}
      />

      <R79PageHeader title="R79 Archive" subtitle={ARCHIVE_INTRO}>
        <p style={styles.museumEyebrow}>Permanent Record · Digital Museum</p>
      </R79PageHeader>

      <MuseumSection title="Project" exhibit="01">
        <div style={styles.projectGrid}>
          <Field label="Project Name" value={ARCHIVE_PROJECT.name} highlight />
          <Field label="Started" value={String(ARCHIVE_PROJECT.started)} />
          <Field label="Status" value={ARCHIVE_PROJECT.status} />
          <Field
            label="Description"
            value={ARCHIVE_PROJECT.description}
            wide
          />
        </div>
      </MuseumSection>

      <MuseumSection title="Mission" exhibit="02">
        <div style={styles.missionBlock}>
          <p style={styles.missionLead}>{ARCHIVE_MISSION.lead}</p>
          <p style={styles.missionGoal}>{ARCHIVE_MISSION.goal}</p>
          <div style={styles.missionPrinciples}>
            {ARCHIVE_MISSION.principles.map((line) => (
              <p key={line} style={styles.missionPrinciple}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </MuseumSection>

      <MuseumSection title="Origins" exhibit="03">
        <div style={styles.originsBlock}>
          <p style={styles.originsLead}>R79 began with a simple question:</p>
          <blockquote style={styles.originsQuestion}>
            &ldquo;{ARCHIVE_ORIGINS.question}&rdquo;
          </blockquote>
          {ARCHIVE_ORIGINS.paragraphs.map((paragraph) => (
            <p key={paragraph} style={styles.originsParagraph}>
              {paragraph}
            </p>
          ))}
        </div>
      </MuseumSection>

      <MuseumSection title="Philosophy" exhibit="04">
        <div style={styles.philosophyBlock}>
          {ARCHIVE_PHILOSOPHY.map((line) => (
            <p key={line} style={styles.philosophyLine}>
              {line}
            </p>
          ))}
        </div>
      </MuseumSection>

      <MuseumSection title="Team Motto" exhibit="05" prominent>
        <blockquote style={styles.mottoBlock}>
          {ARCHIVE_TEAM_MOTTO.map((line) => (
            <p key={line} style={styles.mottoLine}>
              {line}
            </p>
          ))}
        </blockquote>
      </MuseumSection>

      <MuseumSection title="Captain's Log" exhibit="06" subtitle="Founder's record of milestones, reflections and turning points.">
        <p style={styles.captainsLogHeader}>{CAPTAINS_LOG_HEADER}</p>

        <button
          type="button"
          onClick={openAddJournalModal}
          style={styles.addJournalButton}
        >
          + Add Log Entry
        </button>

        <div style={styles.journalList}>
          {journalEntries.map((entry) => (
            <article key={entry.id} style={styles.journalEntry}>
              <div style={styles.journalEntryHeader}>
                <div>
                  <h4 style={styles.journalEntryDate}>
                    {formatArchiveJournalDate(entry.date)}
                  </h4>
                  <h5 style={styles.journalEntryTitle}>{entry.title}</h5>
                </div>
                <button
                  type="button"
                  onClick={() => handleEditJournalEntry(entry)}
                  style={styles.journalEditButton}
                >
                  Edit
                </button>
              </div>

              <div style={styles.logMetaRow}>
                <span style={styles.logMetaItem}>
                  Build {entry.buildVersion}
                </span>
                {entry.tags?.length ? (
                  <div style={styles.logTagRow}>
                    {entry.tags.map((tag) => (
                      <span key={`${entry.id}-${tag}`} style={styles.logTag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div style={styles.snapshotPanel}>
                <p style={styles.snapshotTitle}>Snapshot statistics</p>
                <div style={styles.snapshotGrid}>
                  <SnapshotStat label="Cars indexed" value={entry.snapshot.carsIndexed} />
                  <SnapshotStat
                    label="Tracks supported"
                    value={entry.snapshot.tracksSupported}
                  />
                  <SnapshotStat
                    label="Historical records"
                    value={entry.snapshot.historicalRecords}
                  />
                  <SnapshotStat
                    label="Games supported"
                    value={entry.snapshot.gamesSupported}
                  />
                  <SnapshotStat
                    label="AI modules"
                    value={entry.snapshot.aiModulesCount}
                  />
                </div>
              </div>

              <p style={styles.journalEntryText}>{entry.text}</p>

              <p style={styles.logEntryFooter}>{CAPTAINS_LOG_ENTRY_FOOTER}</p>
            </article>
          ))}
        </div>
      </MuseumSection>

      <MuseumSection title="Browse History" exhibit="07" subtitle="Captain's Log timeline — newest first.">
        <BrowseHistoryTimeline
          entries={journalEntries}
          expandedId={expandedHistoryId}
          onToggle={(entryId) =>
            setExpandedHistoryId((current) =>
              current === entryId ? null : entryId,
            )
          }
        />
      </MuseumSection>

      <MuseumSection title="The Wall" exhibit="08" subtitle="Permanent inscriptions from the R79 journey.">
        <QuoteWall quotes={ARCHIVE_WALL} />
      </MuseumSection>

      <MuseumSection title="Legacy" exhibit="09">
        <div style={styles.legacyBlock}>
          {ARCHIVE_LEGACY.map((paragraph, index) => (
            <p
              key={paragraph}
              style={{
                ...styles.legacyParagraph,
                ...(index === 2 || index === 3 ? styles.legacyEmphasis : null),
              }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </MuseumSection>

      <MuseumSection title="Live Project Stats" exhibit="10">
        <div style={styles.statsGrid}>
          <Stat
            label="Current Version"
            value={
              <BrandVersionLabel
                version={stats.currentVersion.replace(/^v/i, "")}
                compact
              />
            }
            live
          />
          <Stat label="Development Days" value={stats.developmentDays} live />
          <Stat label="Cars Indexed" value={stats.carsIndexed} live />
          <Stat label="Tracks Supported" value={stats.tracksSupported} live />
          <Stat label="Historical Records" value={stats.historicalRecords} live />
          <Stat
            label="Championship Seasons Imported"
            value={stats.championshipSeasonsImported}
            live
          />
          <Stat label="Games Supported" value={stats.gamesSupported} live />
          <Stat label="AI Modules" value={stats.aiModulesCount} live />
        </div>
      </MuseumSection>

      <MuseumSection title="Roadmap" exhibit="11">
        <RoadmapGroup title="Completed" items={ARCHIVE_ROADMAP.completed} done />
        <RoadmapGroup title="In Progress" items={ARCHIVE_ROADMAP.inProgress} progress />
        <RoadmapGroup title="Planned" items={ARCHIVE_ROADMAP.planned} />
        <RoadmapGroup title="Future" items={ARCHIVE_ROADMAP.future} future />
      </MuseumSection>

      <MuseumSection title="Founder Note" exhibit="12">
        <div style={styles.founderBlock}>
          {ARCHIVE_FOUNDER_NOTE.map((paragraph) => (
            <p key={paragraph} style={styles.founderParagraph}>
              {paragraph}
            </p>
          ))}
        </div>
      </MuseumSection>

      <MuseumSection title="Current Journey" exhibit="13">
        <div style={styles.journeyGrid}>
          <Field
            label="Current Version"
            value={
              <BrandVersionLabel
                version={currentJourney.currentVersion.replace(/^v/i, "")}
                compact
              />
            }
            highlight
          />
          <Field label="Days Building" value={String(currentJourney.daysBuilding)} />
          <Field
            label="Captain's Log Entries"
            value={String(currentJourney.logEntries)}
          />
          <Field label="Last Milestone" value={currentJourney.lastMilestone} wide />
          <Field label="Current Focus" value={currentJourney.currentFocus} wide />
        </div>
      </MuseumSection>

      <MuseumSection title="R79 Identity" exhibit="14" prominent>
        <div style={styles.identityBlock}>
          {ARCHIVE_IDENTITY.map((line) => (
            <p key={line} style={styles.identityLine}>
              {line}
            </p>
          ))}
        </div>
      </MuseumSection>

      <footer style={styles.footer}>
        <div style={styles.footerClosing}>
          {ARCHIVE_FOOTER.closing.map((line) => (
            <p key={line} style={styles.footerClosingLine}>
              {line}
            </p>
          ))}
          <p style={styles.footerFinalLine}>{ARCHIVE_FOOTER.finalLine}</p>
        </div>
      </footer>

      <ThePromiseSection />

      {showJournalModal ? (
        <CaptainsLogModal
          isEditing={Boolean(editingEntryId)}
          date={journalDate}
          title={journalTitle}
          text={journalText}
          buildVersion={journalBuildVersion}
          tags={journalTags}
          message={journalMessage}
          onDateChange={setJournalDate}
          onTitleChange={setJournalTitle}
          onTextChange={setJournalText}
          onBuildVersionChange={setJournalBuildVersion}
          onTagsChange={setJournalTags}
          onSave={handleSaveJournalEntry}
          onCancel={closeJournalModal}
        />
      ) : null}
    </section>
  );
}

function BrowseHistoryTimeline({ entries, expandedId, onToggle }) {
  if (entries.length === 0) {
    return (
      <p style={styles.browseEmpty}>
        No Captain&apos;s Log entries yet. Add a log entry to build the history
        timeline.
      </p>
    );
  }

  return (
    <div style={styles.browseTimeline}>
      {entries.map((entry, index) => {
        const isExpanded = expandedId === entry.id;
        const isLast = index === entries.length - 1;

        return (
          <div key={entry.id} style={styles.browseTimelineItem}>
            {!isLast ? <span style={styles.browseTimelineLine} aria-hidden="true" /> : null}

            <button
              type="button"
              onClick={() => onToggle(entry.id)}
              style={{
                ...styles.browseTimelineButton,
                ...(isExpanded ? styles.browseTimelineButtonExpanded : null),
              }}
              aria-expanded={isExpanded}
            >
              <span style={styles.browseTimelineIcon} aria-hidden="true">
                {getCaptainsLogEntryIcon(entry)}
              </span>

              <span style={styles.browseTimelineContent}>
                <span style={styles.browseTimelineDate}>
                  {formatArchiveJournalDate(entry.date)}
                </span>
                <span style={styles.browseTimelineTitle}>{entry.title}</span>
                <span style={styles.browseTimelineVersion}>
                  {entry.buildVersion}
                </span>
              </span>

              <span style={styles.browseTimelineChevron} aria-hidden="true">
                {isExpanded ? "▾" : "▸"}
              </span>
            </button>

            <div
              style={{
                ...styles.browseExpandShell,
                gridTemplateRows: isExpanded ? "1fr" : "0fr",
              }}
            >
              <div style={styles.browseExpandInner}>
                <article style={styles.browseExpandedEntry}>
                  <div style={styles.logMetaRow}>
                    <span style={styles.logMetaItem}>
                      Build {entry.buildVersion}
                    </span>
                    {entry.tags?.length ? (
                      <div style={styles.logTagRow}>
                        {entry.tags.map((tag) => (
                          <span key={`${entry.id}-browse-${tag}`} style={styles.logTag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div style={styles.snapshotPanel}>
                    <p style={styles.snapshotTitle}>Snapshot statistics</p>
                    <div style={styles.snapshotGrid}>
                      <SnapshotStat
                        label="Cars indexed"
                        value={entry.snapshot.carsIndexed}
                      />
                      <SnapshotStat
                        label="Tracks supported"
                        value={entry.snapshot.tracksSupported}
                      />
                      <SnapshotStat
                        label="Historical records"
                        value={entry.snapshot.historicalRecords}
                      />
                      <SnapshotStat
                        label="Games supported"
                        value={entry.snapshot.gamesSupported}
                      />
                      <SnapshotStat
                        label="AI modules"
                        value={entry.snapshot.aiModulesCount}
                      />
                    </div>
                  </div>

                  <p style={styles.journalEntryText}>{entry.text}</p>
                  <p style={styles.logEntryFooter}>{CAPTAINS_LOG_ENTRY_FOOTER}</p>
                </article>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CaptainsLogModal({
  isEditing,
  date,
  title,
  text,
  buildVersion,
  tags,
  message,
  onDateChange,
  onTitleChange,
  onTextChange,
  onBuildVersionChange,
  onTagsChange,
  onSave,
  onCancel,
}) {
  return (
    <div style={styles.modalOverlay} onClick={onCancel} role="presentation">
      <div
        style={styles.modalPanel}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label={isEditing ? "Edit log entry" : "Add log entry"}
      >
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>
            {isEditing ? "Edit Log Entry" : "Add Log Entry"}
          </h3>
          <button type="button" onClick={onCancel} style={styles.modalCloseButton}>
            ×
          </button>
        </div>

        <div style={styles.modalForm}>
          <label style={styles.journalLabel}>
            Date
            <input
              type="date"
              value={date}
              onChange={(event) => onDateChange(event.target.value)}
              style={styles.journalDateInput}
            />
          </label>
          <label style={styles.journalLabel}>
            Title
            <input
              type="text"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Log entry title…"
              style={styles.journalTitleInput}
            />
          </label>
          <label style={styles.journalLabel}>
            Entry Text
            <textarea
              value={text}
              onChange={(event) => onTextChange(event.target.value)}
              placeholder="Document a milestone, reflection, or turning point…"
              rows={8}
              style={styles.journalTextarea}
            />
          </label>
          <label style={styles.journalLabel}>
            Build Version
            <input
              type="text"
              value={buildVersion}
              onChange={(event) => onBuildVersionChange(event.target.value)}
              placeholder="e.g. v1.0.0"
              style={styles.journalTitleInput}
            />
          </label>
          <label style={styles.journalLabel}>
            Tags (optional)
            <input
              type="text"
              value={tags}
              onChange={(event) => onTagsChange(event.target.value)}
              placeholder="milestone, platform, gt8"
              style={styles.journalTitleInput}
            />
          </label>
          {message ? <p style={styles.modalMessage}>{message}</p> : null}
        </div>

        <div style={styles.modalActions}>
          <button type="button" onClick={onSave} style={styles.journalButton}>
            Save
          </button>
          <button type="button" onClick={onCancel} style={styles.journalCancelButton}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function SnapshotStat({ label, value }) {
  return (
    <div style={styles.snapshotStat}>
      <span style={styles.snapshotLabel}>{label}</span>
      <span style={styles.snapshotValue}>{value}</span>
    </div>
  );
}

function Breadcrumb({ items }) {
  return (
    <nav style={styles.breadcrumb} aria-label="Archive navigation">
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

function MuseumSection({
  title,
  exhibit,
  subtitle,
  prominent = false,
  children,
}) {
  return (
    <article
      style={{
        ...styles.section,
        ...(prominent ? styles.sectionProminent : null),
      }}
    >
      <div style={styles.sectionHeader}>
        {exhibit ? (
          <span style={styles.exhibitLabel}>Exhibit {exhibit}</span>
        ) : null}
        <h3 style={styles.sectionTitle}>{title}</h3>
        {subtitle ? <p style={styles.sectionSubtitle}>{subtitle}</p> : null}
      </div>
      {children}
    </article>
  );
}

function ThePromiseSection() {
  return (
    <article style={styles.promiseSection} aria-label="The Promise">
      <div style={styles.sectionHeader}>
        <span style={styles.exhibitLabel}>Permanent Record</span>
        <h3 style={styles.promiseTitle}>{ARCHIVE_PROMISE.title}</h3>
      </div>

      <div style={styles.promiseBody}>
        <p style={styles.promiseLead}>{ARCHIVE_PROMISE.lead}</p>
        {ARCHIVE_PROMISE.commitments.map((line) => (
          <p key={line} style={styles.promiseLine}>
            {line}
          </p>
        ))}
        <div style={styles.promisePrinciples}>
          {ARCHIVE_PROMISE.principles.map((line) => (
            <p key={line} style={styles.promisePrinciple}>
              {line}
            </p>
          ))}
        </div>
        <p style={styles.promiseClosing}>{ARCHIVE_PROMISE.closing}</p>
        <div style={styles.promisePathfinderBlock}>
          {ARCHIVE_PROMISE.pathfinderRecognition.map((line) => (
            <p key={line} style={styles.promisePathfinderLine}>
              {line}
            </p>
          ))}
        </div>
      </div>

      <div style={styles.promiseIdentityBlock}>
        {ARCHIVE_IDENTITY.map((line) => (
          <p key={`promise-${line}`} style={styles.promiseIdentityLine}>
            {line}
          </p>
        ))}
      </div>

      <div style={styles.promiseDivider} aria-hidden="true">
        <span style={styles.promiseDividerLine} />
      </div>

      <div style={styles.promiseJourney}>
        <h4 style={styles.promiseJourneyTitle}>Current Journey</h4>
        <div style={styles.promiseJourneyGrid}>
          <div style={styles.promiseJourneyField}>
            <span style={styles.promiseJourneyLabel}>Started</span>
            <span style={styles.promiseJourneyValue}>
              {ARCHIVE_PROMISE.journey.started}
            </span>
          </div>
          <div style={styles.promiseJourneyFieldWide}>
            <span style={styles.promiseJourneyLabel}>Status</span>
            <div style={styles.promiseStatusList}>
              {ARCHIVE_PROMISE.journey.status.map((line) => (
                <p key={line} style={styles.promiseStatusLine}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p style={styles.promiseFinalLine}>{ARCHIVE_PROMISE.finalLine}</p>
    </article>
  );
}

function QuoteWall({ quotes }) {
  return (
    <div style={styles.wall}>
      {quotes.map((passage, index) => (
        <div key={passage.join(" ")} style={styles.wallEntry}>
          <blockquote style={styles.wallQuote}>
            {passage.map((line) => (
              <p key={line} style={styles.wallLine}>
                {line}
              </p>
            ))}
          </blockquote>
          {index < quotes.length - 1 ? (
            <div style={styles.wallDivider} aria-hidden="true">
              <span style={styles.wallDividerLine} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Field({ label, value, wide = false, highlight = false }) {
  return (
    <div
      style={{
        ...styles.fieldCard,
        ...(wide ? styles.fieldCardWide : null),
        ...(highlight ? styles.fieldCardHighlight : null),
      }}
    >
      <span style={styles.fieldLabel}>{label}</span>
      <div style={styles.fieldValue}>{value}</div>
    </div>
  );
}

function Stat({ label, value, live = false }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>
        {label}
        {live ? <span style={styles.liveBadge}> live</span> : null}
      </span>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

function RoadmapGroup({ title, items, done = false, progress = false, future = false }) {
  return (
    <div style={styles.roadmapGroup}>
      <h4 style={styles.roadmapTitle}>{title}</h4>
      <ul style={styles.roadmapList}>
        {items.map((item) => (
          <li
            key={item}
            style={{
              ...styles.roadmapItem,
              ...(future ? styles.roadmapItemFuture : null),
              ...(progress ? styles.roadmapItemProgress : null),
            }}
          >
            <span style={styles.roadmapMarker} aria-hidden="true">
              {done ? "✓" : "•"}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  shell: {
    background: [
      "radial-gradient(ellipse at 50% -10%, rgba(45, 85, 160, 0.35), transparent 55%)",
      "radial-gradient(circle at bottom, rgba(12, 18, 32, 0.95), rgba(6, 9, 16, 0.98))",
    ].join(", "),
    border: "1px solid rgba(34, 211, 238, 0.2)",
    borderRadius: "16px",
    color: "#f3f6ff",
    fontFamily: "Inter, Segoe UI, Roboto, sans-serif",
    margin: "0 auto",
    maxWidth: "920px",
    padding: "24px 22px",
    boxShadow:
      "0 20px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(180, 200, 255, 0.08)",
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
  museumHeader: {
    background:
      "linear-gradient(180deg, rgba(22, 36, 68, 0.55), rgba(9, 14, 24, 0.35))",
    border: "1px solid rgba(132, 172, 255, 0.3)",
    borderRadius: "14px",
    marginBottom: "20px",
    padding: "22px 20px",
    textAlign: "center",
  },
  museumEyebrow: {
    color: "rgba(184, 205, 255, 0.75)",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.14em",
    margin: "0 0 10px",
    textTransform: "uppercase",
  },
  museumTitle: {
    fontSize: "1.75rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    margin: "0 0 10px",
  },
  museumIntro: {
    color: "rgba(220, 228, 255, 0.88)",
    fontSize: "0.95rem",
    fontStyle: "italic",
    lineHeight: 1.55,
    margin: "0 auto",
    maxWidth: "560px",
  },
  missionBlock: {
    borderLeft: "3px solid rgba(132, 172, 255, 0.45)",
    paddingLeft: "14px",
  },
  missionLead: {
    color: "#e8efff",
    fontSize: "0.95rem",
    lineHeight: 1.55,
    margin: "0 0 10px",
  },
  missionGoal: {
    color: "#dce8ff",
    fontSize: "0.92rem",
    lineHeight: 1.5,
    margin: "0 0 12px",
  },
  missionPrinciples: {
    display: "grid",
    gap: "6px",
  },
  missionPrinciple: {
    color: "#9bc0ff",
    fontSize: "0.92rem",
    fontWeight: 700,
    margin: 0,
  },
  originsBlock: {
    display: "grid",
    gap: "10px",
  },
  originsLead: {
    color: "#dce8ff",
    fontSize: "0.92rem",
    margin: 0,
  },
  originsQuestion: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(132, 172, 255, 0.35)",
    borderRadius: "10px",
    color: "#e8efff",
    fontSize: "1.05rem",
    fontStyle: "italic",
    lineHeight: 1.5,
    margin: 0,
    padding: "14px 16px",
  },
  originsParagraph: {
    color: "#dce8ff",
    fontSize: "0.9rem",
    lineHeight: 1.55,
    margin: 0,
  },
  mottoBlock: {
    background:
      "linear-gradient(135deg, rgba(45, 85, 180, 0.4), rgba(12, 20, 38, 0.92))",
    border: "1px solid rgba(132, 172, 255, 0.5)",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
    margin: 0,
    padding: "22px 24px",
    textAlign: "center",
  },
  mottoLine: {
    color: "#f3f7ff",
    fontSize: "1.2rem",
    fontStyle: "italic",
    fontWeight: 600,
    lineHeight: 1.6,
    margin: "0 0 8px",
  },
  section: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(34, 211, 238, 0.16)",
    borderRadius: "12px",
    marginBottom: "14px",
    padding: "16px",
  },
  sectionProminent: {
    borderColor: "rgba(132, 172, 255, 0.42)",
    boxShadow: "inset 0 1px 0 rgba(180, 200, 255, 0.06)",
  },
  sectionHeader: {
    borderBottom: "1px solid rgba(124, 156, 222, 0.18)",
    marginBottom: "14px",
    paddingBottom: "10px",
  },
  exhibitLabel: {
    color: "rgba(155, 192, 255, 0.65)",
    display: "block",
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    marginBottom: "6px",
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: "#e8efff",
    fontSize: "1.05rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
    margin: 0,
  },
  sectionSubtitle: {
    color: "rgba(205, 217, 255, 0.72)",
    fontSize: "0.84rem",
    fontStyle: "italic",
    lineHeight: 1.45,
    margin: "8px 0 0",
  },
  wall: {
    display: "grid",
    gap: "0",
  },
  wallEntry: {
    display: "grid",
    gap: "0",
  },
  wallQuote: {
    background: "rgba(12, 18, 31, 0.75)",
    border: "1px solid rgba(132, 172, 255, 0.22)",
    borderRadius: "10px",
    margin: 0,
    padding: "16px 18px",
    textAlign: "center",
  },
  wallLine: {
    color: "#e8efff",
    fontSize: "0.95rem",
    fontStyle: "italic",
    lineHeight: 1.6,
    margin: "0 0 6px",
  },
  wallDivider: {
    display: "flex",
    justifyContent: "center",
    padding: "14px 0",
  },
  wallDividerLine: {
    background:
      "linear-gradient(90deg, transparent, rgba(132, 172, 255, 0.45), transparent)",
    display: "block",
    height: "1px",
    width: "min(280px, 70%)",
  },
  journeyGrid: {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  },
  identityBlock: {
    textAlign: "center",
  },
  identityLine: {
    color: "#e8efff",
    fontSize: "1.05rem",
    fontStyle: "italic",
    fontWeight: 600,
    lineHeight: 1.65,
    margin: "0 0 8px",
  },
  projectGrid: {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  },
  fieldCard: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(34, 211, 238, 0.16)",
    borderRadius: "10px",
    display: "grid",
    gap: "6px",
    padding: "12px",
  },
  fieldCardWide: {
    gridColumn: "1 / -1",
  },
  fieldCardHighlight: {
    borderColor: "rgba(132, 172, 255, 0.4)",
  },
  fieldLabel: {
    color: "#b8cdff",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
  fieldValue: {
    color: "#dce8ff",
    fontSize: "0.92rem",
    lineHeight: 1.45,
  },
  philosophyBlock: {
    borderLeft: "3px solid rgba(132, 172, 255, 0.45)",
    paddingLeft: "14px",
  },
  philosophyLine: {
    color: "#dce8ff",
    fontSize: "0.92rem",
    lineHeight: 1.55,
    margin: "0 0 10px",
  },
  timelineYearBlock: {
    marginBottom: "12px",
  },
  timelineYear: {
    color: "#9bc0ff",
    fontSize: "0.95rem",
    fontWeight: 700,
    margin: "0 0 8px",
  },
  timelineList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gap: "6px",
  },
  timelineItem: {
    alignItems: "center",
    background: "rgba(20, 30, 52, 0.45)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "8px",
    color: "#dce8ff",
    display: "flex",
    fontSize: "0.88rem",
    gap: "10px",
    padding: "8px 10px",
  },
  timelineCheck: {
    color: "#7dffa8",
    fontWeight: 700,
    minWidth: "14px",
  },
  statsGrid: {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  },
  statCard: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(34, 211, 238, 0.16)",
    borderRadius: "10px",
    display: "grid",
    gap: "6px",
    padding: "12px",
  },
  statLabel: {
    color: "#b8cdff",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
  liveBadge: {
    color: "#7dffa8",
    fontSize: "0.65rem",
    fontWeight: 700,
    textTransform: "lowercase",
  },
  statValue: {
    color: "#9bc0ff",
    fontSize: "1.05rem",
    fontWeight: 700,
  },
  roadmapGroup: {
    marginBottom: "12px",
  },
  roadmapTitle: {
    color: "#b8cdff",
    fontSize: "0.82rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    margin: "0 0 8px",
    textTransform: "uppercase",
  },
  roadmapList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gap: "6px",
  },
  roadmapItem: {
    alignItems: "center",
    background: "rgba(20, 30, 52, 0.45)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "8px",
    color: "#dce8ff",
    display: "flex",
    fontSize: "0.88rem",
    gap: "10px",
    padding: "8px 10px",
  },
  roadmapItemProgress: {
    borderColor: "rgba(220, 180, 90, 0.35)",
    background: "rgba(56, 44, 18, 0.25)",
  },
  roadmapItemFuture: {
    borderStyle: "dashed",
    borderColor: "rgba(124, 156, 222, 0.25)",
    background: "rgba(16, 22, 36, 0.35)",
  },
  roadmapMarker: {
    color: "#9bc0ff",
    fontWeight: 700,
    minWidth: "14px",
  },
  journalIntro: {
    color: "rgba(205, 217, 255, 0.8)",
    fontSize: "0.88rem",
    lineHeight: 1.45,
    margin: "0 0 12px",
  },
  browseIntro: {
    color: "rgba(205, 217, 255, 0.8)",
    fontSize: "0.88rem",
    lineHeight: 1.45,
    margin: "0 0 14px",
  },
  browseEmpty: {
    color: "rgba(205, 217, 255, 0.8)",
    fontSize: "0.88rem",
    margin: 0,
  },
  browseTimeline: {
    display: "grid",
    gap: "0",
  },
  browseTimelineItem: {
    display: "grid",
    gap: "0",
    paddingLeft: "18px",
    position: "relative",
  },
  browseTimelineLine: {
    background: "linear-gradient(180deg, rgba(132, 172, 255, 0.45), rgba(132, 172, 255, 0.15))",
    bottom: 0,
    left: "7px",
    position: "absolute",
    top: "34px",
    width: "2px",
  },
  browseTimelineButton: {
    alignItems: "center",
    background: "rgba(16, 24, 42, 0.55)",
    border: "1px solid rgba(113, 143, 209, 0.25)",
    borderRadius: "10px",
    color: "#f3f6ff",
    cursor: "pointer",
    display: "flex",
    gap: "12px",
    marginBottom: "8px",
    padding: "12px 14px",
    textAlign: "left",
    transition: "background 0.25s ease, border-color 0.25s ease",
    width: "100%",
  },
  browseTimelineButtonExpanded: {
    background: "rgba(30, 52, 101, 0.45)",
    borderColor: "rgba(132, 172, 255, 0.45)",
  },
  browseTimelineIcon: {
    flexShrink: 0,
    fontSize: "1.35rem",
    lineHeight: 1,
    width: "28px",
  },
  browseTimelineContent: {
    display: "grid",
    flex: 1,
    gap: "3px",
    minWidth: 0,
  },
  browseTimelineDate: {
    color: "#9bc0ff",
    fontSize: "0.82rem",
    fontWeight: 700,
  },
  browseTimelineTitle: {
    color: "#f3f7ff",
    fontSize: "0.95rem",
    fontWeight: 700,
  },
  browseTimelineVersion: {
    color: "rgba(205, 217, 255, 0.7)",
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  browseTimelineChevron: {
    color: "#9bc0ff",
    flexShrink: 0,
    fontSize: "0.9rem",
    fontWeight: 700,
  },
  browseExpandShell: {
    display: "grid",
    marginBottom: "8px",
    transition: "grid-template-rows 0.3s ease",
  },
  browseExpandInner: {
    minHeight: 0,
    overflow: "hidden",
  },
  browseExpandedEntry: {
    background: "rgba(9, 14, 24, 0.65)",
    border: "1px solid rgba(113, 143, 209, 0.2)",
    borderRadius: "10px",
    marginBottom: "4px",
    padding: "12px 14px",
  },
  legacyBlock: {
    borderLeft: "3px solid rgba(132, 172, 255, 0.35)",
    paddingLeft: "16px",
  },
  legacyParagraph: {
    color: "#dce8ff",
    fontSize: "0.92rem",
    lineHeight: 1.6,
    margin: "0 0 12px",
  },
  legacyEmphasis: {
    color: "#e8efff",
    fontWeight: 600,
  },
  addJournalButton: {
    background: "linear-gradient(135deg, #22d3ee 0%, #6366f1 55%, #8b5cf6 100%)",
    border: "1px solid #77a0ff",
    borderRadius: "999px",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "0.88rem",
    fontWeight: 600,
    marginBottom: "14px",
    padding: "9px 16px",
  },
  modalOverlay: {
    alignItems: "center",
    background: "rgba(4, 8, 16, 0.82)",
    display: "flex",
    inset: 0,
    justifyContent: "center",
    padding: "16px",
    position: "fixed",
    zIndex: 1000,
  },
  modalPanel: {
    background:
      "radial-gradient(circle at top, rgba(30, 63, 120, 0.55), rgba(9, 12, 20, 0.98))",
    border: "1px solid rgba(132, 172, 255, 0.45)",
    borderRadius: "14px",
    boxShadow: "0 20px 48px rgba(0, 0, 0, 0.5)",
    color: "#f3f6ff",
    fontFamily: "Inter, Segoe UI, Roboto, sans-serif",
    maxWidth: "520px",
    padding: "18px",
    width: "100%",
  },
  modalHeader: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "14px",
  },
  modalTitle: {
    color: "#e8efff",
    fontSize: "1.1rem",
    margin: 0,
  },
  modalCloseButton: {
    background: "transparent",
    border: "none",
    color: "#9bc0ff",
    cursor: "pointer",
    fontSize: "1.5rem",
    lineHeight: 1,
    padding: "0 4px",
  },
  modalForm: {
    display: "grid",
    gap: "10px",
    marginBottom: "14px",
  },
  modalMessage: {
    color: "#ffe6a8",
    fontSize: "0.84rem",
    margin: 0,
  },
  modalActions: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  journalLabel: {
    color: "#dce9ff",
    display: "grid",
    fontSize: "0.85rem",
    fontWeight: 600,
    gap: "6px",
  },
  journalDateInput: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "8px",
    color: "#dbe6ff",
    fontSize: "0.9rem",
    padding: "8px 10px",
  },
  journalTitleInput: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "8px",
    color: "#dbe6ff",
    fontSize: "0.9rem",
    padding: "8px 10px",
  },
  journalTextarea: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "8px",
    color: "#dbe6ff",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    lineHeight: 1.45,
    padding: "10px",
    resize: "vertical",
  },
  journalButton: {
    background: "linear-gradient(135deg, #22d3ee 0%, #6366f1 55%, #8b5cf6 100%)",
    border: "1px solid #77a0ff",
    borderRadius: "999px",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    padding: "8px 16px",
  },
  journalCancelButton: {
    background: "rgba(20, 28, 48, 0.9)",
    border: "1px solid rgba(141, 169, 233, 0.35)",
    borderRadius: "999px",
    color: "#d8e3ff",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    padding: "8px 16px",
  },
  journalList: {
    display: "grid",
    gap: "10px",
  },
  journalEntry: {
    background: "rgba(16, 24, 42, 0.55)",
    border: "1px solid rgba(113, 143, 209, 0.25)",
    borderLeft: "3px solid rgba(132, 172, 255, 0.45)",
    borderRadius: "10px",
    padding: "12px 14px",
  },
  journalEntryHeader: {
    alignItems: "flex-start",
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "10px",
  },
  journalEntryDate: {
    color: "#9bc0ff",
    fontSize: "0.88rem",
    fontWeight: 700,
    margin: "0 0 4px",
  },
  journalEntryTitle: {
    color: "#f3f7ff",
    fontSize: "1rem",
    fontWeight: 700,
    margin: 0,
  },
  journalEditButton: {
    background: "rgba(20, 28, 48, 0.9)",
    border: "1px solid rgba(141, 169, 233, 0.35)",
    borderRadius: "999px",
    color: "#d8e3ff",
    cursor: "pointer",
    flexShrink: 0,
    fontSize: "0.78rem",
    fontWeight: 600,
    padding: "5px 12px",
  },
  journalEntryText: {
    color: "#dce8ff",
    fontSize: "0.9rem",
    lineHeight: 1.6,
    margin: "0 0 10px",
    whiteSpace: "pre-line",
  },
  logMetaRow: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "12px",
  },
  logMetaItem: {
    color: "#b8cdff",
    fontSize: "0.82rem",
    fontWeight: 600,
  },
  logTagRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  logTag: {
    background: "rgba(30, 52, 101, 0.45)",
    border: "1px solid rgba(134, 169, 240, 0.4)",
    borderRadius: "999px",
    color: "#dce9ff",
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "4px 10px",
  },
  snapshotPanel: {
    background: "rgba(9, 14, 24, 0.65)",
    border: "1px solid rgba(113, 143, 209, 0.2)",
    borderRadius: "8px",
    marginBottom: "12px",
    padding: "10px 12px",
  },
  snapshotTitle: {
    color: "#b8cdff",
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
    margin: "0 0 8px",
    textTransform: "uppercase",
  },
  snapshotGrid: {
    display: "grid",
    gap: "8px",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  },
  snapshotStat: {
    background: "rgba(20, 30, 52, 0.45)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "8px",
    display: "grid",
    gap: "4px",
    padding: "8px",
  },
  snapshotLabel: {
    color: "#b8cdff",
    fontSize: "0.72rem",
    fontWeight: 600,
  },
  snapshotValue: {
    color: "#9bc0ff",
    fontSize: "0.95rem",
    fontWeight: 700,
  },
  logEntryFooter: {
    borderTop: "1px solid rgba(124, 156, 222, 0.2)",
    color: "rgba(184, 205, 255, 0.8)",
    fontSize: "0.84rem",
    fontStyle: "italic",
    margin: 0,
    paddingTop: "10px",
    textAlign: "center",
  },
  founderBlock: {
    borderLeft: "3px solid rgba(155, 192, 255, 0.3)",
    paddingLeft: "14px",
  },
  founderParagraph: {
    color: "#dce8ff",
    fontSize: "0.9rem",
    lineHeight: 1.55,
    margin: "0 0 10px",
  },
  footer: {
    background: "rgba(9, 14, 24, 0.65)",
    border: "1px solid rgba(124, 156, 222, 0.22)",
    borderRadius: "12px",
    marginTop: "6px",
    padding: "20px 18px",
    textAlign: "center",
  },
  footerClosing: {
    marginBottom: "16px",
  },
  footerClosingLine: {
    color: "rgba(205, 217, 255, 0.8)",
    fontSize: "0.9rem",
    fontStyle: "italic",
    lineHeight: 1.55,
    margin: "0 0 5px",
  },
  captainsLogHeader: {
    color: "rgba(184, 205, 255, 0.72)",
    fontSize: "0.86rem",
    fontStyle: "italic",
    fontWeight: 500,
    letterSpacing: "0.02em",
    margin: "0 0 14px",
    textAlign: "center",
  },
  footerFinalLine: {
    color: "rgba(184, 205, 255, 0.92)",
    fontSize: "0.92rem",
    fontStyle: "italic",
    fontWeight: 600,
    lineHeight: 1.55,
    margin: "12px 0 0",
  },
  promiseSection: {
    background:
      "linear-gradient(180deg, rgba(28, 48, 92, 0.35), rgba(9, 14, 24, 0.95))",
    border: "1px solid rgba(132, 172, 255, 0.45)",
    borderRadius: "14px",
    boxShadow:
      "0 12px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(200, 215, 255, 0.08)",
    marginBottom: "0",
    marginTop: "16px",
    padding: "20px 18px",
  },
  promiseTitle: {
    color: "#f3f7ff",
    fontSize: "1.15rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
    margin: 0,
  },
  promiseBody: {
    borderLeft: "3px solid rgba(132, 172, 255, 0.4)",
    marginBottom: "18px",
    paddingLeft: "16px",
  },
  promiseLead: {
    color: "#e8efff",
    fontSize: "0.95rem",
    fontWeight: 600,
    lineHeight: 1.55,
    margin: "0 0 12px",
  },
  promiseLine: {
    color: "#dce8ff",
    fontSize: "0.92rem",
    lineHeight: 1.55,
    margin: "0 0 8px",
  },
  promisePrinciples: {
    display: "grid",
    gap: "6px",
    margin: "14px 0",
  },
  promisePrinciple: {
    color: "#9bc0ff",
    fontSize: "0.92rem",
    fontWeight: 700,
    lineHeight: 1.5,
    margin: 0,
  },
  promiseClosing: {
    color: "#e8efff",
    fontSize: "0.94rem",
    fontStyle: "italic",
    fontWeight: 600,
    lineHeight: 1.55,
    margin: "14px 0 0",
  },
  promisePathfinderBlock: {
    display: "grid",
    gap: "8px",
    marginTop: "14px",
  },
  promisePathfinderLine: {
    color: "rgba(255, 230, 168, 0.92)",
    fontSize: "0.92rem",
    lineHeight: 1.55,
    margin: 0,
  },
  promiseIdentityBlock: {
    marginBottom: "18px",
    textAlign: "center",
  },
  promiseIdentityLine: {
    color: "#e8efff",
    fontSize: "1rem",
    fontStyle: "italic",
    fontWeight: 600,
    lineHeight: 1.65,
    margin: "0 0 6px",
  },
  promiseDivider: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "18px",
  },
  promiseDividerLine: {
    background:
      "linear-gradient(90deg, transparent, rgba(132, 172, 255, 0.4), transparent)",
    display: "block",
    height: "1px",
    width: "min(320px, 80%)",
  },
  promiseJourney: {
    background: "rgba(12, 18, 31, 0.65)",
    border: "1px solid rgba(132, 172, 255, 0.22)",
    borderRadius: "10px",
    marginBottom: "18px",
    padding: "14px 16px",
  },
  promiseJourneyTitle: {
    color: "#b8cdff",
    fontSize: "0.82rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    margin: "0 0 12px",
    textTransform: "uppercase",
  },
  promiseJourneyGrid: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  },
  promiseJourneyField: {
    display: "grid",
    gap: "6px",
  },
  promiseJourneyFieldWide: {
    display: "grid",
    gap: "8px",
    gridColumn: "1 / -1",
  },
  promiseJourneyLabel: {
    color: "#b8cdff",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
  promiseJourneyValue: {
    color: "#9bc0ff",
    fontSize: "1.05rem",
    fontWeight: 700,
  },
  promiseStatusList: {
    display: "grid",
    gap: "6px",
  },
  promiseStatusLine: {
    color: "#dce8ff",
    fontSize: "0.92rem",
    lineHeight: 1.45,
    margin: 0,
  },
  promiseFinalLine: {
    borderTop: "1px solid rgba(124, 156, 222, 0.25)",
    color: "rgba(184, 205, 255, 0.92)",
    fontSize: "0.98rem",
    fontStyle: "italic",
    fontWeight: 600,
    letterSpacing: "0.02em",
    margin: 0,
    paddingTop: "16px",
    textAlign: "center",
  },
};
