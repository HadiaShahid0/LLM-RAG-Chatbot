import { GoogleGenAI } from "@google/genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-embedding-001",
  outputDimensionality: 3072,
});

export const generateDocumentEmbeddingService = async (text) => {
  if (!text?.trim()) throw new Error("Document text cannot be empty");

  return (await embeddings.embedDocuments([text]))[0];
};

export const generateQueryEmbeddingService = async (question) => {
  if (!question?.trim()) throw new Error("Question cannot be empty");

  return await embeddings.embedQuery(question);
};
