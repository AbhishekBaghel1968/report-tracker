import { useSocket } from "../context/SocketContext";
import { Trash2, Check, CheckCheck, BellOff, X } from "lucide-react";
import { Link } from "react-router-dom";

function NotificationDropdown({ onClose }) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    clearNotifications,
  } = useSocket();

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return "";
    }
  };

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

  return (
    <div
      style={{
        position: "absolute",
        top: "55px",
        right: 0,
        width: "360px",
        background: "rgba(10, 10, 18, 0.98)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--radius-md, 14px)",
        boxShadow: "0 15px 40px rgba(0,0,0,0.8), 0 0 20px rgba(0, 240, 255, 0.05)",
        zIndex: 9999,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: "450px"
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(255, 255, 255, 0.01)"
        }}
      >
        <div>
          <span style={{ fontWeight: "700", fontSize: "0.95rem", letterSpacing: "0.05em", color: "var(--text-primary)" }}>
            NOTIFICATION CONSOLE
          </span>
          {unreadCount > 0 && (
            <span style={{
              marginLeft: "8px",
              background: "var(--accent-light)",
              color: "var(--accent)",
              fontSize: "0.75rem",
              padding: "2px 8px",
              borderRadius: "100px",
              fontWeight: "600"
            }}>
              {unreadCount} new
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px",
            borderRadius: "50%",
            transition: "var(--transition)"
          }}
          onMouseOver={(e) => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseOut={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
        >
          <X size={16} />
        </button>
      </div>

      {/* Action Toolbar */}
      {notifications.length > 0 && (
        <div
          style={{
            padding: "8px 16px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            background: "rgba(0, 0, 0, 0.2)",
          }}
        >
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            style={{
              background: "transparent",
              border: "none",
              color: unreadCount === 0 ? "var(--text-muted)" : "var(--accent)",
              cursor: unreadCount === 0 ? "default" : "pointer",
              fontSize: "0.75rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <CheckCheck size={14} /> Mark all read
          </button>
          <button
            onClick={clearNotifications}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--danger)",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <Trash2 size={14} /> Clear all
          </button>
        </div>
      )}

      {/* List Container */}
      <div style={{ overflowY: "auto", flexGrow: 1, minHeight: "150px" }}>
        {notifications.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px"
            }}
          >
            <BellOff size={32} style={{ opacity: 0.4, color: "var(--text-muted)" }} />
            No new alerts logged.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--border-color)",
                borderLeft: `3px solid ${getBorderColor(notif.type)}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
                background: notif.isRead ? "transparent" : "rgba(0, 240, 255, 0.02)",
                transition: "var(--transition)",
              }}
            >
              <div style={{ flexGrow: 1 }}>
                <p style={{
                  fontWeight: "700",
                  fontSize: "0.82rem",
                  color: getBorderColor(notif.type),
                  textTransform: "uppercase",
                  letterSpacing: "0.02em"
                }}>
                  {notif.title}
                </p>
                <p style={{
                  fontSize: "0.82rem",
                  color: notif.isRead ? "var(--text-secondary)" : "var(--text-primary)",
                  marginTop: "3px",
                  lineHeight: "1.4"
                }}>
                  {notif.message}
                </p>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "6px", display: "inline-block" }}>
                  {formatTime(notif.createdAt)}
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0, alignSelf: "center" }}>
                {!notif.isRead && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    title="Mark as read"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "var(--success)",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "var(--transition)"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "var(--success-light)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  >
                    <Check size={14} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notif.id)}
                  title="Delete"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "var(--danger)",
                    cursor: "pointer",
                    padding: "4px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "var(--transition)"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "var(--danger-light)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Footer view all link */}
      <div style={{
        padding: "12px",
        textAlign: "center",
        borderTop: "1px solid var(--border-color)",
        background: "rgba(0,0,0,0.25)"
      }}>
        <Link 
          to="/notifications" 
          onClick={onClose} 
          style={{ 
            color: "var(--accent)", 
            fontSize: "0.82rem", 
            fontWeight: "700", 
            textDecoration: "none", 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "6px",
            letterSpacing: "0.02em"
          }}
        >
          Open Alert Center →
        </Link>
      </div>
    </div>
  );
}

export default NotificationDropdown;
