import React from "react";

interface ModalProps {
  isOpen: boolean;
  type: "success" | "confirm" | "error";
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
}

export const ModalConfirmacion: React.FC<ModalProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center transform transition-all scale-100 border border-gray-100">
        {/* Icono */}
        <div
          className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
            type === "success"
              ? "bg-green-100"
              : type === "error"
              ? "bg-red-100"
              : "bg-blue-100"
          }`}
        >
          {type === "success" ? (
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : type === "error" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>

        {/* Contenido */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>

        {/* Botones */}
        <div className="flex justify-center gap-3">
          {type === "confirm" ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition-transform active:scale-95"
              >
                Confirmar
              </button>
            </>
          ) : (
            <button
              onClick={onConfirm || onClose}
              className="w-full py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 shadow-sm"
            >
              Aceptar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
