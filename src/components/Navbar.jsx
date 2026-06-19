import { Link, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <h2 style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
        <Shield size={24} color="#00f0ff" style={{ filter: "drop-shadow(0 0 8px rgba(0, 240, 255, 0.4))" }} /> 
        <span>Sentinel</span>
      </h2>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
        <Link to="/track-complaint">
          <button className="nav-btn">Track Status</button>
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
