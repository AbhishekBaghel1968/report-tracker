const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Stop words to filter out during local keyword extraction.
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with', 
  'from', 'about', 'as', 'into', 'like', 'through', 'after', 'before', 'my', 'your', 'his', 'her', 'their', 'our', 
  'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'them', 'us', 'have', 
  'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', 
  'been', 'being', 'am', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 
  'can', 'will', 'just', 'should', 'now', 'complaint', 'incident', 'report', 'crime', 'cyber'
]);

/**
 * Cyber crime dictionary for classification and keyword extraction priorities.
 */
const CYBER_DICTIONARY = {
  'Banking Fraud': [
    'bank', 'card', 'credit', 'debit', 'otp', 'transaction', 'atm', 'transfer', 'cvv', 'fraud', 'money', 
    'upi', 'paytm', 'gpay', 'phonepe', 'account', 'charge', 'withdrawal', 'payment', 'cash', 'balance'
  ],
  'Phishing': [
    'email', 'link', 'click', 'url', 'phishing', 'spoof', 'fake', 'verification', 'suspended', 'login', 
    'credentials', 'password', 'reset', 'domain', 'website', 'dns', 'sms', 'message', 'inbox', 'text'
  ],
  'Crypto Scam': [
    'crypto', 'bitcoin', 'btc', 'eth', 'ethereum', 'wallet', 'blockchain', 'investment', 'double', 'binance', 
    'coin', 'token', 'usdt', 'miners', 'mining', 'trade', 'profits', 'guaranteed'
  ],
  'Identity Theft': [
    'identity', 'stole', 'impersonate', 'documents', 'aadhaar', 'pan', 'passport', 'signature', 'profile', 
    'hacked', 'forge', 'ssn', 'credentials', 'hijack', 'details', 'personal', 'license'
  ],
  'Cyber Bullying': [
    'bully', 'harass', 'abuse', 'threat', 'stalk', 'blackmail', 'extort', 'photos', 'leaked', 'messages', 
    'insult', 'intimidation', 'posts', 'comments', 'troll', 'stalker'
  ],
  'Social Media Scam': [
    'instagram', 'facebook', 'twitter', 'telegram', 'whatsapp', 'snapchat', 'hijack', 'social', 'media', 
    'profile', 'inbox', 'dms', 'dm', 'friend', 'compromised', 'impersonator', 'followers'
  ]
};

/**
 * Suggested Actions for officers based on complaint category.
 */
const SUGGESTED_RECOMMENDATIONS = {
  'Banking Fraud': 
    "1. Initiate official request to beneficiary bank/merchant to freeze transactions immediately.\n" +
    "2. File transaction details on the National Cyber Crime Reporting Portal (1930 Helpline database).\n" +
    "3. Advise victim to block all debit/credit cards and reset online banking access codes.\n" +
    "4. Request audit trails and IP addresses from payment gateway servers.",
  
  'Phishing': 
    "1. Request immediate takedown of the malicious phishing URL/domain from registrar/hosting provider.\n" +
    "2. Extract email header attributes (SPF, DKIM, DMARC) to trace sender IP and source MTA.\n" +
    "3. Check for corporate/user credential exposure on known breaches databases (e.g. haveibeenpwned).\n" +
    "4. Warn local users and enforce system-wide password rotations.",
  
  'Crypto Scam': 
    "1. Track destination cryptocurrency wallet address on Etherscan, Blockchain.info, or Solscan.\n" +
    "2. Submit blacklisting alerts to major crypto exchanges (e.g., Binance, Coinbase) where funds may transit.\n" +
    "3. Document transaction hashes and contract addresses for smart contract inspection.\n" +
    "4. Advise victim regarding the high risk of recovery scams claiming they can retrieve lost crypto.",
  
  'Identity Theft': 
    "1. Advise victim to lock Aadhaar card biometric credentials online and place freeze on PAN transactions.\n" +
    "2. File standard credit bureaus alert flags to prevent unauthorized accounts generation.\n" +
    "3. Audit recent security log sessions of citizen's key email and security accounts.\n" +
    "4. Verify official identity documentation matches submitted biometric logs.",
  
  'Cyber Bullying': 
    "1. Preserving metadata, digital headers, timestamps, and active profile URLs of perpetrators.\n" +
    "2. Send legal preservation request to social media platform for perpetrator IP registry and logs.\n" +
    "3. Counsel victim regarding local laws (e.g. IT Act Section 67) and platform reporting features.\n" +
    "4. Enforce security configurations on the victim's social media settings to isolate communications.",
  
  'Social Media Scam': 
    "1. Report compromised profiles to the platform's trust & safety team for quarantine and recovery.\n" +
    "2. Check geo-location login history coordinates to identify illegitimate access points.\n" +
    "3. Draft advisory alert for the victim's contacts regarding compromised status and active fraud links.\n" +
    "4. Verify email or phone numbers connected to the social account were not altered by unauthorized users."
};

