import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { initiateSocketConnection } from "../services/socket";
import api from "../services/api";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial notification history
  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error("Failed to fetch notifications list:", err);
    }
  };

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Connect to backend socket server
    const socketInstance = initiateSocketConnection(token, user.id, user.role);

    socketInstance.on("connect", () => {
      console.log("Connected to real-time notification socket gateway:", socketInstance.id);
      fetchNotifications();
    });

    socketInstance.on("notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((c) => c + 1);

      // Play custom/browser audio alert or show toast alert
      const typeColor = notification.type === "SUCCESS" ? "var(--success)" :
                        notification.type === "ERROR" ? "var(--danger)" :
                        notification.type === "WARNING" ? "var(--warning)" :
                        "var(--accent)";

      toast.custom((t) => (
        <div
          className={`${t.visible ? 'animate-enter' : 'animate-leave'}`}
          style={{
            maxWidth: "380px",
            width: "100%",
            background: "rgba(10, 10, 18, 0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderLeft: `4px solid ${typeColor}`,
            borderRadius: "var(--radius-md, 14px)",
            padding: "16px",
            color: "var(--text-primary)",
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.7), 0 0 15px ${typeColor}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pointerEvents: "auto"
          }}
        >
          <div style={{ flex: 1, marginRight: "12px" }}>
            <p style={{ fontWeight: "700", fontSize: "0.85rem", color: typeColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              🔔 {notification.title || "SECURITY ALERT"}
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", marginTop: "4px", lineHeight: "1.4" }}>
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: "600",
              padding: "4px 8px",
              borderRadius: "4px",
              transition: "var(--transition)"
            }}
            onMouseOver={(e) => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseOut={(e) => e.currentTarget.style.color = "var(--text-muted)"}
          >
            Dismiss
          </button>
        </div>
      ), { duration: 5000 });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => {
        const target = prev.find(n => n.id === id);
        if (target && !target.isRead) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(n => n.id !== id);
      });
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadList = notifications.filter(n => !n.isRead);
      if (unreadList.length > 0) {
        await Promise.all(unreadList.map(n => api.put(`/notifications/${n.id}/read`)));
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const clearNotifications = async () => {
    try {
      if (notifications.length > 0) {
        await Promise.all(notifications.map(n => api.delete(`/notifications/${n.id}`)));
      }
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead, clearNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};
