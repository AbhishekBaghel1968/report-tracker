import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Clock, ShieldAlert, FileText, Download } from "lucide-react";
import api from "../services/api";

function TrackComplaint() {
  const [searchParams] = useSearchParams();
  const [complaintIdInput, setComplaintIdInput] = useState("");
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const urlId = searchParams.get("id");

  useEffect(() => {
    if (urlId) {
      setComplaintIdInput(urlId);
      handleTrack(urlId);
    }
  }, [urlId]);

  const handleTrack = async (id) => {
    const trackingId = id || complaintIdInput;
    if (!trackingId) {
      setError("Please enter a Complaint Tracking ID");
      return;
    }

    setLoading(true);
    setError("");
    setComplaint(null);

    try {
      const response = await api.get(`/complaints/track/${trackingId.trim()}`);
      setComplaint(response.data);
    } catch (err) {
      console.error("Error tracking complaint", err);
      const msg = err.response?.status === 404 
        ? "Complaint not found. Verify the ID." 
        : "Failed to fetch status details.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const statuses = ["SUBMITTED", "UNDER_REVIEW", "INVESTIGATING", "RESOLVED"];
  const isRejected = complaint?.status === "REJECTED";

  const getStatusIndex = (currentStatus) => {
    if (currentStatus === "REJECTED") return 1; // SUBMITTED -> UNDER_REVIEW -> REJECTED (stops at index 1 before rejection)
    return statuses.indexOf(currentStatus);
  };

  return (
    <div className="dashboard" style={{ maxWidth: "800px" }}>
      <h1>Track Complaint</h1>
      <p>Enter your unique complaint tracking number (e.g. COMP-XXXXXX) to monitor investigation progress.</p>

      {/* Search Bar */}
      <div style={{
        display: "flex",
        gap: "12px",
        margin: "30px 0 50px",
        background: "var(--bg-secondary)",
        padding: "16px",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-color)",
        boxShadow: "var(--shadow-sm)"
      }}>
        <input
          type="text"
          placeholder="Enter Complaint Tracking ID (e.g., COMP-8A9F321B)"
          value={complaintIdInput}
          onChange={(e) => setComplaintIdInput(e.target.value)}
          style={{
            flex: 1,
            padding: "12px",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-sm)",
            fontSize: "1rem",
            marginBottom: 0
          }}
        />
        <button
          onClick={() => handleTrack()}
          disabled={loading}
          style={{
            width: "auto",
            padding: "0 28px",
            background: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-sm)",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Search size={18} /> {loading ? "Searching..." : "Track"}
        </button>
      </div>

      {error && (
        <div style={{
          background: "#ffebee",
          color: "#c62828",
          padding: "16px",
          borderRadius: "var(--radius-md)",
          marginBottom: "30px",
          fontWeight: "500",
          border: "1px solid #ffcdd2",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <ShieldAlert size={20} /> {error}
        </div>
      )}

      {complaint && (
        <div style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "40px",
          boxShadow: "var(--shadow-md)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <span style={{
                fontSize: "0.85rem",
                fontWeight: "700",
                color: "var(--primary)",
                background: "var(--primary-light)",
                padding: "4px 10px",
                borderRadius: "100px",
                letterSpacing: "0.05em"
              }}>
                {complaint.complaintId}
              </span>
              <h2 style={{ marginTop: "12px", fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)" }}>
                {complaint.title}
              </h2>
            </div>
            
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Incident Date</p>
              <p style={{ fontWeight: "700", color: "var(--text-primary)" }}>
                {new Date(complaint.incidentDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <hr style={{ border: 0, height: "1px", background: "var(--border-color)", margin: "30px 0" }} />

          {/* Progress Flow */}
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "25px" }}>Investigation Status</h3>
          
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
            margin: "0 0 50px",
            padding: "0 10px"
          }}>
            {/* Status Line Background */}
            <div style={{
              position: "absolute",
              top: "15px",
              left: "10px",
              right: "10px",
              height: "4px",
              background: "#e2e8f0",
              zIndex: 1
            }} />

            {/* Status Line Progress */}
            {!isRejected && (
              <div style={{
                position: "absolute",
                top: "15px",
                left: "10px",
                width: `${(getStatusIndex(complaint.status) / (statuses.length - 1)) * 100}%`,
                height: "4px",
                background: "var(--primary)",
                zIndex: 2,
                transition: "all 0.5s ease"
              }} />
            )}

            {statuses.map((status, index) => {
              const isActive = !isRejected && index <= getStatusIndex(complaint.status);
              const isCurrent = !isRejected && index === getStatusIndex(complaint.status);
              
              return (
                <div key={status} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 3, position: "relative" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: isActive ? "var(--primary)" : "#ffffff",
                    border: isActive ? "2px solid var(--primary)" : "2px solid #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    color: isActive ? "#ffffff" : "#64748b",
                    boxShadow: isCurrent ? "0 0 0 4px rgba(13, 148, 136, 0.25)" : "none",
                    transition: "all 0.3s ease"
                  }}>
                    {index + 1}
                  </div>
                  <span style={{
                    marginTop: "10px",
                    fontSize: "0.85rem",
                    fontWeight: isCurrent ? "700" : "600",
                    color: isCurrent ? "var(--primary)" : isActive ? "var(--text-primary)" : "var(--text-muted)",
                    textAlign: "center"
                  }}>
                    {status.replace("_", " ")}
                  </span>
                </div>
              );
            })}

            {isRejected && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 3, position: "relative" }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#dc2626",
                  border: "2px solid #dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  color: "#ffffff"
                }}>
                  ✗
                </div>
                <span style={{
                  marginTop: "10px",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  color: "#dc2626",
                  textAlign: "center"
                }}>
                  REJECTED
                </span>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginBottom: "30px" }}>
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Category</p>
              <p style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "1.1rem" }}>{complaint.category}</p>
            </div>
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Priority Level</p>
              <p style={{
                fontWeight: "700",
                color: complaint.priority === "HIGH" ? "#c5221f" : complaint.priority === "MEDIUM" ? "#b06000" : "#137333",
                fontSize: "1.1rem"
              }}>{complaint.priority}</p>
            </div>
          </div>

          <div style={{ marginBottom: "30px" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "6px" }}>Detailed Description</p>
            <div style={{
              background: "var(--bg-primary)",
              padding: "20px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              lineHeight: "1.6",
              whiteSpace: "pre-wrap"
            }}>
              {complaint.description}
            </div>
          </div>

          {complaint.evidenceFiles && complaint.evidenceFiles.length > 0 && (
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "10px" }}>Evidence Attachments</p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {complaint.evidenceFiles.map((file) => (
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
                      fontSize: "0.9rem",
                      transition: "var(--transition)"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#e2e8f0"}
                    onMouseOut={(e) => e.currentTarget.style.background = "#f1f5f9"}
                  >
                    <FileText size={18} color="var(--primary)" />
                    <span style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {file.fileName}
                    </span>
                    <Download size={16} />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "40px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            <Clock size={14} />
            <span>Last Updated: {complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleString() : new Date(complaint.createdAt).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrackComplaint;
