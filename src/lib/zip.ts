import JSZip from "jszip";
import type { GeneratedFile } from "./types";

export async function buildZip(files: GeneratedFile[]): Promise<Blob> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.path, file.content);
  }
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
