import { useState } from "react";
import Navbar from "../components/Navbar";

export default function AuditLogs() {
  const dummyLogs = [
    {
      id: 1,
      user: "santhosh@company.com",
      action: "UPLOAD_POLICY",
      status: "SUCCESS",
      timestamp: "2026-02-17T16:02:10Z",
    },
    {
      id: 2,
      user: "admin@company.com",
      action: "LOGIN",
      status: "SUCCESS",
      timestamp: "2026-02-17T14:42:22Z",
    },
    {
      id: 3,
      user: "john@company.com",
      action: "UPLOAD_POLICY",
      status: "FAILED",
      timestamp: "2026-02-16T22:15:10Z",
    },
    {
      id: 4,
      user: "admin@company.com",
      action: "LOGOUT",
      status: "SUCCESS",
      timestamp: "2026-02-16T23:50:55Z",
    },
  ];

  const [logs] = useState(dummyLogs);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "ALL" || log.action === filter;

    return matchesSearch && matchesFilter;
  });

  const total = logs.length;
  const success = logs.filter((l) => l.status === "SUCCESS").length;
  const failed = logs.filter((l) => l.status === "FAILED").length;

  return (
    <div style={styles.page}>
      <Navbar active="audit" />

      <div style={styles.container}>
        <h1 style={styles.heading}>Audit Activity Dashboard</h1>

        {/* Summary Cards */}
        <div style={styles.cardGrid}>
          <StatCard title="Total Events" value={total} />
          <StatCard title="Successful" value={success} success />
          <StatCard title="Failed" value={failed} danger />
        </div>

        {/* Filters */}
        <div style={styles.filterBar}>
          <input
            type="text"
            placeholder="Search user or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.search}
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={styles.select}
          >
            <option value="ALL">All Actions</option>
            <option value="UPLOAD_POLICY">Upload</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
          </select>
        </div>

        {/* Table */}
      <div style={styles.premiumTableWrapper}>
  <table style={styles.premiumTable}>
    <thead>
      <tr style={styles.premiumHead}>
        <th style={styles.th}>User</th>
        <th style={styles.th}>Action</th>
        <th style={styles.thCenter}>Status</th>
        <th style={styles.thRight}>Timestamp</th>
      </tr>
    </thead>

    <tbody>
      {filteredLogs.map((log, index) => (
        <tr
          key={log.id}
          style={{
            ...styles.premiumRow,
            background:
              index % 2 === 0 ? "#ffffff" : "#f9fafb",
          }}
        >
          <td style={styles.td}>{log.user}</td>
          <td style={styles.td}>{log.action}</td>

          <td style={styles.tdCenter}>
            <span
              style={{
                ...styles.statusBadgePremium,
                background:
                  log.status === "SUCCESS"
                    ? "linear-gradient(135deg,#16a34a,#22c55e)"
                    : "linear-gradient(135deg,#dc2626,#ef4444)",
              }}
            >
              {log.status}
            </span>
          </td>

          <td style={styles.tdRight}>
            {new Date(log.timestamp).toLocaleString()}
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  {filteredLogs.length === 0 && (
    <div style={styles.empty}>No logs found.</div>
  )}
</div>

      </div>
    </div>
  );
}

/* ---------- Stat Card Component ---------- */

function StatCard({ title, value, success, danger }) {
  return (
    <div
      style={{
        ...styles.card,
        background: success
          ? "linear-gradient(135deg,#ecfdf5,#d1fae5)"
          : danger
          ? "linear-gradient(135deg,#fef2f2,#fee2e2)"
          : "linear-gradient(135deg,#ffffff,#f1f5f9)",
      }}
    >
      <p style={styles.cardTitle}>{title}</p>
      <h2 style={styles.cardValue}>{value}</h2>
    </div>
  );
}

/* ---------- Styles ---------- */

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #eef2ff 0%, #f8fafc 50%, #e0e7ff 100%)",
    fontFamily: "Inter, sans-serif",
  },

  container: {
    padding: "60px",
  },

  heading: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "40px",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "25px",
    marginBottom: "40px",
  },

  card: {
    padding: "30px",
    borderRadius: "22px",
    boxShadow: "0 20px 45px rgba(0,0,0,0.08)",
    transition: "all 0.3s ease",
  },

  cardTitle: {
    fontSize: "14px",
    color: "#64748b",
  },

  cardValue: {
    fontSize: "32px",
    fontWeight: "700",
    marginTop: "10px",
  },

  filterBar: {
    display: "flex",
    gap: "20px",
    marginBottom: "30px",
  },

  search: {
    padding: "12px 16px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    width: "300px",
    fontSize: "14px",
    background: "#ffffff",
    boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
  },

  select: {
    padding: "12px 16px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    background: "#ffffff",
    boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
  },

  

  empty: {
    padding: "20px",
    textAlign: "center",
    color: "#64748b",
  },
  premiumTableWrapper: {
  marginTop: "20px",
  borderRadius: "24px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 30px 80px rgba(0,0,0,0.08)",
},

premiumTable: {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: "0",
},

premiumHead: {
  background: "linear-gradient(135deg,#f1f5f9,#e2e8f0)",
  textAlign: "left",
},

th: {
  padding: "18px 24px",
  fontSize: "13px",
  fontWeight: "600",
  color: "#475569",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
},

thCenter: {
  padding: "18px 24px",
  textAlign: "center",
  fontSize: "13px",
  fontWeight: "600",
  color: "#475569",
  textTransform: "uppercase",
},

thRight: {
  padding: "18px 24px",
  textAlign: "right",
  fontSize: "13px",
  fontWeight: "600",
  color: "#475569",
  textTransform: "uppercase",
},

premiumRow: {
  transition: "all 0.25s ease",
  cursor: "default",
},

td: {
  padding: "18px 24px",
  fontSize: "14px",
  color: "#0f172a",
},

tdCenter: {
  padding: "18px 24px",
  textAlign: "center",
},

tdRight: {
  padding: "18px 24px",
  textAlign: "right",
  fontWeight: "500",
  color: "#334155",
},

statusBadgePremium: {
  padding: "6px 18px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "600",
  color: "#ffffff",
  boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
},

};
