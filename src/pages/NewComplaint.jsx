import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

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

  return (
    <div className="auth-container">
      <div className="auth-box" style={{ width: "550px" }}>
        <h2>Register Complaint</h2>

        {error && (
          <div style={{
            background: "#ffebee",
            color: "#c62828",
            padding: "10px",
            borderRadius: "var(--radius-sm)",
            marginBottom: "20px",
            fontSize: "0.9rem",
            fontWeight: "500",
            border: "1px solid #ffcdd2"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-secondary)" }}>Complaint Title *</label>
          <input
            type="text"
            name="title"
            placeholder="e.g. Identity theft on Facebook"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <div style={{ display: "flex", gap: "15px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-secondary)" }}>Category *</label>
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

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-secondary)" }}>Priority *</label>
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

          <label style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-secondary)" }}>Incident Date *</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />

          <label style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-secondary)" }}>Description *</label>
          <textarea
            rows="5"
            name="description"
            placeholder="Explain the incident in detail..."
            value={formData.description}
            onChange={handleChange}
            required
          />

          <label style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-secondary)" }}>Upload Evidence (Max 10MB - JPG, PNG, PDF)</label>
          <input
            type="file"
            name="evidence"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleChange}
            style={{ padding: "8px" }}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default NewComplaint;
