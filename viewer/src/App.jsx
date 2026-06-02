// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";
import { useSimulation } from "./hooks/useSimulation";
import DefinitionPanel from "./components/DefinitionPanel";
import InputPanel from "./components/InputPanel";
import ResultPanel from "./components/ResultPanel";
import TimelineSimulationPanel from "./components/TimelineSimulationPanel";

function getWorkspaceStatusTone(status) {
  if (!status) {
    return "workspace-status-neutral";
  }

  if (status.includes("error")) {
    return "workspace-status-error";
  }

  if (
    status.startsWith("saved") ||
    status.startsWith("loaded") ||
    status.startsWith("cleared") ||
    status.startsWith("config exported") ||
    status.startsWith("config imported")
  ) {
    return "workspace-status-success";
  }

  return "workspace-status-neutral";
}

function App() {
  const importInputRef = useRef(null);
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
    timelineDomainRows,
    timelineError,
    isTimelinePlaying,
    runSimulation,
    playSimulation,
    stopSimulation,
    resetSimulation,
    saveWorkspace,
    loadWorkspace,
    clearWorkspace,
    importConfigFromFile,
    exportConfig,
    workspaceStatus
  } = useSimulation();

  const workspaceStatusClassName = ["workspace-status", getWorkspaceStatusTone(workspaceStatus)]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Decision Config Studio</h1>
        <p className="subtitle">
          canonical config を編集し、Import / Export round-trip を試しながら、単発評価と timeline simulation
          で挙動を確認できます。
        </p>
        <div className="workspace-controls">
          <div className="control-group">
            <span className="control-group-label">Workspace</span>
            <div className="control-group-buttons">
              <button type="button" className="secondary button-small" onClick={saveWorkspace}>
                Save
              </button>
              <button type="button" className="secondary button-small" onClick={loadWorkspace}>
                Load
              </button>
              <button type="button" className="secondary button-small" onClick={clearWorkspace}>
                Clear
              </button>
            </div>
          </div>
          <div className="control-group control-group-export">
            <span className="control-group-label">Config</span>
            <div className="control-group-buttons">
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    await importConfigFromFile(file);
                  }
                  event.target.value = "";
                }}
              />
              <button type="button" className="secondary button-small" onClick={() => importInputRef.current?.click()}>
                Import Config
              </button>
              <button type="button" className="secondary button-small" onClick={exportConfig}>
                Export Config
              </button>
            </div>
          </div>
          {workspaceStatus ? <span className={workspaceStatusClassName}>{workspaceStatus}</span> : null}
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
        <InputPanel inputText={inputText} onInputChange={setInputText} onEvaluate={evaluateCurrent} error={error} />
        <ResultPanel result={result} error={error} />
        <TimelineSimulationPanel
          sequenceText={sequenceText}
          onSequenceChange={setSequenceText}
          onRunSimulation={runSimulation}
          onPlaySimulation={playSimulation}
          onStopSimulation={stopSimulation}
          onResetSimulation={resetSimulation}
          timelineRows={timelineRows}
          timelineDomainRows={timelineDomainRows}
          timelineError={timelineError}
          isTimelinePlaying={isTimelinePlaying}
        />
      </section>
    </main>
  );
}

export default App;
