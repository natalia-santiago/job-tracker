import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./Dashboard.css";

export default function AddJob() {
  const navigate = useNavigate();

  const [token] = useState(() => localStorage.getItem("token") || "");

  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState("applied");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) navigate("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!company.trim() || !position.trim()) {
      setError("Company and Position are required.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/jobs", {
        company: company.trim(),
        position: position.trim(),
        status,
        notes: notes.trim(),
      });

      navigate("/dashboard");
    } catch (err) {
      if (err?.response?.status === 401) {
        logout();
        return;
      }
      setError(err?.response?.data?.error || "Failed to add job");
    } finally {
      setSaving(false);
    }
  };

  if (!token) return null;

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="brandMark" />
          <div>
            <h1 className="title">Add Job</h1>
            <p className="subtitle">Create a new job application entry</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className="btn btnGhost btnSmall" onClick={() => navigate("/dashboard")}>
            Back
          </button>
          <button className="btn btnGhost btnSmall" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div className="alert" role="alert">
          <div className="alertTitle">Error</div>
          <div className="alertBody">{error}</div>
        </div>
      )}

      <main className="grid">
        <section className="card">
          <div className="cardHeader">
            <h2 className="cardTitle">Job Details</h2>
            <span className="cardHint">All fields are private to your account</span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Company *</span>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., DLB Associates"
                style={inputStyle}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Position *</span>
              <input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g., Commissioning Field Technician II"
                style={inputStyle}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
                <option value="applied">applied</option>
                <option value="interview">interview</option>
                <option value="offer">offer</option>
                <option value="rejected">rejected</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes (recruiter name, next steps, etc.)"
                rows={5}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </label>

            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button className="btn" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Job"}
              </button>

              <button
                className="btn btnGhost"
                type="button"
                onClick={() => navigate("/dashboard")}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Natalia Santiago</span>
        <span className="dot" />
        <span>React • Express • MongoDB</span>
      </footer>
    </div>
  );
}

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  outline: "none",
  fontSize: 14,
};
