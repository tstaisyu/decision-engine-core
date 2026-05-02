import { useSimulation } from "./hooks/useSimulation";
import DefinitionPanel from "./components/DefinitionPanel";
import InputPanel from "./components/InputPanel";
import ResultPanel from "./components/ResultPanel";
import TimelineChart from "./components/TimelineChart";

function App() {
  const {
    presetNames,
    selectedPreset,
    setSelectedPreset,
    inputText,
    setInputText,
    result,
    error,
    evaluateCurrent
  } = useSimulation();

  return (
    <main className="app-shell">
      <h1>Decision Engine Viewer</h1>
      <p className="subtitle">First-step React viewer for running local preset simulations.</p>

      <div className="layout">
        <DefinitionPanel
          presetNames={presetNames}
          selectedPreset={selectedPreset}
          onPresetChange={setSelectedPreset}
        />
        <InputPanel inputText={inputText} onInputChange={setInputText} onEvaluate={evaluateCurrent} />
      </div>

      <ResultPanel result={result} error={error} />
      <TimelineChart />
    </main>
  );
}

export default App;
