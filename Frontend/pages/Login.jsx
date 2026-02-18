import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const [selectedRole, setSelectedRole] = useState("paralegal");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

 const handleLogin = () => {
  const result = login(email, password);

  if (!result.success) {
    alert(result.message);
    return;
  }

  const role = result.user.role;

  if (role === "paralegal" || role === "associate") {
    navigate("/workflow");
  } else if (role === "partner") {
    navigate("/dashboard");
  } else if (role === "it admin") {
    navigate("/auditlogs");
  }
};



  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>V</div>
          <h1 style={styles.brand}>Veritas AI</h1>
          <p style={styles.tagline}>Secure Legal Intelligence</p>
        </div>

        {/* Card */}
        <div style={styles.card}>
          <h2 style={styles.welcome}>Welcome Back</h2>
          <p style={styles.subText}>
            Please select your role and sign in to your workspace.
          </p>

          <p style={styles.label}>IDENTIFY YOUR ROLE</p>

          <div style={styles.roleGrid}>
            {["paralegal", "associate", "partner", "IT admin"].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                style={{
                  ...styles.roleButton,
                  ...(selectedRole === role ? styles.activeRole : {}),
                }}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>

          {/* Email */}
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Email Address</label>
            <input
              type="email"
              placeholder="name@firm.com"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

          </div>

          {/* Password */}
          <div style={styles.inputGroup}>
            <div style={styles.passwordHeader}>
              <label style={styles.inputLabel}>Password</label>
              <span style={styles.forgot}>Forgot password?</span>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

          </div>

          <button
            style={styles.signInBtn}
            onClick={handleLogin}
          >
            Secure Sign In →
          </button>

        <p style={styles.bottomText}>
          New to Veritas? <span style={styles.link}>Request Firm Access</span>
        </p>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <span>🔒 SOC2 CERTIFIED</span>
        <span>🔐 256-BIT AES</span>
        <span>🛡 PRIVACY FIRST</span>
      </div>
    </div>
    </div >
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #111827 100%)",
    fontFamily: "Inter, system-ui, sans-serif",
  },

  wrapper: {
    width: "100%",
    maxWidth: "480px",
    textAlign: "center",
  },

  header: {
    marginBottom: "30px",
  },

  logo: {
    width: "60px",
    height: "60px",
    background: "linear-gradient(135deg, #2563eb, #4f46e5)",
    borderRadius: "16px",
    margin: "0 auto 15px",
    color: "#fff",
    fontSize: "28px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 15px 30px rgba(37,99,235,0.4)",
  },

  brand: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "700",
    color: "#ffffff",
  },

  tagline: {
    fontSize: "13px",
    color: "#94a3b8",
    marginTop: "6px",
  },

  card: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "35px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
    textAlign: "left",
    color: "#e5e7eb",
  },

  welcome: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "600",
  },

  subText: {
    fontSize: "13px",
    color: "#94a3b8",
    marginBottom: "25px",
  },

  label: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#9ca3af",
    marginBottom: "10px",
  },

  roleGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "25px",
  },

  roleButton: {
    padding: "12px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#e5e7eb",
    cursor: "pointer",
    fontWeight: "500",
    textTransform: "capitalize",
    transition: "all 0.3s ease",
  },

  activeRole: {
    border: "2px solid #3b82f6",
    backgroundColor: "rgba(59,130,246,0.15)",
    boxShadow: "0 10px 25px rgba(59,130,246,0.3)",
  },

  inputGroup: {
    marginBottom: "18px",
  },

  inputLabel: {
    fontSize: "12px",
    fontWeight: "500",
    marginBottom: "6px",
    display: "block",
    color: "#cbd5e1",
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#fff",
    outline: "none",
    transition: "0.3s",
  },

  passwordHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  forgot: {
    fontSize: "12px",
    color: "#60a5fa",
    cursor: "pointer",
  },

  signInBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #4f46e5)",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "15px",
    boxShadow: "0 15px 30px rgba(37,99,235,0.4)",
    transition: "all 0.3s ease",
  },

  bottomText: {
    textAlign: "center",
    fontSize: "12px",
    marginTop: "20px",
    color: "#94a3b8",
  },

  link: {
    color: "#60a5fa",
    fontWeight: "600",
    cursor: "pointer",
  },

  footer: {
    marginTop: "25px",
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    fontSize: "11px",
    color: "#64748b",
  },
};
