import { useState,useEffect } from "react";
import {LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid} from "recharts";
import { IoDocumentTextOutline, IoShieldCheckmarkOutline, IoPeopleOutline, IoCheckmarkCircle} from "react-icons/io5";
import LogoutButton from "../components/Logout";
import { useContext } from "react";
import { AuthContext } from "../../context/Authcontext";
const weeklyData = [
  { name: "Mon", value: 400 },
  { name: "Tue", value: 650 },
  { name: "Wed", value: 500 },
  { name: "Thu", value: 450 },
  { name: "Fri", value: 700 },
  { name: "Sat", value: 980 },
  { name: "Sun", value: 620 },
];

const dailyData = [
  { name: "8AM", value: 120 },
  { name: "10AM", value: 200 },
  { name: "12PM", value: 350 },
  { name: "2PM", value: 300 },
  { name: "4PM", value: 420 },
  { name: "6PM", value: 280 },
];

export default function Dashboard() {
  const [view, setView] = useState("weekly");
  const chartData = view === "weekly" ? weeklyData : dailyData;
  const [metrics, setMetrics] = useState({
  activeUsers: 0,
  documentsProcessed: 0,
  complianceScore: 0,
  cpuUsage: 0,
  memoryUsage: 0,
});

useEffect(() => {
  const fetchMetrics = () => {
    fetch("https://veritas-ai-1-f5sr.onrender.com/dashboard-metrics")
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
      })
      .catch(err => console.error("FETCH ERROR:", err));
  };

  fetchMetrics(); 

  const interval = setInterval(fetchMetrics, 5000);

  return () => clearInterval(interval);
}, []);

const { user } = useContext(AuthContext);

  return (
    
    <div style={styles.page}>
    
      {/* Main */}
      <div style={styles.main}>
 {user?.role === "it admin" && (
  <div
    style={{
      position: "absolute",
      top: "40px",
      right: "60px",
      zIndex: 1000,
    }}
  >
    <LogoutButton />
  </div>
)}
        <h1 style={styles.heading}>Overview Dashboard</h1>
        
          
        {/* Stats */}
        <div style={styles.statsGrid}>
          <Stat
            title="Documents Processed (24h)"
           value={metrics.documentsProcessed}

            badge="+12%"
            icon={<IoDocumentTextOutline size={20} />}
          />

          <Stat
            title="Avg Compliance Score"
            value={`${metrics.complianceScore}%`}

            badge="+0.5%"
            icon={<IoShieldCheckmarkOutline size={20} />}
          />

          <Stat
            title="Active Users"
            value={metrics.activeUsers}
            badge="+3%"
            icon={<IoPeopleOutline size={20} />}
          />

         <Stat
  title="CPU Usage"
  value={`${metrics.cpuUsage}%`}
  icon={<IoCheckmarkCircle size={20} />}
/>

<Stat
  title="Memory Usage"
  value={`${metrics.memoryUsage}%`}
  icon={<IoCheckmarkCircle size={20} />}
/>

        </div>

        {/* Chart + Alerts */}
        <div style={styles.contentGrid}>
          {/* Chart */}
          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h3>Processing Trends</h3>
              <div>
                <button
                  style={
                    view === "daily" ? styles.toggleActive : styles.toggleBtn
                  }
                  onClick={() => setView("daily")}
                >
                  Daily
                </button>
                <button
                  style={
                    view === "weekly" ? styles.toggleActive : styles.toggleBtn
                  }
                  onClick={() => setView("weekly")}
                >
                  Weekly
                </button>
              </div>
            </div>

            <div style={{ height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      color: "#fff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={4}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts */}
          <div style={styles.alertCard}>
            <h3>Recent Alerts</h3>
            <div style={styles.alertItem}>⚠ Compliance Drift Detected</div>
            <div style={styles.alertItem}>👤 New User Provisioned</div>
            <div style={styles.alertItem}>✅ Audit Completed</div>
          </div>
        </div>

        {/* Active Processing Batches */}
        <div style={styles.tableCard}>
          <h3 style={styles.tableTitle}>Active Processing Batches</h3>

          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={styles.thLeft}>Batch ID</th>
                <th style={styles.thLeft}>Workflow</th>
                <th style={styles.thCenter}>Status</th>
                <th style={styles.thRight}>Records</th>
                <th style={styles.thRight}>Completion</th>
              </tr>
            </thead>

            <tbody>
              <tr
                style={styles.tr}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f8fafc")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td style={styles.tdLeft}>#BT-8422</td>
                <td style={styles.tdLeft}>Quarterly Tax Validation</td>
                <td style={styles.tdCenter}>
                  <span style={styles.statusProcessing}>PROCESSING</span>
                </td>
                <td style={styles.tdRight}>14,200</td>
                <td style={styles.tdCompletion}>
                  <div style={styles.completionWrapper}>
                    <span style={styles.completionPercent}>65%</span>
                    <div style={styles.progressTrack}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: "65%",
                          background: "#11376b",
                        }}
                      />
                    </div>
                  </div>
                </td>
              </tr>

              <tr
                style={styles.tr}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f8fafc")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td style={styles.tdLeft}>#BT-8421</td>
                <td style={styles.tdLeft}>Employee PII Sanitization</td>
                <td style={styles.tdCenter}>
                  <span style={styles.statusCompleted}>COMPLETED</span>
                </td>
                <td style={styles.tdRight}>2,840</td>
                <td style={styles.tdCompletion}>
                  <div style={styles.completionWrapper}>
                    <span style={styles.completionPercent}>100%</span>
                    <div style={styles.progressTrack}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: "100%",
                          background: "#116b44",
                        }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* Small Components */

