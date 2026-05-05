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
  const rules = selectedConfig?.rules || selectedConfig?.states?.rules || [];
  const states =
    selectedConfig?.states && Array.isArray(selectedConfig.states)
      ? selectedConfig.states
      : Object.entries(selectedConfig?.actions?.byState || {}).map(([name, action]) => ({ name, action }));
  const actions = Object.fromEntries(states.map((state) => [state.name, state.action]));
  const stateEscalations = selectedConfig?.escalations?.state || {};
  const actionEscalations = selectedConfig?.escalations?.action || {};
  const baseRules = baseSelectedConfig?.rules || baseSelectedConfig?.states?.rules || [];
  const baseStates =
    baseSelectedConfig?.states && Array.isArray(baseSelectedConfig.states)
      ? baseSelectedConfig.states
      : Object.entries(baseSelectedConfig?.actions?.byState || {}).map(([name, action]) => ({ name, action }));
  const baseActions = Object.fromEntries(baseStates.map((state) => [state.name, state.action]));
  const baseStateEscalations = baseSelectedConfig?.escalations?.state || {};
  const baseActionEscalations = baseSelectedConfig?.escalations?.action || {};

  function updateRuleNumber(index, key, rawValue) {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      return;
    }

    const nextConfig = structuredClone(selectedConfig);
    if (!nextConfig) {
      return;
    }

    if (!Array.isArray(nextConfig.rules)) {
      nextConfig.rules = structuredClone(rules);
    }
    if (!nextConfig.rules?.[index]) {
      return;
    }

    nextConfig.rules[index][key] = value;

    if (nextConfig.states && !Array.isArray(nextConfig.states) && Array.isArray(nextConfig.states.rules?.[index] ? nextConfig.states.rules : null)) {
      nextConfig.states.rules[index][key] = value;
    }
    onConfigChange(nextConfig);
  }

  function updateAction(state, action) {
    const nextConfig = structuredClone(selectedConfig);
    if (!nextConfig) {
      return;
    }

    if (!Array.isArray(nextConfig.rules)) {
      nextConfig.rules = structuredClone(rules);
    }
    if (!Array.isArray(nextConfig.states)) {
      nextConfig.states = structuredClone(states);
    }
    const targetState = nextConfig.states.find((item) => item?.name === state);
    if (!targetState) {
      return;
    }

    targetState.action = action;

    if (!nextConfig.actions || Array.isArray(nextConfig.actions)) {
      nextConfig.actions = {};
    }
    if (!nextConfig.actions.byState || Array.isArray(nextConfig.actions.byState)) {
      nextConfig.actions.byState = {};
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
    const availableActions = Array.from(new Set([...Object.values(actions), ...Object.values(baseActions)]));

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
      typeof rule.onThreshold === "number" &&
      typeof rule.offThreshold === "number"
    ) {
      return (
        <div className="rule-condition-cell">
          <div className="rule-condition-inline">
            value &gt;= {thresholdInput("onThreshold")}
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

      const ruleThreshold = typeof rule.onThreshold === "number" ? rule.onThreshold : rule.threshold;
      const baseRuleThreshold =
        typeof baseRule.onThreshold === "number" ? baseRule.onThreshold : baseRule.threshold;
      if (typeof ruleThreshold === "number" && ruleThreshold !== baseRuleThreshold) {
        changes.push({
          key: `rule-threshold-${index}`,
          label: `Rules: ${rule.name} threshold ${baseRuleThreshold} -> ${ruleThreshold}`,
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

    if (resetType === "rule-threshold" && nextConfig.rules?.[target]) {
      if (typeof nextConfig.rules[target].onThreshold === "number" || typeof baseRules[target]?.onThreshold === "number") {
        nextConfig.rules[target].onThreshold = baseRules[target]?.onThreshold;
      } else {
        nextConfig.rules[target].threshold = baseRules[target]?.threshold;
      }
      if (nextConfig.states && !Array.isArray(nextConfig.states) && nextConfig.states.rules?.[target]) {
        if (
          typeof nextConfig.states.rules[target].onThreshold === "number" ||
          typeof baseRules[target]?.onThreshold === "number"
        ) {
          nextConfig.states.rules[target].onThreshold = baseRules[target]?.onThreshold;
        } else {
          nextConfig.states.rules[target].threshold = baseRules[target]?.threshold;
        }
      }
    }

    if (resetType === "rule-off-threshold" && nextConfig.rules?.[target]) {
      nextConfig.rules[target].offThreshold = baseRules[target]?.offThreshold;
      if (nextConfig.states && !Array.isArray(nextConfig.states) && nextConfig.states.rules?.[target]) {
        nextConfig.states.rules[target].offThreshold = baseRules[target]?.offThreshold;
      }
    }

    if (resetType === "action") {
      if (!Array.isArray(nextConfig.rules)) {
        nextConfig.rules = structuredClone(rules);
      }
      if (!Array.isArray(nextConfig.states)) {
        nextConfig.states = structuredClone(states);
      }
      const targetState = nextConfig.states.find((state) => state?.name === target);
      if (targetState) {
        targetState.action = baseActions[target];
      }
      if (nextConfig.actions?.byState?.[target] !== undefined) {
        nextConfig.actions.byState[target] = baseActions[target];
      }
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
        <h3>昇格条件（Escalations）</h3>
        <div className="definition-subgrid">
          <div className="definition-item">
            <label htmlFor="state-hot-to-critical">hot → critical durationMs</label>
            <input
              id="state-hot-to-critical"
              className="editable-field"
              type="number"
              step="1"
              value={stateEscalations.hotToCritical?.durationMs ?? ""}
              onChange={(event) => updateEscalationDuration("state", "hotToCritical", event.target.value)}
            />
          </div>
          <div className="definition-item">
            <label htmlFor="action-fan-low-to-high">fan_low → fan_high durationMs</label>
            <input
              id="action-fan-low-to-high"
              className="editable-field"
              type="number"
              step="1"
              value={actionEscalations.fanLowToHigh?.durationMs ?? ""}
              onChange={(event) => updateEscalationDuration("action", "fanLowToHigh", event.target.value)}
            />
          </div>
          <div className="definition-item">
            <label htmlFor="action-fan-low-to-high-cooling-effect">fanLowToHigh requireNoCoolingEffect</label>
            <select
              id="action-fan-low-to-high-cooling-effect"
              className="editable-field"
              value={
                actionEscalations.fanLowToHigh?.requireNoCoolingEffect === undefined
                  ? ""
                  : String(actionEscalations.fanLowToHigh.requireNoCoolingEffect)
              }
              onChange={(event) => updateActionEscalationBoolean("fanLowToHigh", event.target.value)}
            >
              <option value="">default</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DefinitionPanel;
