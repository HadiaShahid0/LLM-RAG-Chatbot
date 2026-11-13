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

  const chunksByUser = new Map();

  chunks.forEach((chunk) => {
    const userId = String(chunk.metadata?.userId || "");

    if (!userId) {
      console.warn("Chunk is missing userId:", chunk.id);
      return;
    }

    if (!chunksByUser.has(userId)) {
      chunksByUser.set(userId, []);
    }

    chunksByUser.get(userId).push(chunk);
  });

  chunksByUser.forEach((userChunks, userId) => {
    const keywordIndex = createKeywordIndex(userChunks);

    keywordIndexes.set(userId, keywordIndex);

    console.log(`BM25 indexed ${userChunks.length} chunks for user ${userId}`);
  });
};

export const searchKeywordChunksService = (question, userId, topK = 7) => {
  if (!question?.trim()) return [];

  if (!userId) {
    throw new Error("User ID is required");
  }

  const userIndex = keywordIndexes.get(String(userId));

  if (!userIndex) {
    return [];
  }

  const { engine, chunksById } = userIndex;

  const results = engine.search(question, topK);

  const keywordResults = results
    .map(([id, score]) => {
      const chunk = chunksById.get(id);

      if (!chunk) return null;

      return {
        ...chunk,
        keywordScore: score,
      };
    })
    .filter(Boolean);

  console.log("\n========== BM25 KEYWORD SEARCH ==========");
  console.log("User ID:", userId);
  console.log("Question:", question);
  console.log("Requested topK:", topK);
  console.log("Results found:", keywordResults.length);

  console.table(
    keywordResults.map((chunk, index) => ({
      rank: index + 1,
      id: chunk.id,
      keywordScore: chunk.keywordScore,
      fileName: chunk.metadata?.fileName,
      chunkIndex: chunk.metadata?.chunkIndex,
    })),
  );

  return keywordResults;
};
