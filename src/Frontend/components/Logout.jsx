import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/Authcontext";
import API_BASE from "../service/api";

export default function LogoutButton() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!user) return;

    try {
      await fetch(`${API_BASE}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: user.role, 
          action: "LOGOUT",
          status: "SUCCESS",
        }),
      });
    } catch (error) {
      console.error("Audit log failed:", error);
    }

    logout();
    navigate("/");
  };

  return (
    <button style={styles.logoutBtn} onClick={handleLogout}>
      Logout
    </button>
  );
}

const styles = {
  logoutBtn: {
    padding: "10px 20px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #dc2626, #ef4444)",
    color: "#ffffff",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
 
    transition: "all 0.25s ease",
  },
};