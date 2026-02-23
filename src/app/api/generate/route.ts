import { NextRequest, NextResponse } from "next/server";
import { buildPrompt } from "@/lib/prompt";
import { readFileSync } from "fs";
import { join } from "path";
import type { GeneratedFile, UploadedScreenshot, PageHint } from "@/lib/types";

function parseClaudeResponse(text: string): GeneratedFile[] {
  // Defensively strip markdown fences
  const cleaned = text
    .replace(/^```json\s*/m, "")
    .replace(/^```\s*/m, "")
    .replace(/```\s*$/m, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed.files)) {
    throw new Error("Claude response missing files array");
  }

  return parsed.files.filter(
    (f: unknown): f is GeneratedFile =>
      typeof (f as GeneratedFile).path === "string" &&
      typeof (f as GeneratedFile).content === "string"
  );
}

function loadTemplate(filename: string): string {
  return readFileSync(
    join(process.cwd(), "src/lib/template", filename),
    "utf-8"
  );
}

function mergeWithTemplates(
  claudeFiles: GeneratedFile[],
  shopifyDomain: string,
  shopifyToken: string
): GeneratedFile[] {
  const staticFiles: GeneratedFile[] = [
    { path: "src/lib/shopify.ts", content: loadTemplate("shopify.ts.template") },
    { path: "src/lib/types.ts", content: loadTemplate("types.ts.template") },
    {
      path: "src/components/cart-provider.tsx",
      content: loadTemplate("cart-provider.tsx.template"),
    },
    {
      path: "src/app/api/cart/route.ts",
      content: loadTemplate("cart-route.ts.template"),
    },
    {
      path: "next.config.ts",
      content: loadTemplate("next.config.ts.template"),
    },
    { path: "package.json", content: loadTemplate("package.json.template") },
    { path: "tsconfig.json", content: loadTemplate("tsconfig.json.template") },
    {
      path: "postcss.config.mjs",
      content: loadTemplate("postcss.config.mjs.template"),
    },
    { path: ".gitignore", content: loadTemplate("gitignore.template") },
    { path: "CLAUDE.md", content: loadTemplate("claude-md.template") },
    {
      path: ".env.local",
      content: loadTemplate("env.local.template")
        .replace("{{SHOPIFY_DOMAIN}}", shopifyDomain)
        .replace("{{SHOPIFY_TOKEN}}", shopifyToken),
    },
  ];

  // Static files win over Claude if paths overlap
  const staticPaths = new Set(staticFiles.map((f) => f.path));
  const filteredClaudeFiles = claudeFiles.filter(
    (f) => !staticPaths.has(f.path)
  );

  return [...filteredClaudeFiles, ...staticFiles];
}

export async function POST(req: NextRequest) {
  try {
    const {
      screenshots,
      pageHints,
    }: { screenshots: UploadedScreenshot[]; pageHints: PageHint[] } =
      await req.json();

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN ?? "";
    const shopifyToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? "";

    if (!anthropicKey) {
      return NextResponse.json(
        {
          error:
            "ANTHROPIC_API_KEY is not configured. Add it to .env.local.",
        },
        { status: 500 }
      );
    }

    if (screenshots.length === 0) {
      return NextResponse.json(
        { error: "No screenshots provided." },
        { status: 400 }
      );
    }

    const { systemPrompt, messages } = buildPrompt(screenshots, pageHints);

    const anthropicResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 8192,
          system: systemPrompt,
          messages,
        }),
      }
    );

    if (!anthropicResponse.ok) {
      const err = await anthropicResponse.text();
      return NextResponse.json(
        { error: `Anthropic API error: ${err}` },
        { status: 502 }
      );
    }

    const anthropicData = await anthropicResponse.json();
    const claudeText: string = anthropicData.content[0].text;

    const claudeFiles = parseClaudeResponse(claudeText);
    const allFiles = mergeWithTemplates(claudeFiles, shopifyDomain, shopifyToken);

    return NextResponse.json({ files: allFiles });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
