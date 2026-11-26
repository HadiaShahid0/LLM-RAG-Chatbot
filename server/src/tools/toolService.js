import { rerankChunksService } from "../rag/services/re-rankerService.js";
import { hybridSearchService } from "../rag/services/hybridSearch.js";
import { getAuthorizedDocumentIdsService } from "../services/documentPermissionService.js";
import {
  getRetrievalCacheKeyService,
  getRetrievalCacheService,
  saveRetrievalCacheService,
} from "../cacheServices/retrievalCacheService.js";

export const searchWikipedia = async ({ topic }) => {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic)}&format=json`;

  const response = await fetch(url);

  const data = await response.json();

  return data.query.search.map((item) => ({
    title: item.title,
    snippet: item.snippet.replace(/<[^>]*>/g, ""),
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replaceAll(" ", "_"))}`,
  }));
};

export const getRelevantDocumentChunksService = async (
  question,
  userId,
  tenantId,
  topK = 5,
) => {
  if (typeof question !== "string") {
    if (Array.isArray(question)) {
      question = question
        .map((item) => (typeof item === "string" ? item : item.text || ""))
        .join(" ");
    } else {
      question = question?.text || question?.content || "";
    }
  }

  if (!question?.trim()) return [];

  if (!userId || !tenantId)
    throw new Error("User Id and Tenant Id is required for document Retrieval");

  try {
    const allowedDocumentIds = await getAuthorizedDocumentIdsService(
      userId,
      tenantId,
    );

    if (allowedDocumentIds.length === 0) {
      console.log("No authorized documents available");
      return [];
    }

    const cacheParams = {
      question,
      userId,
      tenantId,
      allowedDocumentIds,
      topK,
    };

    const cacheKey = getRetrievalCacheKeyService(cacheParams);

    const cachedResults = await getRetrievalCacheService(cacheKey);

    if (cachedResults !== null) return cachedResults;

    const candidateChunks = await hybridSearchService({
      question,
      tenantId,
      allowedDocumentIds,
      topK: topK * 2,
    });

    console.log(`Retrieved ${candidateChunks.length} candidate chunks.`);

    console.log(
      JSON.stringify(
        candidateChunks.map((chunk, index) => ({
          rank: index + 1,
          id: chunk.id,
          text: chunk.text,
          metadata: chunk.metadata,
          score: chunk.score,
          vectorRank: chunk.vectorRank,
          keywordRank: chunk.keywordRank,
          rrfScore: chunk.rrfScore,
        })),
        null,
        2,
      ),
    );

    if (candidateChunks.length === 0) return [];

    const rerankedChunks = await rerankChunksService({
      question,
      chunks: candidateChunks,
      tenantId,
      topK,
    });

    const threshold = -8;

    const relevantChunks = rerankedChunks.filter((chunk) => {
      return chunk.rerankScore >= threshold;
    });

    console.log(`Re-ranking selected ${rerankedChunks.length} chunks.`);

    await saveRetrievalCacheService(cacheParams, relevantChunks);

    console.log(`Score threshold: ${threshold}`);
    console.log(`Chunks before thresholding: ${rerankedChunks.length}`);
    console.log(`Chunks after thresholding: ${relevantChunks.length}`);

    return relevantChunks;
  } catch (error) {
    console.error("Document retrieval failed:", error);
    return [];
  }
};
