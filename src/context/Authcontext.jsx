import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 🔥 Demo Users (Frontend Only)
  const demoUsers = [
    {
      email: "paralegal@firm.com",
      password: "123",
      role: "paralegal",
    },
    {
      email: "associate@firm.com",
      password: "123",
      role: "associate",
    },
    {
      email: "partner@firm.com",
      password: "123",
      role: "partner",
    },
    {
      email: "admin@firm.com",
      password: "123",
      role: "it admin",
    },
  ];

  // 🔁 Auto login after refresh
  useEffect(() => {
    const storedUser = localStorage.getItem("veritas_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 🔐 LOGIN FUNCTION
  const login = (email, password) => {
    const validUser = demoUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!validUser) {
      return { success: false, message: "Invalid email or password" };
    }

    const userData = {
      email: validUser.email,
      role: validUser.role,
      isLoggedIn: true,
    };

    // Save in localStorage
    localStorage.setItem("veritas_user", JSON.stringify(userData));

    setUser(userData);

    // 🔥 IMPORTANT (Fixes your error)
    return { success: true, user: userData };
  };

  // 🚪 LOGOUT FUNCTION
  const logout = () => {
    localStorage.removeItem("veritas_user");
    setUser(null);
  };

  // 🔍 Helper: Check Role
  const hasRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        hasRole, // optional helper
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
