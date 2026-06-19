import { useNavigate } from "react-router-dom";
import { ShieldAlert, MapPin, ShieldCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

function Home() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 70, damping: 15 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ overflow: "hidden", position: "relative" }}
    >
      {/* Visual cyber mesh overlay */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "100%",
        backgroundImage: "linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
        zIndex: 0
      }} />

      {/* Hero Section */}
      <section className="hero">
        <motion.div variants={itemVariants}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(0, 240, 255, 0.05)",
            border: "1px solid rgba(0, 240, 255, 0.15)",
            padding: "6px 14px",
            borderRadius: "100px",
            fontSize: "0.85rem",
            fontWeight: "600",
            color: "var(--accent)",
            marginBottom: "24px",
            letterSpacing: "0.05em",
            textTransform: "uppercase"
          }}>
            <ShieldCheck size={14} /> Official Encryption Standard
          </div>
        </motion.div>

        <motion.h1 variants={itemVariants}>
          Cyber Crime <br />
          <span style={{ 
            background: "linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>Complaint Portal</span>
        </motion.h1>

        <motion.p variants={itemVariants}>
          Report internet frauds, identity theft, and cyber harassment securely. Monitor real-time investigations through end-to-end encrypted tracking.
        </motion.p>

        <motion.div variants={itemVariants}>
          <button 
            className="hero-btn" 
            onClick={() => navigate("/complaint")}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <span>Report Cyber Crime</span>
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </section>

      {/* Features Row */}
      <motion.section className="features" variants={itemVariants}>
        <motion.div 
          className="card" 
          onClick={() => navigate("/complaint")}
          whileHover={{ y: -8, transition: { duration: 0.2 } }}
        >
          <div style={{
            width: "50px",
            height: "50px",
            borderRadius: "12px",
            background: "var(--danger-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            color: "var(--danger)"
          }}>
            <ShieldAlert size={24} />
          </div>
          <h2>Report Crime</h2>
          <p>File incident report anonymously or with details. Protected by quantum-safe encryption layers.</p>
        </motion.div>

        <motion.div 
          className="card" 
          onClick={() => navigate("/track-complaint")}
          whileHover={{ y: -8, transition: { duration: 0.2 } }}
        >
          <div style={{
            width: "50px",
            height: "50px",
            borderRadius: "12px",
            background: "var(--accent-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            color: "var(--accent)"
          }}>
            <MapPin size={24} />
          </div>
          <h2>Track Status</h2>
          <p>Input your secure tracking ID to follow live investigator notes, case classification, and resolution audits.</p>
        </motion.div>

        <motion.div 
          className="card"
          whileHover={{ y: -8, transition: { duration: 0.2 } }}
        >
          <div style={{
            width: "50px",
            height: "50px",
            borderRadius: "12px",
            background: "var(--primary-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            color: "var(--primary)"
          }}>
            <ShieldCheck size={24} />
          </div>
          <h2>Secure Portal</h2>
          <p>Under strict compliance of global IT and Privacy acts. Your identity details are strictly guarded.</p>
        </motion.div>
      </motion.section>
    </motion.div>
  );
}

export default Home;