/**
 * Local Rule-Based NLP & Keyword Extraction Fallback Engine
 */
function runLocalNLPEngine(title = "", description = "") {
  const mergedText = `${title} ${description}`;
  const normalizedText = mergedText.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
  const words = normalizedText.split(/\s+/).filter(Boolean);

  // 1. NLP Keyword extraction (filter out stop words and short terms)
  const candidateKeywords = [];
  const freqMap = {};

  words.forEach(word => {
    if (word.length >= 3 && !STOP_WORDS.has(word)) {
      freqMap[word] = (freqMap[word] || 0) + 1;
    }
  });

  // Extract all unique candidate words
  const uniqueWords = Object.keys(freqMap);

  // Score candidate words: boost priority if they exist in the cyber dictionary
  const dictWords = new Set(Object.values(CYBER_DICTIONARY).flat());
  const scoredWords = uniqueWords.map(word => {
    let score = freqMap[word];
    if (dictWords.has(word)) {
      score += 5; // boost priority for cybercrime keywords
    }
    return { word, score };
  });

  // Sort by score and take top 10 keywords
  scoredWords.sort((a, b) => b.score - a.score);
  const keywords = scoredWords.slice(0, 10).map(item => item.word);

  // 2. Multi-class Category Classification (bag-of-words keyword counting)
  const categoryScores = {
    'Banking Fraud': 0,
    'Phishing': 0,
    'Social Media Scam': 0,
    'Identity Theft': 0,
    'Cyber Bullying': 0,
    'Crypto Scam': 0
  };

  Object.entries(CYBER_DICTIONARY).forEach(([category, terms]) => {
    terms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'g');
      const matches = normalizedText.match(regex);
      if (matches) {
        categoryScores[category] += matches.length;
      }
    });
  });

  // Pick category with highest matches
  let bestCategory = 'Phishing'; // Default baseline
  let maxScore = 0;
  Object.entries(categoryScores).forEach(([cat, score]) => {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat;
    }
  });

  // If no category matched but title/desc indicates something, run minor fallbacks
  if (maxScore === 0) {
    const textLower = mergedText.toLowerCase();
    if (textLower.includes('money') || textLower.includes('bank') || textLower.includes('card')) {
      bestCategory = 'Banking Fraud';
    } else if (textLower.includes('crypto') || textLower.includes('invest') || textLower.includes('bitcoin')) {
      bestCategory = 'Crypto Scam';
    } else if (textLower.includes('harass') || textLower.includes('abuse') || textLower.includes('threat')) {
      bestCategory = 'Cyber Bullying';
    } else if (textLower.includes('instagram') || textLower.includes('facebook') || textLower.includes('media')) {
      bestCategory = 'Social Media Scam';
    } else if (textLower.includes('identity') || textLower.includes('impersonat') || textLower.includes('aadhaar')) {
      bestCategory = 'Identity Theft';
    }
  }

  // 3. Predict severity & Risk score
  // Baseline risk score
  let riskScore = 20;

  // Add weights for critical triggers
  const criticalTriggers = [
    { terms: ['otp', 'password', 'pin', 'cvv', 'credential', 'credentials'], weight: 25 },
    { terms: ['blackmail', 'extort', 'threaten', 'leaked', 'photos'], weight: 25 },
    { terms: ['lakh', 'crore', 'rupee', 'rupees', 'money', 'stole', 'lost', 'thousands', 'transfer'], weight: 20 },
    { terms: ['urgent', 'immediate', 'emergency', 'asap'], weight: 15 },
    { terms: ['crypto', 'wallet', 'blockchain', 'bitcoin'], weight: 15 },
    { terms: ['hacked', 'compromised', 'hijack'], weight: 15 }
  ];

  criticalTriggers.forEach(trigger => {
    const hasMatch = trigger.terms.some(term => normalizedText.includes(term));
    if (hasMatch) {
      riskScore += trigger.weight;
    }
  });

  // Cap risk score between 10 and 100
  riskScore = Math.max(10, Math.min(100, riskScore));

  // Severity classification
  let severity = 'LOW';
  if (riskScore >= 75) {
    severity = 'HIGH';
  } else if (riskScore >= 45) {
    severity = 'MEDIUM';
  }

  // 4. Officer Suggested actions
  const recommendation = SUGGESTED_RECOMMENDATIONS[bestCategory] || 
    "1. Review complete complaint statements.\n2. Request evidence logs and attachments.\n3. Log update note inside investigation logs.";

  return {
    category: bestCategory,
    severity,
    riskScore,
    keywords,
    recommendation
  };
}

