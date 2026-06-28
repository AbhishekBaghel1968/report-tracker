import { useState, useEffect } from "react";
import { 
  ShieldAlert, ShieldCheck, Shield, Award, Terminal, 
  Cpu, Activity, CheckCircle, RefreshCw, AlertTriangle, AlertCircle, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import toast from "react-hot-toast";

function AIAnalyzer({ title, description, complaintId, existingAnalysis, onAnalysisComplete }) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysis, setAnalysis] = useState(null);

  const steps = [
    "Establishing encrypted connection to Sentinel AI node...",
    "Tokenizing complaint text and removing stop words...",
    "Scanning dictionaries for cybercrime match vectors...",
    "Extracting Indicator of Compromise (IOC) signifiers...",
    "Evaluating weighted transaction & threat trigger scores...",
    "Generating suggested mitigation checklist and report details..."
  ];

  useEffect(() => {
    if (existingAnalysis && existingAnalysis.category && existingAnalysis.riskScore) {
      setAnalysis(existingAnalysis);
    } else {
      setAnalysis(null);
    }
  }, [existingAnalysis]);

  // Loading steps animation
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 700);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleRunAnalysis = async () => {
    if (loading) return;
    setLoading(true);
    setLoadingStep(0);
    try {
      const response = await api.post("/ai/analyze", {
        title,
        description,
        complaintId
      });
      
      if (response.data && response.data.success) {
        toast.success("Security diagnostics scan complete.");
        setAnalysis(response.data.analysis);
        if (onAnalysisComplete) {
          onAnalysisComplete(response.data.analysis);
        }
      } else {
        throw new Error("Invalid API response format.");
      }
    } catch (err) {
      console.error("AI diagnostics scan failed:", err);
      toast.error(err.response?.data?.error || "AI evaluation server timeout occurred.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (String(severity).toUpperCase()) {
      case "HIGH": return "var(--danger)";
      case "MEDIUM": return "var(--warning)";
      case "LOW": return "var(--success)";
      default: return "var(--text-secondary)";
    }
  };

  const getSeverityBg = (severity) => {
    switch (String(severity).toUpperCase()) {
      case "HIGH": return "var(--danger-light)";
      case "MEDIUM": return "var(--warning-light)";
      case "LOW": return "var(--success-light)";
      default: return "rgba(255,255,255,0.02)";
    }
  };

  // Helper to determine circle meter path parameters
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const riskScoreVal = analysis?.riskScore || 0;
  const strokeDashoffset = circumference - (riskScoreVal / 100) * circumference;

  const getMeterColor = (score) => {
    if (score >= 75) return "#f43f5e"; // var(--danger)
    if (score >= 45) return "#f59e0b"; // var(--warning)
    return "#10b981"; // var(--success)
  };

  return (
    <div style={{
      background: "rgba(10, 10, 18, 0.95)",
      border: "1px solid var(--glass-border)",
      borderRadius: "var(--radius-lg)",
      padding: "30px",
      boxShadow: "var(--shadow-lg), 0 0 30px rgba(0, 240, 255, 0.03)",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background glowing effects */}
      <div style={{
        position: "absolute",
        top: "-50px",
        right: "-50px",
        width: "150px",
        height: "150px",
        background: `radial-gradient(circle, ${analysis ? getMeterColor(analysis.riskScore) + '15' : 'rgba(0, 240, 255, 0.08)'} 0%, transparent 70%)`,
        pointerEvents: "none",
        zIndex: 0
      }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", borderBottom: "1px solid var(--border-color)", paddingBottom: "15px", zIndex: 1, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            background: "rgba(0, 240, 255, 0.08)",
            border: "1px solid rgba(0, 240, 255, 0.2)",
            borderRadius: "10px",
            padding: "8px",
            color: "var(--accent)"
          }}>
            <Cpu size={20} style={{ animation: loading ? "pulse 1.5s infinite" : "none" }} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
              AI SEC Forensics Scanner
            </h3>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>VERSION: Sentinel NLP-ML v2.5</span>
          </div>
        </div>

        {!loading && (
          <button
            onClick={handleRunAnalysis}
            style={{
              width: "auto",
              margin: 0,
              padding: "8px 16px",
              background: "rgba(0, 240, 255, 0.05)",
              border: "1px solid rgba(0, 240, 255, 0.2)",
              borderRadius: "var(--radius-sm)",
              color: "var(--accent)",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "var(--transition)"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(0, 240, 255, 0.15)";
              e.currentTarget.style.borderColor = "var(--accent)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(0, 240, 255, 0.05)";
              e.currentTarget.style.borderColor = "rgba(0, 240, 255, 0.2)";
            }}
          >
            <RefreshCw size={14} className={loading ? "spin-animation" : ""} />
            <span>{analysis ? "Re-run Assessment" : "Run AI Assessment"}</span>
          </button>
        )}
      </div>

      {/* Main Contents Area */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {loading ? (
            /* SCANNER LOADER ANIMATION */
            <motion.div
              key="loader"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 10px",
                textAlign: "center"
              }}
            >
              <div style={{ position: "relative", width: "120px", height: "120px", marginBottom: "25px" }}>
                {/* Outer scanning loader circles */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  border: "2px dashed var(--accent)",
                  borderRadius: "50%",
                  animation: "spin 6s linear infinite"
                }} />
                <div style={{
                  position: "absolute",
                  inset: "8px",
                  border: "2px solid rgba(139, 92, 246, 0.2)",
                  borderTopColor: "var(--primary)",
                  borderRadius: "50%",
                  animation: "spin 1.5s linear infinite"
                }} />
                <div style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent)"
                }}>
                  <Activity size={32} style={{ animation: "pulse 1s infinite alternate" }} />
                </div>
              </div>

              {/* Progress status indicators */}
              <div style={{ width: "100%", maxWidth: "420px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px", fontFamily: "monospace" }}>
                  <span>ANALYZING SIGNATURES</span>
                  <span>{Math.round(((loadingStep + 1) / steps.length) * 100)}%</span>
                </div>
                <div style={{ width: "100%", height: "4px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "100px", overflow: "hidden" }}>
                  <div style={{
                    width: `${((loadingStep + 1) / steps.length) * 100}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)",
                    boxShadow: "0 0 10px var(--accent)",
                    transition: "width 0.4s ease-out"
                  }} />
                </div>
              </div>

              {/* Scrolling terminal diagnostic log logs */}
              <div style={{
                width: "100%",
                maxWidth: "450px",
                background: "rgba(3, 3, 7, 0.6)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                padding: "12px 16px",
                fontFamily: "monospace",
                fontSize: "0.75rem",
                textAlign: "left",
                color: "#10b981",
                height: "65px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "4px"
              }}>
                <div style={{ color: "var(--text-muted)" }}>&gt; sentinel_sec_audit.sh --execute</div>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} className="scanner-step-log">
                  {steps[loadingStep]}
                </div>
              </div>
            </motion.div>

          ) : !analysis ? (
            /* EMPTY INITIAL / PROMPT RUN STATE */
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px",
                textAlign: "center"
              }}
            >
              <AlertCircle size={44} color="var(--text-muted)" style={{ marginBottom: "15px" }} />
              <h4 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: "600" }}>AI Diagnostic Scan Pending</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: "340px", marginTop: "6px", marginBottom: "20px" }}>
                This case has not undergone forensics classification scan. Trigger the AI scanner to evaluate threat vectors.
              </p>
              <button
                onClick={handleRunAnalysis}
                style={{
                  width: "auto",
                  padding: "10px 24px",
                  background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
                  boxShadow: "0 4px 15px var(--primary-glow)"
                }}
              >
                Trigger Security Scan
              </button>
            </motion.div>

          ) : (
            /* ANALYSIS RESULTS VIEW PANEL */
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1.8fr",
                gap: "25px",
              }}
              className="ai-analyzer-results-grid"
            >
              {/* LEFT COLUMN: RISK METER & CATEGORY CLASSIFIERS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "center" }}>
                
                {/* SVG CIRCULAR RISK METER */}
                <div style={{
                  background: "rgba(3, 3, 7, 0.4)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "20px",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <div style={{ position: "relative", width: "120px", height: "120px" }}>
                    <svg height="120" width="120" style={{ transform: "rotate(-90deg)" }}>
                      {/* Background circular track */}
                      <circle
                        stroke="rgba(255,255,255,0.03)"
                        fill="transparent"
                        strokeWidth={stroke}
                        r={normalizedRadius}
                        cx="60"
                        cy="60"
                      />
                      {/* Foreground circular path */}
                      <circle
                        stroke={getMeterColor(analysis.riskScore)}
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + " " + circumference}
                        style={{ strokeDashoffset, transition: "stroke-dashoffset 0.8s ease-out" }}
                        r={normalizedRadius}
                        cx="60"
                        cy="60"
                        strokeLinecap="round"
                        filter={`drop-shadow(0 0 6px ${getMeterColor(analysis.riskScore)}33)`}
                      />
                    </svg>
                    {/* Centered scores info */}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <span style={{ fontSize: "1.6rem", fontWeight: "800", fontFamily: "monospace", color: getMeterColor(analysis.riskScore), lineHeight: 1 }}>
                        {analysis.riskScore}%
                      </span>
                      <span style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginTop: "4px", fontWeight: "700" }}>
                        Risk Score
                      </span>
                    </div>
                  </div>

                  {/* Severity Badge */}
                  <div style={{
                    marginTop: "15px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 14px",
                    borderRadius: "100px",
                    background: getSeverityBg(analysis.severity),
                    border: `1px solid ${getSeverityColor(analysis.severity)}33`,
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: getSeverityColor(analysis.severity),
                    letterSpacing: "0.05em"
                  }}>
                    {analysis.severity === "HIGH" ? (
                      <ShieldAlert size={12} color="var(--danger)" />
                    ) : analysis.severity === "MEDIUM" ? (
                      <AlertTriangle size={12} color="var(--warning)" />
                    ) : (
                      <ShieldCheck size={12} color="var(--success)" />
                    )}
                    <span>{analysis.severity} SEVERITY</span>
                  </div>
                </div>

                {/* CATEGORY INFO */}
                <div style={{
                  background: "rgba(3, 3, 7, 0.4)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "20px",
                  width: "100%",
                  textAlign: "center"
                }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "600" }}>
                    Diagnostics Class
                  </span>
                  <h4 style={{ fontSize: "1.1rem", color: "var(--text-primary)", fontWeight: "700", marginTop: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <Shield size={16} color="var(--accent)" /> {analysis.category}
                  </h4>
                </div>

              </div>

              {/* RIGHT COLUMN: IOCs & SUGGESTED ACTION CHECKLIST */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {/* EXTRACTED KEYWORDS / IOC TAGS */}
                <div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", fontWeight: "600", marginBottom: "8px" }}>
                    Threat Indicators & Scam Signifiers (Keywords)
                  </span>
                  
                  {(!analysis.keywords || analysis.keywords.length === 0) ? (
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>No threat indicators extracted.</span>
                  ) : (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {analysis.keywords.map((kw, i) => (
                        <span
                          key={i}
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                            color: "var(--accent)",
                            background: "rgba(0, 240, 255, 0.04)",
                            border: "1px solid rgba(0, 240, 255, 0.15)",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            boxShadow: "0 2px 5px rgba(0, 240, 255, 0.01)"
                          }}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* RECOMMENDATIONS TERMINAL BOX */}
                <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", fontWeight: "600", marginBottom: "8px" }}>
                    Suggested Actions for Investigating Officer
                  </span>
                  <div style={{
                    background: "#020204",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    padding: "16px 20px",
                    fontFamily: "monospace",
                    fontSize: "0.82rem",
                    color: "#a7f3d0", // Light green terminal color
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                    position: "relative",
                    flexGrow: 1,
                    minHeight: "150px",
                    boxShadow: "inset 0 2px 10px rgba(0,0,0,0.8)"
                  }}>
                    {/* Small terminal bar header */}
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "6px",
                      background: "rgba(255,255,255,0.02)",
                      borderBottom: "1px solid var(--border-color)",
                      borderTopLeftRadius: "var(--radius-md)",
                      borderTopRightRadius: "var(--radius-md)"
                    }} />

                    {/* Terminal content */}
                    <div style={{ marginTop: "5px" }}>
                      {analysis.recommendation}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Embedded CSS rules for scanning loaders */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 0.4; }
          100% { opacity: 1; }
        }
        @media (max-width: 650px) {
          .ai-analyzer-results-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
    </div>
  );
}

export default AIAnalyzer;
