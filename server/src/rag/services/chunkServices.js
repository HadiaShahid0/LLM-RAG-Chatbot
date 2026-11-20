import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const cleanPDFTextService = (documents) => {
  if (!Array.isArray(documents) || documents.length === 0) {
    throw new Error("PDF text cannot be empty");
  }

  const cleanedDocuments = documents
    .map((document) => {
      let cleanedText = document.pageContent || "";

      cleanedText = cleanedText.replace(/--\s*\d+\s+of\s+\d+\s*--/gi, "");
      cleanedText = cleanedText.replace(/[^\S\n]+/g, " ");
      cleanedText = cleanedText.replace(/\n{3,}/g, "\n\n");
      cleanedText = cleanedText.trim();

      return {
        ...document,
        pageContent: cleanedText,
      };
    })
    .filter((document) => document.pageContent.length > 0);

  if (!cleanedDocuments.length) {
    throw new Error("No readable text remains after PDF cleaning");
  }

  return cleanedDocuments;
};

export const splitTextIntoChunksService = async (
  documents,
  chunkSize = 1000,
  overlap = 200,
) => {
  if (!Array.isArray(documents) || documents.length === 0)
    throw new Error("Documents cannot be empty");

  if (chunkSize <= 0 || overlap < 0 || overlap >= chunkSize)
    throw new Error("Invalid chunk size or overlap");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: overlap,
    separators: ["\n\n", "\n", " ", ""],
  });

  return await splitter.splitDocuments(documents);
};

// export const splitTextIntoChunksService = (text, chunkSize = 1000, overlap = 200) => {

//   if (!text?.trim()) throw new Error("Text cannot be empty");

//   if (chunkSize <= 0 || overlap < 0 || overlap >= chunkSize)
//     throw new Error("Invalid chunk size or overlap");

//   const chunks = [];
//   let start = 0;

//   while (start < text.length) {
//     const end = Math.min(start + chunkSize, text.length);
//     const chunk = text.slice(start, end).trim();

//     if (chunk) chunks.push(chunk);

//     if (end === text.length) break;

//     start = end - overlap;
//   }
//   return chunks;
// };
