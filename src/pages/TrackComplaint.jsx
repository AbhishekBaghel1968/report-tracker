import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Clock, ShieldAlert, FileText, Download, ShieldCheck } from "lucide-react";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";

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
    <motion.div 
      className="dashboard" 
      style={{ maxWidth: "850px", padding: 0 }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 80, damping: 15 }}
    >
      <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
        Audit Case Tracking
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "4px" }}>
        Track real-time security logs, case classifications, and investigator status.
      </p>

      {/* Search Input Bar */}
      <div style={{
        display: "flex",
        gap: "12px",
        margin: "30px 0 40px",
        background: "var(--glass-bg)",
        padding: "16px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--shadow-sm)",
        alignItems: "center"
      }}>
        <input
          type="text"
          placeholder="Enter Tracking ID (e.g. COMP-8A9F321B)"
          value={complaintIdInput}
          onChange={(e) => setComplaintIdInput(e.target.value)}
          style={{
            flex: 1,
            padding: "12px 16px",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-sm)",
            background: "rgba(3, 3, 7, 0.4)",
            color: "var(--text-primary)",
            fontSize: "1.05rem",
            marginBottom: 0
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleTrack();
          }}
        />
        <button
          onClick={() => handleTrack()}
          disabled={loading}
          style={{
            width: "auto",
            padding: "0 28px",
            height: "48px",
            background: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-sm)",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "var(--transition)",
            boxShadow: "0 4px 14px var(--primary-glow)",
            marginBottom: 0
          }}
          onMouseOver={(e) => e.currentTarget.style.boxShadow = "0 6px 18px rgba(139, 92, 246, 0.5)"}
          onMouseOut={(e) => e.currentTarget.style.boxShadow = "0 4px 14px var(--primary-glow)"}
        >
          <Search size={18} /> 
          <span>{loading ? "Searching..." : "Track Case"}</span>
        </button>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="alert-error" 
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              marginBottom: "30px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <ShieldAlert size={20} /> 
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complaint Log Card */}
      <AnimatePresence>
        {complaint && (
          <motion.div 
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-lg)",
              padding: "35px",
              boxShadow: "var(--shadow-lg)"
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 70, damping: 15 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
              <div>
                <span style={{
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  color: "var(--accent)",
                  background: "var(--accent-light)",
                  border: "1px solid rgba(0, 240, 255, 0.2)",
                  padding: "4px 12px",
                  borderRadius: "100px",
                  letterSpacing: "0.05em"
                }}>
                  {complaint.complaintId}
                </span>
                <h3 style={{ marginTop: "12px", fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
                  {complaint.title}
                </h3>
              </div>
              
              <div style={{ textAlign: "right" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Incident Date</p>
                <p style={{ fontWeight: "700", color: "var(--text-primary)" }}>
                  {new Date(complaint.incidentDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <hr style={{ border: 0, height: "1px", background: "var(--border-color)", margin: "30px 0" }} />

            {/* Timeline Progress */}
            <h4 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "25px", color: "var(--text-primary)" }}>
              Audit Progress Log
            </h4>
            
            <div className="track-timeline">
              <div className="track-timeline-line" />
              
              {!isRejected && (
                <div 
                  className="track-timeline-progress"
                  style={{
                    width: `${(getStatusIndex(complaint.status) / (statuses.length - 1)) * 100}%`
                  }}
                />
              )}

              {statuses.map((status, index) => {
                const isActive = !isRejected && index <= getStatusIndex(complaint.status);
                const isCurrent = !isRejected && index === getStatusIndex(complaint.status);
                
                return (
                  <div 
                    key={status} 
                    className={`track-timeline-step ${isActive ? "active" : ""} ${isCurrent ? "current" : ""}`}
                  >
                    <div className="track-step-circle">
                      {isActive ? <ShieldCheck size={18} /> : index + 1}
                    </div>
                    <span className="track-step-label">
                      {status.replace("_", " ")}
                    </span>
                  </div>
                );
              })}

              {isRejected && (
                <div className="track-timeline-step active" style={{ zIndex: 10 }}>
                  <div className="track-step-circle" style={{ background: "var(--danger)", borderColor: "var(--danger)", color: "white", boxShadow: "0 0 15px var(--danger-glow)" }}>
                    ✗
                  </div>
                  <span className="track-step-label" style={{ color: "var(--danger)", fontWeight: "700" }}>
                    REJECTED
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginBottom: "30px" }}>
              <div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Incident Category</p>
                <p style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "1.05rem", marginTop: "4px" }}>{complaint.category}</p>
              </div>
              <div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Priority Classification</p>
                <p style={{
                  fontWeight: "700",
                  color: complaint.priority === "HIGH" ? "var(--danger)" : complaint.priority === "MEDIUM" ? "var(--warning)" : "var(--success)",
                  fontSize: "1.05rem",
                  marginTop: "4px"
                }}>{complaint.priority}</p>
              </div>
            </div>

            <div style={{ marginBottom: "30px" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "8px" }}>Detailed Statement</p>
              <div style={{
                background: "rgba(3, 3, 7, 0.4)",
                padding: "20px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
                fontSize: "0.95rem"
              }}>
                {complaint.description}
              </div>
            </div>

            {complaint.evidenceFiles && complaint.evidenceFiles.length > 0 ? (
              <div style={{ marginBottom: "15px" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "12px" }}>Evidence Attachments</p>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {complaint.evidenceFiles.map((file) => (
                    <a
                      key={file.id}
                      href={`http://localhost:8080/api/files/${file.filePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="evidence-download-chip"
                    >
                      <FileText size={16} color="var(--accent)" />
                      <span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {file.fileName}
                      </span>
                      <Download size={14} style={{ marginLeft: "4px" }} />
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No attached evidence files.</p>
            )}

            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "40px", color: "var(--text-muted)", fontSize: "0.85rem", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
              <Clock size={14} />
              <span>Last Session Update: {complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleString() : new Date(complaint.createdAt).toLocaleString()}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default TrackComplaint;
