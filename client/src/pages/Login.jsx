import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login", form);

      // 🔐 Save auth data
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/dashboard");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Login failed";

      setError(msg);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "2rem 1rem" }}>
      <h2>Login</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          autoComplete="email"
          style={{ display: "block", marginBottom: 12, width: "100%", padding: 8 }}
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
          style={{ display: "block", marginBottom: 12, width: "100%", padding: 8 }}
        />

        <button type="submit" style={{ padding: "8px 14px" }}>
          Login
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        Need an account? <a href="/register">Register</a>
      </p>
    </div>
  );
}
