import { QdrantClient } from "@qdrant/js-client-rest";

export const COLLECTION_NAME = "chatDocuments";

export const SEMANTIC_CACHE_COLLECTION = "semanticResponseCache";

if (!process.env.QDRANT_URL || !process.env.QDRANT_API_KEY) {
  throw new Error("Qdrant environment variables are missing");
}

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

let documentCollection = null;
let semanticCacheInitialized = false;
let semanticCacheInitPromise = null;

export const getDocumentCollectionService = async () => {
  if (documentCollection) return documentCollection;

  const collections = await qdrant.getCollections();

  const collectionExists = collections.collections.some(
    (collection) => collection.name === COLLECTION_NAME,
  );

  if (!collectionExists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 3072,
        distance: "Cosine",
      },
    });

    console.log("Qdrant collection created successfully.");
  }

  const indexFields = ["userId", "tenantId", "documentId", "scope"];

  for (const field of indexFields) {
    await qdrant.createPayloadIndex(COLLECTION_NAME, {
      field_name: field,
      field_schema: "keyword",
      wait: true,
    });
  }

  console.log("Qdrant payload indexes created successfully.");

  documentCollection = qdrant;

  return documentCollection;
};

export const getSemanticCacheCollectionService = async () => {
  if (semanticCacheInitialized) return qdrant;

  if (!semanticCacheInitPromise) {
    semanticCacheInitPromise = (async () => {
      const collections = await qdrant.getCollections();

      const collectionExists = collections.collections.some(
        (collection) => collection.name === SEMANTIC_CACHE_COLLECTION,
      );

      if (!collectionExists) {
        await qdrant.createCollection(SEMANTIC_CACHE_COLLECTION, {
          vectors: {
            size: 3072,
            distance: "Cosine",
          },
        });

        console.log("Semantic cache collection created");
      }

      const indexFields = [
        { field_name: "userId", field_schema: "keyword" },
        { field_name: "tenantId", field_schema: "keyword" },
        { field_name: "model", field_schema: "keyword" },
        { field_name: "expiresAt", field_schema: "integer" },
      ];

      for (const field of indexFields) {
        await qdrant.createPayloadIndex(SEMANTIC_CACHE_COLLECTION, {
          ...field,
          wait: true,
        });
      }

      semanticCacheInitialized = true;

      console.log("Semantic cache collection initialized");

      return qdrant;
    })().catch((error) => {
      semanticCacheInitPromise = null;
      throw error;
    });
  }
  return await semanticCacheInitPromise;
};

export const checkQdrantConnection = async () => {
  await qdrant.getCollections();
  console.log("Qdrant connected successfully.");
};

export default qdrant;
