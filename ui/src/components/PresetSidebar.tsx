const DEMO_PRESETS = [
  { id: "demo", name: "Demo — orbit with zoom", active: true },
  { id: "slow_swing", name: "Slow swing test", active: false },
  { id: "blank", name: "Empty 30s", active: false },
];

type Props = {
  projectName: string;
  onSelectPreset: (id: string) => void;
};

export function PresetSidebar({ projectName, onSelectPreset }: Props) {
  return (
    <aside className="preset-sidebar">
      <h3>Animations</h3>
      <ul className="preset-list">
        {DEMO_PRESETS.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              className={projectName.toLowerCase().includes(p.id.replace("_", "")) || p.name === projectName ? "active" : ""}
              onClick={() => onSelectPreset(p.id)}
            >
              {p.name}
            </button>
          </li>
        ))}
      </ul>
      <p className="preset-note">Preset switching is demo-only until host API is connected.</p>
    </aside>
  );
}
