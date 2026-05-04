// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

import { useSimulation } from "./hooks/useSimulation";
import DefinitionPanel from "./components/DefinitionPanel";
import InputPanel from "./components/InputPanel";
import ResultPanel from "./components/ResultPanel";
import TimelineSimulationPanel from "./components/TimelineSimulationPanel";

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
    evaluateCurrent,
    sequenceText,
    setSequenceText,
    timelineRows,
    timelineError,
    runSimulation,
    saveWorkspace,
    loadWorkspace,
    clearWorkspace,
    exportConfig,
    workspaceStatus
  } = useSimulation();

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>プリセットビューアー</h1>
        <p className="subtitle">
          プリセットの状態ルール、アクション、継続時間による昇格を確認し、入力に対する判定結果を比較できます。
        </p>
        <div className="workspace-controls">
          <button type="button" className="secondary button-small" onClick={saveWorkspace}>
            Save
          </button>
          <button type="button" className="secondary button-small" onClick={loadWorkspace}>
            Load
          </button>
          <button type="button" className="secondary button-small" onClick={clearWorkspace}>
            Clear
          </button>
          <button type="button" className="secondary button-small" onClick={exportConfig}>
            Export Config
          </button>
          <span className="workspace-status">{workspaceStatus}</span>
        </div>
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
        <TimelineSimulationPanel
          sequenceText={sequenceText}
          onSequenceChange={setSequenceText}
          onRunSimulation={runSimulation}
          timelineRows={timelineRows}
          timelineError={timelineError}
        />
      </section>
    </main>
  );
}

export default App;
