const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Clean and parse json helper.
 */
function cleanJsonString(str) {
  try {
    // Remove markdown code blocks if present
    let cleaned = str.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse AI response JSON directly:', e);
    return null;
  }
}

/**
 * Local Rule-Based Fallback Engine
 */
function runRuleBasedEngine(text) {
  const content = text.toLowerCase();
  
  // 1. Category extraction
  let aiCategory = "General Cyber Crime";
  if (content.includes("phishing") || content.includes("fake email") || content.includes("link") || content.includes("credential") || content.includes("spoof")) {
    aiCategory = "Phishing";
  } else if (content.includes("bank") || content.includes("card") || content.includes("otp") || content.includes("money") || content.includes("transaction") || content.includes("transfer")) {
    aiCategory = "Financial Fraud";
  } else if (content.includes("identity") || content.includes("impersonat") || content.includes("stole my info") || content.includes("hack") || content.includes("profile")) {
    aiCategory = "Identity Theft";
  } else if (content.includes("bully") || content.includes("harass") || content.includes("threat") || content.includes("stalk") || content.includes("abuse")) {
    aiCategory = "Cyber Bullying";
  } else if (content.includes("social media") || content.includes("instagram") || content.includes("facebook") || content.includes("account hijacked")) {
    aiCategory = "Social Media Crime";
  } else if (content.includes("scam") || content.includes("online seller") || content.includes("product") || content.includes("fake website")) {
    aiCategory = "Online Fraud";
  }

  // 2. Priority extraction
  let aiPriority = "LOW";
  let aiRiskScore = 30;
  if (content.includes("urgent") || content.includes("immediate") || content.includes("loss of") || content.includes("threatened") || content.includes("critical") || content.includes("emergency")) {
    aiPriority = "HIGH";
    aiRiskScore = 85;
  } else if (content.includes("moderate") || content.includes("suspicious") || content.includes("help") || content.includes("stole")) {
    aiPriority = "MEDIUM";
    aiRiskScore = 60;
  }

  // 3. IOCs extraction using regexes
  const iocs = [];
  const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const domainRegex = /\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b/g;

  const ips = text.match(ipRegex);
  if (ips) ips.forEach(ip => { if (!iocs.includes(ip)) iocs.push(ip); });

  const emails = text.match(emailRegex);
  if (emails) emails.forEach(email => { if (!iocs.includes(email)) iocs.push(email); });

  const domains = text.match(domainRegex);
  if (domains) {
    domains.forEach(domain => {
      // Exclude common email domains or non-url words
      if (!domain.includes("@") && !["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"].includes(domain.toLowerCase()) && !iocs.includes(domain)) {
        iocs.push(domain.toLowerCase());
      }
    });
  }

  // 4. Fraud risk detection
  let fraudRiskLevel = "LOW";
  const fraudReasons = [];
  if (content.includes("lottery") || content.includes("won") || content.includes("gift card") || content.includes("millions") || content.includes("prize") || content.includes("unclaimed")) {
    fraudRiskLevel = "HIGH";
    fraudReasons.push("Contains high-probability financial spam lottery scam keywords.");
  }
  if (content.includes("crypto") || content.includes("invest") || content.includes("double your") || content.includes("guaranteed profit")) {
    fraudRiskLevel = "MEDIUM";
    fraudReasons.push("Contains common speculative crypto investment fraud patterns.");
  }
  if (content.includes("otp") && (content.includes("share") || content.includes("gave") || content.includes("asked"))) {
    fraudRiskLevel = "HIGH";
    fraudReasons.push("Indicates voluntary sharing of one-time password credentials, highly suspect.");
  }

  const aiSummary = text.length > 150 ? text.substring(0, 150) + "..." : text;

  return {
    aiSummary,
    aiCategory,
    aiPriority,
    aiRiskScore,
    aiIocs: JSON.stringify(iocs),
    fraudRiskLevel,
    fraudReasons: fraudReasons.length > 0 ? fraudReasons.join(" ") : "No high-risk fraud markers identified."
  };
}

/**
 * Analyze Complaint statement
 */
