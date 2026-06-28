/**
 * Threat Intelligence Feed Aggregator
 */
function getActiveThreatFeed() {
  const currentYear = new Date().getFullYear();
  return {
    threatLevel: "CRITICAL",
    threatIndicators: [
      { id: 1, type: "Phishing Domain", indicator: "secure-auth-login-verify.icu", risk: "CRITICAL", source: "Sentinel PhishEngine", detectedAt: new Date(Date.now() - 40 * 60 * 1000) },
      { id: 2, type: "Malicious IP Address", indicator: "193.201.224.12", risk: "HIGH", source: "SOC Firewall logs", detectedAt: new Date(Date.now() - 3 * 3600 * 1000) },
      { id: 3, type: "Ransomware Hash", indicator: "da39a3ee5e6b4b0d3255bfef95601890afd80709", risk: "HIGH", source: "ThreatIntel Core", detectedAt: new Date(Date.now() - 6 * 3600 * 1000) },
      { id: 4, type: "C2 Server Domain", indicator: "botnet-control-panel.net", risk: "CRITICAL", source: "Sentinel Agent Feed", detectedAt: new Date(Date.now() - 24 * 3600 * 1000) },
      { id: 5, type: "Vishing Phone Number", indicator: "+91 98765 09876", risk: "MEDIUM", source: "User Report logs", detectedAt: new Date(Date.now() - 36 * 3600 * 1000) }
    ],
    advisories: [
      { id: 101, title: "Ransomware Alert: LockBit 4.0 Campaign Active", severity: "CRITICAL", target: "Financial & Government Infrastructure", advisory: "Security operations centers are advised to block port 445/139 and inspect anomalous SMB traffic immediately. Ensure offsite encrypted backups are operational." },
      { id: 102, title: "Zero-Day Exploitation: Remote Code Execution in popular Web Application Frameworks", severity: "HIGH", target: "NodeJS & Web Portal servers", advisory: "CVE-2026-90412 has been disclosed. Apply security patches to JSON deserialization handlers immediately." }
    ],
    cves: [
      { id: `CVE-${currentYear}-41291`, score: 9.8, severity: "CRITICAL", summary: "RCE vulnerability in framework authentication handlers." },
      { id: `CVE-${currentYear}-38190`, score: 8.4, severity: "HIGH", summary: "SQL Injection in report generators and analytics modules." },
      { id: `CVE-${currentYear}-20211`, score: 7.5, severity: "HIGH", summary: "Cross-Site Scripting (XSS) in custom markdown visualizers." }
    ]
  };
}

module.exports = {
  getActiveThreatFeed
};
