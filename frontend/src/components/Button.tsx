import type { ButtonHTMLAttributes } from "react";
import "../Styles/Styles.css";

type ButtonProps = {
  aux: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ aux, className = "", onClick, ...props }: ButtonProps) {
  const handleClick = onClick ?? (() => alert("¡Botón de prueba presionado!"));

  return (
    <button
      className={`btn ${className}`.trim()}
      onClick={handleClick}
      type="button"
      {...props}
    >
      {aux}
    </button>
  );
}
