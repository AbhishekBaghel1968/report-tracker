import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role === "ROLE_ADMIN") {
      navigate("/admin-dashboard");
    } else if (user.role === "ROLE_OFFICER") {
      navigate("/officer");
    } else if (user.role === "ROLE_CITIZEN") {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "75vh",
      width: "100%",
      padding: "20px"
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 15 }}
        style={{
          background: "var(--glass-bg)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-lg)",
          padding: "45px 35px",
          maxWidth: "500px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 15px 35px rgba(0, 0, 0, 0.4), 0 0 30px rgba(244, 63, 94, 0.05)"
        }}
      >
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "24px"
        }}>
          <div style={{
            background: "rgba(244, 63, 94, 0.08)",
            padding: "16px",
            borderRadius: "50%",
            color: "var(--danger)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 25px rgba(244, 63, 94, 0.15)",
            border: "1px solid rgba(244, 63, 94, 0.2)"
          }}>
            <ShieldAlert size={48} />
          </div>
        </div>

        <h2 style={{
          fontSize: "1.75rem",
          fontWeight: "800",
          color: "var(--text-primary)",
          marginBottom: "12px"
        }}>
          Access Denied
        </h2>
        
        <p style={{
          color: "var(--text-secondary)",
          fontSize: "0.95rem",
          lineHeight: "1.6",
          marginBottom: "32px"
        }}>
          Your account is not authorized to access this terminal segment. Unapproved entry attempts are logged for system audit purposes.
        </p>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          <button
            onClick={handleGoBack}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "var(--primary)",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "0.9rem",
              transition: "var(--transition)",
              boxShadow: "0 4px 14px var(--primary-glow)"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "var(--primary-hover)"}
            onMouseOut={(e) => e.currentTarget.style.background = "var(--primary)"}
          >
            <Home size={16} />
            <span>Go to My Dashboard</span>
          </button>

          <button
            onClick={() => navigate("/")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "transparent",
              color: "var(--text-secondary)",
              padding: "12px 24px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-color)",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.9rem",
              transition: "var(--transition)"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <ArrowLeft size={16} />
            <span>Return to Home</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default Unauthorized;
