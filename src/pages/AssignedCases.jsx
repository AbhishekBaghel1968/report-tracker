import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Search, Filter, Eye, RefreshCw, ChevronLeft, ChevronRight, 
  Download, FileSpreadsheet, FileText, CheckCircle2, AlertTriangle, 
  SlidersHorizontal, CheckCircle, RefreshCcw, Loader2
} from "lucide-react";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

function AssignedCases() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  // URL status/report check
  const statusParam = searchParams.get("status") || "";
  const showReportParam = searchParams.get("report") === "true";

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(statusParam);
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [limit, setLimit] = useState(10);

  // PDF generation loader
  const [exportingPDF, setExportingPDF] = useState(false);

  // Sync state with URL change
  useEffect(() => {
    setSelectedStatus(statusParam);
  }, [statusParam]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit,
        search: searchTerm,
        status: selectedStatus,
        priority: selectedPriority,
        category: selectedCategory,
      });

      const response = await api.get(`/officer/cases?${queryParams.toString()}`);
      setCases(response.data.cases || []);
      setTotalCount(response.data.totalCount || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching assigned cases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [currentPage, selectedStatus, selectedPriority, selectedCategory, limit]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCases();
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedPriority("");
    setSelectedCategory("");
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleQuickStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/officer/case/${id}/status`, { status: newStatus });
      fetchCases();
    } catch (err) {
      console.error("Failed to update status quick-action", err);
      alert("Failed to update status. Check backend connection.");
    }
  };

  // Excel Export
  const exportToExcel = () => {
    if (cases.length === 0) return;
    const excelData = cases.map(c => ({
      "Complaint ID": c.complaintId,
      "Title": c.title,
      "Category": c.category,
      "Priority": c.priority,
      "Status": c.status,
      "Incident Date": c.incidentDate,
      "Date Assigned": new Date(c.createdAt || c.updatedAt).toLocaleDateString(),
      "Citizen Name": c.user?.name || "Anonymous",
      "Citizen Phone": c.user?.phone || "N/A"
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assigned Cases");
    
    // Auto-adjust columns widths
    const maxLens = Object.keys(excelData[0]).map(key => 
      Math.max(key.length, ...excelData.map(item => String(item[key] ?? "").length))
    );
    worksheet["!cols"] = maxLens.map(len => ({ wch: len + 3 }));

    XLSX.writeFile(workbook, `assigned_cases_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // PDF Export of Report Summary card
  const exportToPDF = async () => {
    const reportElement = document.getElementById("pdf-report-template");
    if (!reportElement) return;

    try {
      setExportingPDF(true);
      // Temporarily reveal the print frame
      reportElement.style.display = "block";

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0a0a12"
      });

      // Hide printing frame
      reportElement.style.display = "none";

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`investigation_summary_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Error printing PDF report.");
    } finally {
      setExportingPDF(false);
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

  return (
    <div style={{ width: "100%" }}>
      {/* Report Section Header */}
      {showReportParam && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          style={{ 
            background: "rgba(0, 240, 255, 0.03)", 
            border: "1px solid rgba(0, 240, 255, 0.15)",
            padding: "20px",
            borderRadius: "var(--radius-md)",
            marginBottom: "25px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", color: "var(--accent)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Download size={18} /> Export Reports Engine
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                Generate secure Excel spreadsheets or cryptographic PDF documents of your caseload.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                onClick={exportToExcel} 
                disabled={cases.length === 0}
                style={{ 
                  background: "rgba(16, 185, 129, 0.1)", 
                  border: "1px solid rgba(16, 185, 129, 0.3)", 
                  color: "#10b981",
                  padding: "8px 16px",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <FileSpreadsheet size={16} /> Excel Report
              </button>
              <button 
                onClick={exportToPDF} 
                disabled={cases.length === 0 || exportingPDF}
                style={{ 
                  background: "rgba(139, 92, 246, 0.1)", 
                  border: "1px solid rgba(139, 92, 246, 0.3)", 
                  color: "var(--primary)",
                  padding: "8px 16px",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                {exportingPDF ? (
                  <>
                    <Loader2 size={16} className="spin-animation" style={{ animation: "spin 1s linear infinite" }} />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText size={16} /> PDF Overview
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search & Filters Glass Container */}
      <div style={{
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--radius-md)",
        padding: "20px",
        marginBottom: "25px",
        boxShadow: "var(--shadow-sm)"
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search Input */}
          <div style={{ position: "relative", flexGrow: 1, minWidth: "240px" }}>
            <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by Complaint ID or Title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: "42px", height: "45px" }}
            />
          </div>

          {/* Status Dropdown */}
          <div style={{ minWidth: "140px" }}>
            <select 
              value={selectedStatus} 
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              style={{ height: "45px" }}
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Priority Dropdown */}
          <div style={{ minWidth: "130px" }}>
            <select 
              value={selectedPriority} 
              onChange={(e) => { setSelectedPriority(e.target.value); setCurrentPage(1); }}
              style={{ height: "45px" }}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {/* Category Dropdown */}
          <div style={{ minWidth: "150px" }}>
            <select 
              value={selectedCategory} 
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              style={{ height: "45px" }}
            >
              <option value="">All Categories</option>
              <option value="Phishing">Phishing</option>
              <option value="Online Fraud">Online Fraud</option>
              <option value="Identity Theft">Identity Theft</option>
              <option value="Social Media Crime">Social Media Crime</option>
              <option value="Cyber Bullying">Cyber Bullying</option>
              <option value="Financial Fraud">Financial Fraud</option>
            </select>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              type="submit" 
              style={{ 
                width: "auto", 
                margin: 0, 
                height: "45px", 
                padding: "0 20px", 
                background: "var(--primary)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <Filter size={16} /> Filter
            </button>
            <button 
              type="button" 
              onClick={resetFilters}
              style={{ 
                width: "auto", 
                margin: 0, 
                height: "45px", 
                padding: "0 16px", 
                background: "rgba(255, 255, 255, 0.03)", 
                color: "var(--text-secondary)",
                border: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <RefreshCcw size={14} /> Clear
            </button>
          </div>
        </form>
      </div>

      {/* Main Case List Table */}
      {loading ? (
        <div style={{
          textAlign: "center",
          padding: "80px 50px",
          background: "var(--glass-bg)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--glass-border)",
          color: "var(--text-secondary)"
        }}>
          <Loader2 size={36} className="spin-animation" style={{ animation: "spin 1s linear infinite", color: "var(--accent)", marginBottom: "15px", display: "inline-block" }} />
          <p>Retrieving secure incident data...</p>
        </div>
      ) : cases.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "80px 50px",
          background: "var(--glass-bg)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--glass-border)",
          color: "var(--text-secondary)"
        }}>
          <SlidersHorizontal size={36} color="var(--text-muted)" style={{ marginBottom: "15px", opacity: 0.5, display: "inline-block" }} />
          <p>No complaints match the filter parameters.</p>
        </div>
      ) : (
        <>
          <div className="complaint-table-container">
            <table className="complaint-table">
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date Assigned</th>
                  <th style={{ textAlign: "center" }}>Quick Update</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: "700", color: "var(--accent)" }}>{c.complaintId}</td>
                    <td style={{ fontWeight: "500", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</td>
                    <td>{c.category}</td>
                    <td>
                      <span style={{ 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: "6px", 
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        color: getPriorityColor(c.priority)
                      }}>
                        <AlertTriangle size={12} /> {c.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(c.status)}`}>
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>{new Date(c.createdAt || c.incidentDate).toLocaleDateString()}</td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <select 
                          value={c.status}
                          onChange={(e) => handleQuickStatusUpdate(c.id, e.target.value)}
                          style={{ 
                            padding: "4px 8px", 
                            fontSize: "0.75rem", 
                            width: "120px", 
                            height: "28px",
                            background: "rgba(3,3,7,0.8)",
                            borderColor: "var(--border-color)",
                            borderRadius: "4px"
                          }}
                        >
                          <option value="SUBMITTED">Submitted</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="INVESTIGATING">Investigating</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                        <button 
                          onClick={() => handleQuickStatusUpdate(c.id, "RESOLVED")}
                          disabled={c.status === "RESOLVED"}
                          style={{
                            width: "auto",
                            margin: 0,
                            padding: "0 8px",
                            height: "28px",
                            background: "rgba(16, 185, 129, 0.12)",
                            color: "var(--success)",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                          title="Quick Resolve Case"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/officer/case/${c.id}`)}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "var(--primary)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontWeight: "600",
                          fontSize: "0.9rem",
                          transition: "var(--transition)"
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = "var(--accent)"}
                        onMouseOut={(e) => e.currentTarget.style.color = "var(--primary)"}
                      >
                        <Eye size={16} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "20px",
            background: "var(--glass-bg)",
            padding: "15px 24px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--glass-border)",
            fontSize: "0.9rem",
            color: "var(--text-secondary)"
          }}>
            <div>
              Showing <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{((currentPage - 1) * limit) + 1}</span> to <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{Math.min(currentPage * limit, totalCount)}</span> of <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{totalCount}</span> cases
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                style={{
                  width: "auto",
                  margin: 0,
                  padding: "8px 12px",
                  background: "transparent",
                  border: "1px solid var(--border-color)",
                  color: currentPage === 1 ? "var(--text-muted)" : "var(--text-primary)",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  borderRadius: "6px"
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: "0.85rem" }}>Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                style={{
                  width: "auto",
                  margin: 0,
                  padding: "8px 12px",
                  background: "transparent",
                  border: "1px solid var(--border-color)",
                  color: currentPage === totalPages ? "var(--text-muted)" : "var(--text-primary)",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  borderRadius: "6px"
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* PDF PRINT TEMPLATE CARD (Hidden by default, styled for export canvas capture) */}
      <div 
        id="pdf-report-template" 
        style={{
          display: "none",
          width: "800px",
          padding: "45px",
          background: "#0a0a12",
          border: "2px solid #00f0ff",
          fontFamily: "'Inter', sans-serif"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid rgba(0, 240, 255, 0.2)", paddingBottom: "20px", marginBottom: "30px" }}>
          <div>
            <h1 style={{ color: "#ffffff", fontSize: "1.8rem", fontWeight: "700", letterSpacing: "1px" }}>SENTINEL INVESTIGATION OFFICE</h1>
            <p style={{ color: "#00f0ff", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "2px", marginTop: "5px" }}>Caseload Audit & Investigation Dossier</p>
          </div>
          <div style={{ textAlign: "right", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            <p>Report ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            <p style={{ marginTop: "4px" }}>Date Generated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div style={{ marginBottom: "35px" }}>
          <h2 style={{ color: "#ffffff", fontSize: "1.2rem", marginBottom: "15px" }}>1. Officer Assignment Profile</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#94a3b8" }}>
            <tbody>
              <tr>
                <td style={{ padding: "8px 0", fontWeight: "600", width: "150px" }}>Investigating Officer:</td>
                <td style={{ padding: "8px 0", color: "#ffffff" }}>{user?.name}</td>
                <td style={{ padding: "8px 0", fontWeight: "600", width: "150px" }}>Officer Email:</td>
                <td style={{ padding: "8px 0", color: "#ffffff" }}>{user?.email}</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0", fontWeight: "600" }}>Assigned Cases Count:</td>
                <td style={{ padding: "8px 0", color: "#ffffff" }}>{totalCount} Active Reports</td>
                <td style={{ padding: "8px 0", fontWeight: "600" }}>System clearance:</td>
                <td style={{ padding: "8px 0", color: "#00f0ff", fontWeight: "700" }}>LEVEL 3 / SECURITY OFFICER</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2 style={{ color: "#ffffff", fontSize: "1.2rem", marginBottom: "15px" }}>2. Assigned Crime Incidents Listing</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#94a3b8", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "rgba(139, 92, 246, 0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <th style={{ padding: "10px", textAlign: "left", color: "#ffffff" }}>Complaint ID</th>
                <th style={{ padding: "10px", textAlign: "left", color: "#ffffff" }}>Title</th>
                <th style={{ padding: "10px", textAlign: "left", color: "#ffffff" }}>Category</th>
                <th style={{ padding: "10px", textAlign: "left", color: "#ffffff" }}>Priority</th>
                <th style={{ padding: "10px", textAlign: "left", color: "#ffffff" }}>Status</th>
                <th style={{ padding: "10px", textAlign: "left", color: "#ffffff" }}>Date Filed</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "10px", fontWeight: "700", color: "#00f0ff" }}>{c.complaintId}</td>
                  <td style={{ padding: "10px", color: "#ffffff" }}>{c.title}</td>
                  <td style={{ padding: "10px" }}>{c.category}</td>
                  <td style={{ padding: "10px", color: getPriorityColor(c.priority), fontWeight: "700" }}>{c.priority}</td>
                  <td style={{ padding: "10px", color: c.status === "RESOLVED" ? "#10b981" : "#f59e0b" }}>{c.status}</td>
                  <td style={{ padding: "10px" }}>{new Date(c.createdAt || c.incidentDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "60px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px", display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          <p>CONFIDENTIAL DOC — FOR INTERNAL SECURITY OFFICE USE ONLY</p>
          <p>SENTINEL INTEL CRYPTO-LOG v2.4</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          display: inline-block;
        }
      `}} />
    </div>
  );
}

export default AssignedCases;
