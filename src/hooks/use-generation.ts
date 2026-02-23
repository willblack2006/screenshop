"use client";

import { useState, useCallback } from "react";
import type {
  WizardState,
  UploadedScreenshot,
  PageHint,
  GeneratedFile,
} from "@/lib/types";

async function resizeAndEncode(
  file: File
): Promise<{ base64: string; mimeType: string; previewUrl: string }> {
  const img = await createImageBitmap(file);
  const maxDim = 1568;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await canvas.convertToBlob({ type: "image/webp", quality: 0.85 });
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(blob);
  });
  const previewUrl = URL.createObjectURL(blob);
  return { base64, mimeType: "image/webp", previewUrl };
}

const INITIAL_STATE: WizardState = {
  step: 1,
  screenshots: [],
  status: "idle",
  statusMessage: "",
  result: null,
  error: null,
};

export function useGeneration() {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);

  const addScreenshot = useCallback(async (file: File) => {
    const encoded = await resizeAndEncode(file);
    setState((prev) => ({
      ...prev,
      screenshots: [
        ...prev.screenshots,
        {
          ...encoded,
          pageHint: "Homepage" as PageHint,
        },
      ],
    }));
  }, []);

  const removeScreenshot = useCallback((index: number) => {
    setState((prev) => {
      const updated = [...prev.screenshots];
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return { ...prev, screenshots: updated };
    });
  }, []);

  const updatePageHint = useCallback((index: number, hint: PageHint) => {
    setState((prev) => {
      const updated = [...prev.screenshots];
      updated[index] = { ...updated[index], pageHint: hint };
      return { ...prev, screenshots: updated };
    });
  }, []);

  const generate = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      step: 2,
      status: "generating",
      statusMessage: "Sending screenshots to Claude...",
      error: null,
    }));

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenshots: state.screenshots,
          pageHints: state.screenshots.map((s) => s.pageHint),
        }),
      });

      const data: { files?: GeneratedFile[]; error?: string } =
        await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Generation failed");
      }

      setState((prev) => ({
        ...prev,
        step: 3,
        status: "done",
        statusMessage: "Done!",
        result: data.files ?? [],
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState((prev) => ({
        ...prev,
        step: 1,
        status: "error",
        statusMessage: "",
        error: message,
      }));
    }
  }, [state.screenshots]);

  const reset = useCallback(() => {
    setState((prev) => {
      prev.screenshots.forEach((s) => URL.revokeObjectURL(s.previewUrl));
      return INITIAL_STATE;
    });
  }, []);

  return {
    state,
    addScreenshot,
    removeScreenshot,
    updatePageHint,
    generate,
    reset,
  };
}
