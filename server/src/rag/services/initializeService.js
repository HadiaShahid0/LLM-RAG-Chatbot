import {
  getDocumentCollectionService,
  COLLECTION_NAME,
} from "./vectorStoreServices.js";
import { buildKeywordIndexService } from "./keywordSearchService.js";

export const initializeHybridSearchService = async () => {
  try {
    console.log("Initializing BM25 keyword index");

    const qdrant = await getDocumentCollectionService();

    let offset = null;
    const chunks = [];

    do {
      const storedDocuments = await qdrant.scroll(COLLECTION_NAME, {
        limit: 100,
        offset,
        with_payload: true,
        with_vector: false,
      });

      storedDocuments.points.forEach((point) => {
        const { text, ...metadata } = point.payload || {};

        if (text && metadata.tenantId && metadata.documentId) {
          chunks.push({
            id: point.id,
            text,
            metadata,
          });
        }
      });

      offset = storedDocuments.next_page_offset;
    } while (offset !== null);

    buildKeywordIndexService(chunks);

    console.log(`BM25 keyword index initialized with ${chunks.length} chunks`);
  } catch (error) {
    console.log("Failed to initialize BM25 keyword index", error);
    throw error;
  }
};
