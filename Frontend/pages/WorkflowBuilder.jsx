"use client";

import { useCallback, useState } from "react";
import Navbar from "../components/Navbar";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

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

  /* ---------------- ADD NODE ---------------- */

  const addNode = (type) => {
    const newNode = {
      id: Date.now().toString(),
      position: { x: 200, y: 200 },
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
      if (!isValidConnection(params)) {
        alert("Invalid workflow order!");
        return;
      }
      setEdges((eds) => addEdge(params, eds));
    },
    [nodes]
  );

  /* ---------------- VALIDATE WHOLE FLOW ---------------- */

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

    return true;
  };

  /* ---------------- STATUS UPDATE ---------------- */

  const updateStatus = (type, status) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.data.type === type
          ? { ...node, data: { ...node.data, status } }
          : node
      )
    );
  };

  /* ---------------- EXECUTION ---------------- */

  const runWorkflow = async () => {
    if (!validateWorkflow()) return;

    setRunning(true);

    try {
      updateStatus("extract", "RUNNING");
      await new Promise((r) => setTimeout(r, 800));
      updateStatus("extract", "SUCCESS");

      updateStatus("gdpr", "RUNNING");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://127.0.0.1:8000/upload-nda", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        updateStatus("gdpr", "FAILED");
        setRunning(false);
        return;
      }

      updateStatus("gdpr", "SUCCESS");
      setResult(data);

      updateStatus("score", "RUNNING");
      await new Promise((r) => setTimeout(r, 600));
      updateStatus("score", "SUCCESS");
    } catch (err) {
      updateStatus("gdpr", "FAILED");
    }

    setRunning(false);
  };

  /* ---------------- NODE STYLING ---------------- */

  const styledNodes = nodes.map((node) => {
    let borderColor = "#e5e7eb";

    if (node.data.status === "RUNNING") borderColor = "#f59e0b";
    if (node.data.status === "SUCCESS") borderColor = "#16a34a";
    if (node.data.status === "FAILED") borderColor = "#dc2626";

    return {
      ...node,
      style: {
        border: `2px solid ${borderColor}`,
        padding: 10,
        borderRadius: 10,
      },
    };
  });

  return (
    <div style={styles.page}>
      <Navbar active="workflow" />

      <div style={styles.container}>
        {/* LEFT SIDEBAR */}
        <div style={styles.leftPanel}>
          <h3>Add Nodes</h3>

          <button style={styles.addBtn} onClick={() => addNode("extract")}>
            Extract Text
          </button>

          <button style={styles.addBtn} onClick={() => addNode("gdpr")}>
            Analyse GDPR
          </button>

          <button style={styles.addBtn} onClick={() => addNode("score")}>
            Score Compliance
          </button>

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
            {running ? "Running..." : "Run Workflow"}
          </button>
        </div>

        {/* FLOW CANVAS */}
        <div style={styles.canvasWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={styledNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
            >
              <Controls />
              <Background />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>

      {result && (
        <div style={styles.resultBox}>
          <h2>Compliance Score: {result.finalScore}%</h2>
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
  },
  container: {
    display: "flex",
    flex: 1,
  },
  leftPanel: {
    width: 260,
    padding: 20,
    borderRight: "1px solid #e5e7eb",
  },
  addBtn: {
    display: "block",
    width: "100%",
    marginBottom: 10,
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
    cursor: "pointer",
  },
  runBtn: {
    marginTop: 20,
    width: "100%",
    padding: 10,
    background: "#11376b",
    color: "#fff",
    border: "none",
    borderRadius: 6,
  },
  canvasWrapper: {
    flex: 1,
  },
  resultBox: {
    padding: 20,
  },
};