function Stat({ title, value, icon, badge, live }) {
  return (
    <div style={styles.statCard}>
      {/* Top Section */}
      <div style={styles.statTop}>
        <div style={styles.iconBox}>{icon}</div>

        {badge && <div style={styles.statBadge}>{badge}</div>}

        {live && (
          <div style={styles.liveBadge}>
            <span style={styles.liveDot}></span>
            LIVE
          </div>
        )}
      </div>

      <p style={styles.statLabel}>{title}</p>
      <h2 style={styles.statValue}>{value}</h2>
    </div>
  );
}

function Progress({ percent, green }) {
  return (
    <div style={styles.progressWrapper}>
      <div style={styles.progressRow}>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: percent + "%",
              background: green
                ? "linear-gradient(90deg, #16a34a, #22c55e)"
                : "linear-gradient(90deg, #11376b, #1e4fa3)",
            }}
          />
        </div>
        <span style={styles.progressPercent}>{percent}%</span>
      </div>
    </div>
  );
}

/* Styles */

const styles = {
page: {
  display: "flex",
  flexDirection: "column",  
  minHeight: "100vh",
  background: "#ffffff",
  fontFamily: "Inter, sans-serif",
  color: "#111111",
},


  /* Sidebar */
  sidebar: {
    width: "260px",
    background: "#f8f9fb",
    padding: "30px 20px",
    borderRight: "1px solid #e5e7eb",
  },

  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "40px",
  },

  logo: {
    width: "45px",
    height: "45px",
    background: "#11376b",
    color: "#ffffff",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },

  brand: {
    fontSize: "18px",
    fontWeight: "600",
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  menuItem: {
    padding: "12px",
    borderRadius: "10px",
    cursor: "pointer",
    color: "#6b7280",
    transition: "0.2s",
  },

  menuItemActive: {
    padding: "12px",
    borderRadius: "10px",
    background: "#eef2ff",
    color: "#11376b",
    fontWeight: "500",
  },

  /* Main */
  main: {
    flex: 1,
    padding: "40px",
    background: "#ffffff",
  },

  heading: {
    marginBottom: "30px",
    fontWeight: "600",
  },

statsGrid: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 320px",
  gridTemplateRows: "auto auto",
  gap: "28px",
  alignItems: "stretch",
},




