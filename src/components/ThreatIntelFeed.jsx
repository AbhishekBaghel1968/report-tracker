import { useEffect, useState } from "react";
import { ShieldAlert, RefreshCw, Terminal, Eye, AlertTriangle } from "lucide-react";
import api from "../services/api";

function ThreatIntelFeed() {
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchThreatFeed = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/threat-intel");
      setFeed(res.data);
    } catch (err) {
      console.error("Threat Intelligence load failed:", err);
      setError("Threat aggregator link offline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreatFeed();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)", background: "var(--glass-bg)", borderRadius: "12px", border: "1px solid var(--glass-border)" }}>
        <RefreshCw size={20} className="spin-animation" style={{ animation: "spin 1.5s linear infinite", display: "inline-block", color: "var(--accent)" }} />
        <p style={{ marginTop: "10px", fontSize: "0.85rem" }}>Tuning threat intelligence vectors...</p>
      </div>
    );
  }

  if (error || !feed) {
    return (
      <div style={{ padding: "16px", background: "var(--glass-bg)", borderRadius: "12px", border: "1px solid var(--danger)", color: "var(--danger)", fontSize: "0.85rem", textAlign: "center" }}>
        <span>⚠️ {error || "Threat feed feed aggregator offline."}</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Risk Banner */}
      <div style={{
        background: "rgba(255, 0, 85, 0.05)",
        border: "1px solid rgba(255, 0, 85, 0.2)",
        borderRadius: "10px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ShieldAlert size={18} color="var(--danger)" style={{ filter: "drop-shadow(0 0 4px var(--danger))" }} />
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", display: "block", letterSpacing: "1px" }}>Global Threat Severity</span>
            <span style={{ fontSize: "1rem", fontWeight: "800", color: "var(--danger)" }}>{feed.threatLevel} LEVEL WARNING</span>
          </div>
        </div>
        <button
          onClick={fetchThreatFeed}
          style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", padding: 0 }}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Threat advisories */}
      <div style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", borderRadius: "12px", padding: "20px" }}>
        <h4 style={{ fontSize: "0.9rem", fontWeight: "700", letterSpacing: "0.05em", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px" }}>
          <Terminal size={14} color="var(--accent)" /> CORE EXPLOIT ADVISORIES
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {feed.advisories.map(adv => (
            <div key={adv.id} style={{ borderLeft: "3px solid var(--danger)", paddingLeft: "12px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)" }}>{adv.title}</span>
              <span style={{ fontSize: "0.75rem", background: "rgba(255, 0, 85, 0.1)", color: "var(--danger)", padding: "1px 6px", borderRadius: "4px", marginLeft: "8px", fontWeight: "700" }}>{adv.severity}</span>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: "1.4" }}>{adv.advisory}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CVE alerts */}
      <div style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", borderRadius: "12px", padding: "20px" }}>
        <h4 style={{ fontSize: "0.9rem", fontWeight: "700", letterSpacing: "0.05em", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px" }}>
          <ShieldAlert size={14} color="var(--warning)" /> SEVERE CVE VECTOR WATCH
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {feed.cves.map(cve => (
            <div key={cve.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(3,3,7,0.4)", border: "1px solid var(--border-color)", borderRadius: "6px" }}>
              <div>
                <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--accent)" }}>{cve.id}</span>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>{cve.summary}</p>
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", color: cve.score >= 9 ? "var(--danger)" : "var(--warning)", padding: "4px 8px", background: "rgba(255,255,255,0.02)", borderRadius: "4px" }}>
                Score: {cve.score}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Blacklisted indicators */}
      <div style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", borderRadius: "12px", padding: "20px" }}>
        <h4 style={{ fontSize: "0.9rem", fontWeight: "700", letterSpacing: "0.05em", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px" }}>
          <Eye size={14} color="var(--primary)" /> INSTANT IOC BLACKLIST
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {feed.threatIndicators.map(ind => (
            <div key={ind.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
              <span style={{ fontFamily: "monospace", color: "var(--text-primary)" }}>{ind.indicator}</span>
              <span style={{ color: ind.risk === "CRITICAL" ? "var(--danger)" : "var(--warning)", fontWeight: "600" }}>{ind.type} ({ind.risk})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ThreatIntelFeed;
