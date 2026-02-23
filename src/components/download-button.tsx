"use client";

import { buildZip } from "@/lib/zip";
import type { GeneratedFile } from "@/lib/types";

interface DownloadButtonProps {
  files: GeneratedFile[];
}

export function DownloadButton({ files }: DownloadButtonProps) {
  async function handleDownload() {
    const blob = await buildZip(files);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "screenshop-output.zip";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Download ZIP
    </button>
  );
}
