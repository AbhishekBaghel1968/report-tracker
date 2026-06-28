import { useState } from "react";
import { useSocket } from "../context/SocketContext";
import { 
  Search, Bell, BellOff, Archive, Trash2, Check, CheckCheck, 
  Volume2, VolumeX, AlertTriangle, CheckCircle, Info, ShieldAlert, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    soundMuted,
    toggleSound,
    markAsRead,
    archiveNotification,
    deleteNotification,
    markAllAsRead,
    clearNotifications,
  } = useSocket();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all", "unread", "archived"
  const [severityFilter, setSeverityFilter] = useState("ALL"); // "ALL", "SUCCESS", "INFO", "WARNING", "ERROR"

  const getBorderColor = (type) => {
    switch (type) {
      case "SUCCESS":
        return "var(--success)";
      case "ERROR":
        return "var(--danger)";
      case "WARNING":
        return "var(--warning)";
      default:
        return "var(--accent)";
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle size={18} color="var(--success)" />;
      case "ERROR":
        return <ShieldAlert size={18} color="var(--danger)" />;
      case "WARNING":
        return <AlertTriangle size={18} color="var(--warning)" />;
      default:
        return <Info size={18} color="var(--accent)" />;
    }
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' | ' + date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return "";
    }
  };

  // Filter notifications based on tab, severity, and search query
  const filteredNotifications = notifications.filter(notif => {
    // 1. Filter by search query
    const matchesSearch = 
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Filter by Active Tab
    let matchesTab = true;
    if (activeTab === "unread") {
      matchesTab = !notif.isRead && !notif.isArchived;
    } else if (activeTab === "archived") {
      matchesTab = notif.isArchived;
    } else {
      // "all" tab: do not show archived alerts by default unless tab is specifically archived
      matchesTab = !notif.isArchived;
    }

    // 3. Filter by severity
    const matchesSeverity = severityFilter === "ALL" || notif.type === severityFilter;

    return matchesSearch && matchesTab && matchesSeverity;
  });

  const getSeverityBadgeCount = (type) => {
    return notifications.filter(n => 
      !n.isArchived && 
      (activeTab === "unread" ? !n.isRead : true) && 
      (type === "ALL" ? true : n.type === type)
    ).length;
  };

  return (
    <div style={{
      width: "100%",
      background: "var(--glass-bg)",
      border: "1px solid var(--glass-border)",
      borderRadius: "var(--radius-lg, 16px)",
      boxShadow: "var(--shadow-md)",
      padding: "30px",
      marginTop: "20px",
      position: "relative"
    }}>
      {/* Top Console Bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "20px",
        borderBottom: "1px solid var(--border-color)",
        paddingBottom: "20px",
        marginBottom: "25px"
      }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "0.02em" }}>
            🛡️ Sentinel Cyber Alert Center
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
            Real-time security logs, complaint audits, and SOC broadcasts.
          </p>
        </div>

        {/* Audio controls & stats */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {/* Sound Toggle Button */}
          <button
            onClick={toggleSound}
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-color)",
              padding: "8px 16px",
              borderRadius: "var(--radius-sm, 6px)",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "var(--transition)"
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
            onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
          >
            {soundMuted ? (
              <>
                <VolumeX size={16} color="var(--danger)" />
                <span>Alert Sound: MUTED</span>
              </>
            ) : (
              <>
                <Volume2 size={16} color="var(--success)" />
                <span>Alert Sound: PLAY</span>
              </>
            )}
          </button>

          {/* Quick Counter */}
          <div style={{
            background: "rgba(0, 240, 255, 0.08)",
            border: "1px solid rgba(0, 240, 255, 0.2)",
            padding: "8px 16px",
            borderRadius: "var(--radius-sm, 6px)",
            textAlign: "center"
          }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Unread Alerts</span>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--accent)", marginTop: "2px" }}>{unreadCount}</div>
          </div>
        </div>
      </div>

      {/* Control panel and filters */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        marginBottom: "25px"
      }}>
        {/* Search & Tabs */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px"
        }}>
          {/* Tab Selector */}
          <div style={{
            display: "flex",
            background: "rgba(0,0,0,0.3)",
            padding: "4px",
            borderRadius: "8px",
            border: "1px solid var(--border-color)"
          }}>
            {[
              { id: "all", label: "Active Alerts" },
              { id: "unread", label: "Unread" },
              { id: "archived", label: "Archived Log" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? "rgba(255,255,255,0.06)" : "transparent",
                  color: activeTab === tab.id ? "var(--accent)" : "var(--text-secondary)",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "var(--transition)"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div style={{
            position: "relative",
            maxWidth: "320px",
            width: "100%"
          }}>
            <input
              type="text"
              placeholder="Search alert telemetry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm, 6px)",
                padding: "10px 16px 10px 40px",
                color: "var(--text-primary)",
                fontSize: "0.85rem",
                outline: "none",
                transition: "var(--transition)"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
            />
            <Search size={16} color="var(--text-muted)" style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none"
            }} />
          </div>
        </div>

        {/* Severity filter pills and bulk actions */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          borderTop: "1px dashed var(--border-color)",
          paddingTop: "18px"
        }}>
          {/* Severity Filters */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "All Levels" },
              { id: "SUCCESS", label: "Success" },
              { id: "INFO", label: "Info" },
              { id: "WARNING", label: "Warning" },
              { id: "ERROR", label: "Critical" }
            ].map(pill => {
              const isActive = severityFilter === pill.id;
              const count = getSeverityBadgeCount(pill.id);
              const pillColor = pill.id === "SUCCESS" ? "var(--success)" :
                                pill.id === "WARNING" ? "var(--warning)" :
                                pill.id === "ERROR" ? "var(--danger)" :
                                "var(--accent)";
              return (
                <button
                  key={pill.id}
                  onClick={() => setSeverityFilter(pill.id)}
                  style={{
                    background: isActive ? `rgba(${pill.id === "SUCCESS" ? "16,185,129" : pill.id === "WARNING" ? "245,158,11" : pill.id === "ERROR" ? "239,68,68" : "139,92,246"}, 0.08)` : "transparent",
                    color: isActive ? pillColor : "var(--text-secondary)",
                    border: isActive ? `1px solid ${pillColor}` : "1px solid var(--border-color)",
                    padding: "6px 12px",
                    borderRadius: "100px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "var(--transition)"
                  }}
                >
                  <span>{pill.label}</span>
                  <span style={{
                    background: isActive ? pillColor : "rgba(255, 255, 255, 0.05)",
                    color: isActive ? "#ffffff" : "var(--text-muted)",
                    padding: "1px 6px",
                    borderRadius: "10px",
                    fontSize: "0.65rem",
                    fontWeight: "700"
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bulk Actions */}
          {filteredNotifications.length > 0 && (
            <div style={{ display: "flex", gap: "10px" }}>
              {activeTab === "unread" && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--glass-border)",
                    padding: "6px 12px",
                    borderRadius: "var(--radius-sm, 6px)",
                    color: "var(--success)",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "var(--transition)"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "var(--success-light)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <CheckCheck size={14} /> Mark All Read
                </button>
              )}

              <button
                onClick={clearNotifications}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-sm, 6px)",
                  color: "var(--danger)",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "var(--transition)"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "var(--danger-light)"}
                onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
              >
                <Trash2 size={14} /> Clear All Logs
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div style={{ minHeight: "250px" }}>
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 20px",
                color: "var(--text-muted)",
                textAlign: "center",
                gap: "15px"
              }}
            >
              <BellOff size={48} style={{ opacity: 0.3, color: "var(--text-muted)" }} />
              <div>
                <p style={{ fontWeight: "700", fontSize: "1rem", color: "var(--text-primary)" }}>
                  No Alerts Telemetry Found
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Adjust filters or check back later for live system notifications.
                </p>
              </div>
            </motion.div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: notif.isRead ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 240, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    borderLeft: `4px solid ${getBorderColor(notif.type)}`,
                    borderRadius: "var(--radius-md, 10px)",
                    padding: "16px 20px",
                    gap: "20px",
                    transition: "var(--transition)",
                    boxShadow: notif.isRead ? "none" : "0 4px 12px rgba(0, 240, 255, 0.03)"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = getBorderColor(notif.type)}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
                >
                  {/* Left Side: Icon & Copy */}
                  <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flex: 1 }}>
                    <div style={{ marginTop: "3px" }}>
                      {getAlertIcon(notif.type)}
                    </div>
                    <div>
                      <h4 style={{
                        fontWeight: "800",
                        fontSize: "0.9rem",
                        color: getBorderColor(notif.type),
                        textTransform: "uppercase",
                        letterSpacing: "0.03em"
                      }}>
                        {notif.title}
                      </h4>
                      <p style={{
                        fontSize: "0.88rem",
                        color: notif.isRead ? "var(--text-secondary)" : "var(--text-primary)",
                        marginTop: "5px",
                        lineHeight: "1.5"
                      }}>
                        {notif.message}
                      </p>
                      <span style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                        marginTop: "8px",
                        display: "inline-block"
                      }}>
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Quick Action buttons */}
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    {!notif.isRead && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        title="Mark as Read"
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid var(--border-color)",
                          color: "var(--success)",
                          cursor: "pointer",
                          padding: "6px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "var(--transition)"
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = "var(--success-light)";
                          e.currentTarget.style.borderColor = "var(--success)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                          e.currentTarget.style.borderColor = "var(--border-color)";
                        }}
                      >
                        <Check size={14} />
                      </button>
                    )}

                    {!notif.isArchived && (
                      <button
                        onClick={() => archiveNotification(notif.id)}
                        title="Archive Notification"
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid var(--border-color)",
                          color: "var(--accent)",
                          cursor: "pointer",
                          padding: "6px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "var(--transition)"
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = "var(--accent-light)";
                          e.currentTarget.style.borderColor = "var(--accent)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                          e.currentTarget.style.borderColor = "var(--border-color)";
                        }}
                      >
                        <Archive size={14} />
                      </button>
                    )}

                    <button
                      onClick={() => deleteNotification(notif.id)}
                      title="Delete Notification"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid var(--border-color)",
                        color: "var(--danger)",
                        cursor: "pointer",
                        padding: "6px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "var(--transition)"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "var(--danger-light)";
                        e.currentTarget.style.borderColor = "var(--danger)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                        e.currentTarget.style.borderColor = "var(--border-color)";
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default NotificationPanel;
