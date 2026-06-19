import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield, Key, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!loginData.email || !loginData.password) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);
    const result = await login(loginData.email, loginData.password);
    setLoading(false);

    if (result.success) {
      if (result.role === "ROLE_ADMIN") {
        navigate("/admin-dashboard");
      } else if (result.role === "ROLE_OFFICER") {
        navigate("/officer");
      } else {
        navigate("/dashboard");
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-container">
      <motion.div 
        className="auth-box"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 15 }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
          <div style={{
            background: "var(--accent-light)",
            padding: "12px",
            borderRadius: "50%",
            color: "var(--accent)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px rgba(0, 240, 255, 0.2)"
          }}>
            <Shield size={32} />
          </div>
        </div>

        <h2>Secure Login</h2>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "25px" }}>
          Access the Sentinel encrypted crime dashboard.
        </p>

        {error && (
          <motion.div 
            className="alert-error" 
            style={{ marginBottom: "20px" }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="email"
                name="email"
                placeholder="name@domain.com"
                value={loginData.email}
                onChange={handleChange}
                style={{ paddingLeft: "42px" }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={loginData.password}
                onChange={handleChange}
                style={{ paddingLeft: "42px" }}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <Key size={16} />
            <span>{loading ? "Authenticating..." : "Establish Session"}</span>
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "24px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Unauthorized access is recorded. <br />
          Need credentials?{" "}
          <Link to="/register" style={{ color: "var(--accent)", fontWeight: "600", textDecoration: "none" }}>
            Create Account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;
