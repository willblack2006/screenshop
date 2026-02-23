"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import type { GeneratedFile } from "@/lib/types";

interface CodePreviewProps {
  files: GeneratedFile[];
}

function getLanguage(path: string): string {
  if (path.endsWith(".tsx") || path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".mjs") || path.endsWith(".js")) return "javascript";
  if (path.endsWith(".md")) return "markdown";
  return "plaintext";
}

function groupByDirectory(files: GeneratedFile[]) {
  const groups: Record<string, GeneratedFile[]> = {};
  for (const file of files) {
    const parts = file.path.split("/");
    const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "(root)";
    if (!groups[dir]) groups[dir] = [];
    groups[dir].push(file);
  }
  return groups;
}

export function CodePreview({ files }: CodePreviewProps) {
  const [selectedPath, setSelectedPath] = useState(files[0]?.path ?? "");

  const selectedFile = files.find((f) => f.path === selectedPath);
  const groups = groupByDirectory(files);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden flex h-[520px]">
      {/* File tree */}
      <div className="w-60 flex-shrink-0 bg-gray-900 overflow-y-auto text-sm">
        {Object.entries(groups).map(([dir, dirFiles]) => (
          <div key={dir}>
            <div className="px-3 py-1.5 text-gray-500 text-xs font-mono uppercase tracking-wider">
              {dir}
            </div>
            {dirFiles.map((file) => {
              const filename = file.path.split("/").pop() ?? file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedPath(file.path)}
                  className={`w-full text-left px-4 py-1.5 text-xs font-mono truncate transition-colors ${
                    file.path === selectedPath
                      ? "bg-indigo-600 text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  }`}
                >
                  {filename}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 min-w-0">
        {selectedFile ? (
          <Editor
            height="100%"
            language={getLanguage(selectedFile.path)}
            value={selectedFile.content}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-950 text-gray-500 text-sm">
            Select a file
          </div>
        )}
      </div>
    </div>
  );
}
