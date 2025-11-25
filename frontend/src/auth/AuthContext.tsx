import type { ReactNode } from "react";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface UserData {
  sub: string;
  role: "ALUMNO" | "DOCENTE" | "ADMIN_SECRETARIA" | "ADMIN_DEPARTAMENTO";
  name: string;
  exp: number;
}

interface AuthContextType {
  token: string | null;
  role: UserData["role"] | null;
  username: string | null;
  fullName: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [role, setRole] = useState<UserData["role"] | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const payloadBase64 = token.split(".")[1];
        const decodedPayload = atob(payloadBase64);
        const userData: UserData = JSON.parse(decodedPayload);

        if (userData.exp * 1000 > Date.now()) {
          setRole(userData.role);
          setUsername(userData.sub);
          setFullName(userData.name);
          localStorage.setItem("token", token);
        } else {
          logout();
        }
      } catch (error) {
        console.error("Error decodificando el token:", error);
        logout();
      }
    } else {
      localStorage.removeItem("token");
      setRole(null);
      setUsername(null);
      setFullName(null);
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/token`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errMsg = "Error al iniciar sesión";
        try {
          const err = await response.json();
          errMsg = err.detail || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      const new_token = data.access_token;

      // Decodificar token
      const payloadBase64 = new_token.split(".")[1];
      const decodedPayload = atob(payloadBase64);
      const userData: UserData = JSON.parse(decodedPayload);

      setToken(new_token);
      setRole(userData.role);
      setUsername(userData.sub);
      setFullName(userData.name);

      // Redirección según rol
      switch (userData.role) {
        case "ALUMNO":
          navigate("/alumno");
          break;
        case "DOCENTE":
          navigate("/profesores");
          break;
        case "ADMIN_DEPARTAMENTO":
          navigate("/departamento");
          break;
        case "ADMIN_SECRETARIA":
          navigate("/secretaria");
          break;
        default:
          navigate("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setToken(null);
    setRole(null);
    setUsername(null);
    setFullName(null);
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{ token, role, username,fullName, login, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