statCard: {
  position: "relative",
  background: "linear-gradient(135deg, #ffffff, #f8fafc)",
  padding: "26px",
  borderRadius: "20px",
  border: "1px solid rgba(17, 24, 39, 0.06)",
  boxShadow: "0 10px 30px rgba(17, 24, 39, 0.08)",
  backdropFilter: "blur(10px)",
  transition: "all 0.3s ease",
  overflow: "hidden",
},


  statTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },

  iconBox: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    background: "#e0e7ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#11376b",
  },

  statBadge: {
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "20px",
    background: "#d1fae5",
    color: "#065f46",
  },

  liveBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#16a34a",
  },

  liveDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#16a34a",
  },

  statLabel: {
    fontSize: "13px",
    color: "#6b7280",
  },

  statValue: {
    marginTop: "6px",
    fontSize: "30px",
    fontWeight: "700",
    color: "#111111",
  },

  /* Chart + Alerts */
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "20px",
    marginTop:"10px",
  },

  chartCard: {
    background: "#ffffff",
    padding: "25px",
    borderRadius: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
  },

  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px",
  },

  toggleBtn: {
    background: "transparent",
    border: "1px solid #e5e7eb",
    color: "#6b7280",
    padding: "6px 12px",
    marginLeft: "8px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  toggleActive: {
    background: "#11376b",
    border: "none",
    color: "#ffffff",
    padding: "6px 12px",
    marginLeft: "8px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  alertCard: {
    background: "#ffffff",
    padding: "25px",
    borderRadius: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
  },

  alertItem: {
    marginBottom: "15px",
    padding: "12px",
    borderRadius: "10px",
    background: "#f3f4f6",
    color: "#374151",
  },

  /* Table */
  tableCard: {
    marginTop: "50px",
    background: "#f8fafc",
    padding: "32px",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
  },

  tableTitle: {
    marginBottom: "24px",
    fontWeight: "600",
    fontSize: "20px",
    color: "#0f172a",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  tableHeadRow: {
    borderBottom: "1px solid #e2e8f0",
  },

  thLeft: {
    textAlign: "left",
    padding: "16px 0",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "0.6px",
    textTransform: "uppercase",
    color: "#64748b",
  },

  thCenter: {
    textAlign: "center",
    padding: "16px 0",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "0.6px",
    textTransform: "uppercase",
    color: "#64748b",
  },

  thRight: {
    textAlign: "right",
    padding: "16px 0",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "0.6px",
    textTransform: "uppercase",
    color: "#64748b",
  },

  tr: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.2s ease",
  },

  tdLeft: {
    textAlign: "left",
    padding: "20px 0",
    fontSize: "14px",
    fontWeight: "500",
    color: "#0f172a",
  },

  tdCenter: {
    textAlign: "center",
    padding: "20px 0",
  },

  tdRight: {
    textAlign: "right",
    padding: "20px 0",
    fontWeight: "500",
    color: "#0f172a",
  },

  statusProcessing: {
    padding: "6px 14px",
    fontSize: "11px",
    borderRadius: "999px",
    background: "#fef9c3",
    color: "#92400e",
    fontWeight: "600",
    letterSpacing: "0.4px",
  },

  statusCompleted: {
    padding: "6px 14px",
    fontSize: "11px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: "600",
    letterSpacing: "0.4px",
  },

  progressWrapper: {
    width: "200px",
    marginLeft: "auto",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },

  progressLabel: {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "500",
  },
 
  progressFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.4s ease",
  },

  progressPercent: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
    minWidth: "40px",
    textAlign: "right",
  },
  tdCompletion: {
    padding: "20px 0",
    textAlign: "right",
  },

  completionWrapper: {
    width: "180px",
    marginLeft: "auto",
  },

  completionPercent: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "6px",
  },

  progressTrack: {
    height: "8px",
    background: "#e5e7eb",
    borderRadius: "999px",
    overflow: "hidden",
  },
};
