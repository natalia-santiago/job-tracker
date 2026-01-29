import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

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

  /* -------------------- Load user (Account header) -------------------- */
  const loadUser = async () => {
    if (user) return; // already loaded

    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch {
      logout();
    }
  };

  /* -------------------- Load jobs -------------------- */
  const loadJobs = async () => {
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
    loadUser();
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------- Derived -------------------- */
  const jobCount = useMemo(() => jobs.length, [jobs]);

  /* -------------------- UI -------------------- */
  return (
    <div className="page">
      {/* Top Bar */}
      <header className="topbar">
        <div className="brand">
          <div className="brandMark" />
          <div>
            <h1 className="title">Job Tracker</h1>
            <p className="subtitle">Track applications, interviews, and offers</p>
          </div>
        </div>

        {/* Account Section */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user && (
            <div style={{ textAlign: "right", lineHeight: 1.2 }}>
              <div style={{ fontWeight: 700 }}>{user.name}</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>{user.email}</div>
            </div>
          )}

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

      {/* Main */}
      <main className="grid">
        {/* Summary */}
        <section className="card">
          <div className="cardHeader">
            <h2 className="cardTitle">Overview</h2>
            <span className="cardHint">{jobCount} total jobs</span>
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
                <div className="emptyBody">Start by adding your first application.</div>
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
