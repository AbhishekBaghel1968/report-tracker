import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || (user.role !== "ROLE_ADMIN" && user.role !== "ROLE_OFFICER")) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketInstance = io("http://localhost:8080", {
      withCredentials: true,
    });

    socketInstance.on("connect", () => {
      console.log("Connected to SOC real-time gateway:", socketInstance.id);
    });

    socketInstance.on("notification", (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((c) => c + 1);

      // Play audio indicator or emit browser toast
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-slate-900 border border-cyan-500/30 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          style={{
            background: "rgba(10, 10, 20, 0.95)",
            borderLeft: "4px solid var(--accent)",
            padding: "16px",
            color: "var(--text-primary)",
            fontFamily: "var(--font-primary, sans-serif)",
            boxShadow: "0 0 15px rgba(0, 240, 255, 0.25)"
          }}
        >
          <div className="flex-1 w-0">
            <p style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--text-primary)" }}>
              SOC ALERT
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
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
              paddingLeft: "10px"
            }}
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

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, markAllAsRead, clearNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};
