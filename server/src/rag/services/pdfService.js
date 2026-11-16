import { CanvasFactory } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

export const extractTextFromPDFService = async (fileBuffer) => {
  let parser;

  try {
    if (!fileBuffer) {
      throw new Error("PDF file buffer is required");
    }

    parser = new PDFParse({
      data: new Uint8Array(fileBuffer),
      CanvasFactory,
    });

    const result = await parser.getText();

    if (!result.text?.trim()) {
      throw new Error(
        "No text found in the PDF. It may be scanned or image-based.",
      );
    }

    return [
      {
        pageContent: result.text,
        metadata: {
          source: "uploaded-pdf",
        },
      },
    ];
  } catch (error) {
    console.error("PDF extraction failed:", error);
    throw error;
  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
};