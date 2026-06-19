import { useState } from "react";
import { Eye, UserCheck, CheckCircle2, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function AdminComplaintsTable({ complaints, officers, onView, onResolve, onDelete, onAssign, currentUser }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState("");

  const isAdmin = currentUser?.role === "ROLE_ADMIN";

  const totalPages = Math.max(Math.ceil(complaints.length / pageSize), 1);
  const paginatedComplaints = complaints.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openAssignModal = (complaint) => {
    setAssignTarget(complaint);
    setSelectedOfficer(complaint.officerId || "");
  };

  const closeAssignModal = () => {
    setAssignTarget(null);
    setSelectedOfficer("");
  };

  const handleAssignSave = async () => {
    if (!assignTarget) return;
    await onAssign(assignTarget.id, selectedOfficer ? parseInt(selectedOfficer, 10) : null);
    closeAssignModal();
  };

  return (
    <div className="profile-card" style={{ padding: "30px", marginBottom: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)" }}>
          Registered Incident Logs
        </h3>
        
        {/* Page Size Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              setCurrentPage(1);
            }}
            style={{
              padding: "4px 8px",
              background: "rgba(3, 3, 7, 0.5)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            <option value={5}>5 logs</option>
            <option value={10}>10 logs</option>
            <option value={20}>20 logs</option>
          </select>
        </div>
      </div>

      {complaints.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)", background: "rgba(0, 0, 0, 0.2)", borderRadius: "var(--radius-md)" }}>
          No audit logs match these filter parameters.
        </div>
      ) : (
        <>
          <div className="complaint-table-container">
            <table className="complaint-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Reporter</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Assigned Officer</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="wait">
                  {paginatedComplaints.map((c) => (
                    <motion.tr 
                      key={c.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      whileHover={{ scale: 1.002, backgroundColor: "rgba(255, 255, 255, 0.02)" }}
                      style={{ cursor: "default" }}
                    >
                      <td style={{ fontWeight: "700", color: "var(--accent)" }}>{c.complaintId}</td>
                      <td>
                        <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{c.user?.name || "Citizen"}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{c.user?.email}</div>
                      </td>
                      <td>{c.category}</td>
                      <td>
                        <span style={{
                          fontSize: "0.8rem",
                          fontWeight: "700",
                          color: c.priority === "HIGH" ? "var(--danger)" : c.priority === "MEDIUM" ? "var(--warning)" : "var(--success)"
                        }}>
                          {c.priority}
                        </span>
                      </td>
                      <td style={{ color: c.officer?.name ? "var(--text-primary)" : "var(--text-muted)", fontSize: "0.85rem" }}>
                        {c.officer?.name || "Unassigned"}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(c.status)}`}>
                          {c.status.replace("_", " ")}
                        </span>
                      </td>
                      <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {/* View Button */}
                          <button
                            onClick={() => onView(c)}
                            style={{
                              border: "none",
                              background: "rgba(0, 240, 255, 0.06)",
                              color: "var(--accent)",
                              cursor: "pointer",
                              padding: "6px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "var(--transition)"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = "rgba(0, 240, 255, 0.15)"}
                            onMouseOut={(e) => e.currentTarget.style.background = "rgba(0, 240, 255, 0.06)"}
                            title="Audit Case Log"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {/* Assign Button */}
                          <button
                            onClick={() => openAssignModal(c)}
                            style={{
                              border: "none",
                              background: "rgba(139, 92, 246, 0.06)",
                              color: "#a78bfa",
                              cursor: "pointer",
                              padding: "6px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "var(--transition)"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = "rgba(139, 92, 246, 0.15)"}
                            onMouseOut={(e) => e.currentTarget.style.background = "rgba(139, 92, 246, 0.06)"}
                            title="Assign Case"
                          >
                            <UserCheck size={16} />
                          </button>

                          {/* Resolve Button */}
                          {c.status !== "RESOLVED" && (
                            <button
                              onClick={() => onResolve(c.id)}
                              style={{
                                border: "none",
                                background: "rgba(16, 185, 129, 0.06)",
                                color: "var(--success)",
                                cursor: "pointer",
                                padding: "6px",
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "var(--transition)"
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = "rgba(16, 185, 129, 0.15)"}
                              onMouseOut={(e) => e.currentTarget.style.background = "rgba(16, 185, 129, 0.06)"}
                              title="Resolve Incident"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}

                          {/* Delete Button (ADMIN-only) */}
                          {isAdmin && (
                            <button
                              onClick={() => onDelete(c.id)}
                              style={{
                                border: "none",
                                background: "rgba(244, 63, 94, 0.06)",
                                color: "var(--danger)",
                                cursor: "pointer",
                                padding: "6px",
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "var(--transition)"
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = "rgba(244, 63, 94, 0.15)"}
                              onMouseOut={(e) => e.currentTarget.style.background = "rgba(244, 63, 94, 0.06)"}
                              title="Delete Record"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", flexWrap: "wrap", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Showing {Math.min((currentPage - 1) * pageSize + 1, complaints.length)} to {Math.min(currentPage * pageSize, complaints.length)} of {complaints.length} records
            </span>

            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: "6px 12px",
                  background: "rgba(255, 255, 255, 0.03)",
                  color: currentPage === 1 ? "var(--text-muted)" : "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "4px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer"
                }}
              >
                <ChevronLeft size={16} />
              </button>
              
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => handlePageChange(index + 1)}
                  style={{
                    padding: "6px 12px",
                    background: currentPage === index + 1 ? "var(--primary)" : "transparent",
                    color: "#ffffff",
                    border: "1px solid " + (currentPage === index + 1 ? "var(--primary)" : "var(--border-color)"),
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  {index + 1}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: "6px 12px",
                  background: "rgba(255, 255, 255, 0.03)",
                  color: currentPage === totalPages ? "var(--text-muted)" : "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "4px",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer"
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Assignment Modal Overlay */}
      <AnimatePresence>
        {assignTarget && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(3, 3, 7, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: "90%",
                maxWidth: "420px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                padding: "24px",
                position: "relative"
              }}
            >
              <button 
                onClick={closeAssignModal}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer"
                }}
              >
                <X size={18} />
              </button>

              <h4 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", color: "var(--text-primary)" }}>
                Assign Complaint {assignTarget.complaintId}
              </h4>
              
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
                Select a cyber operations officer to investigate and audit this incident.
              </p>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Select Officer</label>
                <select
                  value={selectedOfficer}
                  onChange={(e) => setSelectedOfficer(e.target.value)}
                  style={{
                    padding: "10px",
                    width: "100%",
                    background: "rgba(3, 3, 7, 0.4)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem"
                  }}
                >
                  <option value="">-- Unassigned --</option>
                  {officers.map(off => (
                    <option key={off.id} value={off.id}>{off.name} ({off.email})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  onClick={closeAssignModal}
                  style={{
                    padding: "8px 16px",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.85rem"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignSave}
                  style={{
                    padding: "8px 16px",
                    background: "var(--primary)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "0.85rem"
                  }}
                >
                  Save Assignment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminComplaintsTable;
