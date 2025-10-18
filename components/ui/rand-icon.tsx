import React from 'react';

interface RandIconProps {
  className?: string;
}

// South African Rand symbol - R with horizontal line
export function RandIcon({ className = "w-4 h-4" }: RandIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* R shape */}
      <path d="M7 3h8a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z" />
      {/* Vertical line */}
      <path d="M9 9h6" />
      <path d="M9 15h6" />
      {/* Horizontal line through R */}
      <path d="M9 12h4" />
      {/* Diagonal line */}
      <path d="M11 9h2" />
    </svg>
  );
}

// Alternative: Simple R symbol (more readable)
export function RandIconSimple({ className = "w-4 h-4" }: RandIconProps) {
  // Extract size classes and convert to text size
  const sizeClasses = className.match(/(w-\d+|h-\d+)/g) || [];
  let textSize = "text-base";
  
  // Convert width/height classes to appropriate text sizes
  if (sizeClasses.includes("w-3") || sizeClasses.includes("h-3")) {
    textSize = "text-xs";
  } else if (sizeClasses.includes("w-4") || sizeClasses.includes("h-4")) {
    textSize = "text-sm";
  } else if (sizeClasses.includes("w-5") || sizeClasses.includes("h-5")) {
    textSize = "text-base";
  } else if (sizeClasses.includes("w-6") || sizeClasses.includes("h-6")) {
    textSize = "text-lg";
  }
  
  // Remove size classes from className and add text size
  const cleanClassName = className.replace(/(w-\d+|h-\d+)/g, '').trim();
  
  return (
    <span className={`font-bold ${textSize} leading-none inline-flex items-center ${cleanClassName}`}>
      R
    </span>
  );
}
