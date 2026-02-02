import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./Dashboard.css";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/dashboard");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
          <button
            className="btn btnGhost btnSmall"
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </div>
      </header>

      {error && (
        <div className="alert" role="alert">
          <div className="alertTitle">Login failed</div>
          <div className="alertBody">{error}</div>
        </div>
      )}

      <main className="grid">
        <section className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
          <div className="cardHeader">
            <h2 className="cardTitle">Login</h2>
            <span className="cardHint">Welcome back</span>
          </div>

          <form onSubmit={handleSubmit} className="form" style={{ gridTemplateColumns: "1fr" }}>
            <div className="field">
              <div className="label">Email</div>
              <input
                className="input"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <div className="label">Password</div>
              <input
                className="input"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
              Need an account?{" "}
              <button
                type="button"
                className="btn btnGhost btnSmall"
                onClick={() => navigate("/register")}
                style={{ padding: "6px 10px" }}
              >
                Register
              </button>
            </p>
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
