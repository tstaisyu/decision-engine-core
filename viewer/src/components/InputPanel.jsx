function InputPanel({ inputText, onInputChange, onEvaluate }) {
  return (
    <section className="panel">
      <h2>Input</h2>
      <label htmlFor="input-json">Input JSON</label>
      <textarea
        id="input-json"
        value={inputText}
        onChange={(event) => onInputChange(event.target.value)}
        spellCheck={false}
      />
      <button type="button" onClick={onEvaluate}>
        Evaluate
      </button>
    </section>
  );
}

export default InputPanel;
