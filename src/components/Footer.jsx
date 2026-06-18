import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <Shield size={20} color="#00e5ff" />
          <span>Cyber Portal</span>
        </div>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/track-complaint">Track Complaint</Link>
          <Link to="/complaint">Report Crime</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 Cyber Crime Complaint Portal | Developed by Abhishek Baghel</p>
      </div>
    </footer>
  );
}

export default Footer;
