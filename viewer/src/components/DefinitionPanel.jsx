// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

function DefinitionPanel({
  presetNames,
  selectedPreset,
  onPresetChange,
  baseSelectedConfig,
  selectedConfig,
  onConfigChange
}) {
  const rules = selectedConfig?.states?.rules || [];
  const actions = selectedConfig?.actions?.byState || {};
  const stateEscalations = selectedConfig?.escalations?.state || {};
  const actionEscalations = selectedConfig?.escalations?.action || {};
  const baseRules = baseSelectedConfig?.states?.rules || [];
  const baseActions = baseSelectedConfig?.actions?.byState || {};
  const baseStateEscalations = baseSelectedConfig?.escalations?.state || {};
  const baseActionEscalations = baseSelectedConfig?.escalations?.action || {};

  function updateRuleNumber(index, key, rawValue) {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      return;
    }

    const nextConfig = structuredClone(selectedConfig);
    if (!nextConfig?.states?.rules?.[index]) {
      return;
    }

    nextConfig.states.rules[index][key] = value;
    onConfigChange(nextConfig);
  }

  function updateAction(state, action) {
    const nextConfig = structuredClone(selectedConfig);
    if (!nextConfig?.actions?.byState || !(state in nextConfig.actions.byState)) {
      return;
    }

    nextConfig.actions.byState[state] = action;
    onConfigChange(nextConfig);
  }

  function updateEscalationDuration(group, name, rawValue) {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      return;
    }

    const nextConfig = structuredClone(selectedConfig);
    if (
      !nextConfig?.escalations ||
      !nextConfig.escalations[group] ||
      !nextConfig.escalations[group][name]
    ) {
      return;
    }

    nextConfig.escalations[group][name].durationMs = value;
    onConfigChange(nextConfig);
  }

  function updateActionEscalationBoolean(name, rawValue) {
    const nextConfig = structuredClone(selectedConfig);
    if (!nextConfig?.escalations?.action?.[name]) {
      return;
    }

    if (rawValue === "") {
      delete nextConfig.escalations.action[name].requireNoCoolingEffect;
    } else {
      nextConfig.escalations.action[name].requireNoCoolingEffect = rawValue === "true";
    }

    onConfigChange(nextConfig);
  }

  function renderActionRow([state, action]) {
    const availableActions = Array.from(new Set(Object.values(actions)));

    return (
      <tr key={state}>
        <td>{state}</td>
        <td>
          <select
            className="editable-field"
            value={action}
            onChange={(event) => updateAction(state, event.target.value)}
          >
            {availableActions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </td>
      </tr>
    );
  }

  function renderRuleCondition(rule, index) {
    const thresholdInput = (key) => (
      <input
        className="editable-field"
        type="number"
        step="any"
        value={rule[key]}
        onChange={(event) => updateRuleNumber(index, key, event.target.value)}
      />
    );

    if (rule.type === "value_gte" && typeof rule.threshold === "number") {
      return (
        <div className="rule-condition-inline">
          value &gt;= {thresholdInput("threshold")}
        </div>
      );
    }

    if (rule.type === "rate_gt" && typeof rule.threshold === "number") {
      return (
        <div className="rule-condition-inline">
          tempRateAvg &gt; {thresholdInput("threshold")}
        </div>
      );
    }

    if (rule.type === "rate_lt" && typeof rule.threshold === "number") {
      return (
        <div className="rule-condition-inline">
          tempRateAvg &lt; {thresholdInput("threshold")}
        </div>
      );
    }

    if (
      rule.type === "hysteresis" &&
      typeof rule.threshold === "number" &&
      typeof rule.offThreshold === "number"
    ) {
      return (
        <div className="rule-condition-cell">
          <div className="rule-condition-inline">
            value &gt;= {thresholdInput("threshold")}
          </div>
          <div className="rule-condition-inline">
            previousState = {rule.state || rule.name} かつ value &gt; {thresholdInput("offThreshold")}
          </div>
        </div>
      );
    }

    return <span>{rule.type || "-"}</span>;
  }

  function buildChanges() {
    const changes = [];

    rules.forEach((rule, index) => {
      const baseRule = baseRules[index];
      if (!baseRule) {
        return;
      }

      if (typeof rule.threshold === "number" && rule.threshold !== baseRule.threshold) {
        changes.push({
          key: `rule-threshold-${index}`,
          label: `Rules: ${rule.name} threshold ${baseRule.threshold} -> ${rule.threshold}`,
          resetType: "rule-threshold",
          target: index
        });
      }

      if (typeof rule.offThreshold === "number" && rule.offThreshold !== baseRule.offThreshold) {
        changes.push({
          key: `rule-off-threshold-${index}`,
          label: `Rules: ${rule.name} offThreshold ${baseRule.offThreshold} -> ${rule.offThreshold}`,
          resetType: "rule-off-threshold",
          target: index
        });
      }
    });

    Object.entries(actions).forEach(([state, action]) => {
      const baseAction = baseActions[state];
      if (baseAction !== undefined && action !== baseAction) {
        changes.push({
          key: `action-${state}`,
          label: `Actions: ${state} ${baseAction} -> ${action}`,
          resetType: "action",
          target: state
        });
      }
    });

    Object.entries(stateEscalations).forEach(([name, escalation]) => {
      const baseEscalation = baseStateEscalations[name];
      if (baseEscalation && escalation.durationMs !== baseEscalation.durationMs) {
        changes.push({
          key: `state-escalation-${name}`,
          label: `Escalations: ${name} ${baseEscalation.durationMs}ms -> ${escalation.durationMs}ms`,
          resetType: "state-escalation",
          target: name
        });
      }
    });

    Object.entries(actionEscalations).forEach(([name, escalation]) => {
      const baseEscalation = baseActionEscalations[name];
      if (baseEscalation && escalation.durationMs !== baseEscalation.durationMs) {
        changes.push({
          key: `action-escalation-${name}`,
          label: `Escalations: ${name} ${baseEscalation.durationMs}ms -> ${escalation.durationMs}ms`,
          resetType: "action-escalation",
          target: name
        });
      }

      const baseRequireNoCoolingEffect = baseEscalation?.requireNoCoolingEffect;
      if (baseEscalation && escalation.requireNoCoolingEffect !== baseRequireNoCoolingEffect) {
        changes.push({
          key: `action-escalation-cooling-effect-${name}`,
          label: `Escalations: ${name} requireNoCoolingEffect ${String(baseRequireNoCoolingEffect)} -> ${String(escalation.requireNoCoolingEffect)}`,
          resetType: "action-escalation-cooling-effect",
          target: name
        });
      }
    });

    return changes;
  }

  function resetChange(resetType, target) {
    const nextConfig = structuredClone(selectedConfig);
    if (!nextConfig || !baseSelectedConfig) {
      return;
    }

    if (resetType === "rule-threshold" && nextConfig.states?.rules?.[target]) {
      nextConfig.states.rules[target].threshold = baseRules[target]?.threshold;
    }

    if (resetType === "rule-off-threshold" && nextConfig.states?.rules?.[target]) {
      nextConfig.states.rules[target].offThreshold = baseRules[target]?.offThreshold;
    }

    if (resetType === "action" && nextConfig.actions?.byState?.[target] !== undefined) {
      nextConfig.actions.byState[target] = baseActions[target];
    }

    if (resetType === "state-escalation" && nextConfig.escalations?.state?.[target]) {
      nextConfig.escalations.state[target].durationMs = baseStateEscalations[target]?.durationMs;
    }

    if (resetType === "action-escalation" && nextConfig.escalations?.action?.[target]) {
      nextConfig.escalations.action[target].durationMs = baseActionEscalations[target]?.durationMs;
    }

    if (resetType === "action-escalation-cooling-effect" && nextConfig.escalations?.action?.[target]) {
      const baseValue = baseActionEscalations[target]?.requireNoCoolingEffect;
      if (baseValue === undefined) {
        delete nextConfig.escalations.action[target].requireNoCoolingEffect;
      } else {
        nextConfig.escalations.action[target].requireNoCoolingEffect = baseValue;
      }
    }

    onConfigChange(nextConfig);
  }

  function resetAllChanges() {
    if (!baseSelectedConfig) {
      return;
    }

    onConfigChange(structuredClone(baseSelectedConfig));
  }

  const changes = buildChanges();

  return (
    <section className="panel definition-panel">
      <h2>定義（Definition）</h2>
      <p className="section-note">現在の定義を編集し、入力に対する判定結果を確認できます。</p>

      <div className="definition-block">
        <h3>プリセット（Preset）</h3>
        <label htmlFor="preset-select">使用する定義（Active Definition）</label>
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
      </div>

      <div className="definition-block">
        <div className="definition-header-row">
          <h3>変更内容（Changes）</h3>
          <button type="button" className="secondary button-small" onClick={resetAllChanges}>
            変更をリセット
          </button>
        </div>
        <div className="changes-panel">
          {!changes.length ? <div className="changes-item">変更なし</div> : null}
          {changes.map((change) => (
            <div key={change.key} className="changes-item">
              <span className="changes-item-text">{change.label}</span>
              <button
                type="button"
                className="secondary button-small"
                onClick={() => resetChange(change.resetType, change.target)}
              >
                戻す
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="definition-block">
        <h3>ルール（Rules）</h3>
        <table className="definition-table">
          <thead>
            <tr>
              <th>順</th>
              <th>状態名（Name）</th>
              <th>条件</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule, index) => (
              <tr key={`${rule.name}-${index}`}>
                <td>{index + 1}</td>
                <td>{rule.name}</td>
                <td>{renderRuleCondition(rule, index)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="definition-block">
        <h3>アクション（Actions）</h3>
        <table className="definition-table">
          <thead>
            <tr>
              <th>状態（state）</th>
              <th>実行内容（action）</th>
            </tr>
          </thead>
          <tbody>{Object.entries(actions).map(renderActionRow)}</tbody>
        </table>
      </div>

      <div className="definition-block">
        <details>
          <summary>詳細設定：継続時間による昇格（Escalations）</summary>
          <table className="definition-table">
            <thead>
              <tr>
                <th>分類（Group）</th>
                <th>名前（Name）</th>
                <th>継続時間（durationMs）</th>
                <th>冷却効果なし必須（requireNoCoolingEffect）</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stateEscalations).map(([name, escalation]) => (
                <tr key={`state-${name}`}>
                  <td>状態（state）</td>
                  <td>{name}</td>
                  <td>
                    <input
                      className="editable-field"
                      type="number"
                      step="1"
                      value={escalation.durationMs ?? ""}
                      onChange={(event) => updateEscalationDuration("state", name, event.target.value)}
                    />
                  </td>
                  <td>-</td>
                </tr>
              ))}
              {Object.entries(actionEscalations).map(([name, escalation]) => (
                <tr key={`action-${name}`}>
                  <td>アクション（action）</td>
                  <td>{name}</td>
                  <td>
                    <input
                      className="editable-field"
                      type="number"
                      step="1"
                      value={escalation.durationMs ?? ""}
                      onChange={(event) => updateEscalationDuration("action", name, event.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      className="editable-field"
                      value={
                        escalation.requireNoCoolingEffect === true
                          ? "true"
                          : escalation.requireNoCoolingEffect === false
                            ? "false"
                            : ""
                      }
                      onChange={(event) => updateActionEscalationBoolean(name, event.target.value)}
                    >
                      <option value="">未指定</option>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </section>
  );
}

export default DefinitionPanel;
