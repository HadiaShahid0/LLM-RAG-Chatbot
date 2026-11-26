import {
  env,
  AutoTokenizer,
  AutoModelForSequenceClassification,
} from "@huggingface/transformers";

env.cacheDir = "/tmp/huggingface-cache";

let tokenizer;
let rerankerModel;

const loadRerankerModel = async () => {
  if (!tokenizer || !rerankerModel) {
    const modelName = "Xenova/ms-marco-MiniLM-L-6-v2";

    tokenizer = await AutoTokenizer.from_pretrained(modelName);

    rerankerModel =
      await AutoModelForSequenceClassification.from_pretrained(modelName,{
        dtype:"fp32"
      });
  }

  return { tokenizer, rerankerModel };
};

export const rerankChunksService = async ({
  question,
  chunks,
  tenantId,
  topK = 7,
}) => {
  if (!question || !question.trim())
    throw new Error("Question cannot be empty");

  if(!tenantId) throw new Error("Tenant Id is required")

  if (!chunks || chunks.length === 0) return [];

  const authorizedChunks=chunks.filter((chunk)=> String(chunk.metadata?.tenantId)===String(tenantId))
  if(authorizedChunks.length===0) return []

  const { tokenizer, rerankerModel } = await loadRerankerModel();

  const questions = authorizedChunks.map(() => question);
  const documents = authorizedChunks.map((chunk) => chunk.text);

  const inputs = tokenizer(questions, {
    text_pair: documents,
    padding: true,
    truncation: true,
  });

  const result = await rerankerModel(inputs);
  const scores = Array.from(result.logits.data);

  const chunksWithScores = authorizedChunks.map((chunk, index) => ({
    ...chunk,
    rerankScore: scores[index],
  }));

  chunksWithScores.sort(
    (chunkA, chunkB) => chunkB.rerankScore - chunkA.rerankScore,
  );

  console.log("\n========== RERANKING RESULTS ==========");

  console.table(
    chunksWithScores.map((chunk, index) => ({
      rank: index + 1,
      id: chunk.id,
      rerankScore: chunk.rerankScore,
      rrfScore: chunk.rrfScore,
    })),
  );

  return chunksWithScores.slice(0, topK);
};