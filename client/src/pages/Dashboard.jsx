import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./Dashboard.css";

const STATUS_OPTIONS = ["applied", "interview", "offer", "rejected"];

export default function Dashboard() {
  const navigate = useNavigate();

  const [token] = useState(() => localStorage.getItem("token") || "");

  useEffect(() => {
    if (!token) navigate("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    company: "",
    position: "",
    status: "applied",
    notes: "",
  });

  const [busyId, setBusyId] = useState(null);
  const [exporting, setExporting] = useState(false);

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

  const initials = useMemo(() => {
    const name = user?.name || "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (first + last).toUpperCase() || "U";
  }, [user]);

  const safeDate = (job) => job.updatedAt || job.createdAt || 0;

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

  const loadJobs = async () => {
    const t = localStorage.getItem("token");
    if (!t) return logout();

    setLoading(true);
    setError("");

    try {
      const res = await api.get("/jobs");
      setJobs(res.data || []);
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

  const updateJob = async (id, patch, successMsg = "Changes saved") => {
    setError("");
    setBusyId(id);

    try {
      const res = await api.patch(`/jobs/${id}`, patch);
      const updated = res.data;
      setJobs((prev) => prev.map((j) => (j._id === id ? updated : j)));
      showToast("success", successMsg);
    } catch (err) {
      handleApiError(err, "Failed to update job");
    } finally {
      setBusyId(null);
    }
  };

  const deleteJob = async (id) => {
    setError("");
    const ok = window.confirm(
      "Are you sure you want to delete this job? This action cannot be undone."
    );
    if (!ok) return;

    setBusyId(id);

    try {
      await api.delete(`/jobs/${id}`);
      setJobs((prev) => prev.filter((j) => j._id !== id));
      showToast("success", "Job removed");
    } catch (err) {
      handleApiError(err, "Failed to delete job");
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (job) => {
    setEditingId(job._id);
    setEditForm({
      company: job.company || "",
      position: job.position || "",
      status: job.status || "applied",
      notes: job.notes || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ company: "", position: "", status: "applied", notes: "" });
  };

  const saveEdit = async (id) => {
    const payload = {
      company: editForm.company.trim(),
      position: editForm.position.trim(),
      status: editForm.status,
      notes: editForm.notes.trim(),
    };

    if (!payload.company || !payload.position) {
      setError("Company and position are required.");
      showToast("error", "Company and position are required.");
      return;
    }

    await updateJob(id, payload, "Job updated successfully");
    cancelEdit();
  };

  const exportCsv = async () => {
    setExporting(true);
    setError("");

    try {
      const base = api.defaults.baseURL || "";
      const url = `${base}/jobs/export.csv`;
      window.open(url, "_blank", "noopener,noreferrer");
      showToast("success", "Your export is downloading");
    } catch (err) {
      handleApiError(err, "Failed to export CSV");
    } finally {
      setExporting(false);
    }
  };

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...jobs];

    if (statusFilter !== "all") {
      list = list.filter((j) => (j.status || "").toLowerCase() === statusFilter);
    }

    if (q) {
      list = list.filter((j) => {
        const company = (j.company || "").toLowerCase();
        const position = (j.position || "").toLowerCase();
        const notes = (j.notes || "").toLowerCase();
        return company.includes(q) || position.includes(q) || notes.includes(q);
      });
    }

    list.sort((a, b) => {
      if (sort === "newest") return new Date(safeDate(b)) - new Date(safeDate(a));
      if (sort === "oldest") return new Date(safeDate(a)) - new Date(safeDate(b));
      if (sort === "company") return (a.company || "").localeCompare(b.company || "");
      if (sort === "status") return (a.status || "").localeCompare(b.status || "");
      return 0;
    });

    return list;
  }, [jobs, query, statusFilter, sort]);

  const stats = useMemo(() => {
    const counts = { applied: 0, interview: 0, offer: 0, rejected: 0 };
    for (const j of jobs) {
      const s = (j.status || "applied").toLowerCase();
      if (counts[s] !== undefined) counts[s] += 1;
    }
    const total = jobs.length || 0;
    const active = counts.applied + counts.interview + counts.offer;
    const offerRate = total ? Math.round((counts.offer / total) * 100) : 0;

    return { counts, total, active, offerRate };
  }, [jobs]);

  const recent = useMemo(() => {
    const list = [...jobs];
    list.sort((a, b) => new Date(safeDate(b)) - new Date(safeDate(a)));
    return list.slice(0, 6);
  }, [jobs]);

  const greeting = useMemo(() => {
    if (!user?.name) return "Welcome back.";
    const firstName = user.name.trim().split(/\s+/)[0];
    return `Welcome back, ${firstName}`;
  }, [user]);

  const statusSummary = useMemo(() => {
    if (!jobs.length) return "Start by adding your first job application.";

    if (stats.counts.offer > 0)
      return "You have offers in progress. Keep moving forward and compare them carefully.";

    if (stats.counts.interview > 0)
      return "You have interviews coming up. Stay organized and follow up consistently.";

    return "Keep building your pipeline and adding new opportunities.";
  }, [jobs, stats]);

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

      <section className="card dashboardHero">
        <div className="dashboardHeroGrid">
          <div>
            <div className="dashboardEyebrow">Dashboard</div>
            <h2 className="dashboardHeading">{greeting}</h2>
            <p className="dashboardSubtext">{statusSummary}</p>

            <div className="dashboardHeroActions">
              <button
                type="button"
                className="btn btnPrimary"
                onClick={() => navigate("/add-job")}
              >
                Add Job
              </button>

              <button
                type="button"
                className="btn btnGhost"
                onClick={exportCsv}
                disabled={exporting || loading}
                title="Download your jobs as CSV"
              >
                {exporting ? "Exporting..." : "Export CSV"}
              </button>
            </div>
          </div>

          <div className="quickMetrics">
            <QuickMetric label="Total jobs" value={stats.total} />
            <QuickMetric label="Interviews" value={stats.counts.interview} />
            <QuickMetric label="Offers" value={stats.counts.offer} />
            <QuickMetric label="Offer rate" value={`${stats.offerRate}%`} />
          </div>
        </div>
      </section>

      <main className="dashboardDesktopGrid">
        <section className="card applicationsPanel">
          <div className="cardHeader dashboardCardHeader">
            <div className="dashboardCardHeaderMain">
              <h2 className="cardTitle">Applications</h2>
              <span className="cardHint">
                {loading ? "Loading jobs..." : `${filteredJobs.length} of ${jobs.length} shown`}
              </span>
            </div>

            <div className="sectionPill">Manage pipeline</div>
          </div>

          <div className="controlsRow controlsRowTight">
            <input
              className="input"
              placeholder="Search by company, role, or notes"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              className="input"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="company">Sort: Company (A–Z)</option>
              <option value="status">Sort: Status</option>
            </select>

            <button
              type="button"
              className="btn btnGhost btnSmall"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
                setSort("newest");
              }}
            >
              Clear
            </button>
          </div>

          {loading ? (
            <div className="skeletonList applicationsScroller">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="jobCard skeletonCard" key={i}>
                  <div className="skeletonLine w60" />
                  <div className="skeletonLine w80" />
                  <div className="skeletonLine w40" />
                </div>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="empty applicationsEmpty">
              <div className="emptyIcon">+</div>
              <div>
                <div className="emptyTitle">No results found</div>
                <div className="emptyBody">
                  Try adjusting your filters or add a new job to keep your pipeline growing.
                </div>

                <div className="emptyAction">
                  <button
                    type="button"
                    className="btn btnPrimary"
                    onClick={() => navigate("/add-job")}
                  >
                    + Add a Job
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="jobsGrid applicationsScroller">
              {filteredJobs.map((job) => {
                const isEditing = editingId === job._id;
                const isBusy = busyId === job._id;

                return (
                  <article
                    className="jobCard compactJobCard"
                    key={job._id}
                    onClick={() => {
                      if (!isEditing && !isBusy) {
                        startEdit(job);
                        showToast("success", "You can now edit this job");
                      }
                    }}
                    title={isEditing ? "Editing job" : "Click to edit"}
                  >
                    <div className="jobTop">
                      <div className="jobMain">
                        {isEditing ? (
                          <>
                            <input
                              className="input compactInput"
                              value={editForm.company}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, company: e.target.value }))
                              }
                              placeholder="Company"
                              disabled={isBusy}
                            />
                            <input
                              className="input compactInput jobEditInput"
                              value={editForm.position}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, position: e.target.value }))
                              }
                              placeholder="Position"
                              disabled={isBusy}
                            />
                          </>
                        ) : (
                          <>
                            <div className="jobCompany">{job.company}</div>
                            <div className="jobPosition">{job.position}</div>
                          </>
                        )}
                      </div>

                      <div className="jobStatusControl">
                        {isEditing ? (
                          <select
                            className="input statusSelect compactInput"
                            value={editForm.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              setEditForm((p) => ({ ...p, status: e.target.value }))
                            }
                            disabled={isBusy}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <>
                            <select
                              className="input statusSelect compactInput"
                              value={job.status || "applied"}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                updateJob(job._id, { status: e.target.value }, "Status updated")
                              }
                              aria-label="Update status"
                              disabled={isBusy}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>

                            <span className={`pill pill--${job.status}`}>{job.status}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <textarea
                        className="input textarea jobNotesInput compactInput"
                        rows={3}
                        value={editForm.notes}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, notes: e.target.value }))
                        }
                        placeholder="Notes"
                        disabled={isBusy}
                      />
                    ) : (
                      job.notes && <p className="jobNotes">{job.notes}</p>
                    )}

                    <div className="jobMeta">
                      <span className="jobDate">
                        {job.updatedAt
                          ? `Updated ${new Date(job.updatedAt).toLocaleDateString()}`
                          : `Added ${new Date(job.createdAt).toLocaleDateString()}`}
                      </span>

                      <div className="jobButtons">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              className="btn btnPrimary btnSmall"
                              onClick={(e) => {
                                e.stopPropagation();
                                saveEdit(job._id);
                              }}
                              disabled={isBusy}
                            >
                              {isBusy ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              className="btn btnGhost btnSmall"
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelEdit();
                              }}
                              disabled={isBusy}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btnGhost btnSmall"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(job);
                              }}
                              disabled={isBusy}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btnDanger btnSmall"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteJob(job._id);
                              }}
                              disabled={isBusy}
                            >
                              {isBusy ? "Deleting..." : "Delete"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="dashboardSideColumn">
          <section className="card">
            <div className="cardHeader">
              <h2 className="cardTitle">Performance Snapshot</h2>
              <span className="cardHint">Your search at a glance</span>
            </div>

            {loading ? (
              <div className="dashboardLoadingStack">
                <div className="skeletonLine w70" />
                <div className="skeletonLine w60" />
                <div className="skeletonLine w80" />
                <div className="skeletonLine w50" />
              </div>
            ) : (
              <>
                <div className="statsGrid">
                  <Stat label="Total" value={stats.total} />
                  <Stat label="Active" value={stats.active} />
                  <Stat label="Offers" value={stats.counts.offer} />
                  <Stat label="Offer rate" value={`${stats.offerRate}%`} />
                  <Stat label="Applied" value={stats.counts.applied} />
                  <Stat label="Interviews" value={stats.counts.interview} />
                  <Stat label="Rejected" value={stats.counts.rejected} />
                </div>

                <div className="insightCard">
                  <div className="insightTitle">Insight</div>
                  <div className="insightBody">
                    {stats.total === 0
                      ? "You haven’t added any applications yet."
                      : stats.counts.offer > 0
                      ? "Your pipeline is converting into offers. Keep notes updated so you can compare opportunities clearly."
                      : stats.counts.interview > 0
                      ? "You’re making progress with interviews. Focus on follow-ups and interview prep notes."
                      : "Your tracker is building momentum. Keep adding applications consistently to grow your pipeline."}
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="card">
            <div className="cardHeader">
              <h2 className="cardTitle">Recent Activity</h2>
              <span className="cardHint">Latest updates and edits</span>
            </div>

            {loading ? (
              <div className="dashboardLoadingStack">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="recentRow">
                    <div className="skeletonLine w60" />
                    <div className="skeletonLine w40" />
                  </div>
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="empty">
                <div className="emptyIcon">+</div>
                <div>
                  <div className="emptyTitle">No activity yet</div>
                  <div className="emptyBody">Add a job to start tracking your search.</div>
                </div>
              </div>
            ) : (
              <div className="recentList recentListCompact">
                {recent.map((j) => (
                  <button
                    key={j._id}
                    type="button"
                    className="recentItem"
                    onClick={() => {
                      startEdit(j);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      showToast("success", "You can now edit this job");
                    }}
                    title="Click to edit"
                  >
                    <div className="recentMain">
                      <div className="recentTitle">
                        {j.company} — {j.position}
                      </div>
                      <div className="recentSub">
                        {j.updatedAt
                          ? `Updated ${new Date(j.updatedAt).toLocaleDateString()}`
                          : `Added ${new Date(j.createdAt).toLocaleDateString()}`}
                      </div>
                    </div>

                    <span className={`pill pill--${j.status}`}>{j.status}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Natalia Santiago</span>
        <span className="dot" />
        <span>React • Express • MongoDB</span>
      </footer>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="statTile">
      <div className="statLabel">{label}</div>
      <div className="statValue">{value}</div>
    </div>
  );
}

function QuickMetric({ label, value }) {
  return (
    <div className="quickMetric">
      <div className="quickMetricLabel">{label}</div>
      <div className="quickMetricValue">{value}</div>
    </div>
  );
}