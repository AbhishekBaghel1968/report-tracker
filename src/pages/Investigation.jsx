import { motion } from "framer-motion";
import { Shield, Search, Terminal, AlertCircle, Compass, Cpu, Database } from "lucide-react";

function Investigation() {
  const mockScans = [
    { id: 1, type: "IP Geolocation", status: "COMPLETED", target: "192.168.1.104", time: "2 mins ago" },
    { id: 2, type: "Metasploit Audit", status: "RUNNING", target: "Server Node B", time: "Active" },
    { id: 3, type: "Phishing Header Scan", status: "QUEUED", target: "mail-attachment-5431", time: "Pending" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
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
      style={{ width: "100%" }}
    >
      {/* Top Banner */}
      <motion.div variants={itemVariants} style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: "700", color: "var(--text-primary)" }}>
          Forensic Investigation Hub
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "4px" }}>
          Execute deep-packet audits, inspect digital crime scenes, and run cryptographic trace scripts.
        </p>
      </motion.div>

      {/* Main Terminal Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "25px", marginBottom: "40px" }} className="investigation-grid">
        {/* Left Side: Forensic Scanner Console */}
        <motion.div 
          variants={itemVariants} 
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            boxShadow: "var(--shadow-md)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              <Terminal size={18} color="var(--accent)" /> Case Scan Terminal
            </h3>
            <span style={{ fontSize: "0.75rem", background: "rgba(0, 240, 255, 0.1)", color: "var(--accent)", padding: "4px 10px", borderRadius: "100px", fontWeight: "600" }}>
              SECURE SESSION ACTIVE
            </span>
          </div>

          <div style={{ background: "rgba(3, 3, 7, 0.7)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "20px", fontFamily: "monospace", minHeight: "220px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <p style={{ color: "#00f0ff", marginBottom: "8px" }}>&gt; Initializing Sentinel decryptor protocols...</p>
              <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "8px" }}>&gt; Access granted: LEVEL 3 Clearance verified.</p>
              <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "8px" }}>&gt; Binding forensic listener to socket port 8080...</p>
              <p style={{ color: "var(--warning)", marginBottom: "8px" }}>&gt; WARNING: 3 trace route attempts failed on outer nodes.</p>
              <p style={{ color: "#10b981" }}>&gt; Core database synchronization: SUCCESSFUL.</p>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <input 
                type="text" 
                placeholder="Enter shell command or tracking hash..." 
                style={{ background: "transparent", border: "1px solid var(--border-color)", borderRadius: "4px", padding: "8px 12px", flex: 1, color: "white", fontFamily: "monospace", fontSize: "0.85rem" }}
              />
              <button style={{ width: "auto", margin: 0, background: "var(--primary)", padding: "0 16px", fontSize: "0.85rem" }}>Run Scan</button>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Active Forensic Logs */}
        <motion.div 
          variants={itemVariants} 
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            boxShadow: "var(--shadow-md)"
          }}
        >
          <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Cpu size={18} color="var(--primary)" /> Scan Telemetry
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {mockScans.map(scan => (
              <div key={scan.id} style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-sm)", padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--text-primary)" }}>{scan.type}</span>
                  <span style={{ 
                    fontSize: "0.7rem", 
                    fontWeight: "700",
                    color: scan.status === "COMPLETED" ? "var(--success)" : scan.status === "RUNNING" ? "var(--accent)" : "var(--text-muted)"
                  }}>
                    {scan.status}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  <span>Target: {scan.target}</span>
                  <span>{scan.time}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Feature Highlights Grid */}
      <motion.div className="stats-container" variants={itemVariants} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
        <div className="stat-card" style={{ borderLeft: "4px solid var(--primary)", display: "flex", gap: "15px", padding: "20px" }}>
          <div style={{ background: "rgba(139, 92, 246, 0.1)", padding: "10px", borderRadius: "8px", height: "fit-content", color: "var(--primary)" }}>
            <Compass size={20} />
          </div>
          <div>
            <h4 style={{ fontWeight: "700", fontSize: "0.95rem", marginBottom: "4px" }}>Cyber Map Coordinates</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>Trace threat actor IP endpoints using global coordinate maps.</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid var(--accent)", display: "flex", gap: "15px", padding: "20px" }}>
          <div style={{ background: "rgba(0, 240, 255, 0.1)", padding: "10px", borderRadius: "8px", height: "fit-content", color: "var(--accent)" }}>
            <Database size={20} />
          </div>
          <div>
            <h4 style={{ fontWeight: "700", fontSize: "0.95rem", marginBottom: "4px" }}>Evidence Locker v2</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>Securely lock media logs, files, and chat transcripts for case hearings.</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid var(--warning)", display: "flex", gap: "15px", padding: "20px" }}>
          <div style={{ background: "rgba(245, 158, 11, 0.1)", padding: "10px", borderRadius: "8px", height: "fit-content", color: "var(--warning)" }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <h4 style={{ fontWeight: "700", fontSize: "0.95rem", marginBottom: "4px" }}>Threat Radar Index</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>Evaluate incoming complaint severity tags via internal classification metrics.</p>
          </div>
        </div>
      </motion.div>

      {/* Responsive adjustments styling */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          .investigation-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
    </motion.div>
  );
}

export default Investigation;
