import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./Dashboard.css";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showWakeMessage, setShowWakeMessage] = useState(false);

  useEffect(() => {
    let timer;

    if (loading) {
      timer = setTimeout(() => {
        setShowWakeMessage(true);
      }, 2000);
    } else {
      setShowWakeMessage(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setShowWakeMessage(false);

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
    <div className="authPage">
      <div className="authLeft">
        <div className="authCard">
          <div className="authHeader">
            <h2>Welcome back</h2>
            <p>Log in to continue managing your applications and interviews.</p>
          </div>

          {error && (
            <div className="alert" role="alert">
              <div className="alertTitle">Login failed</div>
              <div className="alertBody">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="form authForm">
            <div className="field">
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
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
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="passwordWrapper">
                <input
                  id="password"
                  className="input passwordInput"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="passwordToggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button className="btn btnPrimary authSubmit" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>

            {showWakeMessage && !error && (
              <p className="authSwitch" aria-live="polite">
                This is taking a little longer than usual. The server may still be waking up.
              </p>
            )}

            <p className="authSwitch">
              Need an account?{" "}
              <button
                type="button"
                className="authSwitchLink"
                onClick={() => navigate("/register")}
              >
                Create one
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
            Track applications, manage interviews, and stay focused on your next
            opportunity.
          </p>
        </div>
      </div>
    </div>
  );
}