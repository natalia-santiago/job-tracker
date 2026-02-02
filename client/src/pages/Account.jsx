import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./Dashboard.css";

export default function Account() {
  const navigate = useNavigate();
  const [token] = useState(() => localStorage.getItem("token") || "");

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const initials = useMemo(() => {
    const name = user?.name || "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (first + last).toUpperCase() || "U";
  }, [user]);

  const loadUser = async () => {
    const t = localStorage.getItem("token");
    if (!t) return logout();

    setLoading(true);
    setError("");

    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch (err) {
      if (err?.response?.status === 401) {
        logout();
        return;
      }
      setError(err?.response?.data?.error || "Failed to load account");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) navigate("/login");
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) return null;

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="brandMark" />
          <div>
            <h1 className="title">Account</h1>
            <p className="subtitle">Your profile details</p>
          </div>
        </div>

        <div className="topbarRight">
          <button
            type="button"
            className="btn btnGhost btnSmall"
            onClick={() => navigate("/dashboard")}
          >
            Back
          </button>
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

      {/* ✅ centered like Login/Register */}
      <main className="grid" style={{ justifyItems: "center" }}>
        <section className="card" style={{ width: "100%", maxWidth: 720 }}>
          <div className="cardHeader">
            <h2 className="cardTitle">Account Information</h2>
            <span className="cardHint">Pulled from your authenticated session</span>
          </div>

          {loading ? (
            <div className="empty">
              <div className="spinner" />
              <span>Loading account…</span>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <div className="accountPill" style={{ borderRadius: 16, padding: 12 }}>
                <div className="accountAvatar" style={{ width: 40, height: 40 }}>
                  {initials}
                </div>
                <div className="accountText">
                  <div className="accountPrimary" style={{ fontSize: 14 }}>
                    {user?.name || "—"}
                  </div>
                  <div className="accountSecondary" style={{ fontSize: 12 }}>
                    {user?.email || "—"}
                  </div>
                </div>
              </div>

              <InfoRow label="Name" value={user?.name || "—"} />
              <InfoRow label="Email" value={user?.email || "—"} />

              {user?.createdAt && (
                <InfoRow
                  label="Joined"
                  value={new Date(user.createdAt).toLocaleDateString()}
                />
              )}

              <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btnPrimary"
                  onClick={() => navigate("/dashboard")}
                >
                  Back to Dashboard
                </button>
                <button type="button" className="btn btnGhost" onClick={logout}>
                  Logout
                </button>
              </div>
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

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: 10,
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "rgba(11,31,59,0.02)",
      }}
    >
      <div style={{ fontWeight: 700, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontWeight: 700, color: "var(--navy)" }}>{value}</div>
    </div>
  );
}
