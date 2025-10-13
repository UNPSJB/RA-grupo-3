import React from "react";

type IconsProps = {
  className?: string;
};

export const ChartLineIcon: React.FC<IconsProps> = ({
  className = "w-[29px] h-[29px] text-gray-800 dark:text-white",
}) => (
  <svg
    className={className}
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="0.8"
      d="M3 15v4m6-6v6m6-4v4m6-6v6M3 11l6-5 6 5 5.5-5.5"
    />
  </svg>
);
