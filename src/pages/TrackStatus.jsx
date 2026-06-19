import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShieldAlert, ShieldCheck, Clock, FileText, User, ArrowRight } from "lucide-react";

function TrackStatus() {
  const [searchQuery, setSearchQuery] = useState("");
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);

  const mockQueryDB = {
    "COMP-4819": {
      id: "COMP-4819",
      title: "Online Cryptographic Wallet Phishing Attack",
      category: "Financial Fraud",
      priority: "HIGH",
      filedDate: "June 14, 2026",
      status: "INVESTIGATING",
      assignedBadge: "Officer Sarah (Badge #741)",
      logs: [
        { state: "SUBMITTED", desc: "Complaint filed via secure endpoint.", time: "June 14, 2026 09:24 AM" },
        { state: "UNDER_REVIEW", desc: "Automated routing matched classification parameters.", time: "June 14, 2026 11:40 AM" },
        { state: "INVESTIGATING", desc: "Assigned badge #741. IP forensics logs retrieved.", time: "June 15, 2026 02:15 PM" },
      ]
    },
    "COMP-9012": {
      id: "COMP-9012",
      title: "Social Media Account Identity Theft Hijack",
      category: "Identity Theft",
      priority: "MEDIUM",
      filedDate: "June 08, 2026",
      status: "RESOLVED",
      assignedBadge: "Officer David (Badge #105)",
      logs: [
        { state: "SUBMITTED", desc: "Report filed by verification user.", time: "June 08, 2026 10:15 AM" },
        { state: "UNDER_REVIEW", desc: "Evidence files verified.", time: "June 09, 2026 09:00 AM" },
        { state: "INVESTIGATING", desc: "Contacted provider support logs.", time: "June 10, 2026 01:20 PM" },
        { state: "RESOLVED", desc: "Account restored to owner. Case marked closed.", time: "June 12, 2026 04:30 PM" },
      ]
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setSearched(true);
    const key = searchQuery.trim().toUpperCase();
    if (mockQueryDB[key]) {
      setResult(mockQueryDB[key]);
    } else {
      setResult(null);
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ width: "100%", maxWidth: "850px" }}
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: "700", color: "var(--text-primary)" }}>
          Audit Case Tracking
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "4px" }}>
          Track case history logs, state shifts, classification levels, and officer actions.
        </p>
      </motion.div>

      {/* Lookup Bar */}
      <motion.div variants={itemVariants} style={{ margin: "30px 0 40px" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", background: "var(--glass-bg)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)", boxShadow: "var(--shadow-sm)", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Enter Tracking ID (try 'COMP-4819' or 'COMP-9012')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
          />
          <button
            type="submit"
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
              marginBottom: 0
            }}
          >
            <Search size={18} />
            <span>Search Log</span>
          </button>
        </form>
      </motion.div>

      {/* Search results */}
      <AnimatePresence mode="wait">
        {searched && !result && (
          <motion.div 
            key="not-found"
            className="alert-error" 
            style={{ padding: "16px", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px" }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <ShieldAlert size={20} />
            <span>Case Tracking ID not found in security database ledger. Verify query input.</span>
          </motion.div>
        )}

        {searched && result && (
          <motion.div
            key="found-result"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-lg)",
              padding: "35px",
              boxShadow: "var(--shadow-lg)"
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 85, damping: 15 }}
          >
            {/* Header info card */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
              <div>
                <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--accent)", background: "var(--accent-light)", border: "1px solid rgba(0, 240, 255, 0.2)", padding: "4px 12px", borderRadius: "100px", letterSpacing: "0.05em" }}>
                  {result.id}
                </span>
                <h3 style={{ marginTop: "12px", fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
                  {result.title}
                </h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Date Filed</p>
                <p style={{ fontWeight: "700", color: "var(--text-primary)" }}>{result.filedDate}</p>
              </div>
            </div>

            <hr style={{ border: 0, height: "1px", background: "var(--border-color)", margin: "30px 0" }} />

            {/* Audit log steps */}
            <h4 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "25px", color: "var(--text-primary)" }}>
              Audit Progress History
            </h4>

            {/* Vertically oriented progress tracker */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative", paddingLeft: "30px", marginBottom: "30px" }}>
              <div style={{ position: "absolute", left: "10px", top: "10px", bottom: "10px", width: "2px", background: "var(--border-color)" }} />
              
              {result.logs.map((log, idx) => (
                <div key={idx} style={{ position: "relative" }}>
                  {/* Indicator bullet */}
                  <div style={{ 
                    position: "absolute", 
                    left: "-26px", 
                    top: "4px", 
                    width: "14px", 
                    height: "14px", 
                    borderRadius: "50%", 
                    background: idx === result.logs.length - 1 ? "var(--accent)" : "var(--border-color)",
                    border: "3px solid var(--bg-secondary)",
                    boxShadow: idx === result.logs.length - 1 ? "0 0 10px var(--accent)" : "none"
                  }} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--text-primary)" }}>{log.state}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{log.time}</span>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>{log.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Metadata info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginBottom: "30px", borderTop: "1px solid var(--border-color)", paddingTop: "25px" }}>
              <div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Incident Category</p>
                <p style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "1.05rem", marginTop: "4px" }}>{result.category}</p>
              </div>
              <div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Priority Classification</p>
                <p style={{
                  fontWeight: "700",
                  color: getPriorityColor(result.priority),
                  fontSize: "1.05rem",
                  marginTop: "4px"
                }}>{result.priority}</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", color: "var(--text-muted)", fontSize: "0.85rem", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
              <User size={14} color="var(--primary)" />
              <span>Assigned Badges: <strong>{result.assignedBadge}</strong></span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default TrackStatus;
