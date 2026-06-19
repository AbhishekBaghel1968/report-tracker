import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, FileText, CheckCircle, Clock, AlertTriangle, 
  Search, Eye, ArrowRight, Activity, TrendingUp, BarChart3, Loader2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { motion } from "framer-motion";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

const DEFAULT_STATUS_COLORS = {
  "SUBMITTED": "#8b5cf6",       // Violet
  "UNDER_REVIEW": "#f59e0b",     // Amber
  "INVESTIGATING": "#00f0ff",   // Cyan
  "RESOLVED": "#10b981",        // Emerald
  "REJECTED": "#f43f5e"         // Rose
};

const CHART_COLORS = ["#8b5cf6", "#00f0ff", "#10b981", "#f59e0b", "#f43f5e", "#ec4899"];

function OfficerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    assignedCases: 0,
    underInvestigation: 0,
    resolvedCases: 0,
    pendingReview: 0,
    statusBreakdown: {}
  });
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, casesRes] = await Promise.all([
          api.get("/officer/stats"),
          api.get("/officer/cases?limit=5&page=1")
        ]);
        
        setStats(statsRes.data);
        setRecentCases(casesRes.data.cases || []);
      } catch (err) {
        console.error("Error fetching officer dashboard details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH": return "var(--danger)";
      case "MEDIUM": return "var(--warning)";
      case "LOW": return "var(--success)";
      default: return "var(--text-muted)";
    }
  };

  // Convert status breakdown to chart data
  const statusChartData = Object.keys(stats.statusBreakdown || {}).map(status => ({
    name: status.replace("_", " "),
    value: stats.statusBreakdown[status],
    rawName: status
  })).filter(item => item.value > 0);

  // Group recent cases by category for demonstration if category counts aren't in stats
  const categoryCounts = recentCases.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});
  
  const categoryChartData = Object.keys(categoryCounts).map((cat, idx) => ({
    name: cat,
    value: categoryCounts[cat]
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 85, damping: 14 }
    }
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
        color: "var(--text-secondary)"
      }}>
        <Loader2 size={36} className="spin-animation" style={{ animation: "spin 1s linear infinite", color: "var(--accent)", marginBottom: "15px" }} />
        <p>Loading officer terminal context...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ width: "100%" }}
    >
      {/* Header Info */}
      <motion.div variants={itemVariants} style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: "700", color: "var(--text-primary)" }}>
          Welcome back, Investigator {user?.name || "Officer"}
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "4px" }}>
          Monitor your assigned investigative caseload and update security complaints.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div className="stats-container" variants={itemVariants}>
        {/* Total Assigned Cases */}
        <div className="stat-card" style={{ borderLeft: "4px solid var(--primary)" }}>
          <div className="stat-card-icon" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
            <FileText size={24} />
          </div>
          <div className="stat-card-info">
            <h2>{stats.assignedCases}</h2>
            <p>Assigned Cases</p>
          </div>
        </div>

        {/* Under Investigation */}
        <div className="stat-card" style={{ borderLeft: "4px solid var(--accent)" }}>
          <div className="stat-card-icon" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
            <Activity size={24} />
          </div>
          <div className="stat-card-info">
            <h2>{stats.underInvestigation}</h2>
            <p>Investigation</p>
          </div>
        </div>

        {/* Resolved Cases */}
        <div className="stat-card" style={{ borderLeft: "4px solid var(--success)" }}>
          <div className="stat-card-icon" style={{ background: "var(--success-light)", color: "var(--success)" }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-card-info">
            <h2>{stats.resolvedCases}</h2>
            <p>Resolved Cases</p>
          </div>
        </div>

        {/* Pending Review */}
        <div className="stat-card" style={{ borderLeft: "4px solid var(--warning)" }}>
          <div className="stat-card-icon" style={{ background: "var(--warning-light)", color: "var(--warning)" }}>
            <Clock size={24} />
          </div>
          <div className="stat-card-info">
            <h2>{stats.pendingReview}</h2>
            <p>Pending Review</p>
          </div>
        </div>
      </motion.div>

      {/* Dashboard Charts Row */}
      <motion.div className="analytics-grid" variants={itemVariants}>
        {/* Chart 1: Status Distribution Bar Chart */}
        <div className="analytics-card">
          <h4 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "16px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <BarChart3 size={16} color="var(--accent)" /> Case Status Breakdown
          </h4>
          <div style={{ width: "100%", height: 260 }}>
            {statusChartData.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyValue: "center", height: "100%", color: "var(--text-muted)", fontSize: "0.85rem", justifyContent: "center" }}>
                No case status data logged.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-secondary)", borderColor: "var(--glass-border)", borderRadius: "8px", color: "var(--text-primary)" }}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                    {statusChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={DEFAULT_STATUS_COLORS[entry.rawName] || "var(--primary)"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Category Breakdown */}
        <div className="analytics-card" style={{ gridColumn: "span 2" }}>
          <h4 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "16px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <TrendingUp size={16} color="var(--primary)" /> Case Distribution by Category
          </h4>
          <div style={{ width: "100%", height: 260, display: "flex", alignItems: "center" }}>
            {categoryChartData.length === 0 ? (
              <div style={{ width: "100%", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Analyze categories once you have active assigned cases.
              </div>
            ) : (
              <>
                <div style={{ width: "60%", height: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        fill="#8b5cf6"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CHART_COLORS[index % CHART_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "var(--bg-secondary)", borderColor: "var(--glass-border)", borderRadius: "8px", color: "var(--text-primary)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ width: "40%", display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "20px" }}>
                  {categoryChartData.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
                      <span style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: CHART_COLORS[idx % CHART_COLORS.length],
                        display: "inline-block"
                      }} />
                      <span style={{ color: "var(--text-secondary)" }}>{item.name}:</span>
                      <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Recent Cases */}
      <motion.div variants={itemVariants} style={{ marginTop: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Recent Caseload Assignments</h3>
          <button 
            className="sidebar-link" 
            style={{ 
              background: "transparent", 
              border: "none", 
              color: "var(--accent)", 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              fontSize: "0.9rem"
            }}
            onClick={() => navigate("/officer/cases")}
          >
            All Investigations <ArrowRight size={16} />
          </button>
        </div>

        {recentCases.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "50px",
            background: "var(--glass-bg)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--glass-border)",
            color: "var(--text-secondary)"
          }}>
            <Shield size={36} color="var(--text-muted)" style={{ marginBottom: "15px", opacity: 0.5 }} />
            <p>No complaints assigned to your badge yet.</p>
          </div>
        ) : (
          <div className="complaint-table-container">
            <table className="complaint-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Date Filed</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: "700", color: "var(--accent)" }}>{c.complaintId}</td>
                    <td style={{ fontWeight: "500" }}>{c.title}</td>
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
                        <AlertTriangle size={14} /> {c.priority}
                      </span>
                    </td>
                    <td>{new Date(c.createdAt || c.incidentDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(c.status)}`}>
                        {c.status.replace("_", " ")}
                      </span>
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
                        <Eye size={16} /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Global CSS Inject */}
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
          border-color: rgba(0, 240, 255, 0.25);
          background: var(--glass-bg-hover);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0, 240, 255, 0.06), var(--shadow-md);
        }
        .spin-animation {
          display: inline-block;
        }
      `}} />
    </motion.div>
  );
}

export default OfficerDashboard;
