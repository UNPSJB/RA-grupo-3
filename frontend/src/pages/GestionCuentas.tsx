import React, { useState } from 'react';

const GestionCuentas: React.FC = () => {
    const [newPassword, setNewPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== repeatPassword) {
            setMessage('Las contraseñas nuevas no coinciden.');
            return;
        }

        if (currentPassword.length < 8) {
            setMessage('La contraseña actual debe tener al menos 8 caracteres.');
            return;
        }

        if (newPassword.length < 8) {
            setMessage('La contraseña nueva debe tener al menos 8 caracteres.');
            return;
        }

        // Lógica para cambiar la contraseña (actualmente solo frontend)
        console.log('Contraseña cambiada exitosamente (simulación)');
        setMessage('Contraseña cambiada exitosamente.');
        setNewPassword('');
        setRepeatPassword('');
        setCurrentPassword('');
    };

    return (
        <div className="flex justify-center min-h-screen bg-gray-100 pt-20">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md h-fit">
                <h2 className="text-2xl font-bold text-center text-gray-800">Cambiar Contraseña</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
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
                        <button
                            type="submit"
                            className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Aceptar
                        </button>
                    </div>
                </form>
                {message && (
                    <p className={`mt-4 text-sm text-center ${message.includes('exitosamente') ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
};

export default GestionCuentas;
