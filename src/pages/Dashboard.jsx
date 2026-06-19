import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, Search, User, Eye, Shield, AlertCircle, CheckCircle, 
  BarChart3, RefreshCw, Calendar, Download, AlertTriangle, Play, Pause, Loader2 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { motion } from "framer-motion";
import ComplaintChart from "../components/ComplaintChart";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar 
} from "recharts";

// Default/Example datasets to render as visual samples or when DB is empty
const defaultMonthlyData = [
  { month: "Jan", count: 12 },
  { month: "Feb", count: 15 },
  { month: "Mar", count: 18 },
  { month: "Apr", count: 20 },
  { month: "May", count: 11 },
  { month: "Jun", count: 24 }
];

const defaultCategoryData = [
  { name: "Phishing", value: 12 },
  { name: "Online Fraud", value: 8 },
  { name: "Identity Theft", value: 5 },
  { name: "Social Media Crime", value: 9 },
  { name: "Cyber Bullying", value: 3 },
  { name: "Financial Fraud", value: 7 }
];

const defaultStatusData = [
  { status: "Submitted", count: 12 },
  { status: "Under Review", count: 8 },
  { status: "Investigating", count: 6 },
  { status: "Resolved", count: 25 },
  { status: "Rejected", count: 3 }
];

// Curated dark-theme matching colors for Pie Chart Categories
const CATEGORY_COLORS = {
  "Phishing": "#8b5cf6",         // Violet
  "Online Fraud": "#00f0ff",     // Cyan
  "Identity Theft": "#f43f5e",    // Rose
  "Social Media Crime": "#f59e0b", // Amber
  "Cyber Bullying": "#10b981",    // Emerald
  "Financial Fraud": "#ec4899"    // Pink
};

const DEFAULT_COLORS = ["#8b5cf6", "#00f0ff", "#f43f5e", "#f59e0b", "#10b981", "#ec4899"];

