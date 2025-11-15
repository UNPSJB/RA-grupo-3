import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
      // La navegación al home la maneja el context,
      // pero podrías forzarla aquí también si quisieras
      // navigate("/"); 
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return (
    <div className="flex justify-center min-h-screen bg-gray-100 pt-10">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md h-fit">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Iniciar Sesión
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="mt-4 text-sm text-center text-red-600">
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="username"
              className="text-sm font-medium text-gray-700"
            >
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {isLoading ? "Ingresando..." : "Ingresar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;