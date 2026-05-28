import React from 'react'

export default function App() {
  const STORAGE_KEY = 'r79-adaptive-selections'
  const defaultSelections = {
    selectedWheel: 'T598',
    selectedClass: 'Gr.3',
    selectedCar: 'BMW M6 GT3',
    selectedTrack: 'Watkins Glen',
    selectedPreset: 'Balanced',
  }

  const readSelection = (key, fallback) => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
      return saved[key] ?? fallback
    } catch {
      return fallback
    }
  }

  const [selectedWheel, setSelectedWheel] = React.useState(() => readSelection('selectedWheel', defaultSelections.selectedWheel))
  const [selectedClass, setSelectedClass] = React.useState(() => readSelection('selectedClass', defaultSelections.selectedClass))
  const [selectedCar, setSelectedCar] = React.useState(() => readSelection('selectedCar', defaultSelections.selectedCar))
  const [selectedTrack, setSelectedTrack] = React.useState(() => readSelection('selectedTrack', defaultSelections.selectedTrack))
  const [selectedPreset, setSelectedPreset] = React.useState(() => readSelection('selectedPreset', defaultSelections.selectedPreset))
  const [generated, setGenerated] = React.useState(false)

  React.useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedWheel,
        selectedClass,
        selectedCar,
        selectedTrack,
        selectedPreset,
      }),
    )
  }, [selectedWheel, selectedClass, selectedCar, selectedTrack, selectedPreset])

  const wheelBases = ['T598', 'Fanatec DD Pro', 'Logitech G Pro', 'Logitech G923']

  const cars = {
    'Gr.1': ['Toyota GR010', 'Mazda LM55', 'Porsche 919 Hybrid'],
    'Gr.2': ['Honda NSX Concept-GT', 'Lexus RC F GT500', 'Nissan GT-R GT500'],
    'Gr.3': ['BMW M6 GT3', 'Porsche 911 RSR', 'Mercedes AMG GT3', 'Audi R8 LMS'],
    'Gr.4': ['Toyota GR Supra Gr.4', 'Mazda Atenza Gr.4', 'McLaren 650S Gr.4'],
  }

  const tracks = ['Watkins Glen', 'Suzuka', 'Spa', 'Daytona', 'Brands Hatch']
  const presets = ['Balanced', 'Aggressive', 'Tyre Saver', 'Qualifying', 'Race']

  const profile = React.useMemo(() => {
    if (selectedPreset === 'Aggressive' || selectedPreset === 'Qualifying') {
      return { rotation: 86, stability: 68, traction: 76, tyre: 62, front: '+2', rear: '-1', brake: '-2' }
    }
    if (selectedPreset === 'Tyre Saver' || selectedPreset === 'Race') {
      return { rotation: 64, stability: 88, traction: 86, tyre: 92, front: '0', rear: '+2', brake: '+1' }
    }
    return { rotation: 72, stability: 82, traction: 84, tyre: 78, front: '+1', rear: '+1', brake: '0' }
  }, [selectedPreset])

  const presetTone = React.useMemo(() => {
    if (selectedPreset === 'Aggressive') return 'High-speed bite'
    if (selectedPreset === 'Tyre Saver') return 'Long-run stability'
    if (selectedPreset === 'Qualifying') return 'Maximum rotation'
    if (selectedPreset === 'Race') return 'Race-day durability'
    return 'Balanced control'
  }, [selectedPreset])

  const snapshotSummary = React.useMemo(() => [
    `${selectedPreset} preset`,
    `${selectedTrack} circuit`,
    `${selectedCar} setup`,
  ], [selectedPreset, selectedTrack, selectedCar])

  const bar = (value) => (
    <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
        style={{ width: `${value}%` }}
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#111827_0%,_#020617_45%,_#000000_100%)] text-white p-5 max-w-5xl mx-auto font-sans">
      <header className="rounded-3xl border border-cyan-400/20 bg-zinc-950/90 p-5 mb-5 shadow-2xl shadow-cyan-500/10">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">R79 Adaptive</p>
        <h1 className="text-4xl font-black text-cyan-300 mt-2">Motorsport Setup Lab</h1>
        <p className="text-zinc-400 mt-2">Tune your wheel, car, and track profile with an adaptive setup snapshot.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-200">
          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1">{selectedPreset}</span>
          <span className="rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1">{selectedTrack}</span>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1">{presetTone}</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {snapshotSummary.map((item) => (
            <div key={item} className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3 text-sm text-zinc-200">
              {item}
            </div>
          ))}
        </div>
      </header>

      <Section title="Wheel Base">
        {wheelBases.map((wheel) => (
          <Button key={wheel} active={selectedWheel === wheel} onClick={() => setSelectedWheel(wheel)}>
            {wheel}
          </Button>
        ))}
      </Section>

      <Section title="Race Category">
        <div className="grid grid-cols-2 gap-3">
          {Object.keys(cars).map((cat) => (
            <Button
              key={cat}
              active={selectedClass === cat}
              onClick={() => {
                setSelectedClass(cat)
                setSelectedCar(cars[cat][0])
              }}
            >
              {cat}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Car">
        {cars[selectedClass].map((car) => (
          <Button key={car} active={selectedCar === car} onClick={() => setSelectedCar(car)}>
            {car}
          </Button>
        ))}
      </Section>

      <Section title="Track">
        {tracks.map((track) => (
          <Button key={track} active={selectedTrack === track} onClick={() => setSelectedTrack(track)}>
            {track}
          </Button>
        ))}
      </Section>

      <Section title="Preset">
        <div className="grid grid-cols-2 gap-3">
          {presets.map((preset) => (
            <Button key={preset} active={selectedPreset === preset} onClick={() => setSelectedPreset(preset)}>
              {preset}
            </Button>
          ))}
        </div>
      </Section>

      <div className="mt-3 flex flex-wrap gap-3">
        <button
          onClick={() => setGenerated(true)}
          className="flex-1 min-w-[220px] py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500 text-black font-black shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01]"
        >
          Generate Adaptive Setup
        </button>
        <button
          onClick={() => {
            setSelectedWheel(defaultSelections.selectedWheel)
            setSelectedClass(defaultSelections.selectedClass)
            setSelectedCar(defaultSelections.selectedCar)
            setSelectedTrack(defaultSelections.selectedTrack)
            setSelectedPreset(defaultSelections.selectedPreset)
            setGenerated(false)
          }}
          className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-4 text-zinc-100 font-semibold transition hover:border-cyan-400/60 hover:text-cyan-100"
        >
          Reset Profile
        </button>
      </div>

      {generated && (
        <div className="mt-6 rounded-3xl bg-zinc-950 border border-cyan-400/30 p-5 space-y-5">
          <div>
            <h2 className="text-2xl font-black text-cyan-300">Setup Output</h2>
            <p className="text-zinc-400 text-sm">
              {selectedWheel} • {selectedCar} • {selectedTrack}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Box label="Front" value={profile.front} />
            <Box label="Rear" value={profile.rear} />
            <Box label="Brake" value={profile.brake} />
          </div>

          <Metric label="Rotation" value={profile.rotation} bar={bar} />
          <Metric label="Stability" value={profile.stability} bar={bar} />
          <Metric label="Traction" value={profile.traction} bar={bar} />
          <Metric label="Tyre Mgmt" value={profile.tyre} bar={bar} />

          <div className="rounded-2xl bg-zinc-900 p-4 text-zinc-300">
            Race Engineer Note: Setup tuned for {selectedPreset.toLowerCase()} behaviour on {selectedTrack}. {presetTone} is the current adaptive focus for this build.
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 mb-5">
      <h2 className="text-lg font-bold text-cyan-300 mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Button({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl p-3 border text-left transition hover:-translate-y-0.5 hover:border-cyan-400/70 ${
        active ? 'border-cyan-300 bg-cyan-500/20 text-cyan-100 shadow-inner shadow-cyan-500/10' : 'border-zinc-700 bg-zinc-900 text-zinc-300'
      }`}
    >
      {children}
    </button>
  )
}

function Box({ label, value }) {
  return (
    <div className="bg-zinc-900 rounded-xl p-3 text-center">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-2xl font-black text-purple-300">{value}</p>
    </div>
  )
}

function Metric({ label, value, bar }) {
  return (
    <div>
      <div className="flex justify-between mb-2 text-sm">
        <span>{label}</span>
        <span className="text-cyan-300">{value}%</span>
      </div>
      {bar(value)}
    </div>
  )
}
