import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext'; // <--- CAMBIO 1: Importar

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const GestionCuentas: React.FC = () => {
    const [newPassword, setNewPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [message, setMessage] = useState('');
    
    // <--- CAMBIO 2: Añadir estado de carga y obtener token/logout
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { token, logout } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(''); // Limpiar mensaje previo

        // <--- CAMBIO 3: Validaciones de frontend (¡siguen siendo útiles!)
        if (newPassword !== repeatPassword) {
            setMessage('Las contraseñas nuevas no coinciden.');
            return;
        }
        if (newPassword.length < 8) {
            setMessage('La contraseña nueva debe tener al menos 8 caracteres.');
            return;
        }

        // <--- CAMBIO 4: Lógica de API
        setIsSubmitting(true);
        if (!token) {
            setMessage("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
            setIsSubmitting(false);
            logout();
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/account/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // Si la API nos da un error (ej. contraseña actual incorrecta)
                throw new Error(data.detail || 'Ocurrió un error');
            }

            // Éxito
            setMessage('Contraseña cambiada exitosamente.');
            setNewPassword('');
            setRepeatPassword('');
            setCurrentPassword('');

        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Error al cambiar la contraseña');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex justify-center min-h-screen bg-gray-100 pt-2">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md h-fit">
                <h2 className="text-2xl font-bold text-center text-gray-800">Cambiar Contraseña</h2>
                
                {/* <--- CAMBIO 5: Mostrar mensaje de éxito o error */}
                {message && (
                    <p className={`mt-4 text-sm text-center ${message.includes('exitosamente') ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ... (Tu input de new-password no cambia) ... */}
                    <div>
                        <label 
                            htmlFor="new-password" 
                            className="text-sm font-medium text-gray-700"
                        >
                            Nueva contraseña
                        </label>
                        <input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    {/* ... (Tu input de repeat-password no cambia) ... */}
                    <div>
                        <label 
                            htmlFor="repeat-password" 
                            className="text-sm font-medium text-gray-700"
                        >
                            Repetir contraseña
                        </label>
                        <input
                            id="repeat-password"
                            type="password"
                            value={repeatPassword}
                            onChange={(e) => setRepeatPassword(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    {/* ... (Tu input de current-password no cambia) ... */}
                    <div>
                        <label 
                            htmlFor="current-password" 
                            className="text-sm font-medium text-gray-700"
                        >
                            Ingrese su contraseña actual
                        </label>
                        <input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        {/* <--- CAMBIO 6: Deshabilitar botón mientras se envía */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                        >
                            {isSubmitting ? "Guardando..." : "Aceptar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GestionCuentas;