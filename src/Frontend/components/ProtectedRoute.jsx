import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/Authcontext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useContext(AuthContext);

  // Wait until user loads
  if (user === null) return null;

  if (!user) return <Navigate to="/" />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}
