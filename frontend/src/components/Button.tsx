import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  // Cambiamos 'aux: string' por 'children: ReactNode'
  children: React.ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "ghost"
    | "action"
    | "disabled"
    | "unstyled";
  isActive?: boolean;
};

export function Button({
  children,
  className = "",
  variant = "unstyled",
  isActive = false,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg focus:z-10 focus:ring-2 transition-colors duration-200";
  const themes = {
    primary:
      "bg-blue-700 text-white border-blue-700 hover:bg-blue-800 focus:ring-blue-300",
    secondary:
      "bg-white text-gray-900 border-gray-200 hover:bg-gray-100 focus:ring-blue-500",

    ghost: `
      bg-transparent
      text-white
      border
      border-white/50             // <-- Contorno blanco semi-transparente
      hover:bg-white/20          // <-- Fondo blanco transparente al hover
      hover:text-white           // <-- Texto blanco al hover 
      focus:ring-white/50
    `,
    action: "bg-green-600 text-white border-transparent hover:bg-green-700",
    disabled: "bg-gray-300 text-gray-500 border-transparent cursor-not-allowed",
    unstyled: "",
  };
  const activeClass = isActive
    ? "bg-white/30 border-white text-white" // Fondo más opaco, borde y texto blancos para el activo
    : "";

  const themesClases = themes[variant];
  const combinedClasses = `${baseClasses} ${themesClases} ${activeClass} ${
    className || ""
  }`.trim();

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
}
