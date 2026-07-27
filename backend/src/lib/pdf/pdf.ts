import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  createCanvas,
  DOMMatrix,
  DOMPoint,
  ImageData,
  Path2D,
  type Canvas,
  type SKRSContext2D,
} from "@napi-rs/canvas";

/**
 * PDF helpers for conversion (AGENTS §8). Page text extraction feeds
 * numeric-integrity and the review facsimile; the vision model sees rendered
 * page IMAGES via renderPage. Rendering runs on @napi-rs/canvas (a native
 * backend), so pdfjs's DOM canvas assumptions must be satisfied in Node.
 *
 * NOTE: rendering can only be fully verified against a real PDF once the worker
 * has its env (ANTHROPIC_API_KEY, storage) — smoke-test one page then.
 */

// pdfjs reaches for these as globals during canvas rendering. In Node they are
// absent, so alias the canvas backend's implementations (once, idempotent).
const g = globalThis as Record<string, unknown>;
g.DOMMatrix ??= DOMMatrix;
g.DOMPoint ??= DOMPoint;
g.ImageData ??= ImageData;
g.Path2D ??= Path2D;

/**
 * The canvas factory pdfjs uses for the intermediate canvases it creates while
 * rendering (patterns, groups). Backed by @napi-rs/canvas so it works in Node.
 */
class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(Math.ceil(width), Math.ceil(height));
    return { canvas, context: canvas.getContext("2d") };
  }
  reset(
    cc: { canvas: Canvas; context: SKRSContext2D },
    width: number,
    height: number,
  ) {
    cc.canvas.width = Math.ceil(width);
    cc.canvas.height = Math.ceil(height);
  }
  destroy(cc: { canvas: Canvas; context: SKRSContext2D | null }) {
    // @napi-rs canvases are garbage-collected; just drop the references.
    cc.canvas.width = 0;
    cc.canvas.height = 0;
    cc.context = null;
  }
}

export type RenderedImage = {
  base64: string;
  mediaType: "image/png";
};

export type LoadedPdf = {
  numPages: number;
  getPageLines: (pageIndex: number) => Promise<string[]>;
  /** Render a page (0-indexed) to a PNG for the vision model (AGENTS §8). */
  renderPage: (pageIndex: number, scale?: number) => Promise<RenderedImage>;
};

// Higher scale = sharper text for the model, at more pixels. 2x is a good
// balance for dense exam pages.
const DEFAULT_SCALE = 2;

export async function loadPdf(data: Uint8Array): Promise<LoadedPdf> {
  const doc = await getDocument({
    data,
    CanvasFactory: NodeCanvasFactory,
  }).promise;

  return {
    numPages: doc.numPages,

    async getPageLines(pageIndex: number): Promise<string[]> {
      // pdfjs pages are 1-indexed.
      const page = await doc.getPage(pageIndex + 1);
      const content = await page.getTextContent();
      const lines: string[] = [];
      for (const item of content.items) {
        if ("str" in item && item.str.trim() !== "") {
          lines.push(item.str);
        }
      }
      return lines;
    },

    async renderPage(
      pageIndex: number,
      scale: number = DEFAULT_SCALE,
    ): Promise<RenderedImage> {
      const page = await doc.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale });
      const canvas = createCanvas(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height),
      );
      const context = canvas.getContext("2d");

      await page.render({
        // @napi-rs's canvas + 2D context are structurally compatible; pdfjs
        // types want the DOM element/context. Bridge the two backends.
        canvas: canvas as unknown as HTMLCanvasElement,
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport,
      }).promise;

      return {
        base64: canvas.toBuffer("image/png").toString("base64"),
        mediaType: "image/png",
      };
    },
  };
}

/**
 * Render a page to a PNG for the vision model (AGENTS §8). Thin wrapper over
 * LoadedPdf.renderPage, kept for the handler's existing call site.
 */
export async function renderPageToImage(
  pdf: LoadedPdf,
  pageIndex: number,
): Promise<RenderedImage> {
  return pdf.renderPage(pageIndex);
}
