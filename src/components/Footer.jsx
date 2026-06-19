import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <Shield size={20} color="#00f0ff" style={{ filter: "drop-shadow(0 0 6px rgba(0, 240, 255, 0.4))" }} />
          <span style={{
            background: "linear-gradient(135deg, #ffffff 40%, var(--accent) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: "700"
          }}>Sentinel Portal</span>
        </div>
        
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/track-complaint">Track Status</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 Sentinel Cyber Crime Portal | All Rights Reserved</p>
      </div>
    </footer>
  );
}

export default Footer;
