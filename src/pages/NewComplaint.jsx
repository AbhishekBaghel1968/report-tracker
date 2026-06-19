import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { ShieldAlert, FileText, Calendar, Upload, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

function NewComplaint() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    priority: "",
    date: "",
    description: "",
    evidence: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.title ||
      !formData.category ||
      !formData.priority ||
      !formData.date ||
      !formData.description
    ) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    const postData = new FormData();
    postData.append("title", formData.title);
    postData.append("category", formData.category);
    postData.append("priority", formData.priority);
    postData.append("description", formData.description);
    postData.append("incidentDate", formData.date);
    if (formData.evidence) {
      postData.append("evidence", formData.evidence);
    }

    try {
      const response = await api.post("/complaints", postData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      alert(`Complaint Registered Successfully! Tracking ID: ${response.data.complaintId}`);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error submitting complaint", err);
      const msg = err.response?.data?.error || err.response?.data?.message || "Failed to submit complaint. Make sure file size is under 10MB.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " Bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 80, damping: 15 }}
      style={{ maxWidth: "700px", margin: "0 auto", width: "100%" }}
    >
      <div className="profile-card" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
        <h2>
          <ShieldAlert size={22} color="var(--primary)" style={{ filter: "drop-shadow(0 0 6px var(--primary-glow))" }} />
          <span>File Incident Report</span>
        </h2>
        <hr style={{ border: "0", height: "1px", background: "var(--border-color)", marginBottom: "30px" }} />

        {error && (
          <motion.div 
            className="alert-error" 
            style={{ marginBottom: "25px" }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Complaint Title *</label>
            <div style={{ position: "relative" }}>
              <FileText size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                name="title"
                placeholder="e.g. Identity theft on Facebook profile"
                value={formData.title}
                onChange={handleChange}
                style={{ paddingLeft: "42px" }}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                <option value="Phishing">Phishing</option>
                <option value="Online Fraud">Online Fraud</option>
                <option value="Identity Theft">Identity Theft</option>
                <option value="Social Media Crime">Social Media Crime</option>
                <option value="Cyber Bullying">Cyber Bullying</option>
                <option value="Financial Fraud">Financial Fraud</option>
              </select>
            </div>

            <div className="form-group">
              <label>Priority Level *</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
              >
                <option value="">Select Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Incident Date *</label>
            <div style={{ position: "relative" }}>
              <Calendar size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={{ paddingLeft: "42px" }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Detailed Description *</label>
            <textarea
              rows="5"
              name="description"
              placeholder="Provide a comprehensive timeline of events, website addresses, accounts, and any communication received..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Upload Secure Evidence (Max 10MB | JPG, PNG, PDF)</label>
            <label className="custom-file-upload">
              <Upload className="custom-file-icon" size={24} />
              {formData.evidence ? (
                <div style={{ textAlign: "center" }}>
                  <span className="custom-file-selected">{formData.evidence.name}</span>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    Size: {formatFileSize(formData.evidence.size)}
                  </p>
                </div>
              ) : (
                <span className="custom-file-text">Drag & drop files or click to browse</span>
              )}
              <input
                type="file"
                name="evidence"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleChange}
                style={{ display: "none" }}
              />
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: "8px",
              marginTop: "30px",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
              boxShadow: "0 4px 18px var(--primary-glow)"
            }}
          >
            <AlertCircle size={18} />
            <span>{loading ? "Registering Report..." : "Submit Secure Report"}</span>
          </button>
        </form>
      </div>
    </motion.div>
  );
}

export default NewComplaint;
