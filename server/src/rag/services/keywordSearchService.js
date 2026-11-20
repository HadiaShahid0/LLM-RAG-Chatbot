import bm25 from "wink-bm25-text-search";

const keywordIndexes = new Map();

const prepareText = (text) => {
  return text.toLowerCase().match(/[\p{L}\p{N}_.-]+/gu) || [];
};

const createKeywordIndex = (chunks) => {
  const engine = bm25();
  const chunksById = new Map();

  engine.defineConfig({
    fldWeights: {
      text: 1,
    },
  });

  engine.definePrepTasks([prepareText]);

  chunks.forEach((chunk) => {
    engine.addDoc(
      {
        text: chunk.text,
      },
      chunk.id,
    );

    chunksById.set(chunk.id, chunk);
  });

  engine.consolidate();

  return {
    engine,
    chunksById,
  };
};

export const buildKeywordIndexService = (chunks) => {
  keywordIndexes.clear();

  const chunksByTenant = new Map();

  chunks.forEach((chunk) => {
    const tenantId = String(chunk.metadata?.tenantId || "");

    if (!tenantId) {
      console.warn("Chunk is missing tenantId:", chunk.id);
      return;
    }

    if (!chunksByTenant.has(tenantId)) chunksByTenant.set(tenantId, []);

    chunksByTenant.get(tenantId).push(chunk);
  });

  chunksByTenant.forEach((tenantChunks, tenantId) => {
    const keywordIndex = createKeywordIndex(tenantChunks);

    keywordIndexes.set(tenantId, keywordIndex);

    console.log(
      `BM25 indexed ${tenantChunks.length} chunks for user ${tenantId}`,
    );
  });
};

export const searchKeywordChunksService = (
  question,
  tenantId,
  allowedDocumentIds,
  topK = 7,
) => {
  if (!question?.trim()) return [];

  if (!tenantId) throw new Error("User ID is required");

  if (!Array.isArray(allowedDocumentIds))
    throw new Error("Authorized Ids are required");

  const tenantIndex = keywordIndexes.get(String(tenantId));

  if (!tenantIndex) return [];

  const { engine, chunksById } = tenantIndex;

  const allowedIds = new Set(allowedDocumentIds.map(String));

  const results = engine.search(question, chunksById.size);

  const keywordResults = results
    .map(([id, score]) => {
      const chunk = chunksById.get(id);

      if (!chunk) return null;

      if (!allowedIds.has(String(chunk.metadata?.documentId))) return null;

      return {
        ...chunk,
        keywordScore: score,
      };
    })
    .filter(Boolean)
    .slice(0, topK);

  console.log("\n========== BM25 KEYWORD SEARCH ==========");
  console.log("Tenant ID:", tenantId);
  console.log("Authorized documents:", allowedIds.size);
  console.log("Results found:", keywordResults.length);

  return keywordResults;
};
