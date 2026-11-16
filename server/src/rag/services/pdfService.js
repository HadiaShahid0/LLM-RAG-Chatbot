import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export const extractTextFromPDFService = async (fileBuffer) => {
  try {
    if (!fileBuffer) {
      throw new Error("PDF file buffer is required");
    }

    const pdfBlob = new Blob([fileBuffer], {
      type: "application/pdf",
    });

    const loader = new PDFLoader(pdfBlob);

    const documents = await loader.load();

    if (!documents.length) {
      throw new Error("No content found in the PDF.");
    }

    const extractedText = documents
      .map((document) => document.pageContent)
      .join("\n");

    if (!extractedText.trim()) {
      throw new Error(
        "No text found in the PDF. It may be scanned or image-based",
      );
    }

    return documents;
  } catch (error) {
    console.error("PDF extraction failed:", error.message);
    throw error;
  }
};
