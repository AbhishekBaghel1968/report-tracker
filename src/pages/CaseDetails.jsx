import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Shield, Clock, AlertTriangle, User, Calendar, 
  MapPin, Send, UploadCloud, Paperclip, CheckCircle, FileText, Loader2, Trash2, Bot, MessageSquare, Download
} from "lucide-react";
import api from "../services/api";
import { motion } from "framer-motion";
import SecureChatPanel from "../components/SecureChatPanel";
import AIAnalyzer from "../components/AIAnalyzer";

function CaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!complaint) return;
    setDownloading(true);
    try {
      const response = await api.get(`/reports/${complaint.complaintId}/pdf`, {
        responseType: "blob"
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${complaint.complaintId}-report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading PDF report", err);
      alert("Failed to download PDF report. Ensure you have proper authorization.");
    } finally {
      setDownloading(false);
    }
  };

  // Officer inputs
  const [noteText, setNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const fetchTimeline = async () => {
    try {
      setTimelineLoading(true);
      const response = await api.get(`/complaints/${id}/timeline`);
      setTimeline(response.data);
    } catch (err) {
      console.error("Failed to load timeline telemetry:", err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/officer/cases/${id}`);
      setComplaint(response.data);
      await fetchTimeline();
    } catch (err) {
      console.error("Error fetching complaint details:", err);
      setError(err.response?.data?.error || "Complaint details could not be retrieved. Ensure it is assigned to you.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);


  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      await api.put(`/officer/case/${id}/status`, { status: newStatus });
      await fetchComplaintDetails();
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update case status.");
    } finally {
      setUpdatingStatus(false);
    }
  };


  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      setSubmittingNote(true);
      await api.post(`/officer/notes/${id}`, { note: noteText });
      setNoteText("");
      await fetchComplaintDetails();
    } catch (err) {
      console.error("Failed to add note", err);
      alert("Failed to save investigation note.");
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("complaintId", id);

      await api.post("/officer/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchComplaintDetails();
    } catch (err) {
      console.error("Failed to upload evidence file", err);
      alert(err.response?.data?.error || "Failed to upload file. Ensure it is a valid PNG, JPG or PDF under 10MB.");
    } finally {
      setUploadingFile(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "SUBMITTED": return "badge-submitted";
      case "UNDER_REVIEW": return "badge-review";
      case "INVESTIGATING": return "badge-investigating";
      case "RESOLVED": return "badge-resolved";
      case "REJECTED": return "badge-rejected";
      default: return "badge-submitted";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH": return "var(--danger)";
      case "MEDIUM": return "var(--warning)";
      case "LOW": return "var(--success)";
      default: return "var(--text-muted)";
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--text-secondary)" }}>
        <Loader2 size={36} className="spin-animation" style={{ animation: "spin 1s linear infinite", color: "var(--accent)", marginBottom: "15px" }} />
        <p>Opening case file folder...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <AlertTriangle size={48} color="var(--danger)" style={{ marginBottom: "20px", display: "inline-block" }} />
        <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>Access Denied</h3>
        <p style={{ color: "var(--text-secondary)", marginTop: "8px", marginBottom: "24px" }}>{error || "Case details unavailable."}</p>
        <button onClick={() => navigate("/officer/cases")} style={{ width: "auto", padding: "10px 24px" }}>
          Go to Assigned Cases
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Back Button */}
      <div style={{ marginBottom: "25px" }}>
        <button 
          onClick={() => navigate("/officer/cases")}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.95rem",
            padding: 0
          }}
          onMouseOver={(e) => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseOut={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
        >
          <ArrowLeft size={18} /> Back to Assigned list
        </button>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1.8fr 1.2fr",
        gap: "30px",
      }} className="case-details-grid">
        
        {/* Left Column: Complaint Data */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          
          {/* Main Case Card */}
          <div style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "30px",
            boxShadow: "var(--shadow-md)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "15px", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", fontWeight: "700" }}>Case ID: {complaint.complaintId}</span>
                <h2 style={{ fontSize: "1.45rem", fontWeight: "700", color: "var(--text-primary)", marginTop: "4px" }}>{complaint.title}</h2>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  style={{
                    padding: "6px 14px",
                    background: "rgba(0, 240, 255, 0.06)",
                    border: "1px solid rgba(0, 240, 255, 0.2)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--accent)",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "var(--transition)",
                    width: "auto"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "rgba(0, 240, 255, 0.15)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "rgba(0, 240, 255, 0.06)"}
                >
                  <Download size={14} color="var(--accent)" />
                  <span>{downloading ? "Exporting..." : "Export PDF"}</span>
                </button>
                <span className={`badge ${getStatusBadgeClass(complaint.status)}`} style={{ fontSize: "0.85rem", padding: "6px 14px" }}>
                  {complaint.status.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Case Details Attributes Grid */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
              gap: "20px", 
              borderBottom: "1px solid var(--border-color)", 
              paddingBottom: "25px",
              marginBottom: "25px"
            }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Category</span>
                <span style={{ color: "var(--text-primary)", fontWeight: "600", fontSize: "0.95rem" }}>{complaint.category}</span>
              </div>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Priority</span>
                <span style={{ color: getPriorityColor(complaint.priority), fontWeight: "700", fontSize: "0.95rem" }}>{complaint.priority}</span>
              </div>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Incident Date</span>
                <span style={{ color: "var(--text-primary)", fontWeight: "600", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={14} /> {complaint.incidentDate}
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Incident Location</span>
                <span style={{ color: "var(--text-primary)", fontWeight: "600", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <MapPin size={14} /> {complaint.location}
                </span>
              </div>
            </div>

            {/* Case Description */}
            <div style={{ marginBottom: "25px" }}>
              <h4 style={{ fontSize: "1rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "10px" }}>Citizen Incident Statement</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                {complaint.description || "No statement text provided."}
              </p>
            </div>
          </div>

          {/* Evidence Dossier Section */}
          <div style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "30px",
            boxShadow: "var(--shadow-md)"
          }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Paperclip size={18} color="var(--accent)" /> Attached Incident Evidence
            </h3>

            {/* Citizen Uploads */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>Citizen Uploads</h4>
              {(!complaint.evidenceFiles || complaint.evidenceFiles.length === 0) ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No citizen files uploaded.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {complaint.evidenceFiles.map(file => (
                    <div 
                      key={file.id} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "space-between", 
                        padding: "10px 16px",
                        background: "rgba(3,3,7,0.4)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px"
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <FileText size={16} color="var(--primary)" />
                          <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: "500" }}>{file.fileName}</span>
                        </div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                          SHA-256: {file.fileHash || 'Forensics Pending'} {file.fileSize ? `| Size: ${(file.fileSize / 1024).toFixed(1)} KB` : ''}
                        </span>
                      </div>
                      <a 
                        href={`http://localhost:8080/api/files/${file.filePath}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="sidebar-link"
                        style={{ border: "none", color: "var(--accent)", background: "transparent", fontSize: "0.85rem", padding: "4px 8px", cursor: "pointer", textDecoration: "none" }}
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Officer Uploads */}
            <div>
              <h4 style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>Officer Investigation Logs</h4>
              {(!complaint.evidenceUploads || complaint.evidenceUploads.length === 0) ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No officer logs uploaded yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {complaint.evidenceUploads.map(file => (
                    <div 
                      key={file.id} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "space-between", 
                        padding: "10px 16px",
                        background: "rgba(0, 240, 255, 0.02)",
                        border: "1px solid rgba(0, 240, 255, 0.1)",
                        borderRadius: "8px"
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <FileText size={16} color="var(--accent)" />
                          <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: "500" }}>{file.fileName}</span>
                        </div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                          SHA-256: {file.fileHash || 'Forensics Pending'} {file.fileSize ? `| Size: ${(file.fileSize / 1024).toFixed(1)} KB` : ''}
                        </span>
                      </div>
                      <a 
                        href={`http://localhost:8080/api/files/${file.filePath}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="sidebar-link"
                        style={{ border: "none", color: "var(--accent)", background: "transparent", fontSize: "0.85rem", padding: "4px 8px", cursor: "pointer", textDecoration: "none" }}
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Unified Timeline logs */}
          <div style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "30px",
            boxShadow: "var(--shadow-md)"
          }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "25px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Clock size={18} color="var(--accent)" /> Case Investigation Timeline
            </h3>

            {timelineLoading && timeline.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", color: "var(--text-secondary)" }}>
                <Loader2 size={24} className="spin-animation" style={{ animation: "spin 1s linear infinite", color: "var(--accent)" }} />
                <span style={{ marginLeft: "10px" }}>Decrypting timeline telemetries...</span>
              </div>
            ) : timeline.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "20px" }}>
                No active audit timeline logs generated yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative", paddingLeft: "15px" }}>
                {/* Timeline vertical bar */}
                <div style={{
                  position: "absolute",
                  left: "4px",
                  top: "10px",
                  bottom: "10px",
                  width: "2px",
                  background: "rgba(255, 255, 255, 0.05)"
                }} />

                {timeline.map((evt) => (
                  <div key={evt.id} style={{ position: "relative" }}>
                    {/* Timeline bullet */}
                    <div style={{
                      position: "absolute",
                      left: "-15px",
                      top: "6px",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: evt.type === "AI_ASSESSMENT" ? "var(--warning)" : "var(--primary)",
                      border: "2px solid var(--bg-primary)",
                      boxShadow: evt.type === "AI_ASSESSMENT" ? "0 0 6px var(--warning)" : "none"
                    }} />

                    <div style={{
                      background: "rgba(10,10,20,0.5)",
                      border: "1px solid var(--border-color)",
                      padding: "16px 20px",
                      borderRadius: "var(--radius-sm)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "8px", fontSize: "0.8rem" }}>
                        <span style={{ color: "var(--accent)", fontWeight: "700" }}>{evt.title}</span>
                        <span style={{ color: "var(--text-muted)" }}>{new Date(evt.timestamp).toLocaleString()}</span>
                      </div>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: "1.5" }}>{evt.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>


        </div>

        {/* Right Column: Actions & Citizen Profile */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          
          {/* AI Security Diagnostics and Forensics Scanner */}
          <AIAnalyzer 
            title={complaint.title}
            description={complaint.description}
            complaintId={complaint.id}
            existingAnalysis={{
              category: complaint.aiCategory,
              severity: complaint.aiPriority,
              riskScore: complaint.aiRiskScore,
              keywords: (() => {
                try {
                  return complaint.aiIocs ? JSON.parse(complaint.aiIocs) : [];
                } catch(e) {
                  return [];
                }
              })(),
              recommendation: complaint.aiRecommendation || complaint.aiSummary
            }}
            onAnalysisComplete={fetchComplaintDetails}
          />

          {/* Secure Citizen-Officer Link Chat Panel */}
          <SecureChatPanel complaintId={id} role="officer" />

          
          {/* Status Settings panel */}
          <div style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "25px",
            boxShadow: "var(--shadow-md)"
          }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Shield size={16} color="var(--accent)" /> Adjust Case Status
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {["SUBMITTED", "UNDER_REVIEW", "INVESTIGATING", "RESOLVED", "REJECTED"].map(statusVal => (
                <button
                  key={statusVal}
                  onClick={() => handleStatusChange(statusVal)}
                  disabled={updatingStatus || complaint.status === statusVal}
                  style={{
                    width: "100%",
                    margin: 0,
                    padding: "10px 16px",
                    background: complaint.status === statusVal ? "var(--primary-light)" : "rgba(3, 3, 7, 0.4)",
                    color: complaint.status === statusVal ? "var(--primary)" : "var(--text-primary)",
                    border: complaint.status === statusVal ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    cursor: complaint.status === statusVal ? "default" : "pointer",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "var(--transition)"
                  }}
                  onMouseOver={(e) => {
                    if (complaint.status !== statusVal) {
                      e.currentTarget.style.background = "var(--primary-light)";
                      e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.2)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (complaint.status !== statusVal) {
                      e.currentTarget.style.background = "rgba(3, 3, 7, 0.4)";
                      e.currentTarget.style.borderColor = "var(--border-color)";
                    }
                  }}
                >
                  <span>{statusVal.replace("_", " ")}</span>
                  {complaint.status === statusVal && <CheckCircle size={16} color="var(--primary)" />}
                </button>
              ))}
            </div>
          </div>

          {/* Citizen Profile Details */}
          <div style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "25px",
            boxShadow: "var(--shadow-md)"
          }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={16} color="var(--primary)" /> Citizen Profile
            </h3>
            
            {complaint.user ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Full Name</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{complaint.user.name}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Email Address</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: "600", wordBreak: "break-all" }}>{complaint.user.email}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Phone number</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{complaint.user.phone}</span>
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Anonymous submitter logs.</p>
            )}
          </div>

          {/* Upload Investigation Evidence */}
          <div style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "25px",
            boxShadow: "var(--shadow-md)"
          }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <UploadCloud size={16} color="var(--accent)" /> Upload Security Evidence
            </h3>

            <form onSubmit={handleUploadEvidence} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div 
                className="custom-file-upload"
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: "20px 15px", borderStyle: "dashed" }}
              >
                <UploadCloud size={24} className="custom-file-icon" />
                <span className="custom-file-text">
                  {selectedFile ? selectedFile.name : "Click to select JPG, PNG or PDF"}
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  accept=".jpg,.jpeg,.png,.pdf"
                />
              </div>

              {selectedFile && (
                <button
                  type="submit"
                  disabled={uploadingFile}
                  style={{
                    background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
                    boxShadow: "0 4px 12px var(--accent-glow)"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "var(--accent-hover)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "var(--accent)"}
                >
                  {uploadingFile ? "Uploading File..." : "Confirm Upload"}
                </button>
              )}
            </form>
          </div>

          {/* Add Investigation Note */}
          <div style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "25px",
            boxShadow: "var(--shadow-md)"
          }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Send size={16} color="var(--primary)" /> Log Investigation Note
            </h3>

            <form onSubmit={handleAddNote} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <textarea
                placeholder="Log internal comments, findings, or status updates regarding this investigation..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                style={{ 
                  height: "110px", 
                  resize: "none", 
                  fontSize: "0.85rem",
                  padding: "10px 12px" 
                }}
                required
              />
              <button 
                type="submit" 
                disabled={submittingNote || !noteText.trim()}
                style={{ 
                  margin: 0, 
                  fontSize: "0.85rem", 
                  padding: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <Send size={14} /> Log Entry
              </button>
            </form>
          </div>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 900px) {
          .case-details-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
    </div>
  );
}

export default CaseDetails;
