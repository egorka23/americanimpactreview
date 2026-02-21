export default function ButtonTest() {
  const steps = ["Submitted", "Under Review", "Decision", "Accepted", "Published"];
  const states = ["completed", "completed", "completed", "completed", "current"];

  const variants = [
    { name: "E — Navy (#0b2c4a)", cls: "stepper--navy" },
    { name: "F — Lime (#84cc16)", cls: "stepper--lime" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8f7f4",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "3rem",
      padding: "3rem 1rem 6rem",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1a1a2e", letterSpacing: "-0.02em" }}>
        Stepper — Navy vs Lime
      </h1>

      {variants.map((v) => (
        <div key={v.name} style={{ width: "100%", maxWidth: "540px" }}>
          <div style={{ fontSize: "0.72rem", color: "#999", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {v.name}
          </div>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem 1.2rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div className={`progress-stepper ${v.cls}`}>
              {steps.map((label, i) => {
                const state = states[i];
                const prevDone = i > 0 && states[i - 1] === "completed";
                return (
                  <div key={label} className="stepper-step-wrap">
                    {i > 0 && (
                      <div className={`stepper-line ${
                        state === "completed" || (state === "current" && prevDone)
                          ? "stepper-line--done" : ""
                      }`} />
                    )}
                    <div className={`stepper-node stepper-node--${state}`}>
                      {state === "completed" && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {state === "current" && (
                        <span className="stepper-node__dot" />
                      )}
                    </div>
                    <span className={`stepper-label stepper-label--${state}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
