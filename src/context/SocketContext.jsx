import { createContext, useContext, useEffect, useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { initiateSocketConnection } from "../services/socket";
import api from "../services/api";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

// Dynamic beep synthesizer using Web Audio API
const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    // Cyber notification beep tone (D8 down to D6 slider)
    oscillator.frequency.setValueAtTime(987.77, audioCtx.currentTime); // B5
    oscillator.frequency.exponentialRampToValueAtTime(493.88, audioCtx.currentTime + 0.12); // B4

    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.12);
  } catch (e) {
    console.warn("Failed to play audio alert synthesizer:", e);
  }
};

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundMuted, setSoundMuted] = useState(
    localStorage.getItem("sentinel_sound_muted") === "true"
  );
  
  const soundMutedRef = useRef(soundMuted);

  useEffect(() => {
    soundMutedRef.current = soundMuted;
  }, [soundMuted]);

  const toggleSound = () => {
    const newVal = !soundMuted;
    setSoundMuted(newVal);
    localStorage.setItem("sentinel_sound_muted", String(newVal));
    toast.success(newVal ? "Sound alerts muted" : "Sound alerts enabled", {
      style: {
        background: "rgba(10, 10, 18, 0.95)",
        color: "var(--text-primary)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }
    });
  };

  // Fetch initial notification history
  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data);
      // Unread count excludes archived messages
      setUnreadCount(response.data.filter(n => !n.isRead && !n.isArchived).length);
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
      
      // Increment unread count only if not archived
      if (!notification.isArchived) {
        setUnreadCount((c) => c + 1);
      }

      // Play Dynamic Synthesized Beep if not muted
      if (!soundMutedRef.current) {
        playBeep();
      }

      // Custom cyber-themed toast display
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
      await api.put(`/notifications/read/${id}`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const archiveNotification = async (id) => {
    try {
      await api.put(`/notifications/archive/${id}`);
      setNotifications(prev => {
        const target = prev.find(n => n.id === id);
        if (target && !target.isRead && !target.isArchived) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.map(n => n.id === id ? { ...n, isArchived: true, isRead: true } : n);
      });
    } catch (err) {
      console.error("Failed to archive notification:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => {
        const target = prev.find(n => n.id === id);
        if (target && !target.isRead && !target.isArchived) {
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
      await api.put(`/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const clearNotifications = async () => {
    try {
      await api.delete(`/notifications/clear-all`);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      notifications, 
      unreadCount, 
      soundMuted, 
      toggleSound, 
      markAsRead, 
      archiveNotification, 
      deleteNotification, 
      markAllAsRead, 
      clearNotifications 
    }}>
      {children}
    </SocketContext.Provider>
  );
};