async function analyzeComplaint(text) {
  if (!text || !text.trim()) {
    return runRuleBasedEngine("Empty statement");
  }

  if (!GEMINI_API_KEY) {
    console.log("Gemini API key missing. Running local rule-based diagnostics.");
    return runRuleBasedEngine(text);
  }

  try {
    const prompt = `You are a cyber crime forensics investigator. Analyze the following incident report and return a strictly formatted JSON object with no other characters or markdown wrapper (no backticks).
Incident Report: "${text}"

JSON format required:
{
  "aiSummary": "A concise 2-sentence executive summary of the incident",
  "aiCategory": "Phishing | Financial Fraud | Identity Theft | Cyber Bullying | Social Media Crime | Online Fraud",
  "aiPriority": "LOW | MEDIUM | HIGH",
  "aiRiskScore": 1-100 score,
  "aiIocs": ["ip addresses, email ids, malicious URLs or domain names extracted"],
  "fraudRiskLevel": "LOW | MEDIUM | HIGH",
  "fraudReasons": "Detailed reason why this might be fraud, duplicate, spam, or genuine"
}`;

    const url = `https://generativetext.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: status ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = cleanJsonString(resultText);

    if (parsed) {
      return {
        aiSummary: parsed.aiSummary || "Summary unavailable",
        aiCategory: parsed.aiCategory || "General Cyber Crime",
        aiPriority: parsed.aiPriority || "LOW",
        aiRiskScore: parseInt(parsed.aiRiskScore, 10) || 50,
        aiIocs: JSON.stringify(parsed.aiIocs || []),
        fraudRiskLevel: parsed.fraudRiskLevel || "LOW",
        fraudReasons: parsed.fraudReasons || "N/A"
      };
    }
  } catch (error) {
    console.error("Gemini Complaint Analyzer error:", error.message);
  }

  return runRuleBasedEngine(text);
}

/**
 * AI Chatbot query helper
 */
async function getChatbotResponse(userMessage, history = []) {
  if (!userMessage) return "Please enter a message.";

  const presetResponses = {
    "phishing": "Phishing is a method where attackers send spoofed emails, messages, or links to steal sensitive details (passwords, OTPs, cards). To stay safe: NEVER click suspicious URLs, check the sender's domain, and enable Multi-Factor Authentication (MFA).",
    "otp": "One-Time Passwords (OTP) are temporary security codes. Banks, police, or official representatives will NEVER ask for your OTP over phone, email, or message. If you shared an OTP, contact your bank to freeze transactions immediately.",
    "how to report": "To file a complaint: 1. Navigate to the 'File Complaint' tab. 2. Provide a descriptive title, category, and statements. 3. Upload evidence (screenshots, email headers, log files). 4. Submit to encrypt and assign a tracking ID COMP-XXXX.",
    "identity theft": "Identity theft occurs when someone steals your personal identifiers (SSN, ID numbers, photos, names) to commit fraud. If your identity is stolen, report it here immediately, file alert flags with creditors, and change passwords across accounts.",
    "financial fraud": "If you are a victim of online financial fraud: 1. Immediately call your bank or credit card support to block cards. 2. Record the transaction reference numbers, times, and accounts. 3. File a detailed report here with transaction proof."
  };

  const messageLower = userMessage.toLowerCase();
  for (const key of Object.keys(presetResponses)) {
    if (messageLower.includes(key)) {
      return presetResponses[key];
    }
  }

  if (!GEMINI_API_KEY) {
    return "Thank you for reaching out to Sentinel Security Portal. Keep your credentials safe: never share OTPs, check URLs for HTTPS protocols, and keep operating systems updated with patches. To report an incident, file a case on our platform.";
  }

  try {
    const prompt = `You are Sentinel AI, a secure cyber-security portal assistant. Answer the user's query briefly, providing actionable security advice or guidance regarding cyber crime.
User query: "${userMessage}"
Response limit: Keep under 3-4 sentences.`;

    const url = `https://generativetext.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate AI reply. Check credentials.";
    }
  } catch (err) {
    console.error("Gemini Chatbot error:", err.message);
  }

  return "An unexpected portal timeout occurred. Keep your firewall enabled and never share credentials.";
}

module.exports = {
  analyzeComplaint,
  getChatbotResponse
};
