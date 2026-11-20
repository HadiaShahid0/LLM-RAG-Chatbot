import { QdrantClient } from "@qdrant/js-client-rest";

export const COLLECTION_NAME = "chatDocuments";

if (!process.env.QDRANT_URL || !process.env.QDRANT_API_KEY) {
  throw new Error("Qdrant environment variables are missing");
}

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

let documentCollection = null;

export const getDocumentCollectionService = async () => {
  if (documentCollection) {
    return documentCollection;
  }

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

  // Create payload indexes for filtered fields
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

export const checkQdrantConnection = async () => {
  await qdrant.getCollections();
  console.log("Qdrant connected successfully.");
};

export default qdrant;
