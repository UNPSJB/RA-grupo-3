import React from "react";
import { Button } from "./Button";

export interface ButtonItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive: boolean;
}

export interface ButtonGroupProps {
  buttons: ButtonItem[];
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ buttons }) => {
  if (!buttons || buttons.length === 0) {
    return null;
  }

  return (
    <div className="inline-flex rounded-lg shadow-sm" role="group">
      {buttons.map((button, index) => {
        const activeClasses =
          "bg-blue-700 text-white border-blue-700 shadow-inner";
        const inactiveClasses =
          "bg-blue-500 text-white border-blue-600 hover:bg-blue-600";

        return (
          <Button
            key={button.id}
            onClick={button.onClick}
            variant="unstyled"
            className={`
              ${button.isActive ? activeClasses : inactiveClasses}
              ${index === 0 ? "rounded-l-lg" : ""}
              ${index === buttons.length - 1 ? "rounded-r-lg" : ""}
              ${
                buttons.length > 1 && index > 0 && index < buttons.length - 1
                  ? "rounded-none"
                  : ""
              }
              ${index > 0 ? "-ml-px" : ""} 
            `}
          >
            {button.icon}
            {button.label}
          </Button>
        );
      })}
    </div>
  );
};
