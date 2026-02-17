import { useState } from "react";
import Navbar from "../components/Navbar";

export default function WorkflowBuilder() {
  const [nodes, setNodes] = useState([
    { id: 1, name: "Upload Document", status: "IDLE" },
    { id: 2, name: "GDPR Analysis", status: "IDLE" },
    { id: 3, name: "Compliance Score", status: "IDLE" },
  ]);

  const [running, setRunning] = useState(false);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const updateStatus = (index, status) => {
    setNodes((prev) =>
      prev.map((node, i) => (i === index ? { ...node, status } : node)),
    );
  };

  const runWorkflow = async () => {
    if (!file) {
      alert("Please upload NDA document first.");
      return;
    }

    setRunning(true);

    // STEP 1: Upload Document
    updateStatus(0, "RUNNING");
    await new Promise((r) => setTimeout(r, 800));
    updateStatus(0, "SUCCESS");

    // STEP 2: GDPR Analysis (Call Backend)
    updateStatus(1, "RUNNING");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload-nda", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        alert(data.error || "Invalid document uploaded.");
        updateStatus(1, "FAILED");
        setRunning(false);
        return;
      }

      setResult(data);

      updateStatus(1, "SUCCESS");

      // STEP 3: Compliance Score
      updateStatus(2, "RUNNING");
      await new Promise((r) => setTimeout(r, 600));
      updateStatus(2, "SUCCESS");
    } catch (err) {
      console.error(err);
      updateStatus(1, "FAILED");
    }

    setRunning(false);
  };

  return (
    <div style={styles.page}>
      <Navbar active="workflow" />

      <div style={styles.container}>
        {/* LEFT PANEL */}
        <div style={styles.leftPanel}>
          <h3 style={styles.panelTitle}>Upload NDA</h3>

          <input
            type="file"
            accept=".txt,.pdf,.docx"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ marginTop: 10 }}
          />
        </div>

        {/* CANVAS */}
        <div style={styles.canvas}>
          <div style={styles.canvasHeader}>
            <h2 style={styles.title}>NDA Compliance Workflow</h2>

            <button
              style={styles.runBtn}
              onClick={runWorkflow}
              disabled={running}
            >
              {running ? "Running..." : "Run Workflow"}
            </button>
          </div>

          <div style={styles.pipeline}>
            {nodes.map((node, index) => (
              <div key={node.id} style={styles.nodeBlock}>
                <Node node={node} />
                {index !== nodes.length - 1 && (
                  <div style={styles.verticalConnector} />
                )}
              </div>
            ))}
          </div>

          {/* RESULT PANEL */}
          {result && result.finalScore !== undefined && (
            <div style={styles.premiumCard}>
              {/* Header */}
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={{ margin: 0 }}>Compliance Assessment</h3>
                  <p style={styles.subText}>
                    Multi-Framework Evaluation Report
                  </p>
                </div>

                <div
                  style={{
                    ...styles.scoreBadge,
                    background:
                      result.finalScore >= 80
                        ? "linear-gradient(135deg,#16a34a,#22c55e)"
                        : result.finalScore >= 50
                          ? "linear-gradient(135deg,#f59e0b,#fbbf24)"
                          : "linear-gradient(135deg,#dc2626,#ef4444)",
                  }}
                >
                  {result.finalScore}%
                </div>
              </div>

              {/* Status + Risk */}
              <div style={styles.statusRow}>
                <span
                  style={{
                    ...styles.statusTag,
                    background:
                      result.finalScore >= 80
                        ? "#dcfce7"
                        : result.finalScore >= 50
                          ? "#fef3c7"
                          : "#fee2e2",
                    color:
                      result.finalScore >= 80
                        ? "#166534"
                        : result.finalScore >= 50
                          ? "#92400e"
                          : "#991b1b",
                  }}
                >
                  {result.status}
                </span>

                <span style={styles.riskText}>
                  Risk Level:{" "}
                  <strong>
                    {result.finalScore >= 80
                      ? "Low"
                      : result.finalScore >= 50
                        ? "Medium"
                        : "High"}
                  </strong>
                </span>
              </div>

              {/* Issues */}
              <div style={styles.issueSection}>
                <h4 style={{ marginBottom: 10 }}>Detected Issues</h4>

                {result.reasoning_chain &&
                result.reasoning_chain.length === 0 ? (
                  <div style={styles.successBox}>
                    ✓ All required clauses detected.
                  </div>
                ) : (
                  <ul style={styles.issueList}>
                    {result.reasoning_chain?.map((r, i) => (
                      <li key={i} style={styles.issueItem}>
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* NODE COMPONENT */

function Node({ node }) {
  const statusColor =
    node.status === "SUCCESS"
      ? "#16a34a"
      : node.status === "RUNNING"
        ? "#f59e0b"
        : node.status === "FAILED"
          ? "#dc2626"
          : "#64748b";

  return (
    <div style={styles.node}>
      <div style={styles.nodeHeader}>
        <span>{node.name}</span>
        <span style={{ ...styles.statusBadge, color: statusColor }}>
          {node.status}
        </span>
      </div>
    </div>
  );
}

/* STYLES */

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "Inter, sans-serif",
  },

  container: {
    display: "flex",
    flex: 1,
  },

  leftPanel: {
    width: "260px",
    padding: "30px",
    borderRight: "1px solid #e5e7eb",
    background: "#ffffff",
  },

  panelTitle: {
    fontWeight: "600",
  },

  canvas: {
    flex: 1,
    padding: "60px",
  },

  canvasHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "40px",
  },

  title: {
    fontSize: "22px",
    fontWeight: "600",
  },

  runBtn: {
    background: "#11376b",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  },

  pipeline: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  nodeBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  node: {
    width: "340px",
    padding: "22px",
    borderRadius: "14px",
    background: "#ffffff",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  },

  nodeHeader: {
    display: "flex",
    justifyContent: "space-between",
  },

  statusBadge: {
    fontSize: "12px",
    fontWeight: "600",
  },

  verticalConnector: {
    width: "2px",
    height: "50px",
    background: "#e5e7eb",
  },

  resultBox: {
    marginTop: "50px",
    padding: "25px",
    borderRadius: "14px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },
  premiumCard: {
    marginTop: 50,
    padding: "35px",
    borderRadius: "20px",
    background: "linear-gradient(135deg,#ffffff,#f9fafb)",
    boxShadow: "0 15px 40px rgba(0,0,0,0.08)",
    border: "1px solid rgba(0,0,0,0.05)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  subText: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: 4,
  },

  scoreBadge: {
    padding: "18px 26px",
    borderRadius: "14px",
    fontSize: "22px",
    fontWeight: "700",
    color: "#ffffff",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
  },

  statusRow: {
    marginTop: 25,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statusTag: {
    padding: "8px 18px",
    borderRadius: "999px",
    fontWeight: "600",
    fontSize: "13px",
  },

  riskText: {
    fontSize: "14px",
    color: "#374151",
  },

  frameworkGrid: {
    marginTop: 30,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
  },

  frameworkCard: {
    padding: "18px",
    borderRadius: "14px",
    background: "#ffffff",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
    textAlign: "center",
  },

  frameworkLabel: {
    display: "block",
    fontSize: "13px",
    color: "#64748b",
  },

  frameworkValue: {
    fontSize: "20px",
    fontWeight: "700",
    marginTop: 6,
  },

  issueSection: {
    marginTop: 35,
  },

  issueList: {
    paddingLeft: 20,
  },

  issueItem: {
    marginBottom: 8,
    color: "#dc2626",
    fontSize: "14px",
  },

  successBox: {
    padding: "12px",
    borderRadius: "10px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: "500",
  },
};
