import { useSimulation } from "./hooks/useSimulation";
import DefinitionPanel from "./components/DefinitionPanel";
import InputPanel from "./components/InputPanel";
import ResultPanel from "./components/ResultPanel";

function App() {
  const {
    presetNames,
    selectedPreset,
    setSelectedPreset,
    baseSelectedConfig,
    selectedConfig,
    setSelectedConfig,
    inputText,
    setInputText,
    result,
    error,
    evaluateCurrent
  } = useSimulation();

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>プリセットビューアー</h1>
        <p className="subtitle">
          プリセットの状態ルール、アクション、継続時間による昇格を確認し、入力に対する判定結果を比較できます。
        </p>
      </header>

      <section className="dashboard-grid">
        <DefinitionPanel
          presetNames={presetNames}
          selectedPreset={selectedPreset}
          onPresetChange={setSelectedPreset}
          baseSelectedConfig={baseSelectedConfig}
          selectedConfig={selectedConfig}
          onConfigChange={setSelectedConfig}
        />
        <InputPanel
          inputText={inputText}
          onInputChange={setInputText}
          onEvaluate={evaluateCurrent}
          error={error}
        />
        <ResultPanel result={result} error={error} />
      </section>
    </main>
  );
}

export default App;
