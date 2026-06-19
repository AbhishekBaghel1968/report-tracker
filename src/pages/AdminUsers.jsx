import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, ShieldAlert, ArrowLeft, Loader2, Eye, Ban, CheckCircle, 
  Trash2, ChevronLeft, ChevronRight, User, Mail, Phone, Calendar, 
  Shield, Activity, FileText, AlertCircle
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

function AdminUsers() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected user for detailed view
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch users and complaints registries
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, complaintsRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/complaints").catch(() => ({ data: [] })) // Fallback if no complaints API access
      ]);
      setUsers(usersRes.data);
      setComplaints(complaintsRes.data);
      setError("");
    } catch (err) {
      console.error("Failed to load user management registries:", err);
      setError("Forbidden access or server connection error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle status update (Disable/Enable)
  const handleToggleStatus = async (user) => {
    if (Number(user.id) === Number(currentUser?.id)) {
      showActionMsg("error", "Security override blocked: You cannot disable your own administrator account.");
      return;
    }

    const newStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    if (!window.confirm(`Are you sure you want to change the status of ${user.name} to ${newStatus}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await api.put(`/admin/users/${user.id}/status`, { status: newStatus });
      showActionMsg("success", `Successfully updated ${user.name}'s status to ${newStatus}.`);
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Failed to update status", err);
      const errMsg = err.response?.data?.error || "Failed to update user status.";
      showActionMsg("error", errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (user) => {
    if (Number(user.id) === Number(currentUser?.id)) {
      showActionMsg("error", "Security override blocked: You cannot delete your own account.");
      return;
    }

    const warnMsg = `⚠️ WARNING: Are you sure you want to permanently delete user "${user.name}"? 
    
This will permanently remove their credentials and CASCADE delete all cyber complaints they have submitted. This operation is irreversible.`;

    if (!window.confirm(warnMsg)) {
      return;
    }

    setActionLoading(true);
    try {
      await api.delete(`/admin/users/${user.id}`);
      showActionMsg("success", `User account for "${user.name}" has been permanently purged.`);
      
      // Update local state
      setUsers(prev => prev.filter(u => u.id !== user.id));
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser(null);
      }
    } catch (err) {
      console.error("Failed to delete user", err);
      const errMsg = err.response?.data?.error || "Failed to delete user account.";
      showActionMsg("error", errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Show status feedback message
  const showActionMsg = (type, text) => {
    setActionMessage({ type, text });
    setTimeout(() => {
      setActionMessage({ type: "", text: "" });
    }, 5000);
  };

  // Client-side filtering logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      String(u.id).includes(searchTerm) ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Filter complaints related to the selected user
  const getUserComplaints = (userId) => {
    return complaints.filter(c => Number(c.userId) === Number(userId) || Number(c.user?.id) === Number(userId));
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
        <span>Syncing cyber registry directory database records...</span>
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
      {/* Header bar and navigation controls */}
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

      {/* Visual action alert boxes */}
      {actionMessage.text && (
        <div 
          className={actionMessage.type === "success" ? "alert-success" : "alert-error"}
          style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}
        >
          <AlertCircle size={18} />
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Users Search and Filtering Panels */}
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
            placeholder="Search users by Name, Email, or User ID..."
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

        {/* Role Filtering Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Shield size={16} color="var(--text-secondary)" />
          <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
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
            <option value="ALL">All Roles</option>
            <option value="ROLE_CITIZEN">Citizens (ROLE_CITIZEN)</option>
            <option value="ROLE_OFFICER">Officers (ROLE_OFFICER)</option>
            <option value="ROLE_ADMIN">Administrators (ROLE_ADMIN)</option>
          </select>
        </div>
      </div>

      {/* Users Database Records Table */}
      <div className="complaint-table-container" style={{ marginBottom: "25px" }}>
        <table className="complaint-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Registration Date</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No registered users matched the query filters.
                </td>
              </tr>
            ) : (
              currentUsers.map((userItem) => (
                <tr key={userItem.id}>
                  <td style={{ fontFamily: "monospace", color: "var(--accent)" }}>
                    #{userItem.id}
                  </td>
                  <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                    {userItem.name}
                  </td>
                  <td>{userItem.email}</td>
                  <td>
                    <span className={
                      userItem.role === "ROLE_ADMIN" 
                        ? "badge badge-review" 
                        : userItem.role === "ROLE_OFFICER" 
                        ? "badge badge-investigating" 
                        : "badge badge-submitted"
                    }>
                      {userItem.role === "ROLE_ADMIN" 
                        ? "Admin" 
                        : userItem.role === "ROLE_OFFICER" 
                        ? "Officer" 
                        : "Citizen"}
                    </span>
                  </td>
                  <td>
                    <span className={userItem.status === "ACTIVE" ? "badge badge-resolved" : "badge badge-rejected"}>
                      {userItem.status === "ACTIVE" ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    {new Date(userItem.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    })}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                      {/* View Action */}
                      <button
                        onClick={() => setSelectedUser(userItem)}
                        title="View Full Profile Details"
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

                      {/* Toggle Active/Disabled Action */}
                      <button
                        onClick={() => handleToggleStatus(userItem)}
                        disabled={actionLoading || Number(userItem.id) === Number(currentUser?.id)}
                        title={userItem.status === "ACTIVE" ? "Disable Account" : "Enable Account"}
                        style={{
                          padding: "6px 12px",
                          background: userItem.status === "ACTIVE" ? "rgba(245, 158, 11, 0.08)" : "rgba(16, 185, 129, 0.08)",
                          border: userItem.status === "ACTIVE" ? "1px solid rgba(245, 158, 11, 0.2)" : "1px solid rgba(16, 185, 129, 0.2)",
                          color: userItem.status === "ACTIVE" ? "var(--warning)" : "var(--success)",
                          borderRadius: "4px",
                          cursor: userItem.status === "ACTIVE" && Number(userItem.id) !== Number(currentUser?.id) ? "pointer" : "not-allowed",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.8rem",
                          width: "auto",
                          opacity: Number(userItem.id) === Number(currentUser?.id) ? 0.4 : 1
                        }}
                      >
                        {userItem.status === "ACTIVE" ? (
                          <>
                            <Ban size={12} />
                            <span>Disable</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={12} />
                            <span>Enable</span>
                          </>
                        )}
                      </button>

                      {/* Delete Action (Admins only) */}
                      {currentUser?.role === "ROLE_ADMIN" && (
                        <button
                          onClick={() => handleDeleteUser(userItem)}
                          disabled={actionLoading || Number(userItem.id) === Number(currentUser?.id)}
                          title="Purge User Account"
                          style={{
                            padding: "6px 12px",
                            background: "rgba(244, 63, 94, 0.08)",
                            border: "1px solid rgba(244, 63, 94, 0.2)",
                            color: "var(--danger)",
                            borderRadius: "4px",
                            cursor: Number(userItem.id) !== Number(currentUser?.id) ? "pointer" : "not-allowed",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.8rem",
                            width: "auto",
                            opacity: Number(userItem.id) === Number(currentUser?.id) ? 0.4 : 1
                          }}
                        >
                          <Trash2 size={12} />
                          <span>Purge</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
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
            Showing records <strong>{indexOfFirstItem + 1}</strong> to <strong>{Math.min(indexOfLastItem, filteredUsers.length)}</strong> of <strong>{filteredUsers.length}</strong> accounts
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

      {/* User audit detailed viewer side-out overlay */}
      <AnimatePresence>
        {selectedUser && (
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
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : "U"}
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
                    USER ID: #{selectedUser.id}
                  </span>
                  <h3 style={{ marginTop: "8px", fontSize: "1.35rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    {selectedUser.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
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
                Close Audit Profile
              </button>
            </div>

            <hr style={{ border: 0, height: "1px", background: "var(--border-color)", margin: "20px 0" }} />

            {/* Core credentials and state */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Mail size={16} color="var(--text-muted)" />
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Email Address</p>
                  <p style={{ fontWeight: "600", fontSize: "0.9rem" }}>{selectedUser.email}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Phone size={16} color="var(--text-muted)" />
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Phone Number</p>
                  <p style={{ fontWeight: "600", fontSize: "0.9rem" }}>{selectedUser.phone || "N/A"}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Calendar size={16} color="var(--text-muted)" />
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Registered Since</p>
                  <p style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Activity size={16} color="var(--text-muted)" />
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>System Status</p>
                  <span className={selectedUser.status === "ACTIVE" ? "badge badge-resolved" : "badge badge-rejected"} style={{ marginTop: "4px" }}>
                    {selectedUser.status === "ACTIVE" ? "Active / Verified" : "Suspended"}
                  </span>
                </div>
              </div>
            </div>

            {/* User Complaints section */}
            <div>
              <h4 style={{ color: "var(--text-primary)", fontSize: "1rem", fontWeight: "600", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText size={18} color="var(--accent)" />
                <span>Incident Filings History ({getUserComplaints(selectedUser.id).length})</span>
              </h4>

              {getUserComplaints(selectedUser.id).length === 0 ? (
                <div style={{
                  background: "rgba(3, 3, 7, 0.4)",
                  padding: "20px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-muted)",
                  textAlign: "center",
                  fontSize: "0.85rem"
                }}>
                  This user has not submitted any complaints in the SOC logs registry database.
                </div>
              ) : (
                <div className="complaint-table-container">
                  <table className="complaint-table">
                    <thead>
                      <tr>
                        <th>Case ID</th>
                        <th>Category</th>
                        <th>Incident Date</th>
                        <th>Priority</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getUserComplaints(selectedUser.id).map(complaint => (
                        <tr key={complaint.id}>
                          <td style={{ fontFamily: "monospace", color: "var(--accent)" }}>
                            {complaint.complaintId}
                          </td>
                          <td style={{ color: "var(--text-primary)", fontWeight: "500" }}>{complaint.category}</td>
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
    </motion.div>
  );
}

export default AdminUsers;
