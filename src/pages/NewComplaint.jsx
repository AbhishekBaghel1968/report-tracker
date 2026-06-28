import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { ShieldAlert, FileText, Calendar, Upload, AlertCircle, Mic, MicOff, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import FaceVerificationModal from "../components/FaceVerificationModal";

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
    city: "",
    customCity: "",
    state: "",
  });

  const CITY_CATALOG = {
    "Delhi": "Delhi",
    "Mumbai": "Maharashtra",
    "Bangalore": "Karnataka",
    "Chennai": "Tamil Nadu",
    "Hyderabad": "Telangana",
    "Pune": "Maharashtra",
    "Kolkata": "West Bengal",
    "Agra": "Uttar Pradesh",
    "Lucknow": "Uttar Pradesh",
    "Jaipur": "Rajasthan",
    "Ahmedabad": "Gujarat",
    "Patna": "Bihar",
    "Bhopal": "Madhya Pradesh",
    "Chandigarh": "Punjab",
    "Noida": "Uttar Pradesh",
    "Gurugram": "Haryana",
    "Surat": "Gujarat",
    "Visakhapatnam": "Andhra Pradesh",
    "Kanpur": "Uttar Pradesh",
    "Nagpur": "Maharashtra",
    "Indore": "Madhya Pradesh",
    "Thane": "Maharashtra",
    "Kochi": "Kerala",
    "Amritsar": "Punjab"
  };

  const handleCityChange = (e) => {
    const val = e.target.value;
    if (val === "Other") {
      setFormData(prev => ({
        ...prev,
        city: val,
        customCity: "",
        state: ""
      }));
    } else if (val) {
      setFormData(prev => ({
        ...prev,
        city: val,
        customCity: "",
        state: CITY_CATALOG[val] || ""
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        city: "",
        customCity: "",
        state: ""
      }));
    }
  };

  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  // Biometric states
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);

  useEffect(() => {
    // Initialize Web Speech API recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setFormData(prev => ({
          ...prev,
          description: (prev.description + " " + transcript).trim()
        }));
      };

      rec.onerror = (err) => {
        console.error("Speech recognition error:", err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      alert("Voice speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

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

    if (!faceVerified) {
      setError("Identity verification required: Complete the face verification scan to submit reports.");
      return;
    }

    if (
      !formData.title ||
      !formData.category ||
      !formData.priority ||
      !formData.date ||
      !formData.description ||
      !formData.city ||
      (formData.city === "Other" && !formData.customCity) ||
      !formData.state
    ) {
      setError("Please fill all required fields, including City and State");
      return;
    }

    setLoading(true);
    const postData = new FormData();
    postData.append("title", formData.title);
    postData.append("category", formData.category);
    postData.append("priority", formData.priority);
    postData.append("description", formData.description);
    postData.append("incidentDate", formData.date);
    
    const finalCity = formData.city === "Other" ? formData.customCity : formData.city;
    postData.append("city", finalCity);
    postData.append("state", formData.state);
    postData.append("location", finalCity);

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
          {/* Identity Biometric Verification Card */}
          <div style={{
            background: "rgba(0, 240, 255, 0.02)",
            border: faceVerified ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(0, 240, 255, 0.15)",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "25px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: "700", color: faceVerified ? "var(--success)" : "var(--accent)", display: "block" }}>
                {faceVerified ? "✓ IDENTITY VERIFIED" : "🔒 IDENTITY VERIFICATION REQUIRED"}
              </span>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                {faceVerified ? "Biometric face verification matches registry profiles." : "Complete standard biometric face scan to unlock secure complaint filings."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFaceModalOpen(true)}
              disabled={faceVerified}
              style={{
                width: "auto",
                background: faceVerified ? "rgba(16, 185, 129, 0.1)" : "var(--primary)",
                color: faceVerified ? "var(--success)" : "white",
                border: faceVerified ? "1px solid var(--success)" : "none",
                padding: "8px 16px",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: "700",
                cursor: faceVerified ? "default" : "pointer",
                marginBottom: 0
              }}
            >
              {faceVerified ? "Verified" : "Verify Face Presence"}
            </button>
          </div>

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

          <div className="form-row">
            <div className="form-group">
              <label>City *</label>
              <select
                name="city"
                value={formData.city}
                onChange={handleCityChange}
                required
              >
                <option value="">Select City</option>
                {Object.keys(CITY_CATALOG).sort().map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>State *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                disabled={formData.city !== "Other" && formData.city !== ""}
                placeholder={formData.city === "Other" ? "e.g. Uttar Pradesh" : "Select a city first"}
                required
              />
            </div>
          </div>

          {formData.city === "Other" && (
            <div className="form-group">
              <label>Custom City Name *</label>
              <input
                type="text"
                name="customCity"
                value={formData.customCity}
                onChange={handleChange}
                placeholder="e.g. Agra"
                required
              />
            </div>
          )}

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ marginBottom: 0 }}>Detailed Description *</label>
              <button
                type="button"
                onClick={toggleListening}
                style={{
                  background: isListening ? "rgba(255, 0, 85, 0.12)" : "rgba(255,255,255,0.03)",
                  border: isListening ? "1px solid var(--danger)" : "1px solid var(--border-color)",
                  color: isListening ? "var(--danger)" : "var(--text-secondary)",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  width: "auto",
                  marginBottom: 0
                }}
              >
                {isListening ? (
                  <>
                    <MicOff size={12} />
                    <span>Stop dictating</span>
                  </>
                ) : (
                  <>
                    <Mic size={12} />
                    <span>Voice File Incident</span>
                  </>
                )}
              </button>
            </div>
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
              background: faceVerified
                ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)"
                : "rgba(255,255,255,0.02)",
              color: faceVerified ? "white" : "var(--text-muted)",
              border: faceVerified ? "none" : "1px solid var(--border-color)",
              cursor: faceVerified && !loading ? "pointer" : "not-allowed",
              boxShadow: faceVerified ? "0 4px 18px var(--primary-glow)" : "none"
            }}
          >
            <AlertCircle size={18} />
            <span>{loading ? "Registering Report..." : faceVerified ? "Submit Secure Report" : "Awaiting Face Verification Check"}</span>
          </button>
        </form>
      </div>

      {/* Verification Webcam Dialog */}
      <FaceVerificationModal
        isOpen={faceModalOpen}
        onClose={() => setFaceModalOpen(false)}
        onVerified={(status) => setFaceVerified(status)}
      />
    </motion.div>
  );
}

export default NewComplaint;
