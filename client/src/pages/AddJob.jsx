import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./Dashboard.css";

const STATUS_OPTIONS = ["applied", "interview", "offer", "rejected"];

export default function AddJob() {
  const navigate = useNavigate();

  /* -------------------- Auth gate -------------------- */
  const [token] = useState(() => localStorage.getItem("token") || "");

  useEffect(() => {
    if (!token) navigate("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* -------------------- User (for header) -------------------- */
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  const initials = useMemo(() => {
    const name = user?.name || "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (first + last).toUpperCase() || "U";
  }, [user]);

  /* -------------------- Form state -------------------- */
  const [form, setForm] = useState({
    company: "",
    position: "",
    status: "applied",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Toast (optional, matches your Dashboard pattern)
  const [toast, setToast] = useState(null); // { type: "success" | "error", message }
  const toastTimer = useRef(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

  /* -------------------- Helpers -------------------- */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleApiError = (err, fallback) => {
    if (err?.response?.status === 401) {
      logout();
      return;
    }
    const msg = err?.response?.data?.error || fallback;
    setError(msg);
    showToast("error", msg);
  };

  const loadUser = async () => {
    const t = localStorage.getItem("token");
    if (!t) return logout();

    if (user?.email) return;

    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch (err) {
      handleApiError(err, "Failed to load user");
    }
  };

  useEffect(() => {
    if (!token) return;
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* -------------------- Submit -------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      company: form.company.trim(),
      position: form.position.trim(),
      status: form.status,
      notes: form.notes.trim(),
    };

    if (!payload.company || !payload.position) {
      const msg = "Company and Position are required.";
      setError(msg);
      showToast("error", msg);
      return;
    }

    setSaving(true);
    try {
      await api.post("/jobs", payload);
      showToast("success", "Job added");
      // go back to dashboard after success
      navigate("/dashboard");
    } catch (err) {
      handleApiError(err, "Failed to add job");
    } finally {
      setSaving(false);
    }
  };

  /* -------------------- UI -------------------- */
  if (!token) return null;

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand" style={{ cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
          <div className="brandMark" />
          <div>
            <h1 className="title">Job Tracker</h1>
            <p className="subtitle">Track applications, interviews, and offers</p>
          </div>
        </div>

        <div className="topbarRight">
          {user && (
            <button
              type="button"
              className="accountPill"
              onClick={() => navigate("/account")}
              title="View account"
              style={{ cursor: "pointer" }}
            >
              <div className="accountAvatar">{initials}</div>
              <div className="accountText">
                <div className="accountPrimary">{user.name}</div>
                <div className="accountSecondary">{user.email}</div>
              </div>
            </button>
          )}

          <button type="button" className="btn btnGhost btnSmall" onClick={logout}>
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

      {toast && (
        <div className={`toast toast--${toast.type}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}

      <main className="dashboardGrid">
        <section className="card">
          <div className="cardHeader" style={{ alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <h2 className="cardTitle">Add Job</h2>
              <span className="cardHint">Create a new application entry</span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btnGhost btnSmall"
                onClick={() => navigate("/dashboard")}
                disabled={saving}
              >
                ← Back
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontWeight: 700 }}>Company</label>
              <input
                className="input"
                value={form.company}
                onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                placeholder="e.g., DLB Associates"
                disabled={saving}
                autoFocus
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontWeight: 700 }}>Position</label>
              <input
                className="input"
                value={form.position}
                onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
                placeholder="e.g., Junior Full-Stack Developer"
                disabled={saving}
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontWeight: 700 }}>Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                disabled={saving}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontWeight: 700 }}>Notes</label>
              <textarea
                className="input textarea"
                rows={5}
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Interview dates, recruiter contact, links, reminders…"
                disabled={saving}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
              <button
                type="button"
                className="btn btnGhost"
                onClick={() =>
                  setForm({ company: "", position: "", status: "applied", notes: "" })
                }
                disabled={saving}
              >
                Clear
              </button>

              <button type="submit" className="btn btnPrimary" disabled={saving}>
                {saving ? "Saving..." : "Save Job"}
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