/**
 * Cleans and parses JSON helper from markdown wrappers.
 */
function cleanJsonString(str) {
  try {
    let cleaned = str.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse AI response JSON directly:', e);
    return null;
  }
}

/**
 * Main module analysis method. 
 * Performs Gemini API query if key exists, otherwise runs local rule-based NLP parser.
 */
async function analyzeComplaintData(title = "", description = "") {
  if (!title && !description) {
    return runLocalNLPEngine("Empty Incident", "No description provided");
  }

  if (!GEMINI_API_KEY) {
    console.log("Gemini API key is not configured. Running fallback NLP and keyword extraction engine.");
    return runLocalNLPEngine(title, description);
  }

  try {
    const prompt = `You are a cyber crime forensics investigator. Analyze the following cyber crime incident.
Title: "${title}"
Description: "${description}"

Return a strictly formatted JSON object with no other characters or markdown wrapper (no backticks).
JSON format required:
{
  "category": "Banking Fraud | Phishing | Social Media Scam | Identity Theft | Cyber Bullying | Crypto Scam",
  "severity": "LOW | MEDIUM | HIGH",
  "riskScore": 1-100 score,
  "keywords": ["extracted scam-related keywords, email addresses, phone numbers, fake accounts, or websites"],
  "recommendation": "Suggested investigative actions, mitigation strategies, and next steps for the investigating officer."
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
        category: parsed.category || "Phishing",
        severity: (parsed.severity || "MEDIUM").toUpperCase(),
        riskScore: parseInt(parsed.riskScore, 10) || 50,
        keywords: parsed.keywords || [],
        recommendation: parsed.recommendation || "Verify complaint details and secure digital trace evidence."
      };
    }
  } catch (error) {
    console.error("Gemini AI Complaint Analyzer error:", error.message);
  }

  // Run local NLP engine as fallback if API calls error out
  return runLocalNLPEngine(title, description);
}

/**
 * FUTURE MACHINE LEARNING MODEL SUPPORT (TF.js/ONNX)
 * 
 * To plug in a custom ML model (e.g. an ONNX classification model or TensorFlow.js model):
 * 
 * const tf = require('@tensorflow/tfjs-node'); // Load tfjs Node bindings
 * 
 * let model = null;
 * async function loadMLModel() {
 *   if (!model) {
 *     // Load the saved Keras/Tf.js model from file system
 *     model = await tf.loadLayersModel('file://./src/ml-models/complaint_classifier/model.json');
 *   }
 *   return model;
 * }
 * 
 * async function predictWithML(text) {
 *   const loadedModel = await loadMLModel();
 *   // Preprocess text (tokenize, pad sequence to match vocabulary dimension)
 *   const inputTensor = preprocessTextToTensor(text);
 *   const prediction = loadedModel.predict(inputTensor);
 *   // Decode predictions to target classes (Banking Fraud, Phishing, etc.)
 *   return decodePredictions(prediction);
 * }
 */

module.exports = {
  analyzeComplaintData
};
