import React, { useMemo, useState } from "react";

const WHEELS = {
  T598: ["FFB", "MASTER", "MODE", "INERTIA", "FRICTION", "BOOST LOW", "BOOST HIGH", "SPEED", "DAMPER", "DAMPER GAIN", "SPRING", "GEAR JOLT", "END STOP"],
  "Fanatec DD Pro": ["SEN", "FFB", "FFS", "NDP", "NFR", "NIN", "INT", "FEI", "FOR", "SPR", "DPR"],
  "Fanatec ClubSport DD": ["SEN", "FFB", "FFS", "NDP", "NFR", "NIN", "INT", "FEI", "FOR", "SPR", "DPR"],
  "Logitech G Pro": ["FFB STRENGTH", "TRUEFORCE", "DAMPING", "FILTER", "ANGLE", "BRAKE FORCE"],
  "Logitech G923": ["FFB MAX TORQUE", "FFB SENSITIVITY", "VIBRATION", "ANGLE", "DAMPING"],
};

const CARS = {
  "Gr.1": ["Toyota GR010", "Mazda LM55", "Porsche 919 Hybrid", "Audi R18", "Peugeot 908"],
  "Gr.2": ["Honda NSX Concept-GT", "Lexus RC F GT500", "Nissan GT-R GT500", "Honda NSX GT500", "Toyota Supra GT500"],
  "Gr.3": ["BMW M6 GT3 Sprint", "Aston Martin V12 Vantage GT3 '12", "Porsche 911 RSR", "Mercedes AMG GT3", "Audi R8 LMS", "Genesis X GR3", "Lexus RC F GT3", "Nissan GT-R Nismo GT3"],
  "Gr.4": ["Mazda Atenza Gr.4", "Toyota GR Supra Gr.4", "McLaren 650S Gr.4", "Citroën GT Gr.4", "Porsche Cayman GT4", "Lamborghini Huracán Gr.4"],
};

const TRACKS = ["Watkins Glen", "Circuit Gilles Villeneuve", "Road Atlanta", "Spa", "Suzuka", "Daytona", "Fuji", "Dragon Trail - Seaside", "Brands Hatch", "Nürburgring GP", "Lago Maggiore", "Blue Moon Bay", "Monza", "Laguna Seca"];
const TYRES = ["Racing Soft", "Racing Medium", "Racing Hard", "Intermediate", "Wet"];

const LEARN = {
  FFB: "Main force feedback strength. Higher gives stronger weight, lower gives lighter steering and less fatigue.",
  MASTER: "Overall wheel output strength. Higher gives more force, lower keeps the wheel smoother.",
  MODE: "Wheel response style. Sharper modes help qualifying, calmer modes help race consistency.",
  INERTIA: "Adds steering weight. Higher feels planted, lower feels quicker and more reactive.",
  FRICTION: "Adds constant resistance. Lower keeps steering cleaner, higher can add stability.",
  "BOOST LOW": "Boosts smaller forces and grip detail. Useful for catching subtle tyre load changes.",
  "BOOST HIGH": "Boosts heavy forces. Helps high-speed load feel but can become harsh if too high.",
  SPEED: "Controls response speed. Higher feels sharper, lower feels calmer.",
  DAMPER: "Controls movement resistance. Higher calms unstable cars, lower gives quicker steering.",
  "DAMPER GAIN": "How strongly damping is applied. Higher is stable, lower gives more detail.",
  SPRING: "Centering force. Higher recentres harder, lower feels more natural.",
  "GEAR JOLT": "Gear shift kick feel. Lower keeps shifts smoother.",
  "END STOP": "Resistance at steering lock. Higher feels firmer at full lock.",
};

function makeSetup(wheel, carClass, tyre, bop, laps) {
  const soft = tyre === "Racing Soft";
  const hard = tyre === "Racing Hard" || Number(laps) >= 20;
  const stable = bop === "BOP ON" || hard;

  if (wheel === "T598") {
    return {
      FFB: soft ? "3" : "2",
      MASTER: "75%",
      MODE: soft ? "S" : "B",
      INERTIA: stable ? "HIGH" : "MEDIUM",
      FRICTION: "LOW",
      "BOOST LOW": soft ? "+1" : "0",
      "BOOST HIGH": soft ? "+2" : "+1",
      SPEED: carClass === "Gr.1" || carClass === "Gr.2" ? "EXTREME" : "HIGH",
      DAMPER: stable ? "30%" : "20%",
      "DAMPER GAIN": stable ? "HIGH" : "MEDIUM",
      SPRING: stable ? "20%" : "15%",
      "GEAR JOLT": "LOW",
      "END STOP": "MEDIUM",
    };
  }

  if (wheel.includes("Fanatec")) {
    return {
      SEN: "AUTO",
      FFB: stable ? "70" : "75",
      FFS: "PEAK",
      NDP: stable ? "25" : "18",
      NFR: "5",
      NIN: stable ? "8" : "5",
      INT: soft ? "2" : "3",
      FEI: soft ? "90" : "80",
      FOR: "100",
      SPR: "100",
      DPR: "100",
    };
  }

  if (wheel === "Logitech G Pro") {
    return {
      "FFB STRENGTH": stable ? "8.0 Nm" : "8.5 Nm",
      TRUEFORCE: soft ? "55" : "45",
      DAMPING: stable ? "25" : "18",
      FILTER: "8",
      ANGLE: "1080",
      "BRAKE FORCE": stable ? "65" : "70",
    };
  }

  return {
    "FFB MAX TORQUE": stable ? "6" : "7",
    "FFB SENSITIVITY": soft ? "8" : "6",
    VIBRATION: "ON",
    ANGLE: "900",
    DAMPING: stable ? "MEDIUM" : "LOW",
  };
}

