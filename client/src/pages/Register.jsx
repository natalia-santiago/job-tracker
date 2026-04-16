import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./Dashboard.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="authPage">
      <div className="authLeft">
        <div className="authCard">
          <div className="authHeader">
            <h2>Create your account</h2>
            <p>Start tracking your job applications in one place.</p>
          </div>

          {error && (
            <div className="alert" role="alert">
              <div className="alertTitle">Registration failed</div>
              <div className="alertBody">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="form authForm">
            <div className="field">
              <label className="label" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="input"
                name="name"
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="register-email">
                Email
              </label>
              <input
                id="register-email"
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
              <label className="label" htmlFor="register-password">
                Password
              </label>
              <div className="passwordWrapper">
                <input
                  id="register-password"
                  className="input passwordInput"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="passwordToggle"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button className="btn btnPrimary authSubmit" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <p className="authSwitch">
              Already have an account?{" "}
              <button
                type="button"
                className="authSwitchLink"
                onClick={() => navigate("/login")}
              >
                Log in
              </button>
            </p>
          </form>
        </div>
      </div>

      <div className="authRight">
        <div className="authBrand">
          <div className="brandMark large" />
          <h1>Job Tracker</h1>
          <p>
            Organize your job search, track applications, and stay on top of every
            opportunity — all in one place.
          </p>
        </div>
      </div>
    </div>
  );
}