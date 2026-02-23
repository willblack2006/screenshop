export type PageHint =
  | "Homepage"
  | "Product Page"
  | "Collection Page"
  | "Cart"
  | "Other";

export interface UploadedScreenshot {
  base64: string;
  mimeType: string;
  previewUrl: string;
  pageHint: PageHint;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GenerationResult {
  files: GeneratedFile[];
  error?: string;
}

export type WizardStep = 1 | 2 | 3;
export type GenerationStatus = "idle" | "generating" | "done" | "error";

export interface WizardState {
  step: WizardStep;
  screenshots: UploadedScreenshot[];
  status: GenerationStatus;
  statusMessage: string;
  result: GeneratedFile[] | null;
  error: string | null;
}
