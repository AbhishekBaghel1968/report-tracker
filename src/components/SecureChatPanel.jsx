import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, ShieldAlert, Loader2, User } from "lucide-react";
import api from "../services/api";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

function SecureChatPanel({ complaintId, role }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/chat/${complaintId}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to load chat history:", err);
      setError("Chat server connection refused.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    if (socket) {
      // Join socket room
      socket.emit("join_chat", { complaintId });

      // Listen for incoming message
      const handleNewMessage = (newMessage) => {
        setMessages((prev) => {
          // Avoid duplicate rendering
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      };

      socket.on("chat_message", handleNewMessage);

      return () => {
        socket.emit("leave_chat", { complaintId });
        socket.off("chat_message", handleNewMessage);
      };
    }
  }, [complaintId, socket]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageText = input.trim();
    setInput("");

    try {
      // Send message to REST API (which automatically emits via Socket.IO)
      await api.post(`/chat/${complaintId}`, { message: messageText });
    } catch (err) {
      console.error("Failed to send chat message:", err);
      alert("Failed to deliver message. Verify authorization.");
    }
  };

  return (
    <div style={{
      background: "var(--glass-bg)",
      border: "1px solid var(--glass-border)",
      borderRadius: "var(--radius-lg, 12px)",
      height: "450px",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "var(--shadow-md)"
    }}>
      {/* Panel Header */}
      <div style={{
        padding: "14px 20px",
        background: "rgba(255,255,255,0.01)",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}>
        <MessageSquare size={16} color="var(--accent)" style={{ filter: "drop-shadow(0 0 4px var(--accent-glow))" }} />
        <div>
          <span style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--text-primary)", letterSpacing: "0.05em", display: "block" }}>
            SECURE LINK COMMUNICATION
          </span>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            Encrypted tunnel: Citizen &lt;--&gt; Assigned Badge
          </span>
        </div>
      </div>

      {/* Messages Window */}
      <div style={{
        flex: 1,
        padding: "20px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        background: "rgba(3, 3, 7, 0.2)"
      }}>
        {loading && messages.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-secondary)" }}>
            <Loader2 size={24} className="spin-animation" style={{ animation: "spin 1s linear infinite", color: "var(--accent)", marginBottom: "8px" }} />
            <span style={{ fontSize: "0.8rem" }}>Decrypting transmission...</span>
          </div>
        ) : error ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--danger)", padding: "20px", textAlign: "center" }}>
            <ShieldAlert size={24} style={{ marginBottom: "8px" }} />
            <span style={{ fontSize: "0.8rem" }}>{error}</span>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center" }}>
            <MessageSquare size={24} style={{ opacity: 0.3, marginBottom: "8px" }} />
            <span>No transmission logs found. Initiate chat below.</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId == user.id;
            const senderRole = msg.sender?.role?.replace("ROLE_", "")?.toLowerCase() || "user";
            
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  maxWidth: "75%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start"
                }}
              >
                {/* Sender label */}
                {!isMe && (
                  <span style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: "600", marginBottom: "3px", textTransform: "uppercase" }}>
                    {msg.sender?.name} ({senderRole})
                  </span>
                )}
                {/* Bubble */}
                <div style={{
                  background: isMe ? "var(--primary-light)" : "rgba(10, 10, 18, 0.8)",
                  border: isMe ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid var(--border-color)",
                  borderRadius: "10px",
                  borderBottomRightRadius: isMe ? "2px" : "10px",
                  borderBottomLeftRadius: isMe ? "10px" : "2px",
                  padding: "10px 14px",
                  fontSize: "0.85rem",
                  color: "var(--text-primary)",
                  lineHeight: "1.4"
                }}>
                  {msg.message}
                </div>
                {/* Time */}
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border-color)",
          background: "rgba(0,0,0,0.1)",
          display: "flex",
          gap: "10px",
          alignItems: "center"
        }}
      >
        <input
          type="text"
          placeholder="Transmit encrypted message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            background: "rgba(3, 3, 7, 0.5)",
            color: "var(--text-primary)",
            fontSize: "0.85rem",
            marginBottom: 0
          }}
          disabled={loading || !!error}
        />
        <button
          type="submit"
          disabled={!input.trim() || !!error}
          style={{
            width: "auto",
            height: "38px",
            padding: "0 18px",
            borderRadius: "8px",
            background: "var(--accent)",
            color: "#07070d",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "0.85rem",
            marginBottom: 0
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "var(--accent-hover)"}
          onMouseOut={(e) => e.currentTarget.style.background = "var(--accent)"}
        >
          <Send size={12} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}

export default SecureChatPanel;
