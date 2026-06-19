import { useState, useEffect } from "react";
import { Filter, RotateCcw } from "lucide-react";

function AdminSearchFilters({ onFilterChange, currentFilters, categories, statuses }) {
  const [localSearchId, setLocalSearchId] = useState(currentFilters.complaintId || "");
  const [localSearchUser, setLocalSearchUser] = useState(currentFilters.userName || "");

  // Debounced search for Complaint ID
  useEffect(() => {
    const handler = setTimeout(() => {
      onFilterChange("complaintId", localSearchId);
    }, 350);
    return () => clearTimeout(handler);
  }, [localSearchId]);

  // Debounced search for User Name
  useEffect(() => {
    const handler = setTimeout(() => {
      onFilterChange("userName", localSearchUser);
    }, 350);
    return () => clearTimeout(handler);
  }, [localSearchUser]);

  // Handle resets
  const handleReset = () => {
    setLocalSearchId("");
    setLocalSearchUser("");
    onFilterChange("reset", null);
  };

  return (
    <div 
      className="profile-card" 
      style={{
        padding: "24px",
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--radius-md)",
        marginBottom: "25px",
        boxShadow: "var(--shadow-sm)"
      }}
    >
      <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
        <Filter size={18} color="var(--accent)" />
        <span>Incident Registry Filters</span>
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", alignItems: "end" }}>
        
        {/* Search ID */}
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "6px" }}>Tracking ID</label>
          <input
            type="text"
            placeholder="Search COMP-XXXX"
            value={localSearchId}
            onChange={(e) => setLocalSearchId(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-color)",
              background: "rgba(3, 3, 7, 0.4)",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              width: "100%",
              outline: "none"
            }}
          />
        </div>

        {/* Search User */}
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "6px" }}>User Name</label>
          <input
            type="text"
            placeholder="Search reporter..."
            value={localSearchUser}
            onChange={(e) => setLocalSearchUser(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-color)",
              background: "rgba(3, 3, 7, 0.4)",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              width: "100%",
              outline: "none"
            }}
          />
        </div>

        {/* Filter Status */}
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "6px" }}>Case Status</label>
          <select
            value={currentFilters.status || ""}
            onChange={(e) => onFilterChange("status", e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-color)",
              background: "rgba(3, 3, 7, 0.5)",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              width: "100%",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="">All Statuses</option>
            {statuses.map(s => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        {/* Filter Category */}
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "6px" }}>Category</label>
          <select
            value={currentFilters.category || ""}
            onChange={(e) => onFilterChange("category", e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-color)",
              background: "rgba(3, 3, 7, 0.5)",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              width: "100%",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "6px" }}>From Date</label>
          <input
            type="date"
            value={currentFilters.startDate || ""}
            onChange={(e) => onFilterChange("startDate", e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-color)",
              background: "rgba(3, 3, 7, 0.4)",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              width: "100%",
              outline: "none",
              cursor: "pointer"
            }}
          />
        </div>

        {/* End Date */}
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "6px" }}>To Date</label>
          <input
            type="date"
            value={currentFilters.endDate || ""}
            onChange={(e) => onFilterChange("endDate", e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-color)",
              background: "rgba(3, 3, 7, 0.4)",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              width: "100%",
              outline: "none",
              cursor: "pointer"
            }}
          />
        </div>

        {/* Reset Action */}
        <div style={{ justifySelf: "start", width: "100%" }}>
          <button
            onClick={handleReset}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
              fontSize: "0.85rem",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              width: "100%",
              transition: "var(--transition)"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default AdminSearchFilters;
