import { motion } from "framer-motion";
import { BarChart3, Download, FileSpreadsheet, FileText, FileCode, CheckCircle, Clock } from "lucide-react";

function Reports() {
  const generatedReportsList = [
    { id: "REP-9041", type: "Caseload Summary", date: "June 18, 2026", size: "1.2 MB", format: "PDF" },
    { id: "REP-8874", type: "Fraud Category Breakdown", date: "June 12, 2026", size: "450 KB", format: "Excel" },
    { id: "REP-8630", type: "Threat Intelligence Audit", date: "May 29, 2026", size: "2.8 MB", format: "PDF" }
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
      {/* Header */}
      <motion.div variants={itemVariants} style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: "700", color: "var(--text-primary)" }}>
          Reports & Case Analytics
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "4px" }}>
          Generate cryptographic summary audits, download excel spreadsheets, and review security intelligence exports.
        </p>
      </motion.div>

      {/* Reports Panel Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "25px", marginBottom: "40px" }} className="reports-grid">
        {/* Left Side: Report Generator Options */}
        <motion.div 
          variants={itemVariants} 
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            boxShadow: "var(--shadow-md)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <BarChart3 size={18} color="var(--primary)" /> Generate Custom Export
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="form-group">
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Select Date Range</label>
                <select style={{ width: "100%", background: "rgba(3,3,7,0.4)", height: "42px", borderColor: "var(--border-color)", color: "white" }}>
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>Current Fiscal Quarter</option>
                  <option>All Assigned Cases</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Case Classification Category</label>
                <select style={{ width: "100%", background: "rgba(3,3,7,0.4)", height: "42px", borderColor: "var(--border-color)", color: "white" }}>
                  <option>All Categories</option>
                  <option>Financial Fraud</option>
                  <option>Identity Theft</option>
                  <option>Phishing & Spoofing</option>
                  <option>Cyber Bullying</option>
                </select>
              </div>

              <div style={{ marginTop: "10px" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "8px", display: "block" }}>Export File Format</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  <button style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "6px", color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", fontSize: "0.75rem" }}>
                    <FileText size={16} color="var(--accent)" /> PDF Document
                  </button>
                  <button style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "6px", color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", fontSize: "0.75rem" }}>
                    <FileSpreadsheet size={16} color="#10b981" /> Excel Sheet
                  </button>
                  <button style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "6px", color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", fontSize: "0.75rem" }}>
                    <FileCode size={16} color="var(--warning)" /> JSON Log
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button style={{ width: "100%", marginTop: "30px", background: "var(--primary)", height: "45px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: "600" }}>
            <Download size={16} /> Compile & Download Report
          </button>
        </motion.div>

        {/* Right Side: Historical Report Log */}
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
            <Clock size={18} color="var(--accent)" /> Archive Reports Log
          </h3>

          <div className="complaint-table-container">
            <table className="complaint-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Classification</th>
                  <th>Date Compiled</th>
                  <th>Size</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {generatedReportsList.map(report => (
                  <tr key={report.id}>
                    <td style={{ fontWeight: "700", color: "var(--accent)" }}>{report.id}</td>
                    <td>{report.type}</td>
                    <td>{report.date}</td>
                    <td>{report.size}</td>
                    <td>
                      <button style={{
                        border: "none",
                        background: "transparent",
                        color: "var(--primary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        padding: 0
                      }}>
                        <Download size={14} /> Download ({report.format})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "20px", color: "var(--text-muted)", fontSize: "0.8rem", padding: "10px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "6px" }}>
            <CheckCircle size={14} color="#10b981" />
            <span>Reports generated here are digitally signed with an investigator access token.</span>
          </div>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          .reports-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
    </motion.div>
  );
}

export default Reports;
