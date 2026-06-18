import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Activity, User, Eye } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await api.get("/complaints/user");
        const list = response.data;
        setComplaints(list);

        // Calculate stats
        const total = list.length;
        const resolved = list.filter((c) => c.status === "RESOLVED").count || list.filter((c) => c.status === "RESOLVED").length;
        const pending = list.filter((c) => c.status !== "RESOLVED" && c.status !== "REJECTED").length;

        setStats({ total, pending, resolved });
      } catch (err) {
        console.error("Error fetching complaints", err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.name || "Citizen"}</h1>
      <p>Manage and track your cyber crime complaints securely.</p>

      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <h2>{stats.total}</h2>
          <p>Total Complaints</p>
        </div>

        <div className="stat-card">
          <h2>{stats.pending}</h2>
          <p>Pending</p>
        </div>

        <div className="stat-card">
          <h2>{stats.resolved}</h2>
          <p>Resolved</p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="dashboard-cards">
        <div className="card" onClick={() => navigate("/complaint")} style={{ cursor: "pointer" }}>
          <h2>
            <FileText className="card-icon" />
            New Complaint
          </h2>
          <p>Register a new cyber crime complaint</p>
        </div>

        <div className="card" onClick={() => navigate("/track-complaint")} style={{ cursor: "pointer" }}>
          <h2>
            <Activity className="card-icon" />
            Track Complaint
          </h2>
          <p>Check status by Complaint ID</p>
        </div>

        <div className="card" onClick={() => navigate("/profile")} style={{ cursor: "pointer" }}>
          <h2>
            <User className="card-icon" />
            Profile
          </h2>
          <p>Manage account settings</p>
        </div>
      </div>

      {/* Recent Complaints Table */}
      <h2 style={{ marginTop: "50px" }}>Recent Complaints</h2>

      {loading ? (
        <p style={{ marginTop: "20px", color: "var(--text-secondary)" }}>Loading complaints...</p>
      ) : complaints.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "40px",
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-color)",
          marginTop: "20px",
          color: "var(--text-secondary)"
        }}>
          No complaints registered yet. Click "New Complaint" to file one.
        </div>
      ) : (
        <table className="complaint-table">
          <thead>
            <tr>
              <th>Tracking ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Date Filed</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {complaints.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: "600", color: "var(--primary)" }}>{c.complaintId}</td>
                <td>{c.title}</td>
                <td>{c.category}</td>
                <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : c.incidentDate}</td>
                <td>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    background: c.status === "RESOLVED" ? "#e6f4ea" : c.status === "REJECTED" ? "#fce8e6" : "#fef7e0",
                    color: c.status === "RESOLVED" ? "#137333" : c.status === "REJECTED" ? "#c5221f" : "#b06000"
                  }}>
                    {c.status.replace("_", " ")}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => navigate(`/track-complaint?id=${c.complaintId}`)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--primary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontWeight: "600"
                    }}
                  >
                    <Eye size={16} /> Track
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Dashboard;
