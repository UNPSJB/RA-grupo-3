import React from "react";

type IconsProps = {
  className?: string;
};

export const CheckIcon: React.FC<IconsProps> = ({
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
      strokeWidth="1"
      d="M5 11.917 9.724 16.5 19 7.5"
    />
  </svg>
);
