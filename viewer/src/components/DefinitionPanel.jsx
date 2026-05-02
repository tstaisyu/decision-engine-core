function DefinitionPanel({ presetNames, selectedPreset, onPresetChange }) {
  return (
    <section className="panel">
      <h2>Preset</h2>
      <label htmlFor="preset-select">Preset selector</label>
      <select
        id="preset-select"
        value={selectedPreset}
        onChange={(event) => onPresetChange(event.target.value)}
      >
        {presetNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </section>
  );
}

export default DefinitionPanel;
