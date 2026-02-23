"use client";

import { useEffect, useState } from "react";

const STATUS_MESSAGES = [
  "Sending screenshots to Claude...",
  "Analyzing visual design...",
  "Identifying color palette and typography...",
  "Generating pages and components...",
  "Assembling project files...",
  "Almost done...",
];

export function GenerationStatus() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
      <p className="text-gray-600 text-sm font-medium animate-pulse">
        {STATUS_MESSAGES[messageIndex]}
      </p>
      <p className="text-gray-400 text-xs">
        This usually takes 20–40 seconds
      </p>
    </div>
  );
}
