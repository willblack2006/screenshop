"use client";

import dynamic from "next/dynamic";
import { useGeneration } from "@/hooks/use-generation";
import { StepIndicator } from "@/components/step-indicator";
import { ScreenshotUploader } from "@/components/screenshot-uploader";
import { GenerationStatus } from "@/components/generation-status";
import { DownloadButton } from "@/components/download-button";

const CodePreview = dynamic(
  () => import("@/components/code-preview").then((m) => m.CodePreview),
  { ssr: false }
);

function SetupInstructions() {
  return (
    <div className="mt-6 bg-gray-900 rounded-xl p-5 text-left">
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
        Getting Started
      </p>
      <pre className="text-green-400 text-sm font-mono leading-6 overflow-x-auto">
        {`unzip screenshop-output.zip -d my-store
cd my-store
cp .env.local .env.local   # already filled in
npm install
npm run dev`}
      </pre>
    </div>
  );
}

export default function Home() {
  const {
    state,
    addScreenshot,
    removeScreenshot,
    updatePageHint,
    generate,
    reset,
  } = useGeneration();

  const { step, status, screenshots, result, error } = state;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">screenshop</h1>
            <p className="text-xs text-gray-500">
              Screenshot → Shopify Storefront
            </p>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="GitHub"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Hero */}
        {step === 1 && status === "idle" && screenshots.length === 0 && (
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Turn any ecommerce screenshot
              <br />
              into a{" "}
              <span className="text-indigo-600">production Shopify store</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Upload screenshots of any online shop. Claude AI analyzes the
              design and generates a complete Next.js + Shopify storefront —
              ready to run in minutes.
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <StepIndicator currentStep={step} />

          {/* Error banner */}
          {status === "error" && error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800">
                  Generation failed
                </p>
                <p className="text-sm text-red-600 mt-0.5 break-words">
                  {error}
                </p>
              </div>
              <button
                onClick={reset}
                className="flex-shrink-0 text-sm text-red-600 hover:text-red-800 font-medium underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 1 && (
            <>
              <ScreenshotUploader
                screenshots={screenshots}
                onAdd={addScreenshot}
                onRemove={removeScreenshot}
                onHintChange={updatePageHint}
              />
              <div className="mt-6 flex justify-end">
                <button
                  onClick={generate}
                  disabled={screenshots.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Generate Storefront
                </button>
              </div>
            </>
          )}

          {/* Step 2: Generating */}
          {step === 2 && <GenerationStatus />}

          {/* Step 3: Done */}
          {step === 3 && result && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">
                    {result.length}
                  </span>{" "}
                  files generated
                </p>
                <div className="flex items-center gap-3">
                  <DownloadButton files={result} />
                  <button
                    onClick={reset}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Start over
                  </button>
                </div>
              </div>
              <CodePreview files={result} />
              <SetupInstructions />
            </>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          API keys never leave your server. Credentials live in{" "}
          <code className="bg-gray-100 px-1 rounded">.env.local</code> only.
        </p>
      </main>
    </div>
  );
}
