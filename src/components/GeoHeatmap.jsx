import { useState, useEffect, useRef } from "react";
import { 
  MapContainer, TileLayer, Marker, Popup, Tooltip, CircleMarker, LayerGroup 
} from "react-leaflet";
import { 
  MapPin, AlertTriangle, Shield, Flame, Activity, Play, Pause, RefreshCw, Cpu, TrendingUp 
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons in Vite build environment
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Mock AI Forecast predictions
const AI_PREDICTIONS = [
  { city: "Noida", state: "Uttar Pradesh", latitude: 28.5355, longitude: 77.3910, riskScore: 89, trend: "+42%", reason: "Credential Phishing Botnets" },
  { city: "Jaipur", state: "Rajasthan", latitude: 26.9124, longitude: 75.7873, riskScore: 78, trend: "+25%", reason: "UPI Gateway Scams" },
  { city: "Nagpur", state: "Maharashtra", latitude: 21.1458, longitude: 79.0882, riskScore: 74, trend: "+18%", reason: "Adware Fraud Rings" },
  { city: "Gurugram", state: "Haryana", latitude: 28.4595, longitude: 77.0266, riskScore: 92, trend: "+55%", reason: "Corporate Ransomware Vectors" }
];

function GeoHeatmap({ geoData = [] }) {
  // States for interactive filters and animations
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationStep, setAnimationStep] = useState(0); // 0: Jan-Feb, 1: Mar-Apr, 2: May-Jun, 3: Jul-Aug, 4: Sep-Oct, 5: Nov-Dec (Full)
  const [aiForecastMode, setAiForecastMode] = useState(false);
  const animationIntervalRef = useRef(null);

  // Time steps names
  const TIME_STEPS = ["Jan - Feb", "Mar - Apr", "May - Jun", "Jul - Aug", "Sep - Oct", "Current Data (Full)"];

  // Heatmap styling functions
  const getHeatColor = (count) => {
    if (count <= 5) return "#10b981"; // Green (Low)
    if (count <= 15) return "#f59e0b"; // Yellow/Orange (Medium)
    return "#f43f5e"; // Red (High)
  };

  const getHeatRadius = (count) => {
    return 12 + Math.min(count * 1.5, 28);
  };

  // Play/Pause Time-Based Animation
  useEffect(() => {
    if (isPlaying) {
      animationIntervalRef.current = setInterval(() => {
        setAnimationStep((prev) => {
          if (prev >= TIME_STEPS.length - 1) {
            return 0; // Loop back
          }
          return prev + 1;
        });
      }, 1500);
    } else {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    }

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [isPlaying]);

  // Adjust values based on animation step if running
  const getAnimatedData = () => {
    if (animationStep === TIME_STEPS.length - 1) return geoData;
    
    // Scale down values to simulate progression over time
    const scaleFactor = (animationStep + 1) / TIME_STEPS.length;
    return geoData.map(item => {
      const scaledCount = Math.max(1, Math.round(item.complaintCount * scaleFactor));
      return {
        ...item,
        complaintCount: scaledCount
      };
    });
  };

  const activeData = getAnimatedData();

  // Dynamic Card Calculations
  const totalReports = activeData.reduce((sum, item) => sum + item.complaintCount, 0);

  let highestCity = "N/A";
  let highestCount = -1;
  activeData.forEach(item => {
    if (item.complaintCount > highestCount) {
      highestCount = item.complaintCount;
      highestCity = `${item.city} (${item.complaintCount})`;
    }
  });

  const fraudCounts = {};
  activeData.forEach(item => {
    if (item.topCrime && item.topCrime !== "N/A") {
      fraudCounts[item.topCrime] = (fraudCounts[item.topCrime] || 0) + item.complaintCount;
    }
  });
  let mostCommonFraud = "N/A";
  let maxFraudCount = -1;
  Object.entries(fraudCounts).forEach(([fraud, count]) => {
    if (count > maxFraudCount) {
      maxFraudCount = count;
      mostCommonFraud = fraud;
    }
  });

  const stateCounts = {};
  activeData.forEach(item => {
    if (item.state && item.state !== "Unknown") {
      stateCounts[item.state] = (stateCounts[item.state] || 0) + item.complaintCount;
    }
  });
  let highestState = "N/A";
  let maxStateCount = -1;
  Object.entries(stateCounts).forEach(([state, count]) => {
    if (count > maxStateCount) {
      maxStateCount = count;
      highestState = `${state} (${count})`;
    }
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px", marginBottom: "40px" }}>
      {/* Dynamic Summary Cards Row */}
      <div className="geo-stats-grid">
        {/* Total Geo Reports Card */}
        <div className="geo-stat-card">
          <div className="geo-icon-wrapper" style={{ background: "rgba(0, 240, 255, 0.08)", color: "var(--accent)" }}>
            <Activity size={20} />
          </div>
          <div className="geo-card-info">
            <span className="geo-card-label">Total Geo Reports</span>
            <h3 className="geo-card-value text-glow-cyan">{totalReports}</h3>
            <p className="geo-card-desc">Active mapped complaints</p>
          </div>
        </div>

        {/* Highest Crime City Card */}
        <div className="geo-stat-card">
          <div className="geo-icon-wrapper" style={{ background: "rgba(244, 63, 94, 0.08)", color: "#f43f5e" }}>
            <Flame size={20} />
          </div>
          <div className="geo-card-info">
            <span className="geo-card-label">Highest Crime City</span>
            <h3 className="geo-card-value">{highestCity}</h3>
            <p className="geo-card-desc">Max density coordinates</p>
          </div>
        </div>

        {/* Most Common Fraud Type Card */}
        <div className="geo-stat-card">
          <div className="geo-icon-wrapper" style={{ background: "rgba(139, 92, 246, 0.08)", color: "var(--primary)" }}>
            <Shield size={20} />
          </div>
          <div className="geo-card-info">
            <span className="geo-card-label">Most Common Fraud</span>
            <h3 className="geo-card-value" style={{ fontSize: "1.1rem" }}>{mostCommonFraud}</h3>
            <p className="geo-card-desc">Leading attack category</p>
          </div>
        </div>

        {/* Highest Risk Zone Card */}
        <div className="geo-stat-card">
          <div className="geo-icon-wrapper" style={{ background: "rgba(245, 158, 11, 0.08)", color: "#f59e0b" }}>
            <AlertTriangle size={20} />
          </div>
          <div className="geo-card-info">
            <span className="geo-card-label">Highest Risk Zone</span>
            <h3 className="geo-card-value">{highestState}</h3>
            <p className="geo-card-desc">Leading regional sector</p>
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="geo-map-card">
        {/* Map Header Controls */}
        <div className="geo-map-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <MapPin size={18} className="text-glow-cyan" style={{ color: "var(--accent)" }} />
            <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)" }}>
              Interactive Crime Density Map
            </h4>
          </div>
          
          <div className="geo-controls-bar">
            {/* Play/Pause Animation Controller */}
            <div className="animation-controller">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`anim-btn ${isPlaying ? "playing" : ""}`}
                title={isPlaying ? "Pause Time-Series Playback" : "Play Time-Series Playback"}
              >
                {isPlaying ? <Pause size={12} fill="var(--accent)" /> : <Play size={12} fill="var(--text-primary)" />}
                <span>{isPlaying ? "Pause Playback" : "Play History"}</span>
              </button>
              <div className="time-indicator">
                <span className="time-label">Timeframe:</span>
                <span className="time-value">{TIME_STEPS[animationStep]}</span>
              </div>
            </div>

            {/* AI Hotspot Prediction Toggle */}
            <button 
              onClick={() => setAiForecastMode(!aiForecastMode)}
              className={`ai-toggle-btn ${aiForecastMode ? "active" : ""}`}
            >
              <Cpu size={13} className={aiForecastMode ? "ai-spin" : ""} />
              <span>{aiForecastMode ? "AI Forecast Active" : "Enable AI Predictions"}</span>
            </button>
          </div>
        </div>

        {/* The Leaflet Map */}
        <div className="leaflet-wrapper">
          <MapContainer 
            center={[21.0000, 78.0000]} // Centralized on India
            zoom={5} 
            scrollWheelZoom={true}
            style={{ width: "100%", height: "100%", borderRadius: "var(--radius-md)" }}
          >
            {/* Beautiful dark themed tile layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Render circle heat overlay & markers for active complaints */}
            {activeData.map((item, index) => {
              if (!item.latitude || !item.longitude) return null;
              
              const heatColor = getHeatColor(item.complaintCount);
              const heatRadius = getHeatRadius(item.complaintCount);

              return (
                <LayerGroup key={`geo-group-${index}`}>
                  {/* Outer heat overlay glow circle */}
                  <CircleMarker
                    center={[item.latitude, item.longitude]}
                    pathOptions={{
                      fillColor: heatColor,
                      fillOpacity: 0.15,
                      stroke: true,
                      color: heatColor,
                      opacity: 0.35,
                      weight: 1.5,
                      dashArray: "4,4"
                    }}
                    radius={heatRadius * 1.8}
                  />

                  {/* Inner interactive core circle */}
                  <CircleMarker
                    center={[item.latitude, item.longitude]}
                    pathOptions={{
                      fillColor: heatColor,
                      fillOpacity: 0.7,
                      stroke: true,
                      color: "#030307",
                      opacity: 0.9,
                      weight: 1.5
                    }}
                    radius={heatRadius}
                    eventHandlers={{
                      mouseover: (e) => {
                        e.target.setStyle({ fillOpacity: 0.95, weight: 2.5, color: "#ffffff" });
                      },
                      mouseout: (e) => {
                        e.target.setStyle({ fillOpacity: 0.7, weight: 1.5, color: "#030307" });
                      }
                    }}
                  >
                    {/* Hover tooltips */}
                    <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                      <div className="map-tooltip-content">
                        <strong>{item.city}</strong>
                        <span>Complaints: {item.complaintCount}</span>
                        <span>Top Threat: {item.topCrime}</span>
                      </div>
                    </Tooltip>

                    {/* On Click Detailed Popup */}
                    <Popup minWidth={220}>
                      <div className="map-popup-container">
                        <h4>{item.city}</h4>
                        <span className="subtitle">{item.state} Region</span>
                        <hr className="divider" />
                        <div className="popup-stat-row">
                          <span className="lbl">Audit Count:</span>
                          <span className="val highlight-red">{item.complaintCount} cases</span>
                        </div>
                        <div className="popup-stat-row">
                          <span className="lbl">Principal Threat:</span>
                          <span className="val highlight-cyan">{item.topCrime}</span>
                        </div>
                        <div className="popup-stat-row">
                          <span className="lbl">Coordinates:</span>
                          <span className="val text-muted">{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</span>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                </LayerGroup>
              );
            })}

            {/* AI Predictive Hotspots visualization */}
            {aiForecastMode && AI_PREDICTIONS.map((pred, idx) => (
              <LayerGroup key={`ai-pred-${idx}`}>
                {/* Pulsing prediction ring */}
                <CircleMarker
                  center={[pred.latitude, pred.longitude]}
                  pathOptions={{
                    fillColor: "#8b5cf6",
                    fillOpacity: 0.1,
                    stroke: true,
                    color: "#8b5cf6",
                    opacity: 0.8,
                    weight: 1.5,
                    dashArray: "5,5"
                  }}
                  radius={35}
                />
                
                {/* Central prediction core */}
                <CircleMarker
                  center={[pred.latitude, pred.longitude]}
                  pathOptions={{
                    fillColor: "#8b5cf6",
                    fillOpacity: 0.8,
                    stroke: true,
                    color: "#ffffff",
                    opacity: 1,
                    weight: 2
                  }}
                  radius={10}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                    <div className="map-tooltip-content ai-tooltip">
                      <strong>🔮 AI Hotspot Forecast</strong>
                      <span>City: {pred.city}</span>
                      <span>Risk Growth: {pred.trend}</span>
                    </div>
                  </Tooltip>

                  <Popup minWidth={240}>
                    <div className="map-popup-container ai-popup">
                      <h4>🔮 AI Risk Projection</h4>
                      <span className="subtitle">{pred.city}, {pred.state}</span>
                      <hr className="divider" />
                      <div className="popup-stat-row">
                        <span className="lbl">Model Risk Score:</span>
                        <span className="val highlight-purple">{pred.riskScore}% Critical</span>
                      </div>
                      <div className="popup-stat-row">
                        <span className="lbl">Expected Shift:</span>
                        <span className="val highlight-purple">{pred.trend} Next Quarter</span>
                      </div>
                      <div className="popup-stat-row">
                        <span className="lbl">Dominant Vector:</span>
                        <span className="val highlight-cyan">{pred.reason}</span>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              </LayerGroup>
            ))}
          </MapContainer>
        </div>

        {/* Color Scale Legend */}
        <div className="map-legend">
          <div className="legend-title">Density Index:</div>
          <div className="legend-items">
            <div className="legend-item">
              <span className="dot dot-green" />
              <span>Low (≤5)</span>
            </div>
            <div className="legend-item">
              <span className="dot dot-orange" />
              <span>Medium (6-15)</span>
            </div>
            <div className="legend-item">
              <span className="dot dot-red" />
              <span>High (&gt;15)</span>
            </div>
            {aiForecastMode && (
              <div className="legend-item">
                <span className="dot dot-purple" />
                <span>AI Predicted Forecast</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forecasting panels */}
      {aiForecastMode && (
        <div className="forecast-analysis-panel">
          <div className="panel-header">
            <TrendingUp size={16} color="var(--primary)" />
            <span>AI Regional Predictive Insights & Risk Modeling</span>
          </div>
          <div className="forecast-grid">
            <div className="forecast-box">
              <h5>🎯 Highest Risk Predictive Sector</h5>
              <p>Based on neural network vector modeling, <strong>Northern Capital Zone (NCR)</strong> is expected to observe a surge in ransomware incidents over the next 45 days. Enhanced port monitoring is advised.</p>
            </div>
            <div className="forecast-box">
              <h5>📈 Trending Threat Vector</h5>
              <p>Financial Phishing is shifting from standard SMS to encrypted application channels. Mobile gateway audit frequency should be increased by 20% in Maharashtra and Karnataka regions.</p>
            </div>
          </div>
        </div>
      )}

      {/* Encapsulated Component Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Geo Dashboard Stats */
        .geo-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }
        .geo-stat-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
        }
        .geo-stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(0, 240, 255, 0.25);
          box-shadow: 0 4px 15px rgba(0, 240, 255, 0.05), var(--shadow-md);
        }
        .geo-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justifyContent: center;
          flex-shrink: 0;
        }
        .geo-card-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .geo-card-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .geo-card-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .geo-card-desc {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin: 0;
        }
        .text-glow-cyan {
          text-shadow: 0 0 8px rgba(0, 240, 255, 0.4);
        }

        /* Map Structure Card */
        .geo-map-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: 20px;
          box-shadow: var(--shadow-md);
        }
        .geo-map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
          flex-wrap: wrap;
          gap: 15px;
        }
        .geo-controls-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* Time Series Animation Controls */
        .animation-controller {
          display: flex;
          align-items: center;
          background: rgba(3, 3, 7, 0.4);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 3px;
          gap: 8px;
        }
        .anim-btn {
          border: none;
          background: transparent;
          color: var(--text-primary);
          padding: 6px 12px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: var(--transition);
        }
        .anim-btn:hover {
          background: rgba(255,255,255,0.05);
        }
        .anim-btn.playing {
          background: rgba(0, 240, 255, 0.08);
          color: var(--accent);
        }
        .time-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
          padding-right: 8px;
          font-size: 0.75rem;
        }
        .time-label {
          color: var(--text-secondary);
        }
        .time-value {
          font-weight: 700;
          color: var(--accent);
        }

        /* AI Forecast Toggle */
        .ai-toggle-btn {
          border: 1px solid var(--border-color);
          background: rgba(3, 3, 7, 0.4);
          color: var(--text-primary);
          padding: 8px 14px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          gap: 6px;
          transition: var(--transition);
        }
        .ai-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(139, 92, 246, 0.4);
        }
        .ai-toggle-btn.active {
          background: rgba(139, 92, 246, 0.12);
          color: #8b5cf6;
          border-color: rgba(139, 92, 246, 0.5);
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
        }
        .ai-spin {
          animation: ai-pulse 2s infinite linear;
        }
        @keyframes ai-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }

        /* Leaflet Wrapper */
        .leaflet-wrapper {
          height: 480px;
          position: relative;
          background: #030307;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-color);
        }
        .leaflet-container {
          font-family: inherit;
        }

        /* Map Tooltip Stylings */
        .map-tooltip-content {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 2px 4px;
          font-family: inherit;
          color: #ffffff;
        }
        .map-tooltip-content strong {
          color: var(--accent);
          font-size: 0.8rem;
        }
        .map-tooltip-content span {
          font-size: 0.75rem;
          color: #cbd5e1;
        }
        .ai-tooltip strong {
          color: #a78bfa;
        }

        /* Popup Stylings */
        .leaflet-popup-content-wrapper {
          background: #080710 !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          color: #f8fafc !important;
          border-radius: 8px !important;
          padding: 4px !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
        }
        .leaflet-popup-tip {
          background: #080710 !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
        }
        .map-popup-container {
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-family: inherit;
        }
        .map-popup-container h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #ffffff;
        }
        .map-popup-container .subtitle {
          font-size: 0.7rem;
          color: #94a3b8;
          margin-top: -2px;
        }
        .map-popup-container .divider {
          border: 0;
          height: 1px;
          background: rgba(255,255,255,0.1);
          margin: 6px 0;
        }
        .popup-stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          gap: 15px;
        }
        .popup-stat-row .lbl {
          color: #94a3b8;
        }
        .popup-stat-row .val {
          font-weight: 600;
        }
        .highlight-red {
          color: #f43f5e;
        }
        .highlight-cyan {
          color: var(--accent);
        }
        .highlight-purple {
          color: #a78bfa;
        }
        .ai-popup h4 {
          color: #c084fc;
        }

        /* Map Legend */
        .map-legend {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 15px;
          font-size: 0.75rem;
          color: var(--text-secondary);
          flex-wrap: wrap;
        }
        .legend-title {
          font-weight: 600;
        }
        .legend-items {
          display: flex;
          gap: 15px;
          align-items: center;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .dot-green { background: #10b981; box-shadow: 0 0 6px #10b981; }
        .dot-orange { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
        .dot-red { background: #f43f5e; box-shadow: 0 0 6px #f43f5e; }
        .dot-purple { background: #8b5cf6; box-shadow: 0 0 6px #8b5cf6; }

        /* Forecast Analysis Panel */
        .forecast-analysis-panel {
          background: rgba(139, 92, 246, 0.03);
          border: 1px dashed rgba(139, 92, 246, 0.25);
          border-radius: var(--radius-md);
          padding: 20px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }
        .panel-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #a78bfa;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .forecast-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 15px;
        }
        .forecast-box {
          background: rgba(3, 3, 7, 0.4);
          border: 1px solid rgba(255,255,255,0.03);
          border-radius: 8px;
          padding: 15px;
        }
        .forecast-box h5 {
          margin: 0 0 8px 0;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .forecast-box p {
          margin: 0;
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        `
      }} />
    </div>
  );
}

export default GeoHeatmap;
