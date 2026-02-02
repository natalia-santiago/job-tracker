import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./Dashboard.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/register", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/dashboard");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Registration failed";
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
            type="button"
            className="btn btnGhost btnSmall"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>
      </header>

      {error && (
        <div className="alert" role="alert">
          <div className="alertTitle">Registration failed</div>
          <div className="alertBody">{error}</div>
        </div>
      )}

      {/* ✅ centered */}
      <main className="grid" style={{ justifyItems: "center" }}>
        <section className="card" style={{ width: "100%", maxWidth: 420 }}>
          <div className="cardHeader">
            <h2 className="cardTitle">Create an account</h2>
            <span className="cardHint">It only takes a minute</span>
          </div>

          <form
            onSubmit={handleSubmit}
            className="form"
            style={{ gridTemplateColumns: "1fr" }}
          >
            <div className="field">
              <div className="label">Name</div>
              <input
                className="input"
                name="name"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>

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
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>

            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </button>

            <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
              Already have an account?{" "}
              <button
                type="button"
                className="btn btnGhost btnSmall"
                onClick={() => navigate("/login")}
                style={{ padding: "6px 10px" }}
              >
                Login
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
