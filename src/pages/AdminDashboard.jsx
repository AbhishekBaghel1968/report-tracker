import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, FileText, AlertCircle, CheckCircle, ShieldAlert, BarChart3, 
  Download, RefreshCw, LogOut, ChevronRight, Activity, Calendar, Play, Pause, Loader2 
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

// Modular Sub-components
import AdminSearchFilters from "../components/AdminSearchFilters";
import AdminAnalyticsCharts from "../components/AdminAnalyticsCharts";
import AdminComplaintsTable from "../components/AdminComplaintsTable";
import GeoHeatmap from "../components/GeoHeatmap";

const CATEGORIES = ["Phishing", "Online Fraud", "Identity Theft", "Social Media Crime", "Cyber Bullying", "Financial Fraud"];
const STATUSES = ["SUBMITTED", "UNDER_REVIEW", "INVESTIGATING", "RESOLVED", "REJECTED"];

function AdminDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Advanced Analytics states
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [hotspotData, setHotspotData] = useState([]);
  const [geoData, setGeoData] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [downloadingReportId, setDownloadingReportId] = useState(null);

  const handleDownloadPDF = async (complaintId) => {
    setDownloadingReportId(complaintId);
    try {
      const response = await api.get(`/reports/${complaintId}/pdf`, {
        responseType: "blob"
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${complaintId}-report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading PDF report", err);
      alert("Failed to download PDF report. Ensure you have proper authorization.");
    } finally {
      setDownloadingReportId(null);
    }
  };

  // Filters & Controls
  const [dateFilter, setDateFilter] = useState("1y");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filters, setFilters] = useState({
    complaintId: "",
    userName: "",
    status: "",
    category: "",
    startDate: "",
    endDate: ""
  });

  // Fetch Stats & Charts Analytics
  const fetchStatsAndAnalytics = useCallback(async (filterVal = dateFilter, isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const queryParams = new URLSearchParams({
        filter: filterVal,
        category: filters.category || "",
        status: filters.status || "",
        startDate: filters.startDate || "",
        endDate: filters.endDate || ""
      }).toString();

      const [
        statsRes,
        monthlyRes,
        categoryRes,
        statusRes,
        heatmapRes,
        hotspotRes,
        geoRes
      ] = await Promise.all([
        api.get("/admin/stats"),
        api.get(`/analytics/monthly?filter=${filterVal}`),
        api.get(`/analytics/category?filter=${filterVal}`),
        api.get(`/analytics/status?filter=${filterVal}`),
        api.get(`/analytics/heatmap?filter=${filterVal}`),
        api.get(`/analytics/hotspots?filter=${filterVal}`),
        api.get(`/admin/geo-analytics?${queryParams}`)
      ]);

      setStats(statsRes.data);
      setMonthlyData(monthlyRes.data);
      setCategoryData(categoryRes.data);
      setStatusData(statusRes.data);
      setHeatmapData(heatmapRes.data);
      setHotspotData(hotspotRes.data);
      setGeoData(geoRes.data);
    } catch (err) {
      console.error("Failed to load SOC analytics logs", err);
    } finally {
      setRefreshing(false);
    }
  }, [dateFilter, filters]);

  // Fetch core static registries
  const fetchRegistries = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, officersRes] = await Promise.all([
        api.get("/complaints"),
        api.get("/admin/officers")
      ]);
      setComplaints(listRes.data);
      setOfficers(officersRes.data);
    } catch (err) {
      console.error("Failed to load registrations or officer rosters", err);
      setError("Forbidden access or server connection error.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch static registries on mount
  useEffect(() => {
    fetchRegistries();
  }, [fetchRegistries]);

  // Fetch stats and analytics when filters or dateFilter changes
  useEffect(() => {
    fetchStatsAndAnalytics(dateFilter, false);
  }, [dateFilter, fetchStatsAndAnalytics]);

  // Real-time synchronization using Socket.IO
  useEffect(() => {
    if (!socket) return;

    socket.on("complaint_submitted", (newComplaint) => {
      setComplaints((prev) => [newComplaint, ...prev]);
      fetchStatsAndAnalytics(dateFilter, true);
    });

    socket.on("complaint_updated", (updatedComplaint) => {
      setComplaints((prev) => prev.map((c) => (c.id === updatedComplaint.id ? updatedComplaint : c)));
      if (selectedComplaint && selectedComplaint.id === updatedComplaint.id) {
        setSelectedComplaint(updatedComplaint);
      }
      fetchStatsAndAnalytics(dateFilter, true);
    });

    socket.on("complaint_deleted", ({ id }) => {
      setComplaints((prev) => prev.filter((c) => c.id !== id));
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint(null);
      }
      fetchStatsAndAnalytics(dateFilter, true);
    });

    return () => {
      socket.off("complaint_submitted");
      socket.off("complaint_updated");
      socket.off("complaint_deleted");
    };
  }, [socket, dateFilter, fetchStatsAndAnalytics, selectedComplaint]);

  // Fallback Polling interval (10 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchStatsAndAnalytics(dateFilter, true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, dateFilter, fetchStatsAndAnalytics]);

  // Update complaint status
  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/complaints/${id}`, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update case status.");
    }
  };

  // Resolve complaint (direct resolution)
  const handleResolve = async (id) => {
    await handleStatusChange(id, "RESOLVED");
  };

  // Delete complaint
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this incident record from SOC logs?")) {
      return;
    }
    try {
      await api.delete(`/complaints/${id}`);
    } catch (err) {
      console.error("Failed to delete complaint", err);
      alert("Failed to delete complaint record.");
    }
  };

  // Assign complaint to officer
  const handleAssign = async (id, officerId) => {
    try {
      await api.put(`/admin/complaints/${id}/assign`, { officerId });
    } catch (err) {
      console.error("Failed to assign officer", err);
      alert("Failed to assign case officer.");
    }
  };

  // Filters Handler
  const handleFilterChange = useCallback((key, value) => {
    if (key === "reset") {
      setFilters({
        complaintId: "",
        userName: "",
        status: "",
        category: "",
        startDate: "",
        endDate: ""
      });
    } else {
      setFilters(prev => {
        if (prev[key] === value) return prev;
        return { ...prev, [key]: value };
      });
    }
  }, []);

  // Filter complaints client-side based on filter settings
  const filteredComplaints = complaints.filter(c => {
    const matchesId = !filters.complaintId || c.complaintId.toLowerCase().includes(filters.complaintId.toLowerCase());
    const matchesUser = !filters.userName || (c.user?.name && c.user.name.toLowerCase().includes(filters.userName.toLowerCase()));
    const matchesStatus = !filters.status || c.status === filters.status;
    const matchesCategory = !filters.category || c.category === filters.category;
    
    let matchesDate = true;
    if (filters.startDate) {
      matchesDate = matchesDate && new Date(c.createdAt) >= new Date(filters.startDate + "T00:00:00");
    }
    if (filters.endDate) {
      matchesDate = matchesDate && new Date(c.createdAt) <= new Date(filters.endDate + "T23:59:59");
    }

    return matchesId && matchesUser && matchesStatus && matchesCategory && matchesDate;
  });

  // Export to PDF
  const handleExportPDF = async () => {
    const element = document.getElementById("soc-dashboard-visualizer");
    if (!element) return;
    try {
      // Temporarily hide filter inputs and action buttons in captured canvas image
      const controlElements = document.querySelectorAll(".no-print");
      controlElements.forEach(el => el.style.display = "none");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#030307"
      });

      controlElements.forEach(el => el.style.display = "flex");

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

      pdf.save("sentinel-soc-dashboard-snapshot.pdf");
    } catch (err) {
      console.error("Failed to generate PDF report", err);
      alert("Error generating PDF. Please verify and try again.");
    }
  };

  // Export to Excel sheet
  const handleExportExcel = () => {
    const sheetData = filteredComplaints.map(c => ({
      "Tracking ID": c.complaintId,
      "Reporter Name": c.user?.name || "Citizen",
      "Reporter Email": c.user?.email || "N/A",
      "Reporter Phone": c.user?.phone || "N/A",
      "Category": c.category,
      "Priority": c.priority,
      "Assigned Officer": c.officer?.name || "Unassigned",
      "Status": c.status.replace("_", " "),
      "Incident Date": c.incidentDate,
      "Location": c.location || "Delhi",
      "Date Filed": new Date(c.createdAt).toLocaleDateString(),
      "Description": c.description || ""
    }));

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SOC Complaint Logs");
    XLSX.writeFile(wb, "sentinel-soc-complaints-registry.xlsx");
  };

  if (loading) {
    return (
      <div style={{
        textAlign: "center",
        padding: "80px 40px",
        background: "var(--glass-bg)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--glass-border)",
        color: "var(--text-secondary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "15px"
      }}>
        <Loader2 size={36} className="spin-animation" style={{ animation: "spin 1s linear infinite", color: "var(--accent)" }} />
        <span>Initializing Security Operations Center (SOC) Terminal...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <h2 style={{ color: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          <ShieldAlert size={28} /> Access Denied
        </h2>
        <p style={{ marginTop: "15px", color: "var(--text-secondary)" }}>{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ width: "100%" }}
      id="soc-dashboard-visualizer"
    >
      {/* Analytics controls bar */}
      <div className="no-print" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "25px",
        flexWrap: "wrap",
        gap: "15px",
        background: "rgba(3, 3, 7, 0.6)",
        padding: "14px 20px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--glass-border)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
      }}>
        
        {/* Date Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Calendar size={16} color="var(--text-secondary)" />
          <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>Audit Window:</span>
          <div style={{ display: "flex", gap: "6px" }}>
            {[
              { label: "7D", value: "7d" },
              { label: "30D", value: "30d" },
              { label: "1Y", value: "1y" }
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setDateFilter(btn.value)}
                style={{
                  border: "none",
                  padding: "5px 12px",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  background: dateFilter === btn.value ? "var(--primary-light)" : "transparent",
                  color: dateFilter === btn.value ? "var(--primary)" : "var(--text-secondary)",
                  border: dateFilter === btn.value ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid transparent",
                  transition: "var(--transition)"
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Global Controls & Exporters */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              border: "none",
              padding: "7px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.75rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: autoRefresh ? "rgba(16, 185, 129, 0.08)" : "rgba(255, 255, 255, 0.02)",
              color: autoRefresh ? "var(--success)" : "var(--text-secondary)",
              border: autoRefresh ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid var(--border-color)",
              transition: "var(--transition)"
            }}
          >
            {autoRefresh ? (
              <>
                <span style={{
                  width: "6px",
                  height: "6px",
                  background: "var(--success)",
                  borderRadius: "50%",
                  display: "inline-block",
                  boxShadow: "0 0 6px var(--success)"
                }} />
                Real-Time Sync ON
              </>
            ) : (
              <>
                <Pause size={10} />
                Real-Time Sync OFF
              </>
            )}
          </button>

          {/* Manual Refresh Indicator */}
          <button
            onClick={() => {
              fetchRegistries();
              fetchStatsAndAnalytics(dateFilter);
            }}
            disabled={refreshing}
            style={{
              border: "none",
              padding: "7px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.75rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 255, 255, 0.02)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
              transition: "var(--transition)"
            }}
          >
            <RefreshCw size={10} className={refreshing ? "spin-animation" : ""} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            <span>Sync</span>
          </button>

          {/* PDF Report Export */}
          <button
            onClick={handleExportPDF}
            style={{
              border: "none",
              padding: "7px 12px",
              borderRadius: "var(--radius-sm)",
              background: "var(--primary)",
              color: "#ffffff",
              fontSize: "0.75rem",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 10px var(--primary-glow)",
              transition: "var(--transition)"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "var(--primary-hover)"}
            onMouseOut={(e) => e.currentTarget.style.background = "var(--primary)"}
          >
            <Download size={12} />
            <span>Export PDF</span>
          </button>

          {/* Excel Registry Export */}
          <button
            onClick={handleExportExcel}
            style={{
              border: "none",
              padding: "7px 12px",
              borderRadius: "var(--radius-sm)",
              background: "var(--success)",
              color: "#ffffff",
              fontSize: "0.75rem",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 10px rgba(16, 185, 129, 0.2)",
              transition: "var(--transition)"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "var(--success-hover)"}
            onMouseOut={(e) => e.currentTarget.style.background = "var(--success)"}
          >
            <Download size={12} />
            <span>Export Excel</span>
          </button>

        </div>
      </div>

      {/* Analytical Cards */}
      <div className="stats-container" style={{ marginBottom: "30px" }}>
        
        {/* Total Users */}
        <div 
          className="stat-card clickable-card" 
          onClick={() => navigate("/admin/users")}
          style={{ cursor: "pointer" }}
        >
          <div className="stat-card-icon" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
            <Users size={24} />
          </div>
          <div className="stat-card-info">
            <h2>{stats?.totalUsers || 0}</h2>
            <p>Active Users</p>
          </div>
        </div>

        {/* Total Cases */}
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
            <FileText size={24} />
          </div>
          <div className="stat-card-info">
            <h2>{stats?.totalCases || 0}</h2>
            <p>Reported Incidents</p>
          </div>
        </div>

        {/* Pending Action */}
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "var(--warning-light)", color: "var(--warning)" }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-card-info">
            <h2>{stats?.pendingCases || 0}</h2>
            <p>Pending Audits</p>
          </div>
        </div>

        {/* Resolved Cases */}
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "var(--success-light)", color: "var(--success)" }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-card-info">
            <h2>{stats?.resolvedCases || 0}</h2>
            <p>Resolved Audits</p>
          </div>
        </div>
      </div>

      {/* Analytical Visual Charts Section */}
      <AdminAnalyticsCharts 
        monthlyData={monthlyData}
        categoryData={categoryData}
        statusData={statusData}
        heatmapData={heatmapData}
        hotspotData={hotspotData}
      />

      {/* Geospatial Heatmap Density Section */}
      <GeoHeatmap geoData={geoData} />

      {/* Search and Filters Section */}
      <div className="no-print">
        <AdminSearchFilters 
          onFilterChange={handleFilterChange}
          currentFilters={filters}
          categories={CATEGORIES}
          statuses={STATUSES}
        />
      </div>

      {/* Main Table and Details Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        
        {/* Table component */}
        <AdminComplaintsTable 
          complaints={filteredComplaints}
          officers={officers}
          onView={setSelectedComplaint}
          onResolve={handleResolve}
          onDelete={handleDelete}
          onAssign={handleAssign}
          currentUser={user}
          onDownloadPDF={handleDownloadPDF}
          downloadingReportId={downloadingReportId}
        />

        {/* Detailed audit viewer slide-out */}
        <AnimatePresence>
          {selectedComplaint && (
            <motion.div 
              className="audit-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <span style={{ 
                    fontSize: "0.8rem", 
                    fontWeight: "700", 
                    color: "var(--accent)", 
                    background: "var(--accent-light)", 
                    border: "1px solid rgba(0, 240, 255, 0.2)",
                    padding: "4px 12px", 
                    borderRadius: "100px" 
                  }}>
                    AUDIT CORE: {selectedComplaint.complaintId}
                  </span>
                  <h3 style={{ marginTop: "12px", fontSize: "1.4rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    {selectedComplaint.title}
                  </h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                    Submitting Authority: <strong>{selectedComplaint.user?.name}</strong> ({selectedComplaint.user?.email} | {selectedComplaint.user?.phone})
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => handleDownloadPDF(selectedComplaint.complaintId)}
                    disabled={downloadingReportId === selectedComplaint.complaintId}
                    style={{
                      padding: "8px 16px",
                      background: "var(--primary)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      fontWeight: "600",
                      width: "auto",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 4px 10px var(--primary-glow)",
                      transition: "var(--transition)"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "var(--primary-hover)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "var(--primary)"}
                  >
                    <Download size={14} color="#ffffff" />
                    <span>{downloadingReportId === selectedComplaint.complaintId ? "Exporting..." : "Download Report"}</span>
                  </button>
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    style={{
                      padding: "8px 16px",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      fontWeight: "600",
                      width: "auto"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
                  >
                    Close Audit View
                  </button>
                </div>
              </div>

              <hr style={{ border: 0, height: "1px", background: "var(--border-color)", margin: "25px 0" }} />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px", marginBottom: "25px" }}>
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Logged Incident Date</p>
                  <p style={{ fontWeight: "700", marginTop: "4px" }}>{new Date(selectedComplaint.incidentDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Priority Level</p>
                  <p style={{
                    fontWeight: "700",
                    color: selectedComplaint.priority === "HIGH" ? "var(--danger)" : selectedComplaint.priority === "MEDIUM" ? "var(--warning)" : "var(--success)",
                    marginTop: "4px"
                  }}>{selectedComplaint.priority}</p>
                </div>
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Location Vector</p>
                  <p style={{ fontWeight: "700", marginTop: "4px" }}>{selectedComplaint.location || "Delhi"}</p>
                </div>
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Case Officer Assigned</p>
                  <p style={{ fontWeight: "700", marginTop: "4px", color: selectedComplaint.officer?.name ? "var(--primary)" : "var(--text-muted)" }}>
                    {selectedComplaint.officer?.name || "Unassigned"}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: "25px" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px" }}>Statement logs</p>
                <div style={{ 
                  background: "rgba(3, 3, 7, 0.4)", 
                  padding: "20px", 
                  borderRadius: "var(--radius-md)", 
                  border: "1px solid var(--border-color)", 
                  whiteSpace: "pre-wrap", 
                  lineHeight: "1.6",
                  fontSize: "0.95rem"
                }}>
                  {selectedComplaint.description}
                </div>
              </div>

              {selectedComplaint.evidenceFiles && selectedComplaint.evidenceFiles.length > 0 ? (
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "12px" }}>Evidence Uploads</p>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {selectedComplaint.evidenceFiles.map((file) => (
                      <a
                        key={file.id}
                        href={`http://localhost:8080/api/files/${file.filePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="evidence-download-chip"
                      >
                        <Download size={14} color="var(--primary)" />
                        <span>{file.fileName}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No files uploaded with this complaint.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Global CSS inject for anims */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          display: inline-block;
        }
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 25px;
          margin-bottom: 40px;
        }
        @media (max-width: 1024px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }
        }
        .analytics-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: 24px;
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
        }
        .analytics-card:hover {
          border-color: rgba(0, 240, 255, 0.35);
          background: var(--glass-bg-hover);
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(0, 240, 255, 0.08), var(--shadow-md);
        }
        
        /* Shake keyframes for active notification bell */
        @keyframes shake {
          0% { transform: rotate(0); }
          15% { transform: rotate(10deg); }
          30% { transform: rotate(-10deg); }
          45% { transform: rotate(5deg); }
          60% { transform: rotate(-5deg); }
          75% { transform: rotate(2deg); }
          85% { transform: rotate(-2deg); }
          100% { transform: rotate(0); }
        }
        .shake-animation {
          animation: shake 0.6s ease-in-out infinite alternate;
        }
      `}} />
    </motion.div>
  );
}

export default AdminDashboard;
