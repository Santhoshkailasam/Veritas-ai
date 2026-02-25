"use client";

import { useCallback, useState, useEffect } from "react";

import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { useContext } from "react";
import { AuthContext } from "../context/Authcontext";

/* ---------------- NODE TYPES ---------------- */

const NODE_TYPES = {
  extract: "Extract Text",
  gdpr: "Analyse GDPR",
  score: "Score Compliance",
};

/* ---------------- INITIAL FLOW ---------------- */

const initialNodes = [];
const initialEdges = [];

export default function WorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [file, setFile] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const { user } = useContext(AuthContext);
  const isAssociate = user?.role === "associate";
  const isExecutor = ["paralegal", "partner"].includes(user?.role);
  /* ---------------- ADD NODE ---------------- */

  const addNode = (type) => {
    const newNode = {
      id: Date.now().toString(),
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      data: { label: NODE_TYPES[type], type, status: "IDLE" },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  /* ---------------- VALID CONNECTION ---------------- */

  const isValidConnection = (connection) => {
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    const order = ["extract", "gdpr", "score"];

    const sourceIndex = order.indexOf(sourceNode.data.type);
    const targetIndex = order.indexOf(targetNode.data.type);

    return targetIndex === sourceIndex + 1;
  };

  const onConnect = useCallback(
    (params) => {
      if (!isAssociate) {
        alert("Only Associate can modify workflow.");
        return;
      }

      if (!isValidConnection(params)) {
        alert("Invalid workflow order!");
        return;
      }

      setEdges((eds) => addEdge(params, eds));
    },
    [nodes, isAssociate]
  );


  /* ---------------- VALIDATE WORKFLOW ---------------- */

  const validateWorkflow = () => {
    const required = ["extract", "gdpr", "score"];
    const types = nodes.map((n) => n.data.type);

    for (let r of required) {
      if (!types.includes(r)) {
        alert("Missing required node: " + NODE_TYPES[r]);
        return false;
      }
    }

    if (edges.length < 2) {
      alert("Connect workflow correctly.");
      return false;
    }

    if (!file) {
      alert("Please upload a document.");
      return false;
    }

    return true;
  };

  /* ---------------- UPDATE NODE STATUS ---------------- */

  const updateStatus = (type, status) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.data.type === type
          ? { ...node, data: { ...node.data, status } }
          : node
      )
    );
  };
  const onNodeContextMenu = useCallback((event, node) => {
    if (!isAssociate) return;

    event.preventDefault();
    event.stopPropagation();

    if (contextMenu && contextMenu.node.id === node.id) {
      setContextMenu(null);
      return;
    }

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      node,
    });
  }, [contextMenu, isAssociate]);

  const replaceNode = (newType) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === contextMenu.node.id
          ? {
            ...n,
            data: {
              ...n.data,
              type: newType,
              label: NODE_TYPES[newType],
              status: "IDLE",
            },
          }
          : n
      )
    );

    setContextMenu(null);
  };
  const deleteNode = () => {
    const nodeId = contextMenu.node.id;

    setNodes((nds) => nds.filter((n) => n.id !== nodeId));

    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      )
    );

    setContextMenu(null);
  };

  /* ---------------- EXECUTION ---------------- */

  const runWorkflow = async () => {
    if (!validateWorkflow()) return;

    setRunning(true);
    setResult(null);

    try {
      /* ---------------- EXTRACT STAGE ---------------- */
      updateStatus("extract", "RUNNING");
      await new Promise((r) => setTimeout(r, 800));
      updateStatus("extract", "SUCCESS");

      /* ---------------- GDPR STAGE ---------------- */
      updateStatus("gdpr", "RUNNING");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("https://veritas-ai-1-f5sr.onrender.com/upload-nda", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("Backend Response:", data);

      /* ---------------- HANDLE ERRORS ---------------- */

      // Hard backend error
      if (!res.ok || data.error) {
        alert(data.error || "Invalid document uploaded.");

        setNodes((nds) =>
          nds.map((node) => ({
            ...node,
            data: { ...node.data, status: "FAILED" },
          }))
        );

        setRunning(false);
        return;
      }

      // Incomplete policy case
      if (data.status === "INCOMPLETE_POLICY") {
        alert("Policy is incomplete.\n\nMissing:\n" + data.missing_clauses?.join("\n"));

        updateStatus("gdpr", "FAILED");
        setRunning(false);
        return;
      }

      // If AI didn’t return score
      if (data.score === undefined && data.finalScore === undefined) {
        alert("AI did not return a valid compliance score.");

        updateStatus("gdpr", "FAILED");
        setRunning(false);
        return;
      }

      /* ---------------- SUCCESS ---------------- */

      updateStatus("gdpr", "SUCCESS");

      setResult(data);

      updateStatus("score", "RUNNING");
      await new Promise((r) => setTimeout(r, 600));
      updateStatus("score", "SUCCESS");

    } catch (err) {
      console.error("Workflow error:", err);
      updateStatus("gdpr", "FAILED");
    }

    setRunning(false);
  };

  /* ---------------- NODE STYLING ---------------- */

  const styledNodes = nodes.map((node) => {
    let borderColor = "#e5e7eb";

    if (node.data.status === "RUNNING") borderColor = "#11376b";
    if (node.data.status === "SUCCESS") borderColor = "#16a34a";
    if (node.data.status === "FAILED") borderColor = "#dc2626";

    return {
      ...node,
      style: {
        border: `2px solid ${borderColor}`,
        padding: 12,
        borderRadius: 12,
        background: "white",
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
      },

    };
  });
  const defaultTemplateNodes = [
    {
      id: "1",
      position: { x: 100, y: 100 },
      data: { label: "Extract Text", type: "extract", status: "IDLE" },
    },
    {
      id: "2",
      position: { x: 350, y: 100 },
      data: { label: "Analyse GDPR", type: "gdpr", status: "IDLE" },
    },
    {
      id: "3",
      position: { x: 600, y: 100 },
      data: { label: "Score Compliance", type: "score", status: "IDLE" },
    },
  ];

  const defaultTemplateEdges = [
    { id: "e1-2", source: "1", target: "2" },
    { id: "e2-3", source: "2", target: "3" },
  ];


  useEffect(() => {
    if (isExecutor) {
      setNodes(defaultTemplateNodes);
      setEdges(defaultTemplateEdges);
    }
  }, [isExecutor]);


  return (

    <div style={styles.page} onClick={() => contextMenu && setContextMenu(null)}>

      <div style={styles.container}>
        {/* LEFT PANEL */}
        <div style={styles.leftPanel}>
          <h3 style={{ marginBottom: 15 }}>
            {isAssociate ? "Workflow Builder" : "Workflow Executor"}
          </h3>


          {/* Show buttons ONLY for Associate */}
          {isAssociate &&
            Object.keys(NODE_TYPES).map((type) => (
              <button
                key={type}
                style={styles.addBtn}
                onClick={() => addNode(type)}
              >
                {NODE_TYPES[type]}
              </button>
            ))
          }



          <hr style={{ margin: "20px 0" }} />

          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button
            style={styles.runBtn}
            onClick={runWorkflow}
            disabled={running}
          >
            {running ? "Running Workflow..." : "Run Workflow"}
          </button>
        </div>

        {/* CANVAS */}
        <div style={styles.canvasWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={styledNodes}
              edges={edges}

              /* Allow changes ONLY for Associate */
              onNodesChange={isAssociate ? onNodesChange : undefined}
              onEdgesChange={isAssociate ? onEdgesChange : undefined}
              onConnect={isAssociate ? onConnect : undefined}

              /* Lock interactions */
              nodesDraggable={isAssociate}
              nodesConnectable={isAssociate}
              elementsSelectable={isAssociate}
              panOnDrag={true}
              zoomOnScroll={true}

              /* Delete restriction */
              deleteKeyCode={isAssociate ? ["Backspace", "Delete"] : null}

              /* Delete handler only if associate */
              onNodesDelete={
                isAssociate
                  ? (deleted) => {
                    setNodes((nds) =>
                      nds.filter((node) => !deleted.some((d) => d.id === node.id))
                    );

                    setEdges((eds) =>
                      eds.filter(
                        (edge) =>
                          !deleted.some(
                            (d) => d.id === edge.source || d.id === edge.target
                          )
                      )
                    );
                  }
                  : undefined
              }

              /* Context menu only for associate */
              onNodeContextMenu={isAssociate ? onNodeContextMenu : undefined}

              fitView
            >


              <Controls />
              <Background gap={16} size={1} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>

      {/* PREMIUM RESULT PANEL */}
      {result && (
        <div style={styles.resultWrapper}>
          <div style={styles.resultCard}>

            {/* CLOSE BUTTON */}
            <button
              style={styles.closeBtn}
              onClick={() => {
                setResult(null);

                // Reset node statuses when closing result
                setNodes((nds) =>
                  nds.map((node) => ({
                    ...node,
                    data: { ...node.data, status: "IDLE" },
                  }))
                );
              }}
            >
              ✕
            </button>

            <div style={styles.scoreSection}>
              <h2 style={styles.scoreTitle}>Compliance Score</h2>
              <div style={styles.scoreCircle}>

                {result.score}%


              </div>
            </div>

            <div style={styles.reasonSection}>
              <h3 style={styles.reasonTitle}>AI Analysis Details</h3>

              {/* Rules Triggered */}
              {result.rules_triggered?.length > 0 && (
                <>
                  <h4>Rules Triggered</h4>
                  {result.rules_triggered.map((rule, index) => (
                    <div key={index} style={styles.reasonItem}>
                      <div style={styles.reasonText}>{rule}</div>
                    </div>
                  ))}
                </>
              )}

              {/* Missing Requirements */}
              {result.missing_requirements?.length > 0 && (
                <>
                  <h4>Missing Requirements</h4>
                  {result.missing_requirements.map((req, index) => (
                    <div
                      key={index}
                      style={{ ...styles.reasonItem, borderLeft: "4px solid #dc2626" }}
                    >
                      <div style={styles.reasonText}>{req}</div>
                    </div>
                  ))}
                </>
              )}

              {/* Text Evidence */}
              {result.text_evidence?.length > 0 && (
                <>
                  <h4>Text Evidence</h4>
                  {result.text_evidence.map((text, index) => (
                    <div
                      key={index}
                      style={{ ...styles.reasonItem, borderLeft: "4px solid #16a34a" }}
                    >
                      <div style={styles.reasonText}>{text}</div>
                    </div>
                  ))}
                </>
              )}

              {/* Meta Info */}
              <div style={{ marginTop: 20, fontSize: 13, color: "#6b7280" }}>
                Confidence: {result.confidence} | Risk Level: {result.risk_level} |
                Analysis Time: {result.analysis_time_ms}ms
              </div>
            </div>

          </div>
        </div>
      )}
      {/* CONTEXT MENU */}
      {contextMenu && (
        <div
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            background: "white",
            borderRadius: 8,
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
            padding: 10,
            zIndex: 2000,
            minWidth: 160,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.menuTitle}>Replace Node</div>

          {Object.keys(NODE_TYPES)
            .filter((type) => type !== contextMenu.node.data.type)
            .map((type) => (
              <div
                key={type}
                style={styles.menuItem}
                onClick={() => replaceNode(type)}
              >
                {NODE_TYPES[type]}
              </div>
            ))}

          <hr style={{ margin: "8px 0" }} />

          <div
            style={{ ...styles.menuItem, color: "#dc2626" }}
            onClick={deleteNode}
          >
            Delete Node
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- PREMIUM STYLES ---------------- */

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "linear-gradient(135deg, #f1f5f9, #e0e7ff)",
  },

  container: {
    display: "flex",
    flex: 1,
  },

  leftPanel: {
    width: 280,
    padding: 25,
    borderRight: "1px solid #e5e7eb",
    background: "white",
  },

  addBtn: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    border: "1px solid #d1d5db",
    cursor: "pointer",
    background: "#f8fafc",
  },

  runBtn: {
    marginTop: 20,
    width: "100%",
    padding: 12,
    background: "linear-gradient(135deg, #11376b, #2563eb)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
  },

  canvasWrapper: {
    flex: 1,
  },

  resultWrapper: {
    padding: 40,
    background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
  },

  resultCard: {
    position: "relative",   // IMPORTANT
    maxWidth: 1100,
    margin: "auto",
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(12px)",
    borderRadius: 20,
    padding: 40,
    display: "flex",
    gap: 50,
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
  },


  scoreSection: {
    minWidth: 250,
    textAlign: "center",
  },

  scoreTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 20,
  },

  scoreCircle: {
    width: 170,
    height: 170,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #11376b, #2563eb)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 36,
    fontWeight: 700,
    boxShadow: "0 15px 30px rgba(17,55,107,0.4)",
  },

  reasonSection: {
    flex: 1,
  },

  reasonTitle: {
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 20,
  },

  reasonItem: {
    background: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    borderLeft: "4px solid #11376b",
    boxShadow: "0 6px 15px rgba(0,0,0,0.05)",
  },

  reasonStep: {
    fontSize: 12,
    fontWeight: 600,
    color: "#11376b",
    marginBottom: 6,
  },

  reasonText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 1.6,
  },
  closeBtn: {
    position: "absolute",
    top: 15,
    right: 20,
    border: "none",
    background: "transparent",
    fontSize: 20,
    cursor: "pointer",
    color: "#6b7280",
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 6,
    color: "#6b7280",
  },

  menuItem: {
    padding: "6px 8px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  },
};
