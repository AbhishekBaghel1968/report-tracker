import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, ShieldAlert, ArrowLeft, Loader2, Eye, Ban, CheckCircle, 
  Trash2, ChevronLeft, ChevronRight, User, Mail, Phone, Calendar, 
  Shield, Activity, FileText, AlertCircle, Users, CheckSquare, Plus, X, Award
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

function AdminOfficers() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [officers, setOfficers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Action Feedback states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals / Details view states
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [assigningOfficer, setAssigningOfficer] = useState(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [selectedComplaintId, setSelectedComplaintId] = useState("");

  // Fetch Officers and Complaints
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [officersRes, complaintsRes] = await Promise.all([
        api.get("/admin/officers"),
        api.get("/complaints").catch(() => ({ data: [] }))
      ]);
      setOfficers(officersRes.data);
      setComplaints(complaintsRes.data);
      setError("");
    } catch (err) {
      console.error("Failed to load officer management data:", err);
      setError("Forbidden access or server connection error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show status feedback message
  const showActionMsg = (type, text) => {
    setActionMessage({ type, text });
    setTimeout(() => {
      setActionMessage({ type: "", text: "" });
    }, 5000);
  };

  // Toggle Officer status (Active / Suspended)
  const handleToggleStatus = async (officer) => {
    const isCurrentlyActive = officer.dbStatus === "ACTIVE";
    const newStatus = isCurrentlyActive ? "DISABLED" : "ACTIVE";
    const actionWord = isCurrentlyActive ? "suspend" : "activate";

    if (!window.confirm(`Are you sure you want to ${actionWord} officer ${officer.name}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await api.put(`/admin/users/${officer.id}/status`, { status: newStatus });
      showActionMsg("success", `Successfully updated officer ${officer.name}'s account status to ${newStatus === "ACTIVE" ? "Active" : "Suspended"}.`);
      
      // Update local state dynamically
      setOfficers(prev => prev.map(o => {
        if (o.id === officer.id) {
          // Recompute computed status based on rules
          let compStatus = "Active";
          if (newStatus === "DISABLED") {
            compStatus = "Suspended";
          } else if (o.assignedCasesCount >= 3) {
            compStatus = "Busy";
          } else if (o.id % 3 === 0) {
            compStatus = "Offline";
          } else {
            compStatus = "Active";
          }
          return { ...o, dbStatus: newStatus, status: compStatus };
        }
        return o;
      }));

      // Update selected viewer state if open
      if (selectedOfficer && selectedOfficer.id === officer.id) {
        setSelectedOfficer(prev => {
          let compStatus = "Active";
          if (newStatus === "DISABLED") {
            compStatus = "Suspended";
          } else if (prev.assignedCasesCount >= 3) {
            compStatus = "Busy";
          } else if (prev.id % 3 === 0) {
            compStatus = "Offline";
          } else {
            compStatus = "Active";
          }
          return { ...prev, dbStatus: newStatus, status: compStatus };
        });
      }
    } catch (err) {
      console.error("Failed to update status", err);
      const errMsg = err.response?.data?.error || "Failed to update officer status.";
      showActionMsg("error", errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Assign complaint to officer
  const handleAssignComplaint = async () => {
    if (!selectedComplaintId) {
      alert("Please select a complaint to assign.");
      return;
    }

    setActionLoading(true);
    try {
      // API endpoint PUT /api/admin/assign/:complaintId
      const assignRes = await api.put(`/admin/assign/${selectedComplaintId}`, { 
        officerId: assigningOfficer.id 
      });

      const updatedComplaint = assignRes.data;
      showActionMsg("success", `Successfully assigned Complaint ${updatedComplaint.complaintId} to ${assigningOfficer.name}.`);

      // Update local complaints registry
      setComplaints(prev => prev.map(c => c.id === updatedComplaint.id ? updatedComplaint : c));

      // Re-fetch officers to sync case lists and statuses properly
      const officersRes = await api.get("/admin/officers");
      setOfficers(officersRes.data);

      // If details view is open, update selected officer's display
      if (selectedOfficer && selectedOfficer.id === assigningOfficer.id) {
        const matchingOfficer = officersRes.data.find(o => o.id === assigningOfficer.id);
        if (matchingOfficer) setSelectedOfficer(matchingOfficer);
      }

      setAssigningOfficer(null);
      setSelectedComplaintId("");
    } catch (err) {
      console.error("Failed to assign complaint", err);
      const errMsg = err.response?.data?.error || "Failed to assign case.";
      showActionMsg("error", errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Client-side filtering logic for Officers Table
  const filteredOfficers = officers.filter(o => {
    const matchesSearch = 
      String(o.id).includes(searchTerm) ||
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredOfficers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOfficers = filteredOfficers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Get active pending complaints for assignment (exclude resolved, rejected)
  const assignableComplaints = complaints.filter(c => {
    const isUnresolved = c.status !== "RESOLVED" && c.status !== "REJECTED";
    const matchesQuery = 
      c.complaintId.toLowerCase().includes(assignSearch.toLowerCase()) ||
      c.title.toLowerCase().includes(assignSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(assignSearch.toLowerCase());
    
    // Also make sure it is not already assigned to THIS officer
    const isAlreadyAssignedToThis = assigningOfficer && Number(c.officerId) === Number(assigningOfficer.id);

    return isUnresolved && matchesQuery && !isAlreadyAssignedToThis;
  });

  // Calculate dynamic stats
  const totalOfficers = officers.length;
  const activeCount = officers.filter(o => o.status === "Active").length;
  const busyCount = officers.filter(o => o.status === "Busy").length;
  const offlineCount = officers.filter(o => o.status === "Offline" || o.status === "Suspended").length;

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
        <span>Syncing security officer registry database records...</span>
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
        <button 
          onClick={() => navigate("/admin-dashboard")}
          style={{
            marginTop: "20px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-color)",
            padding: "8px 20px",
            color: "white",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer"
          }}
        >
          Back to Control Room
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ width: "100%" }}
    >
      {/* Header Back Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <button 
          onClick={() => navigate("/admin-dashboard")}
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 16px",
            color: "var(--text-primary)",
            fontSize: "0.85rem",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "var(--transition)"
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
        >
          <ArrowLeft size={16} />
          <span>Back to Control Room</span>
        </button>
      </div>

      {/* Success/Error Alerts */}
      {actionMessage.text && (
        <div 
          className={actionMessage.type === "success" ? "alert-success" : "alert-error"}
          style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}
        >
          <AlertCircle size={18} />
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-container" style={{ marginBottom: "30px" }}>
        {/* Total Officers */}
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
            <Users size={24} />
          </div>
          <div className="stat-card-info">
            <h2>{totalOfficers}</h2>
            <p>Total Officers</p>
          </div>
        </div>

        {/* Active Officers */}
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "var(--success-light)", color: "var(--success)" }}>
            <Activity size={24} />
          </div>
          <div className="stat-card-info">
            <h2>{activeCount}</h2>
            <p>Active Officers</p>
          </div>
        </div>

        {/* Busy Officers */}
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "var(--warning-light)", color: "var(--warning)" }}>
            <Shield size={24} />
          </div>
          <div className="stat-card-info">
            <h2>{busyCount}</h2>
            <p>Busy Officers</p>
          </div>
        </div>

        {/* Offline Officers */}
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(100, 116, 139, 0.12)", color: "var(--text-secondary)" }}>
            <Ban size={24} />
          </div>
          <div className="stat-card-info">
            <h2>{offlineCount}</h2>
            <p>Offline / Suspended</p>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "25px",
        flexWrap: "wrap",
        gap: "15px",
        background: "rgba(3, 3, 7, 0.6)",
        padding: "16px 20px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--glass-border)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
      }}>
        {/* Search Field */}
        <div style={{ position: "relative", flexGrow: 1, maxWidth: "450px" }}>
          <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search officers by Name, Email, or Officer ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              paddingLeft: "42px",
              background: "rgba(3, 3, 7, 0.5)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)"
            }}
          />
        </div>

        {/* Status Filtering Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Activity size={16} color="var(--text-secondary)" />
          <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              background: "rgba(3, 3, 7, 0.5)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              width: "180px"
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Busy">Busy</option>
            <option value="Offline">Offline</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Officers Table */}
      <div className="complaint-table-container" style={{ marginBottom: "25px" }}>
        <table className="complaint-table">
          <thead>
            <tr>
              <th>Officer ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Assigned Cases</th>
              <th>Status</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentOfficers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No officers match the query filters.
                </td>
              </tr>
            ) : (
              currentOfficers.map((officer) => {
                let badgeClass = "badge-submitted";
                if (officer.status === "Active") badgeClass = "badge-resolved";
                if (officer.status === "Busy") badgeClass = "badge-review";
                if (officer.status === "Offline") badgeClass = "badge-submitted";
                if (officer.status === "Suspended") badgeClass = "badge-rejected";

                return (
                  <tr key={officer.id}>
                    <td style={{ fontFamily: "monospace", color: "var(--accent)" }}>
                      #OFF-{officer.id}
                    </td>
                    <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                      {officer.name}
                    </td>
                    <td>{officer.email}</td>
                    <td style={{ fontWeight: "700" }}>
                      {officer.assignedCasesCount} active cases
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {officer.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                        {/* View Action */}
                        <button
                          onClick={() => setSelectedOfficer(officer)}
                          title="View Full Officer Profile"
                          style={{
                            padding: "6px 12px",
                            background: "rgba(0, 240, 255, 0.08)",
                            border: "1px solid rgba(0, 240, 255, 0.2)",
                            color: "var(--accent)",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.8rem",
                            width: "auto"
                          }}
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>

                        {/* Assign Complaint */}
                        <button
                          onClick={() => setAssigningOfficer(officer)}
                          disabled={officer.status === "Suspended"}
                          title="Assign Complaint to Officer"
                          style={{
                            padding: "6px 12px",
                            background: "rgba(139, 92, 246, 0.08)",
                            border: "1px solid rgba(139, 92, 246, 0.2)",
                            color: "var(--primary)",
                            borderRadius: "4px",
                            cursor: officer.status === "Suspended" ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.8rem",
                            width: "auto",
                            opacity: officer.status === "Suspended" ? 0.4 : 1
                          }}
                        >
                          <Plus size={12} />
                          <span>Assign</span>
                        </button>

                        {/* Suspend Action */}
                        <button
                          onClick={() => handleToggleStatus(officer)}
                          disabled={actionLoading}
                          title={officer.dbStatus === "ACTIVE" ? "Suspend Officer Account" : "Activate Officer Account"}
                          style={{
                            padding: "6px 12px",
                            background: officer.dbStatus === "ACTIVE" ? "rgba(244, 63, 94, 0.08)" : "rgba(16, 185, 129, 0.08)",
                            border: officer.dbStatus === "ACTIVE" ? "1px solid rgba(244, 63, 94, 0.2)" : "1px solid rgba(16, 185, 129, 0.2)",
                            color: officer.dbStatus === "ACTIVE" ? "var(--danger)" : "var(--success)",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.8rem",
                            width: "auto"
                          }}
                        >
                          {officer.dbStatus === "ACTIVE" ? (
                            <>
                              <Ban size={12} />
                              <span>Suspend</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle size={12} />
                              <span>Activate</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(10, 10, 20, 0.6)",
          padding: "14px 20px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--glass-border)",
          color: "var(--text-secondary)"
        }}>
          <span style={{ fontSize: "0.85rem" }}>
            Showing records <strong>{indexOfFirstItem + 1}</strong> to <strong>{Math.min(indexOfLastItem, filteredOfficers.length)}</strong> of <strong>{filteredOfficers.length}</strong> officers
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: "6px 12px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                color: currentPage === 1 ? "var(--text-muted)" : "white",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                width: "auto"
              }}
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>
            
            <span style={{ fontSize: "0.85rem" }}>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: "6px 12px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                color: currentPage === totalPages ? "var(--text-muted)" : "white",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                width: "auto"
              }}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Slide-out details view overlay */}
      <AnimatePresence>
        {selectedOfficer && (
          <motion.div
            className="audit-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            style={{ marginTop: "30px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "var(--accent-light)",
                  border: "1px solid rgba(0, 240, 255, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent)",
                  fontSize: "1.4rem",
                  fontWeight: "700"
                }}>
                  {selectedOfficer.name ? selectedOfficer.name.charAt(0).toUpperCase() : "O"}
                </div>
                <div>
                  <span style={{ 
                    fontSize: "0.75rem", 
                    fontWeight: "700", 
                    color: "var(--accent)", 
                    background: "var(--accent-light)", 
                    border: "1px solid rgba(0, 240, 255, 0.2)",
                    padding: "4px 10px", 
                    borderRadius: "100px" 
                  }}>
                    OFFICER ID: #OFF-{selectedOfficer.id}
                  </span>
                  <h3 style={{ marginTop: "8px", fontSize: "1.35rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    {selectedOfficer.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedOfficer(null)}
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
                Close Profile
              </button>
            </div>

            <hr style={{ border: 0, height: "1px", background: "var(--border-color)", margin: "20px 0" }} />

            {/* Officer Details */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Mail size={16} color="var(--text-muted)" />
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Email Address</p>
                  <p style={{ fontWeight: "600", fontSize: "0.9rem" }}>{selectedOfficer.email}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Phone size={16} color="var(--text-muted)" />
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Phone Number</p>
                  <p style={{ fontWeight: "600", fontSize: "0.9rem" }}>{selectedOfficer.phone || "N/A"}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Activity size={16} color="var(--text-muted)" />
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Computed status</p>
                  <span className={`badge ${
                    selectedOfficer.status === "Active" ? "badge-resolved" : 
                    selectedOfficer.status === "Busy" ? "badge-review" : 
                    selectedOfficer.status === "Suspended" ? "badge-rejected" : "badge-submitted"
                  }`} style={{ marginTop: "4px" }}>
                    {selectedOfficer.status}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Award size={16} color="var(--text-muted)" />
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Active Case Load</p>
                  <p style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--text-primary)" }}>
                    {selectedOfficer.assignedCasesCount} complaints
                  </p>
                </div>
              </div>
            </div>

            {/* Officer Complaints */}
            <div>
              <h4 style={{ color: "var(--text-primary)", fontSize: "1rem", fontWeight: "600", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText size={18} color="var(--accent)" />
                <span>Assigned Cases History ({selectedOfficer.assignedComplaints ? selectedOfficer.assignedComplaints.length : 0})</span>
              </h4>

              {!selectedOfficer.assignedComplaints || selectedOfficer.assignedComplaints.length === 0 ? (
                <div style={{
                  background: "rgba(3, 3, 7, 0.4)",
                  padding: "20px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-muted)",
                  textAlign: "center",
                  fontSize: "0.85rem"
                }}>
                  This officer is not assigned to any active cyber complaints.
                </div>
              ) : (
                <div className="complaint-table-container">
                  <table className="complaint-table">
                    <thead>
                      <tr>
                        <th>Case ID</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Incident Date</th>
                        <th>Priority</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOfficer.assignedComplaints.map(complaint => (
                        <tr key={complaint.id}>
                          <td style={{ fontFamily: "monospace", color: "var(--accent)" }}>
                            {complaint.complaintId}
                          </td>
                          <td style={{ color: "var(--text-primary)", fontWeight: "500" }}>{complaint.title}</td>
                          <td>{complaint.category}</td>
                          <td>{new Date(complaint.incidentDate).toLocaleDateString()}</td>
                          <td>
                            <span style={{ 
                              fontWeight: "600",
                              color: complaint.priority === "HIGH" ? "var(--danger)" : complaint.priority === "MEDIUM" ? "var(--warning)" : "var(--success)" 
                            }}>
                              {complaint.priority}
                            </span>
                          </td>
                          <td>
                            <span className={
                              complaint.status === "SUBMITTED" 
                                ? "badge badge-submitted" 
                                : complaint.status === "UNDER_REVIEW" 
                                ? "badge badge-review" 
                                : complaint.status === "INVESTIGATING" 
                                ? "badge badge-investigating" 
                                : complaint.status === "RESOLVED" 
                                ? "badge badge-resolved" 
                                : "badge badge-rejected"
                            }>
                              {complaint.status.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Complaint Modal Dialog */}
      <AnimatePresence>
        {assigningOfficer && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(3, 3, 7, 0.8)",
            backdropFilter: "blur(6px)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: "100%",
                maxWidth: "600px",
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-lg)",
                padding: "30px",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Shield color="var(--primary)" size={22} /> Assign Case to {assigningOfficer.name}
                </h3>
                <button 
                  onClick={() => { setAssigningOfficer(null); setSelectedComplaintId(""); }}
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Search Input */}
              <div style={{ position: "relative", marginBottom: "15px" }}>
                <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Filter active cases by code, title, or type..."
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  style={{
                    paddingLeft: "42px",
                    background: "rgba(3, 3, 7, 0.4)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)"
                  }}
                />
              </div>

              {/* Complaints List Selection */}
              <div style={{ 
                flexGrow: 1, 
                overflowY: "auto", 
                maxHeight: "300px",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                background: "rgba(3, 3, 7, 0.3)",
                marginBottom: "20px"
              }}>
                {assignableComplaints.length === 0 ? (
                  <p style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    No pending unassigned cases matching query.
                  </p>
                ) : (
                  assignableComplaints.map(comp => (
                    <div 
                      key={comp.id}
                      onClick={() => setSelectedComplaintId(comp.complaintId)}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        cursor: "pointer",
                        background: selectedComplaintId === comp.complaintId ? "rgba(139, 92, 246, 0.12)" : "transparent",
                        borderLeft: selectedComplaintId === comp.complaintId ? "3px solid var(--primary)" : "3px solid transparent",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: "700", color: "var(--accent)" }}>
                          {comp.complaintId}
                        </span>
                        <span style={{ 
                          fontSize: "0.75rem", 
                          fontWeight: "700",
                          color: comp.priority === "HIGH" ? "var(--danger)" : comp.priority === "MEDIUM" ? "var(--warning)" : "var(--success)"
                        }}>
                          {comp.priority} Priority
                        </span>
                      </div>
                      <p style={{ color: "var(--text-primary)", fontSize: "0.9rem", fontWeight: "600" }}>{comp.title}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{comp.category}</span>
                        <span className="badge badge-submitted" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                          {comp.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => { setAssigningOfficer(null); setSelectedComplaintId(""); }}
                  style={{
                    padding: "10px 20px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--border-color)",
                    color: "white",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignComplaint}
                  disabled={actionLoading || !selectedComplaintId}
                  style={{
                    padding: "10px 20px",
                    background: "var(--primary)",
                    border: "none",
                    color: "white",
                    borderRadius: "var(--radius-sm)",
                    cursor: (!selectedComplaintId || actionLoading) ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 10px var(--primary-glow)",
                    opacity: (!selectedComplaintId || actionLoading) ? 0.6 : 1
                  }}
                >
                  {actionLoading ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Loader2 size={14} className="spin-animation" style={{ animation: "spin 1s linear infinite" }} />
                      <span>Assigning...</span>
                    </div>
                  ) : (
                    "Assign Case"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          display: inline-block;
        }
        select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg fill='white' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
          background-repeat: no-repeat;
          background-position: right 10px fill 50%;
          padding-right: 35px;
        }
      `}} />
    </motion.div>
  );
}

export default AdminOfficers;
