import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./Dashboard.css";

const STATUS_OPTIONS = ["applied", "interview", "offer", "rejected"];

export default function AddJob() {
  const navigate = useNavigate();

  const [token] = useState(() => localStorage.getItem("token") || "");

  useEffect(() => {
    if (!token) navigate("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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

  const [form, setForm] = useState({
    company: "",
    position: "",
    status: "applied",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

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

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm({
      company: "",
      position: "",
      status: "applied",
      notes: "",
    });
    setError("");
  };

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
      const msg = "Company and position are required.";
      setError(msg);
      showToast("error", msg);
      return;
    }

    setSaving(true);

    try {
      await api.post("/jobs", payload);
      showToast("success", "Job added");
      navigate("/dashboard");
    } catch (err) {
      handleApiError(err, "Failed to add job");
    } finally {
      setSaving(false);
    }
  };

  if (!token) return null;

  return (
    <div className="page">
      <header className="topbar">
        <div
          className="brand brandButton"
          onClick={() => navigate("/dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/dashboard");
          }}
        >
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

      <section className="card addJobHero">
        <div className="addJobHeroGrid">
          <div>
            <div className="dashboardEyebrow">New application</div>
            <h2 className="dashboardHeading">Add a job to your pipeline</h2>
            <p className="dashboardSubtext">
              Save the company, role, status, and notes so every opportunity stays
              organized from the start.
            </p>
          </div>

          <div className="addJobHeroSide">
            <div className="quickMetric">
              <div className="quickMetricLabel">Default status</div>
              <div className="quickMetricValue addJobMetricValue">
                {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="dashboardGrid addJobLayout">
        <section className="card addJobMainCard">
          <div className="cardHeader dashboardCardHeader">
            <div className="dashboardCardHeaderMain">
              <h2 className="cardTitle">Application details</h2>
              <span className="cardHint">Create a clean, searchable job entry</span>
            </div>

            <button
              type="button"
              className="btn btnGhost btnSmall"
              onClick={() => navigate("/dashboard")}
              disabled={saving}
            >
              ← Back
            </button>
          </div>

          <form onSubmit={handleSubmit} className="addJobForm">
            <div className="field">
              <label className="label" htmlFor="company">
                Company
              </label>
              <input
                id="company"
                className="input"
                value={form.company}
                onChange={(e) => handleChange("company", e.target.value)}
                placeholder="e.g., DLB Associates"
                disabled={saving}
                autoFocus
                autoComplete="organization"
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="position">
                Position
              </label>
              <input
                id="position"
                className="input"
                value={form.position}
                onChange={(e) => handleChange("position", e.target.value)}
                placeholder="e.g., Junior Full-Stack Developer"
                disabled={saving}
                autoComplete="off"
              />
            </div>

            <div className="field fieldFull">
              <label className="label" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                className="input"
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                disabled={saving}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field fieldFull">
              <label className="label" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                className="input textarea addJobTextarea"
                rows={6}
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Interview dates, recruiter contact, links, reminders, application details..."
                disabled={saving}
              />
            </div>

            <div className="addJobActions fieldFull">
              <button
                type="button"
                className="btn btnGhost"
                onClick={resetForm}
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

        <aside className="card addJobTipsCard">
          <div className="cardHeader">
            <h2 className="cardTitle">What to include</h2>
            <span className="cardHint">Better notes, better tracking</span>
          </div>

          <div className="addJobTipsList">
            <div className="addJobTip">
              <div className="addJobTipTitle">Company and role</div>
              <div className="addJobTipBody">
                Use the exact employer and title so search and sorting stay clean later.
              </div>
            </div>

            <div className="addJobTip">
              <div className="addJobTipTitle">Status updates</div>
              <div className="addJobTipBody">
                Start with the current stage now and update it as the process moves.
              </div>
            </div>

            <div className="addJobTip">
              <div className="addJobTipTitle">Useful notes</div>
              <div className="addJobTipBody">
                Add recruiter names, deadlines, interview dates, links, or follow-up reminders.
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Natalia Santiago</span>
        <span className="dot" />
        <span>React • Express • MongoDB</span>
      </footer>
    </div>
  );
}