function makeNotes(track, tyre, bop) {
  const notes = [
    "Recommended baseline, adjust after first 5 clean laps.",
    tyre.includes("Soft") ? "Soft tyres support sharper response, but avoid sliding the rear." : "Prioritise consistency and tyre load management.",
    bop === "BOP ON" ? "Under BOP, wheel settings sharpen feel without changing car balance." : "No BOP may feel more car-dependent, expect stronger handling differences.",
  ];

  if (track.includes("Watkins")) notes.push("Bus Stop kerbs can be attacked, but keep the wheel settled on exit.");
  if (track.includes("Gilles")) notes.push("Chicanes need patience. Let the wheel recentre before full throttle.");
  if (track.includes("Road Atlanta")) notes.push("Keep the car stable through the esses and prioritise final corner exit.");
  if (track.includes("Suzuka")) notes.push("Sector 1 rewards smooth steering more than aggressive rotation.");
  if (track.includes("Spa")) notes.push("Keep high-speed confidence through Eau Rouge and avoid overloading tyres in sector 2.");

  return notes;
}

export default function App() {
  const [wheel, setWheel] = useState("T598");
  const [carClass, setCarClass] = useState("Gr.3");
  const [car, setCar] = useState("BMW M6 GT3 Sprint");
  const [track, setTrack] = useState("Watkins Glen");
  const [tyre, setTyre] = useState("Racing Medium");
  const [bop, setBop] = useState("BOP ON");
  const [laps, setLaps] = useState("20");
  const [generated, setGenerated] = useState(false);
  const [learn, setLearn] = useState(null);
  const [saved, setSaved] = useState(() => JSON.parse(localStorage.getItem("r79-setups") || "[]"));

  const settings = useMemo(() => makeSetup(wheel, carClass, tyre, bop, laps), [wheel, carClass, tyre, bop, laps]);
  const notes = useMemo(() => makeNotes(track, tyre, bop), [track, tyre, bop]);

  function changeClass(value) {
    setCarClass(value);
    setCar(CARS[value][0]);
  }

  function saveSetup() {
    const item = { wheel, carClass, car, track, tyre, bop, laps, settings, notes, date: new Date().toLocaleString() };
    const next = [item, ...saved].slice(0, 20);
    setSaved(next);
    localStorage.setItem("r79-setups", JSON.stringify(next));
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto p-5 pb-20">
        <header className="mb-6">
          <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent">R79</h1>
          <p className="text-zinc-400 text-sm tracking-widest uppercase">Adaptive Wheel Setup Engineer</p>
        </header>

        <Card title="Build Setup">
          <Select label="Game" value="Gran Turismo 7" options={["Gran Turismo 7"]} onChange={() => {}} />
          <Select label="Wheel Base" value={wheel} options={Object.keys(WHEELS)} onChange={setWheel} />
          <Select label="Class" value={carClass} options={Object.keys(CARS)} onChange={changeClass} />
          <Select label="Car" value={car} options={CARS[carClass]} onChange={setCar} />
          <Select label="Track" value={track} options={TRACKS} onChange={setTrack} />
          <Select label="Tyres" value={tyre} options={TYRES} onChange={setTyre} />
          <Select label="BOP" value={bop} options={["BOP ON", "BOP OFF"]} onChange={setBop} />

          <label className="block text-sm text-zinc-400 mt-4 mb-1">Race Length / Laps</label>
          <input value={laps} onChange={(e) => setLaps(e.target.value)} className="w-full rounded-xl bg-zinc-900 border border-zinc-700 p-3" />

          <button onClick={() => setGenerated(true)} className="w-full mt-5 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-black">
            Generate Setup
          </button>
        </Card>

        {generated && (
          <>
            <Card title="R79 Setup Sheet">
              <p className="text-sm text-zinc-400 mb-4">{wheel} • {car} • {track} • {tyre} • {bop} • {laps} laps</p>

              <div className="space-y-2">
                {Object.entries(settings).map(([key, value]) => (
                  <div key={key} className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3">
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-zinc-300 font-bold">{key}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-cyan-300 font-black">{value}</span>
                        <button onClick={() => setLearn(key)} className="text-xs px-2 py-1 rounded-lg border border-purple-400/40 text-purple-300">
                          Learn
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={saveSetup} className="w-full mt-5 py-3 rounded-xl border border-cyan-400/40 bg-cyan-400/10 text-cyan-200 font-bold">
                Save Setup
              </button>
            </Card>

            <Card title="Track Notes">
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note} className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-zinc-300">
                    {note}
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {saved.length > 0 && (
          <Card title="Saved Setups">
            <div className="space-y-3">
              {saved.map((item, index) => (
                <div key={index} className="rounded-xl bg-zinc-900 border border-zinc-800 p-3">
                  <p className="text-cyan-300 font-bold">{item.car}</p>
                  <p className="text-xs text-zinc-400">{item.wheel} • {item.track} • {item.tyre} • {item.bop}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {learn && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-5 z-50">
            <div className="max-w-sm w-full rounded-3xl border border-cyan-400/30 bg-zinc-950 p-6 shadow-[0_0_30px_rgba(0,255,255,0.15)]">
              <h2 className="text-2xl font-black text-cyan-300 mb-3">{learn}</h2>
              <p className="text-zinc-300 leading-relaxed">
                {LEARN[learn] || "Learning notes coming soon for this wheel-base setting."}
              </p>
              <button onClick={() => setLearn(null)} className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-black">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-zinc-950/90 p-5 mb-5 shadow-[0_0_20px_rgba(0,255,255,0.08)]">
      <h2 className="text-xl font-black text-cyan-300 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm text-zinc-400 mb-1">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl bg-zinc-900 border border-zinc-700 p-3 text-white">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
