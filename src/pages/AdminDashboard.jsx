import { useEffect, useState } from "react";
import { Users, FileText, AlertCircle, CheckCircle, Trash2, Eye, Download, FilePlus } from "lucide-react";
import api from "../services/api";

function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const statsResponse = await api.get("/complaints/admin/stats");
      setStats(statsResponse.data);

      const listResponse = await api.get("/complaints");
      setComplaints(listResponse.data);
    } catch (err) {
      console.error("Failed to load admin stats/list", err);
      setError("Unauthorized or server connection error.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/complaints/${id}`, { status: newStatus });
      alert("Status updated successfully!");
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint(prev => ({ ...prev, status: newStatus }));
      }
      fetchAdminData();
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this complaint?")) {
      return;
    }

    try {
      await api.delete(`/complaints/${id}`);
      alert("Complaint deleted successfully!");
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint(null);
      }
      fetchAdminData();
    } catch (err) {
      console.error("Failed to delete complaint", err);
      alert("Failed to delete complaint.");
    }
  };

  const filteredComplaints = complaints.filter(c => {
    return (filterStatus === "" || c.status === filterStatus) &&
           (filterPriority === "" || c.priority === filterPriority);
  });

  if (loading) {
    return <div className="dashboard"><p>Loading Admin Dashboard...</p></div>;
  }

  if (error) {
    return (
      <div className="dashboard" style={{ textAlign: "center", padding: "60px" }}>
        <h2 style={{ color: "#dc2626" }}>Access Denied</h2>
        <p style={{ marginTop: "10px", color: "var(--text-secondary)" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard" style={{ maxWidth: "1400px" }}>
      <h1>Admin Command Center</h1>
      <p style={{ marginBottom: "40px" }}>Review citizen submissions, update status, and audit evidence files.</p>

      {/* Analytical Cards */}
      <div className="stats-container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        <div className="stat-card" style={{ display: "flex", alignItems: "center", gap: "20px", textAlign: "left", width: "100%" }}>
          <div style={{ background: "var(--primary-light)", padding: "16px", borderRadius: "var(--radius-md)" }}>
            <Users size={28} color="var(--primary)" />
          </div>
          <div>
            <h2 style={{ fontSize: "2rem", marginBottom: 0 }}>{stats?.totalUsers}</h2>
            <p style={{ color: "var(--text-secondary)", fontWeight: "500", marginTop: "4px" }}>Total Users</p>
          </div>
        </div>

        <div className="stat-card" style={{ display: "flex", alignItems: "center", gap: "20px", textAlign: "left", width: "100%" }}>
          <div style={{ background: "#e0f2fe", padding: "16px", borderRadius: "var(--radius-md)" }}>
            <FileText size={28} color="#0284c7" />
          </div>
          <div>
            <h2 style={{ fontSize: "2rem", marginBottom: 0, color: "#0284c7" }}>{stats?.totalComplaints}</h2>
            <p style={{ color: "var(--text-secondary)", fontWeight: "500", marginTop: "4px" }}>Total Complaints</p>
          </div>
        </div>

        <div className="stat-card" style={{ display: "flex", alignItems: "center", gap: "20px", textAlign: "left", width: "100%" }}>
          <div style={{ background: "#fef3c7", padding: "16px", borderRadius: "var(--radius-md)" }}>
            <AlertCircle size={28} color="#d97706" />
          </div>
          <div>
            <h2 style={{ fontSize: "2rem", marginBottom: 0, color: "#d97706" }}>{stats?.pendingComplaints}</h2>
            <p style={{ color: "var(--text-secondary)", fontWeight: "500", marginTop: "4px" }}>Pending Action</p>
          </div>
        </div>

        <div className="stat-card" style={{ display: "flex", alignItems: "center", gap: "20px", textAlign: "left", width: "100%" }}>
          <div style={{ background: "#dcfce7", padding: "16px", borderRadius: "var(--radius-md)" }}>
            <CheckCircle size={28} color="#15803d" />
          </div>
          <div>
            <h2 style={{ fontSize: "2rem", marginBottom: 0, color: "#15803d" }}>{stats?.resolvedComplaints}</h2>
            <p style={{ color: "var(--text-secondary)", fontWeight: "500", marginTop: "4px" }}>Resolved Cases</p>
          </div>
        </div>
      </div>

      {/* Visual Charts/Bars Row */}
      <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", marginBottom: "50px" }}>
        {/* Status distribution */}
        <div className="stat-card" style={{ flex: 1, minWidth: "320px", textAlign: "left", padding: "30px", width: "100%" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "20px" }}>Complaints by Status</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {stats && Object.entries(stats.statusBreakdown).map(([status, count]) => {
              const percentage = stats.totalComplaints > 0 ? (count / stats.totalComplaints) * 100 : 0;
              return (
                <div key={status}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                    <span>{status.replace("_", " ")}</span>
                    <span style={{ color: "var(--primary)" }}>{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div style={{ background: "#f1f5f9", height: "8px", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{
                      background: status === "RESOLVED" ? "#22c55e" : status === "REJECTED" ? "#ef4444" : "var(--primary)",
                      width: `${percentage}%`,
                      height: "100%",
                      borderRadius: "10px"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category distribution */}
        <div className="stat-card" style={{ flex: 1, minWidth: "320px", textAlign: "left", padding: "30px", width: "100%" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "20px" }}>Complaints by Category</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {stats && Object.entries(stats.categoryBreakdown).length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>No categories submitted yet.</p>
            ) : (
              stats && Object.entries(stats.categoryBreakdown).map(([category, count]) => {
                const percentage = stats.totalComplaints > 0 ? (count / stats.totalComplaints) * 100 : 0;
                return (
                  <div key={category}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                      <span>{category}</span>
                      <span style={{ color: "var(--primary)" }}>{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div style={{ background: "#f1f5f9", height: "8px", borderRadius: "10px", overflow: "hidden" }}>
                      <div style={{
                        background: "#0284c7",
                        width: `${percentage}%`,
                        height: "100%",
                        borderRadius: "10px"
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Table and Details Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        
        {/* Table list */}
        <div className="stat-card" style={{ width: "100%", textAlign: "left", padding: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800" }}>All Registered Complaints</h3>
            
            {/* Filters */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: "8px 12px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", fontSize: "0.85rem", fontWeight: "600" }}
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                style={{ padding: "8px 12px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", fontSize: "0.85rem", fontWeight: "600" }}
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          {filteredComplaints.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
              No complaints match the filter parameters.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="complaint-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>User</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map((c) => (
                    <tr key={c.id} style={{ background: selectedComplaint?.id === c.id ? "#f1f5f9" : "transparent" }}>
                      <td style={{ fontWeight: "700", color: "var(--primary)" }}>{c.complaintId}</td>
                      <td>
                        <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{c.user?.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{c.user?.email}</div>
                      </td>
                      <td>{c.category}</td>
                      <td>
                        <span style={{
                          fontSize: "0.8rem",
                          fontWeight: "700",
                          color: c.priority === "HIGH" ? "#c5221f" : c.priority === "MEDIUM" ? "#b06000" : "#137333"
                        }}>
                          {c.priority}
                        </span>
                      </td>
                      <td>
                        <select
                          value={c.status}
                          onChange={(e) => handleStatusChange(c.id, e.target.value)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            border: "1px solid var(--border-color)",
                            background: c.status === "RESOLVED" ? "#e6f4ea" : c.status === "REJECTED" ? "#fce8e6" : "#fef7e0",
                            color: c.status === "RESOLVED" ? "#137333" : c.status === "REJECTED" ? "#c5221f" : "#b06000",
                            width: "auto",
                            marginBottom: 0
                          }}
                        >
                          <option value="SUBMITTED">Submitted</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="INVESTIGATING">Investigating</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </td>
                      <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => setSelectedComplaint(c)}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "var(--primary)",
                              cursor: "pointer",
                              padding: "4px"
                            }}
                            title="View Case Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#dc2626",
                              cursor: "pointer",
                              padding: "4px"
                            }}
                            title="Delete Complaint"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detailed audit viewer */}
        {selectedComplaint && (
          <div className="stat-card" style={{ width: "100%", textAlign: "left", padding: "40px", border: "2px solid var(--primary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--primary)", background: "var(--primary-light)", padding: "4px 10px", borderRadius: "100px" }}>
                  {selectedComplaint.complaintId}
                </span>
                <h2 style={{ marginTop: "10px", fontSize: "1.5rem", fontWeight: "800" }}>{selectedComplaint.title}</h2>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Submitted by: <strong>{selectedComplaint.user?.name}</strong> ({selectedComplaint.user?.email} | {selectedComplaint.user?.phone})
                </p>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                style={{
                  padding: "6px 12px",
                  background: "#e2e8f0",
                  color: "var(--text-primary)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontWeight: "600",
                  width: "auto"
                }}
              >
                Close Audit View
              </button>
            </div>

            <hr style={{ border: 0, height: "1px", background: "var(--border-color)", margin: "20px 0" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
              <div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Incident Date</p>
                <p style={{ fontWeight: "700" }}>{new Date(selectedComplaint.incidentDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Priority</p>
                <p style={{
                  fontWeight: "700",
                  color: selectedComplaint.priority === "HIGH" ? "#c5221f" : selectedComplaint.priority === "MEDIUM" ? "#b06000" : "#137333"
                }}>{selectedComplaint.priority}</p>
              </div>
            </div>

            <div style={{ marginBottom: "25px" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>Citizen Description</p>
              <div style={{ background: "var(--bg-primary)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                {selectedComplaint.description}
              </div>
            </div>

            {selectedComplaint.evidenceFiles && selectedComplaint.evidenceFiles.length > 0 ? (
              <div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "10px" }}>Evidence Uploads</p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {selectedComplaint.evidenceFiles.map((file) => (
                    <a
                      key={file.id}
                      href={`http://localhost:8080/api/files/${file.filePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 16px",
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-primary)",
                        fontWeight: "600",
                        textDecoration: "none",
                        fontSize: "0.85rem"
                      }}
                    >
                      <Download size={16} color="var(--primary)" />
                      <span>{file.fileName}</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No files uploaded with this complaint.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
