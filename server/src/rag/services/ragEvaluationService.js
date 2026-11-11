export const calculatePrecisionAtK = (
  retrievedChunkIds,
  relevantChunkIds,
  k,
) => {
  if (k <= 0) return 0;

  const relevantIds = new Set(relevantChunkIds);

  const topKChunks = retrievedChunkIds.slice(0, k);

  const relevantRetrievedChunks = new Set(
    topKChunks.filter((id) => relevantIds.has(id)),
  );

  return relevantRetrievedChunks.size / k;
};

export const calculateRecallAtK = (retrievedChunkIds, relevantChunkIds) => {
  const relevantIds = new Set(relevantChunkIds);

  if (relevantIds.size === 0) return null;

  const retrievedRelevantIds = new Set(
    retrievedChunkIds.filter((id) => relevantIds.has(id)),
  );

  return retrievedRelevantIds.size / relevantIds.size;
};

export const calculateReciprocalRank = (
  retrievedChunkIds,
  relevantChunkIds,
) => {
  const relevantIds = new Set(relevantChunkIds);

  const firstRelevantIndex = retrievedChunkIds.findIndex((id) =>
    relevantIds.has(id),
  );

  return firstRelevantIndex === -1 ? 0 : 1 / (firstRelevantIndex + 1);
};

export const evaluateRetrievalService = (
  retrievedChunks,
  relevantChunkIds,
  k,
) => {
  const retrievedChunkIds = retrievedChunks.map((chunk) => chunk.id);

  const relevantIds = new Set(relevantChunkIds);

  const relevantRetrievedCount = new Set(
    retrievedChunkIds.filter((id) => relevantIds.has(id)),
  ).size;

  return {
    retrievedCount: retrievedChunks.length,
    relevantCount: relevantIds.size,
    relevantRetrievedCount,

    precision: calculatePrecisionAtK(retrievedChunkIds, relevantChunkIds, k),

    recall: calculateRecallAtK(retrievedChunkIds, relevantChunkIds),

    reciprocalRank: calculateReciprocalRank(
      retrievedChunkIds,
      relevantChunkIds,
    ),
  };
};
