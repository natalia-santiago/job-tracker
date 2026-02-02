import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  /* -------------------- Auth gate (run first) -------------------- */
  const [token] = useState(() => localStorage.getItem("token") || "");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* -------------------- State -------------------- */
  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* -------------------- Auth helpers -------------------- */
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
    setError(err?.response?.data?.error || fallback);
  };

  const initials = useMemo(() => {
    const name = user?.name || "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (first + last).toUpperCase() || "U";
  }, [user]);

  /* -------------------- Load user -------------------- */
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

  /* -------------------- Load jobs -------------------- */
  const loadJobs = async () => {
    const t = localStorage.getItem("token");
    if (!t) return logout();

    setLoading(true);
    setError("");

    try {
      const res = await api.get("/jobs");
      setJobs(res.data);
    } catch (err) {
      handleApiError(err, "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    loadUser();
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* -------------------- Derived -------------------- */
  const jobCount = useMemo(() => jobs.length, [jobs]);

  /* -------------------- UI -------------------- */
  if (!token) return null;

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
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

      <main className="grid">
        <section className="card">
          <div className="cardHeader" style={{ alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <h2 className="cardTitle">Overview</h2>
              <span className="cardHint">{jobCount} total jobs</span>
            </div>

            <button
              className="btn btnPrimary btnSmall"
              onClick={() => navigate("/add-job")}
            >
              + Add Job
            </button>
          </div>

          {loading ? (
            <div className="empty">
              <div className="spinner" />
              <span>Loading jobs…</span>
            </div>
          ) : jobCount === 0 ? (
            <div className="empty">
              <div className="emptyIcon">+</div>
              <div>
                <div className="emptyTitle">No jobs yet</div>
                <div className="emptyBody">
                  Start by adding your first application.
                </div>

                <div style={{ marginTop: 12 }}>
                  <button
                    className="btn btnPrimary"
                    onClick={() => navigate("/add-job")}
                  >
                    + Add Your First Job
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="jobsGrid">
              {jobs.map((job) => (
                <article className="jobCard" key={job._id}>
                  <div className="jobTop">
                    <div>
                      <div className="jobCompany">{job.company}</div>
                      <div className="jobPosition">{job.position}</div>
                    </div>
                    <span className={`pill pill--${job.status}`}>{job.status}</span>
                  </div>

                  {job.notes && <p className="jobNotes">{job.notes}</p>}

                  <div className="jobMeta">
                    <span className="jobDate">
                      Added {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
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
