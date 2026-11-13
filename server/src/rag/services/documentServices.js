import { extractTextFromPDFService } from "./pdfService.js";
import {
  splitTextIntoChunksService,
  cleanPDFTextService,
} from "./chunkServices.js";
import { generateDocumentEmbeddingService } from "./embeddingService.js";
import { getDocumentCollectionService } from "./vectorStoreServices.js";

export const storePDFInChromaService = async ({
  filePath,
  documentId,
  fileName,
  userId,
}) => {
  if (!filePath || !documentId)
    throw new Error("Required document information is missing");

  console.log("Extracting PDF text...");

  const documents = await extractTextFromPDFService(filePath);
  console.log("PDF text extracted successfully");
  const cleanedDocuments = cleanPDFTextService(documents);

  console.log("PDF text cleaned successfully");
  const chunks = await splitTextIntoChunksService(cleanedDocuments, 1000, 200);
  console.log("Total Chunks: ", chunks.length);

  if (!chunks.length) throw new Error("No Chunks Generated From PDF");
  console.log("Total Chunks", chunks.length);
  chunks.forEach((chunk, index) => {
    console.log(`\n========== CHUNK ${index + 1} ==========`);
    console.log(chunk.pageContent);
    console.log("\nChunk length:", chunk.pageContent.length);
  });
  const embeddings = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`Generating embedding ${i + 1}/${chunks.length}...`);

    const embedding = await generateDocumentEmbeddingService(
      chunks[i].pageContent,
    );
    embeddings.push(embedding);
    console.log(embedding);
  }

  const collection = await getDocumentCollectionService();

  const ids = [];
  for (let i = 0; i < chunks.length; i++) {
    ids.push(`document=${documentId}-chunk-${i}`);
  }

  const metadatas = chunks.map((chunk, index) => ({
    documentId: String(documentId),
    userId: String(userId),
    fileName,
    chunkIndex: index,
    pageNumber: chunk.metadata?.loc?.pageNumber || 0,
    scope: "user",
  }));

  const existingData = await collection.get({
    where: {
      documentId: String(documentId),
    },
    include: ["metadatas"],
  });

  const texts = chunks.map((chunk) => chunk.pageContent);
  await collection.upsert({
    ids,
    documents: texts,
    embeddings,
    metadatas,
  });

  const newIds = new Set(ids);

  const obsoleteIds = existingData.ids.filter((id) => !newIds.has(id));

  if (obsoleteIds.length > 0) {
    await collection.delete({
      ids: obsoleteIds,
    });
  }
  console.log("PDF chunks stored successfully in ChromaDB");

  return { documentId, totalChunks: chunks.length };
};
