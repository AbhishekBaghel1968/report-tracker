import { useState, useRef, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { useSocket } from "../context/SocketContext";
import NotificationDropdown from "./NotificationDropdown";

function NotificationBell() {
  const { unreadCount } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={bellRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid var(--border-color)",
          padding: "10px",
          borderRadius: "50%",
          cursor: "pointer",
          color: unreadCount > 0 ? "var(--accent)" : "var(--text-secondary)",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "var(--transition)",
          outline: "none"
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
          e.currentTarget.style.borderColor = "rgba(0, 240, 255, 0.2)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
          e.currentTarget.style.borderColor = "var(--border-color)";
        }}
      >
        {unreadCount > 0 ? (
          <Bell size={20} className="shake-animation" style={{ filter: "drop-shadow(0 0 4px rgba(0, 240, 255, 0.4))" }} />
        ) : (
          <BellOff size={20} />
        )}

        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              background: "var(--danger)",
              color: "#ffffff",
              fontSize: "0.7rem",
              fontWeight: "700",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 8px var(--danger)"
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      )}

      {/* Shake keyframe animation styling injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-10deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-8deg); }
          50% { transform: rotate(6deg); }
          60% { transform: rotate(-4deg); }
          70% { transform: rotate(3deg); }
          80% { transform: rotate(-2deg); }
          90% { transform: rotate(1deg); }
          100% { transform: rotate(0deg); }
        }
        .shake-animation {
          animation: shake 0.8s ease-in-out infinite;
          transform-origin: top center;
        }
      `}} />
    </div>
  );
}

export default NotificationBell;
