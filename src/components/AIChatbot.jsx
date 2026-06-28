import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, ShieldAlert, Loader2, Bot } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function AIChatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Sentinel AI active. Ask me about cyber safety, OTP security, phishing, or how to report an incident." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!user) return null; // Only available for logged in users

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setMessages(prev => [...prev, { sender: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await api.post("/ai/chatbot", { message: userText });
      setMessages(prev => [...prev, { sender: "bot", text: res.data.response }]);
    } catch (err) {
      console.error("Chatbot communication failed:", err);
      setMessages(prev => [...prev, { sender: "bot", text: "Connection error: Failed to communicate with security diagnostics. Verify server is online." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: 99999 }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
            color: "#07070d",
            border: "none",
            borderRadius: "50%",
            width: "60px",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(0, 240, 255, 0.4)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            outline: "none"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = "0 0 25px rgba(0, 240, 255, 0.6)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 240, 255, 0.4)";
          }}
        >
          <Bot size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            width: "360px",
            height: "480px",
            background: "rgba(10, 10, 18, 0.98)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--glass-border)",
            borderRadius: "16px",
            boxShadow: "0 15px 45px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 240, 255, 0.05)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transition: "all 0.3s ease"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px",
              background: "rgba(255,255,255,0.02)",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Bot size={20} color="var(--accent)" />
              <span style={{ fontWeight: "700", fontSize: "0.9rem", letterSpacing: "0.05em", color: "var(--text-primary)" }}>
                SENTINEL AI ASSIST
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center"
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  background: msg.sender === "user" ? "var(--primary-light)" : "rgba(3, 3, 7, 0.6)",
                  border: msg.sender === "user" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid var(--border-color)",
                  borderRadius: "12px",
                  borderBottomRightRadius: msg.sender === "user" ? "2px" : "12px",
                  borderBottomLeftRadius: msg.sender === "bot" ? "2px" : "12px",
                  padding: "10px 14px",
                  fontSize: "0.85rem",
                  color: "var(--text-primary)",
                  lineHeight: "1.4"
                }}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "0.8rem", padding: "4px" }}>
                <Loader2 size={14} className="spin-animation" style={{ animation: "spin 1s linear infinite" }} />
                <span>Decrypting response...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--border-color)",
              background: "rgba(0,0,0,0.2)",
              display: "flex",
              gap: "8px",
              alignItems: "center"
            }}
          >
            <input
              type="text"
              placeholder="Ask Sentinel AI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "rgba(3, 3, 7, 0.6)",
                color: "var(--text-primary)",
                fontSize: "0.85rem",
                marginBottom: 0
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: "36px",
                height: "36px",
                minWidth: "36px",
                borderRadius: "8px",
                background: "var(--primary)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "white",
                marginBottom: 0,
                padding: 0
              }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default AIChatbot;
