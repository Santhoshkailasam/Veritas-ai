import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/Authcontext";
import { useContext } from "react";

import Login from "./Frontend/pages/Login";
import Dashboard from "./Frontend/pages/Dashboard";
import WorkflowBuilder from "./Frontend/pages/WorkflowBuilder";
import AuditLogs from "./Frontend/pages/Auditlogs";
import ProtectedRoute from "./Frontend/components/ProtectedRoute";
import Navbar from "./Frontend/components/Navbar";

function Layout() {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  // Hide navbar on login page
  const isLoginPage = location.pathname === "/";

  const showNavbar =
    user &&
    user.role === "partner" &&
    !isLoginPage;

  return (
    <>
      {showNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["partner"]}>
              <Dashboard />
             
            </ProtectedRoute>
          }
        />
        <Route
  path="/auditlogs"
  element={
    <ProtectedRoute allowedRoles={["partner"]}>
      <AuditLogs />
    </ProtectedRoute>
  }
/>

       <Route
  path="/workflow"
  element={
    <ProtectedRoute allowedRoles={["paralegal", "associate", "partner"]}>
      <WorkflowBuilder />
    </ProtectedRoute>
  }
/>


        <Route
          path="/admindashboard"
          element={
            <ProtectedRoute allowedRoles={["it admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
}
