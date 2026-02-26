import { useNavigate, useLocation } from "react-router-dom";
import LogoutButton from "./Logout";
export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={styles.navbar}>
      {/* Left */}
      <div style={styles.leftSection}>
        <div style={styles.logo}>V</div>
        <span style={styles.brand}>Veritas AI</span>
      </div>

      {/* Center Menu */}
      <div style={styles.menu}>
        <NavItem
          label="Dashboard"
          active={location.pathname === "/dashboard"}
          onClick={() => navigate("/dashboard")}
        />

        <NavItem
          label="Workflow Builder"
          active={location.pathname === "/workflow"}
          onClick={() => navigate("/workflow")}
        />

        <NavItem label="Documents" />
        <NavItem label="Audit Logs"   active={location.pathname === "/auditlogs"} onClick={() => navigate("/auditlogs")}/>
        <NavItem label="System Metrics" />
      </div>

      {/* Right */}
     <LogoutButton />
    </div>
  );
}

function NavItem({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...styles.navItem,
        ...(active ? styles.navItemActive : {}),
      }}
    >
      {label}
    </div>
  );
}


const styles = {
  navbar: {
    height: "74px",
    width: "100%",
    background: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 60px",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },

  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  logo: {
    width: "42px",
    height: "42px",
    background: "linear-gradient(135deg, #11376b, #1e4fa3)",
    color: "#ffffff",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    boxShadow: "0 6px 18px rgba(17,55,107,0.25)",
  },

  brand: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
  },

  menu: {
    display: "flex",
    alignItems: "center",
    gap: "40px",
    height: "100%",
  },

  navItem: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#64748b",
    cursor: "pointer",
    height: "100%",
    display: "flex",
    alignItems: "center",
    borderBottom: "3px solid transparent",
    transition: "all 0.25s ease",
  },

  navItemActive: {
    color: "#11376b",
    borderBottom: "3px solid #11376b",
  },

  rightSection: {
    display: "flex",
    alignItems: "center",
  },

  userCircle: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #11376b, #1e4fa3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    color: "#ffffff",
    boxShadow: "0 6px 18px rgba(17,55,107,0.25)",
  },
};

