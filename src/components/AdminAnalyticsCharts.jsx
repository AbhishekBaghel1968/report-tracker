import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from "recharts";
import { BarChart3, ShieldAlert, Activity, MapPin, Grid } from "lucide-react";

const CATEGORY_COLORS = {
  "Phishing": "#8b5cf6",
  "Online Fraud": "#00f0ff",
  "Identity Theft": "#f43f5e",
  "Social Media Crime": "#f59e0b",
  "Cyber Bullying": "#10b981",
  "Financial Fraud": "#ec4899"
};

const DEFAULT_COLORS = ["#8b5cf6", "#00f0ff", "#f43f5e", "#f59e0b", "#10b981", "#ec4899"];

const STATUS_COLORS = {
  "Resolved": "var(--success)",
  "Rejected": "var(--danger)",
  "Under Review": "var(--warning)",
  "Submitted": "#2563eb",
  "Investigating": "var(--accent)"
};

function AdminAnalyticsCharts({ monthlyData, categoryData, statusData, heatmapData, hotspotData }) {
  
  // Format Heatmap Data into grid (7 days x 24 hours)
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  // Get count for a specific day and hour block (grouped into 4-hour intervals for readability: 00-04, 04-08, 08-12, 12-16, 16-20, 20-24)
  const timeBlocks = ["00:00-04:00", "04:00-08:00", "08:00-12:00", "12:00-16:00", "16:00-20:00", "20:00-24:00"];
  
  const getCellDensity = (day, blockIdx) => {
    if (!heatmapData || heatmapData.length === 0) return 0;
    // Map block index to hour range
    const startHour = blockIdx * 4;
    const endHour = startHour + 3;
    
    const count = heatmapData
      .filter(item => item.day.toLowerCase() === day.toLowerCase() && item.hour >= startHour && item.hour <= endHour)
      .reduce((sum, item) => sum + item.count, 0);
      
    return count;
  };

  const getHeatmapColor = (count) => {
    if (count === 0) return "rgba(255, 255, 255, 0.02)";
    if (count <= 2) return "rgba(0, 240, 255, 0.15)";
    if (count <= 5) return "rgba(0, 240, 255, 0.4)";
    if (count <= 10) return "rgba(0, 240, 255, 0.7)";
    return "rgba(0, 240, 255, 1)"; // Neon Cyan
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px", marginBottom: "40px" }}>
      
      {/* Top row: Line Trend & Category Pie Chart */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "25px" }}>
        
        {/* Trend Growth Chart */}
        <div className="analytics-card" style={{ padding: "24px" }}>
          <h4 style={{ fontSize: "1.05rem", fontWeight: "700", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
            <Activity size={18} color="var(--accent)" /> Incident Growth Trend
          </h4>
          <div style={{ width: "100%", height: 260 }}>
            {monthlyData.length === 0 ? (
              <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                No trend logs available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: "var(--bg-secondary)", borderColor: "var(--glass-border)", borderRadius: "8px", color: "var(--text-primary)" }}
                    itemStyle={{ color: "var(--accent)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--accent)"
                    strokeWidth={3}
                    dot={{ fill: "var(--accent)", r: 4 }}
                    activeDot={{ r: 6, stroke: "var(--bg-primary)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Share Chart */}
        <div className="analytics-card" style={{ padding: "24px" }}>
          <h4 style={{ fontSize: "1.05rem", fontWeight: "700", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
            <ShieldAlert size={18} color="var(--primary)" /> Category Vector Breakdown
          </h4>
          <div style={{ width: "100%", height: 260 }}>
            {categoryData.length === 0 ? (
              <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                No category metrics recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    outerRadius={65}
                    fill="#8b5cf6"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CATEGORY_COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--bg-secondary)", borderColor: "var(--glass-border)", borderRadius: "8px", color: "var(--text-primary)" }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconSize={8} 
                    iconType="circle" 
                    wrapperStyle={{ fontSize: "9px", marginTop: "10px" }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Middle row: Status Breakdown & Fraud Hotspots */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "25px" }}>
        
        {/* Status Breakdown Bar Chart */}
        <div className="analytics-card" style={{ padding: "24px" }}>
          <h4 style={{ fontSize: "1.05rem", fontWeight: "700", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
            <BarChart3 size={18} color="var(--success)" /> Status Audit Allocations
          </h4>
          <div style={{ width: "100%", height: 260 }}>
            {statusData.length === 0 ? (
              <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                No status audits found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="status" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-secondary)", borderColor: "var(--glass-border)", borderRadius: "8px", color: "var(--text-primary)" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STATUS_COLORS[entry.status] || "var(--primary)"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Hotspots Horizontal Bar Chart */}
        <div className="analytics-card" style={{ padding: "24px" }}>
          <h4 style={{ fontSize: "1.05rem", fontWeight: "700", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
            <MapPin size={18} color="var(--danger)" /> Fraud Hotspots (Top Cities)
          </h4>
          <div style={{ width: "100%", height: 260 }}>
            {!hotspotData || hotspotData.length === 0 ? (
              <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                No location metrics found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical"
                  data={hotspotData} 
                  margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={11} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-secondary)", borderColor: "var(--glass-border)", borderRadius: "8px", color: "var(--text-primary)" }}
                  />
                  <Bar dataKey="value" fill="var(--danger)" radius={[0, 4, 4, 0]} maxBarSize={18}>
                    {hotspotData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`rgba(244, 63, 94, ${1 - index * 0.15})`} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Heatmap Row */}
      <div className="analytics-card" style={{ padding: "24px" }}>
        <h4 style={{ fontSize: "1.05rem", fontWeight: "700", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
          <Grid size={18} color="var(--accent)" /> Daily Complaints Activity Heatmap
        </h4>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: "600px", display: "grid", gridTemplateColumns: "100px 1fr", gap: "10px", alignItems: "center" }}>
            
            {/* Header Block Row */}
            <div />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>
              {timeBlocks.map(block => (
                <div key={block}>{block}</div>
              ))}
            </div>

            {/* Grid Days Rows */}
            {daysOfWeek.map(day => (
              <div key={day} style={{ display: "contents" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-secondary)" }}>{day}</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
                  {timeBlocks.map((_, idx) => {
                    const count = getCellDensity(day, idx);
                    const color = getHeatmapColor(count);
                    return (
                      <div 
                        key={idx}
                        title={`${day} during ${timeBlocks[idx]}: ${count} complaints logged`}
                        style={{
                          height: "36px",
                          background: color,
                          borderRadius: "4px",
                          border: "1px solid rgba(255, 255, 255, 0.03)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          color: count > 0 ? "rgba(3, 3, 7, 0.85)" : "transparent",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = "scale(1.08)";
                          if (count > 0) e.currentTarget.style.color = "#ffffff";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                          if (count > 0) e.currentTarget.style.color = "rgba(3, 3, 7, 0.85)";
                        }}
                      >
                        {count > 0 ? count : ""}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

          </div>
        </div>
        
        {/* Heatmap Legend */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px", marginTop: "16px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          <span>Low Density</span>
          <div style={{ display: "flex", gap: "4px" }}>
            <div style={{ width: "12px", height: "12px", background: getHeatmapColor(0), borderRadius: "2px" }} />
            <div style={{ width: "12px", height: "12px", background: getHeatmapColor(1), borderRadius: "2px" }} />
            <div style={{ width: "12px", height: "12px", background: getHeatmapColor(4), borderRadius: "2px" }} />
            <div style={{ width: "12px", height: "12px", background: getHeatmapColor(8), borderRadius: "2px" }} />
            <div style={{ width: "12px", height: "12px", background: getHeatmapColor(12), borderRadius: "2px" }} />
          </div>
          <span>High Density</span>
        </div>
      </div>

    </div>
  );
}

export default AdminAnalyticsCharts;
