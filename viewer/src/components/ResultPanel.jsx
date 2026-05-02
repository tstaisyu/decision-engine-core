function ResultPanel({ result, error }) {
  return (
    <section className="panel">
      <h2>Result</h2>
      {error ? <p className="error">{error}</p> : null}
      {!result ? <p>No result yet.</p> : null}
      {result ? (
        <div className="result-grid">
          <div>
            <strong>State</strong>
            <p>{result.state}</p>
          </div>
          <div>
            <strong>Action</strong>
            <p>{result.action}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default ResultPanel;
