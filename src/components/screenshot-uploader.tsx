"use client";

import { useRef } from "react";
import type { PageHint, UploadedScreenshot } from "@/lib/types";

const PAGE_HINTS: PageHint[] = [
  "Homepage",
  "Product Page",
  "Collection Page",
  "Cart",
  "Other",
];

const MAX_FILES = 5;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

interface ScreenshotUploaderProps {
  screenshots: UploadedScreenshot[];
  onAdd: (file: File) => Promise<void>;
  onRemove: (index: number) => void;
  onHintChange: (index: number, hint: PageHint) => void;
}

export function ScreenshotUploader({
  screenshots,
  onAdd,
  onRemove,
  onHintChange,
}: ScreenshotUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = MAX_FILES - screenshots.length;
    Array.from(files)
      .slice(0, remaining)
      .forEach((file) => {
        if (file.size > MAX_SIZE_BYTES) {
          alert(`${file.name} exceeds 10MB limit.`);
          return;
        }
        onAdd(file);
      });
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-4">
      {screenshots.length < MAX_FILES && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <svg
            className="mx-auto w-10 h-10 text-gray-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="text-sm text-gray-600 font-medium">
            Drop screenshots here or click to browse
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PNG, JPEG, or WebP — up to {MAX_FILES} files, 10MB each
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {screenshots.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {screenshots.map((screenshot, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-3 flex gap-3 bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshot.previewUrl}
                alt={`Screenshot ${index + 1}`}
                className="w-20 h-20 object-cover rounded-md flex-shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-xs text-gray-500 font-medium truncate">
                  Screenshot {index + 1}
                </p>
                <select
                  value={screenshot.pageHint}
                  onChange={(e) =>
                    onHintChange(index, e.target.value as PageHint)
                  }
                  className="w-full text-sm border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {PAGE_HINTS.map((hint) => (
                    <option key={hint} value={hint}>
                      {hint}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => onRemove(index)}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
