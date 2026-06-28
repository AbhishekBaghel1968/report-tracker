import { motion } from "framer-motion";
import { Check, Clock, User, ShieldAlert, Calendar, FileText } from "lucide-react";

const STAGES = [
  { key: "SUBMITTED", label: "Complaint Submitted", defaultMsg: "Complaint registered successfully in the portal." },
  { key: "UNDER_REVIEW", label: "Under Review", defaultMsg: "Security operations officer is checking the incident details." },
  { key: "ASSIGNED", label: "Assigned to Officer", defaultMsg: "Case assigned to an investigator for deep analysis." },
  { key: "INVESTIGATING", label: "Investigation Started", defaultMsg: "Cyber investigations and trace forensics are underway." },
  { key: "EVIDENCE_COLLECTED", label: "Evidence Collected", defaultMsg: "Forensic evidence files have been logged into the chain of custody." },
  { key: "RESOLVED", label: "Resolved / Rejected", defaultMsg: "Case classification finalized and closed." },
];

function CaseTimeline({ complaint, timelineEntries = [] }) {
  if (!complaint) return null;

  // Determine current stage index based on complaint status and data
  let currentStageIndex = 0;
  if (complaint.status === "RESOLVED" || complaint.status === "REJECTED") {
    currentStageIndex = 5;
  } else {
    // If evidence files are uploaded or a timeline entry for it exists
    const hasEvidence = 
      (complaint.evidenceFiles && complaint.evidenceFiles.length > 0) || 
      (complaint.evidenceUploads && complaint.evidenceUploads.length > 0) ||
      timelineEntries.some(e => e.stage === "EVIDENCE_COLLECTED");
      
    if (hasEvidence) {
      currentStageIndex = 4;
    } else if (complaint.status === "INVESTIGATING") {
      currentStageIndex = 3;
    } else if (complaint.officerId || complaint.officer) {
      currentStageIndex = 2;
    } else if (complaint.status === "UNDER_REVIEW") {
      currentStageIndex = 1;
    } else {
      currentStageIndex = 0;
    }
  }

  // Map each of the 6 stages to its actual status
  const mappedStages = STAGES.map((stageInfo, index) => {
    // Find database matching entries
    const matches = timelineEntries.filter(entry => {
      if (stageInfo.key === "RESOLVED") {
        return entry.stage === "RESOLVED" || entry.stage === "REJECTED";
      }
      return entry.stage === stageInfo.key;
    });

    const hasEntry = matches.length > 0;
    const entry = hasEntry ? matches[matches.length - 1] : null;

    let isCompleted = index < currentStageIndex || hasEntry;
    let isCurrent = index === currentStageIndex && !hasEntry;

    // Boundary condition for final stage
    if (index === 5 && (complaint.status === "RESOLVED" || complaint.status === "REJECTED")) {
      isCompleted = true;
      isCurrent = false;
    }

    // Set correct stage label if rejected
    let label = stageInfo.label;
    if (index === 5 && complaint.status === "REJECTED") {
      label = "Complaint Rejected";
    }

    return {
      ...stageInfo,
      label,
      index,
      isCompleted,
      isCurrent,
      isPending: !isCompleted && !isCurrent,
      entry,
    };
  });

  // Calculate overall progress percentage
  const completedCount = mappedStages.filter(s => s.isCompleted).length;
  const progressPercent = Math.min(100, Math.round((completedCount / STAGES.length) * 100));

  // Determine estimated resolution time based on priority and category
  const getEstimatedResolution = () => {
    if (complaint.status === "RESOLVED" || complaint.status === "REJECTED") {
      return "Case Closed";
    }
    const createdDate = new Date(complaint.createdAt);
    let daysToAdd = 7; // default for low priority
    if (complaint.priority === "HIGH") {
      daysToAdd = 2; // 48 Hours
    } else if (complaint.priority === "MEDIUM") {
      daysToAdd = 4; // 4 Days
    }
    createdDate.setDate(createdDate.getDate() + daysToAdd);
    return createdDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  // Helper to format date nicely
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) + " | " + d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  return (
    <div style={{
      background: "var(--glass-bg)",
      border: "1px solid var(--glass-border)",
      borderRadius: "var(--radius-lg)",
      padding: "30px",
      boxShadow: "var(--shadow-md)",
      marginTop: "40px",
      position: "relative"
    }} className="case-timeline-container print-section">
      
      {/* Header Info */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px",
        marginBottom: "25px",
        borderBottom: "1px solid var(--border-color)",
        paddingBottom: "18px"
      }}>
        <div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text-primary)" }}>
            Case Investigation Stepper
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "3px" }}>
            Visual audit log of complaint milestones and forensic updates.
          </p>
        </div>
        
        {/* Progress & Est Boxes */}
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          <div style={{
            background: "rgba(139, 92, 246, 0.08)",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            textAlign: "center"
          }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Progress</p>
            <p style={{ color: "var(--primary)", fontSize: "1.1rem", fontWeight: "700", marginTop: "2px" }}>{progressPercent}%</p>
          </div>
          <div style={{
            background: "rgba(0, 240, 255, 0.08)",
            border: "1px solid rgba(0, 240, 255, 0.2)",
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            textAlign: "center"
          }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Target SLA</p>
            <p style={{ color: "var(--accent)", fontSize: "1.1rem", fontWeight: "700", marginTop: "2px" }}>{getEstimatedResolution()}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar Display */}
      <div style={{ marginBottom: "35px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "600", marginBottom: "8px" }}>
          <span style={{ color: "var(--text-secondary)" }}>Complaint Status Journey</span>
          <span style={{ color: "var(--primary)" }}>{completedCount} of 6 Stages Active</span>
        </div>
        <div style={{ height: "6px", width: "100%", background: "rgba(255, 255, 255, 0.03)", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.02)" }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ height: "100%", background: "linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)", borderRadius: "10px" }}
          />
        </div>
      </div>

      {/* Vertical Stepper Container */}
      <div style={{ position: "relative", paddingLeft: "45px" }}>
        
        {/* Stepper Center Line */}
        <div style={{
          position: "absolute",
          top: "12px",
          bottom: "12px",
          left: "20px",
          width: "2px",
          background: "rgba(255, 255, 255, 0.06)",
          zIndex: 1
        }} />

        {/* Dynamic Stepper Progress Line */}
        <motion.div 
          initial={{ height: 0 }}
          animate={{ height: `${Math.max(0, ((completedCount - 1) / 5) * 100)}%` }}
          transition={{ duration: 1, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "12px",
            left: "20px",
            width: "2px",
            background: "linear-gradient(to bottom, var(--success) 0%, var(--primary) 70%, var(--accent) 100%)",
            originY: 0,
            zIndex: 2
          }}
        />

        {/* Stepper Nodes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          {mappedStages.map((stage, idx) => {
            const dateText = stage.entry ? formatDate(stage.entry.createdAt) : (stage.isCompleted && complaint.createdAt ? formatDate(complaint.createdAt) : null);
            const messageText = stage.entry ? stage.entry.message : stage.defaultMsg;
            const authorText = stage.entry ? `Updated by ${stage.entry.updatedBy}` : (stage.isCompleted ? "System Initiated" : null);
            const roleText = stage.entry ? stage.entry.role : (stage.isCompleted ? "SYSTEM" : null);

            return (
              <motion.div 
                key={stage.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                style={{
                  display: "flex",
                  position: "relative",
                  alignItems: "flex-start"
                }}
              >
                
                {/* Node Circle Indicator */}
                <div style={{
                  position: "absolute",
                  left: "-45px",
                  top: "2px",
                  zIndex: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {stage.isCompleted ? (
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "var(--success-light)",
                      border: "2px solid var(--success)",
                      color: "var(--success)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 10px rgba(16, 185, 129, 0.2)"
                    }}>
                      <Check size={16} strokeWidth={3} />
                    </div>
                  ) : stage.isCurrent ? (
                    <motion.div 
                      animate={{ scale: [1, 1.12, 1], boxShadow: ["0 0 8px var(--accent-glow)", "0 0 16px rgba(0, 240, 255, 0.5)", "0 0 8px var(--accent-glow)"] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "rgba(0, 240, 255, 0.12)",
                        border: "2px solid var(--accent)",
                        color: "var(--accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "0.85rem"
                      }}
                    >
                      <Clock size={16} />
                    </motion.div>
                  ) : (
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "var(--bg-secondary)",
                      border: "2px solid var(--border-color)",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      fontWeight: "700"
                    }}>
                      {idx + 1}
                    </div>
                  )}
                </div>

                {/* Glassmorphic Card content */}
                <div style={{
                  flex: 1,
                  background: stage.isPending ? "rgba(255,255,255,0.01)" : "rgba(10, 10, 20, 0.4)",
                  border: stage.isCurrent ? "1px solid rgba(0, 240, 255, 0.25)" : "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px 20px",
                  marginLeft: "12px",
                  transition: "var(--transition)",
                  boxShadow: stage.isCurrent ? "0 4px 15px rgba(0, 240, 255, 0.05)" : "none"
                }} className={stage.isPending ? "timeline-card-pending" : "timeline-card-active"}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px"
                  }}>
                    <h4 style={{
                      fontSize: "0.95rem",
                      fontWeight: "700",
                      color: stage.isPending ? "var(--text-muted)" : (stage.isCurrent ? "var(--accent)" : "var(--text-primary)")
                    }}>
                      {stage.label}
                    </h4>

                    {dateText && (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={12} />
                        {dateText}
                      </span>
                    )}
                  </div>

                  <p style={{
                    fontSize: "0.85rem",
                    color: stage.isPending ? "var(--text-muted)" : "var(--text-secondary)",
                    marginTop: "6px",
                    lineHeight: "1.4"
                  }}>
                    {messageText}
                  </p>

                  {authorText && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginTop: "10px",
                      paddingTop: "8px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.03)",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)"
                    }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <User size={12} />
                        {authorText}
                      </span>
                      {roleText && (
                        <span style={{
                          background: roleText.includes("ADMIN") ? "var(--danger-light)" : (roleText.includes("OFFICER") ? "var(--accent-light)" : "rgba(255,255,255,0.04)"),
                          color: roleText.includes("ADMIN") ? "var(--danger)" : (roleText.includes("OFFICER") ? "var(--accent)" : "var(--text-secondary)"),
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          fontWeight: "700"
                        }}>
                          {roleText.replace("ROLE_", "")}
                        </span>
                      )}
                    </div>
                  )}
                </div>

              </motion.div>
            );
          })}
        </div>

      </div>

    </div>
  );
}

export default CaseTimeline;
