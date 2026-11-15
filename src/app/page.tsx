export default function HomePage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        textAlign: "center",
        background: "#0f172a",
        color: "#f8fafc",
      }}
    >
      <div
        style={{
          maxWidth: "640px",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "2.5rem",
          background: "#1e293b",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h1 style={{ fontSize: "2.25rem", margin: "0 0 0.75rem 0", color: "#38bdf8" }}>
          स्मृति • Smriti
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#94a3b8", marginBottom: "1.5rem" }}>
          Elderly Care &amp; Medication Management Ecosystem
        </p>
        <div
          style={{
            padding: "1rem",
            background: "#0f172a",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            fontSize: "0.95rem",
            color: "#cbd5e1",
            textAlign: "left",
          }}
        >
          <div><strong>Stage 1 Status:</strong> Backend Foundation &amp; Data Layer Active</div>
          <div><strong>API Health Check:</strong> <a href="/api/health" style={{ color: "#38bdf8" }}>/api/health</a></div>
          <div><strong>Authentication:</strong> Supabase Auth (Bearer Token / SSR Cookies)</div>
          <div><strong>Roles:</strong> DOCTOR, ELDER, CARETAKER, FAMILY</div>
        </div>
        <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
          Test all endpoints using Postman or Thunder Client via <code>api.http</code>.
        </p>
      </div>
    </main>
  );
}
