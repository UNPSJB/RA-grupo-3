import type { ReactNode } from "react";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Define la URL de tu API
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Define la forma de los datos del usuario que sacaremos del token
interface UserData {
  sub: string; // El username
  role: "ALUMNO" | "DOCENTE" | "ADMIN"; // Ajusta esto a tus roles
  exp: number;
}

// Define lo que nuestro Contexto va a proveer
interface AuthContextType {
  token: string | null;
  role: UserData["role"] | null;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

// 1. Creamos el Contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Creamos el "Proveedor" del Contexto
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [role, setRole] = useState<UserData["role"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const navigate = useNavigate();

  // Efecto para decodificar el rol cuando el token cambia (o al cargar la app)
  useEffect(() => {
    if (token) {
      try {
        const payloadBase64 = token.split(".")[1];
        const decodedPayload = atob(payloadBase64);
        const userData: UserData = JSON.parse(decodedPayload);
        
        // Verificar si el token ha expirado
        if (userData.exp * 1000 > Date.now()) {
          setRole(userData.role);
          setUsername(userData.sub);
          localStorage.setItem("token", token);
        } else {
          // Token expirado
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
    }
  }, [token]);

  // Función de Login
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al iniciar sesión");
      }

      const data = await response.json();
      const new_token = data.access_token;
      
      // Decodificamos el token AQUÍ MISMO solo para la redirección
      let userRole: UserData["role"] = "ALUMNO"; // Default
      try {
         const payloadBase64 = new_token.split(".")[1];
         const decodedPayload = atob(payloadBase64);
         const userData: UserData = JSON.parse(decodedPayload);
         userRole = userData.role;
      } catch (e) {
         console.error("Error decodificando token en login:", e);
      }

      // Seteamos el token (esto disparará el useEffect)
      setToken(new_token); 

      // Redirección basada en el rol
      switch (userRole) {
        case "ALUMNO":
          navigate("/alumno");
          break;
        case "DOCENTE":
          navigate("/profesores");
          break;
        case "ADMIN":
          navigate("/secretaria");
          break;
        default:
          navigate("/"); // Fallback
      }

    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Función de Logout
  const logout = () => {
    setToken(null);
    setRole(null);
    setUsername(null);
    localStorage.removeItem("token");
    navigate("/login"); // Redirige al Login
  };

  return (
    <AuthContext.Provider value={{ token, role, username, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Creamos un "Hook" para usar el contexto fácilmente
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};