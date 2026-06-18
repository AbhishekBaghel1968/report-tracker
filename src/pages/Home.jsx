import { useNavigate } from "react-router-dom";
import { ShieldAlert, MapPin, ShieldCheck } from "lucide-react";

function Home() {
  const navigate = useNavigate();

  return (
    <>
      <section className="hero">
        <h1>Cyber Crime Complaint Portal</h1>

        <p>Report Cyber Crimes Securely and Track Your Complaints Online</p>

        <button onClick={() => navigate("/complaint")}>Report Complaint</button>
      </section>
      <section className="features">
        <div className="card" onClick={() => navigate("/complaint")} style={{ cursor: "pointer" }}>
          <h2>
            <ShieldAlert className="card-icon" />
            Report Crime
          </h2>
          <p>Register cyber crime complaints securely.</p>
        </div>

        <div className="card" onClick={() => navigate("/track-complaint")} style={{ cursor: "pointer" }}>
          <h2>
            <MapPin className="card-icon" />
            Track Status
          </h2>
          <p>Track your complaint in real time.</p>
        </div>

        <div className="card">
          <h2>
            <ShieldCheck className="card-icon" />
            Secure Portal
          </h2>
          <p>Your information remains protected.</p>
        </div>
      </section>
    </>
  );
}

export default Home;
