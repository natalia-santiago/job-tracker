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

  const joinedDate = useMemo(() => {
    if (!user?.createdAt) return null;
    return new Date(user.createdAt).toLocaleDateString();
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
    if (!token) {
      navigate("/login");
      return;
    }
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
            <h1 className="title">Account</h1>
            <p className="subtitle">Your profile and session details</p>
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

      <section className="card accountHero">
        <div className="accountHeroGrid">
          <div>
            <div className="dashboardEyebrow">Profile</div>
            <h2 className="dashboardHeading">Manage your account details</h2>
            <p className="dashboardSubtext">
              View the information connected to your account and return to your job
              tracker workspace whenever you are ready.
            </p>
          </div>

          <div className="accountHeroSide">
            <div className="accountHeroCard">
              <div className="accountHeroAvatar">{initials}</div>
              <div className="accountHeroText">
                <div className="accountHeroName">{user?.name || "Not set"}</div>
                <div className="accountHeroEmail">{user?.email || "Not set"}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="dashboardDesktopGrid">
        <section className="card accountMainCard">
          <div className="cardHeader">
            <h2 className="cardTitle">Account Information</h2>
            <span className="cardHint">Loaded from your authenticated session</span>
          </div>

          {loading ? (
            <div className="empty">
              <div className="spinner" />
              <span>Loading account details…</span>
            </div>
          ) : (
            <div className="accountInfoList">
              <InfoRow label="Name" value={user?.name || "Not set"} />
              <InfoRow label="Email" value={user?.email || "Not set"} />

              {joinedDate && <InfoRow label="Joined" value={joinedDate} />}

              <div className="accountActions">
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

        <aside className="card accountTipsCard">
          <div className="cardHeader">
            <h2 className="cardTitle">Account Summary</h2>
            <span className="cardHint">At a glance</span>
          </div>

          <div className="accountTipsList">
            <div className="accountTip">
              <div className="accountTipTitle">Signed in as</div>
              <div className="accountTipBody">{user?.email || "Not set"}</div>
            </div>

            <div className="accountTip">
              <div className="accountTipTitle">Profile name</div>
              <div className="accountTipBody">{user?.name || "Not set"}</div>
            </div>

            <div className="accountTip">
              <div className="accountTipTitle">Session status</div>
              <div className="accountTipBody">Authenticated and active.</div>
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

function InfoRow({ label, value }) {
  return (
    <div className="infoRow">
      <div className="infoRowLabel">{label}</div>
      <div className="infoRowValue">{value}</div>
    </div>
  );
}