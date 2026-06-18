import { Link, useNavigate } from "react-router-dom";
import { Shield, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <h2 style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => navigate("/")}>
        <Shield size={24} color="#00e5ff" /> Cyber Portal
      </h2>

      <div className="nav-links">
        <Link to="/">Home</Link>

        {user ? (
          <>
            {user.role === "ROLE_ADMIN" ? (
              <Link to="/admin-dashboard">Admin Panel</Link>
            ) : (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/complaint">New Complaint</Link>
              </>
            )}
            <Link to="/profile">Profile</Link>
            <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginLeft: "10px", marginRight: "10px" }}>
              Hi, {user.name.split(" ")[0]}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "none",
                color: "#dc2626",
                cursor: "pointer",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.95rem"
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}

        <Link to="/track-complaint">
          <button className="nav-btn">Track Complaint</button>
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