// Status color scheme required by standard status dashboard rules
const STATUS_COLORS = {
  "Resolved": "var(--success)",     // Green
  "Rejected": "var(--danger)",       // Red
  "Under Review": "var(--warning)",  // Yellow (Under Review / Review)
  "Submitted": "#2563eb",            // Blue
  "Investigating": "var(--accent)"   // Cyan (Investigating)
};

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  // Analytics states
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [dateFilter, setDateFilter] = useState("1y");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchAnalytics = async (filterVal = dateFilter) => {
    if (user?.role !== "ROLE_ADMIN") return;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const [monthlyRes, categoryRes, statusRes] = await Promise.all([
        api.get(`/analytics/monthly?filter=${filterVal}`),
        api.get(`/analytics/category?filter=${filterVal}`),
        api.get(`/analytics/status?filter=${filterVal}`)
      ]);
      setMonthlyData(monthlyRes.data);
      setCategoryData(categoryRes.data);
      setStatusData(statusRes.data);
    } catch (err) {
      console.error("Failed to load analytics", err);
      setAnalyticsError("Could not retrieve secure analytics logs. Please verify connection.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ROLE_ADMIN") {
      fetchAnalytics(dateFilter);
    }
  }, [dateFilter, user]);

  useEffect(() => {
    if (!autoRefresh || user?.role !== "ROLE_ADMIN") return;
    const interval = setInterval(() => {
      fetchAnalytics(dateFilter);
    }, 30000); // 30 seconds auto-refresh
    return () => clearInterval(interval);
  }, [autoRefresh, dateFilter, user]);

  const handleExportPDF = async () => {
    const element = document.getElementById("analytics-dashboard-section");
    if (!element) return;
    try {
      // Temporarily hide action controls in captured image
      const controls = element.querySelector(".analytics-controls");
      if (controls) controls.style.display = "none";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#030307"
      });

      if (controls) controls.style.display = "flex";

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

      pdf.save("sentinel-analytics-report.pdf");
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Error generating PDF report. Please try again.");
    }
  };

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await api.get("/complaints/user");
        const list = response.data;
        setComplaints(list);

        // Calculate stats
        const total = list.length;
        const resolved = list.filter((c) => c.status === "RESOLVED").length;
        const pending = list.filter((c) => c.status !== "RESOLVED" && c.status !== "REJECTED").length;

        setStats({ total, pending, resolved });
      } catch (err) {
        console.error("Error fetching complaints", err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 80, damping: 14 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ width: "100%" }}
    >
      <motion.div variants={itemVariants} style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: "700", color: "var(--text-primary)" }}>
          Welcome back, {user?.name || "Citizen"}
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "4px" }}>
          Monitor security audit status and submit complaints safely.
        </p>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div className="stats-container" variants={itemVariants}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
            <Shield size={24} />
          </div>
          <div className="stat-card-info">
            <h2>{stats.total}</h2>
            <p>Total Filed</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "var(--warning-light)", color: "var(--warning)" }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-card-info">
            <h2>{stats.pending}</h2>
            <p>Under Audit</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "var(--success-light)", color: "var(--success)" }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-card-info">
            <h2>{stats.resolved}</h2>
            <p>Cases Resolved</p>
          </div>
        </div>
      </motion.div>

      {/* Analytics Dashboard Section (Admin-only) */}
      {user?.role === "ROLE_ADMIN" && (
        <motion.div 
          id="analytics-dashboard-section"
          variants={itemVariants} 
          style={{ 
            marginTop: "30px", 
            marginBottom: "50px", 
            background: "rgba(10, 10, 18, 0.4)",
            padding: "24px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-color)"
          }}
        >
          {/* Section Header */}
          <div className="analytics-header" style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1.4rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px", color: "var(--text-primary)" }}>
              <BarChart3 size={22} color="var(--accent)" style={{ filter: "drop-shadow(0 0 6px var(--accent-glow))" }} />
              SOC Analytics Control Center
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "4px" }}>
              Real-time monitoring of security incident rates, categorization vectors, and resolution statuses.
            </p>
          </div>

          {/* Controls Panel */}
          <div className="analytics-controls" style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "15px",
            background: "rgba(3, 3, 7, 0.6)",
            padding: "12px 18px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--glass-border)"
          }}>
            {/* Left Controls: Date Filters */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Calendar size={16} color="var(--text-secondary)" />
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>Range:</span>
              <div style={{ display: "flex", gap: "6px" }}>
                {[
                  { label: "7 Days", value: "7d" },
                  { label: "30 Days", value: "30d" },
                  { label: "Year", value: "1y" }
                ].map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => setDateFilter(btn.value)}
                    style={{
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
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

            {/* Right Controls: Refresh & PDF Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              {/* Auto Refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                style={{
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: autoRefresh ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.03)",
                  color: autoRefresh ? "var(--success)" : "var(--text-secondary)",
                  border: autoRefresh ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid var(--border-color)",
                  transition: "var(--transition)"
                }}
              >
                {autoRefresh ? (
                  <>
                    <span className="pulse-indicator" style={{
                      width: "8px",
                      height: "8px",
                      background: "var(--success)",
                      borderRadius: "50%",
                      display: "inline-block",
                      boxShadow: "0 0 8px var(--success)"
                    }} />
                    Auto Refresh: ON (30s)
                  </>
                ) : (
                  <>
                    <Pause size={12} />
                    Auto Refresh: OFF
                  </>
                )}
              </button>

              {/* Manual Refresh Button */}
              <button
                onClick={() => fetchAnalytics(dateFilter)}
                disabled={analyticsLoading}
                style={{
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255, 255, 255, 0.03)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                  transition: "var(--transition)"
                }}
              >
                <RefreshCw size={12} className={analyticsLoading ? "spin-animation" : ""} style={{ animation: analyticsLoading ? "spin 1s linear infinite" : "none" }} />
                Refresh
              </button>

              {/* PDF Export Button */}
              <button
                onClick={handleExportPDF}
                style={{
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--primary)",
                  color: "#ffffff",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px var(--primary-glow)",
                  transition: "var(--transition)"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "var(--primary-hover)";
                  e.currentTarget.style.boxShadow = "0 6px 16px var(--primary-glow)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "var(--primary)";
                  e.currentTarget.style.boxShadow = "0 4px 12px var(--primary-glow)";
                }}
              >
                <Download size={12} />
                Export PDF
              </button>
            </div>
          </div>

          {/* Charts Display Area */}
          {analyticsError ? (
            <div className="analytics-card" style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px",
              textAlign: "center",
              borderColor: "var(--danger)"
            }}>
              <AlertTriangle size={36} color="var(--danger)" style={{ marginBottom: "15px" }} />
              <h4 style={{ color: "var(--text-primary)", marginBottom: "8px", fontWeight: "700" }}>System Analytics Offline</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "450px", marginBottom: "20px" }}>
                {analyticsError}
              </p>
              <button
                onClick={() => fetchAnalytics(dateFilter)}
                style={{
                  border: "none",
                  padding: "8px 18px",
                  background: "var(--primary-light)",
                  color: "var(--primary)",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                  border: "1px solid rgba(139, 92, 246, 0.3)"
                }}
              >
                Reconnect SOC Data
              </button>
            </div>
          ) : analyticsLoading && monthlyData.length === 0 ? (
            <div className="analytics-card" style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px",
              textAlign: "center"
            }}>
              <Loader2 size={32} className="spin-animation" style={{ animation: "spin 1s linear infinite", color: "var(--accent)", marginBottom: "15px" }} />
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Initializing security visualizer components...</p>
            </div>
          ) : (
            <div className="analytics-grid">
              {/* Chart 1: Line Chart */}
              <div className="analytics-card">
                <h4 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "16px", color: "var(--text-primary)" }}>
                  Complaint Trend
                </h4>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData.length > 0 ? monthlyData : defaultMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: "var(--bg-secondary)", borderColor: "var(--glass-border)", borderRadius: "8px", color: "var(--text-primary)" }}
                        itemStyle={{ color: "var(--accent)" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="var(--accent)"
                        strokeWidth={3}
                        dot={{ fill: "var(--accent)", r: 4 }}
                        activeDot={{ r: 6, stroke: "var(--bg-primary)", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Pie Chart */}
              <div className="analytics-card">
                <h4 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "16px", color: "var(--text-primary)" }}>
                  Complaint Categories
                </h4>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData.length > 0 ? categoryData : defaultCategoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        fill="#8b5cf6"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {(categoryData.length > 0 ? categoryData : defaultCategoryData).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CATEGORY_COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "var(--bg-secondary)", borderColor: "var(--glass-border)", borderRadius: "8px", color: "var(--text-primary)" }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconSize={8} 
                        iconType="circle" 
                        wrapperStyle={{ fontSize: "9px", marginTop: "10px" }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Bar Chart */}
              <div className="analytics-card">
                <h4 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "16px", color: "var(--text-primary)" }}>
                  Complaint Status Analytics
                </h4>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData.length > 0 ? statusData : defaultStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="status" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: "var(--bg-secondary)", borderColor: "var(--glass-border)", borderRadius: "8px", color: "var(--text-primary)" }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {(statusData.length > 0 ? statusData : defaultStatusData).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={STATUS_COLORS[entry.status] || "var(--primary)"} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Action Cards */}
      <motion.h3 variants={itemVariants} style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "20px" }}>
        Quick Operations
      </motion.h3>

      <motion.div className="dashboard-cards" variants={itemVariants}>
        <div className="action-card" onClick={() => navigate("/complaint")}>
          <div className="action-card-header">
            <div className="action-card-icon-wrapper" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
              <FileText size={20} />
            </div>
            <h3>File New Case</h3>
          </div>
          <p>Register a new incident with media attachments and detailed descriptions.</p>
        </div>

        <div className="action-card" onClick={() => navigate("/track-complaint")}>
          <div className="action-card-header">
            <div className="action-card-icon-wrapper" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
              <Search size={20} />
            </div>
            <h3>Track Case</h3>
          </div>
          <p>Search status database using tracking ID COMP-XXXXXX in real time.</p>
        </div>

        <div className="action-card" onClick={() => navigate("/profile")}>
          <div className="action-card-header">
            <div className="action-card-icon-wrapper" style={{ background: "rgba(255, 255, 255, 0.05)", color: "var(--text-primary)" }}>
              <User size={20} />
            </div>
            <h3>Account Settings</h3>
          </div>
          <p>Manage security codes, change passwords, and update contact profile.</p>
        </div>
      </motion.div>

      {/* Recent Complaints Section */}
      <motion.div variants={itemVariants} style={{ marginTop: "50px" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "20px" }}>Recent Cases</h3>

        {loading ? (
          <div style={{
            textAlign: "center",
            padding: "50px",
            background: "var(--glass-bg)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--glass-border)",
            color: "var(--text-secondary)"
          }}>
            <div className="pulse-loader" style={{
              width: "40px",
              height: "40px",
              border: "3px solid var(--border-color)",
              borderTopColor: "var(--accent)",
              borderRadius: "50%",
              margin: "0 auto 15px",
              animation: "spin 1s linear infinite"
            }} />
            Retrieving secure logs...
          </div>
        ) : complaints.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "50px",
            background: "var(--glass-bg)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--glass-border)",
            color: "var(--text-secondary)"
          }}>
            <Shield size={36} color="var(--text-muted)" style={{ marginBottom: "15px", opacity: 0.5 }} />
            <p>No complaints registered yet. Click "File New Case" to register.</p>
          </div>
        ) : (
          <div className="complaint-table-container">
            <table className="complaint-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date Filed</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: "700", color: "var(--accent)" }}>{c.complaintId}</td>
                    <td style={{ fontWeight: "500" }}>{c.title}</td>
                    <td>{c.category}</td>
                    <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : c.incidentDate}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(c.status)}`}>
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/track-complaint?id=${c.complaintId}`)}
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
                        <Eye size={16} /> Track
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Global CSS inject for spin and layout styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
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
        .spin-animation {
          display: inline-block;
        }
      `}} />
    </motion.div>
  );
}

export default Dashboard;
