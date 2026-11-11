import "dotenv/config";

import { getRelevantDocumentChunksService } from "../tools/toolService.js";

import { evaluateRetrievalService } from "./services/ragEvaluationService.js";
import { initializeHybridSearchService } from "./services/initializeService.js";

import {
  generateAnswerForEvaluationService,
  evaluateGenerationService,
} from "../services/generationEvaluationService.js";

import { evaluationDataset } from "./evaluationDataset.js";

const TOP_K = 7;

// Calculate average while ignoring invalid scores
const calculateAverage = (scores) => {
  const validScores = scores.filter(
    (score) => typeof score === "number" && Number.isFinite(score),
  );

  if (!validScores.length) return null;

  return (
    validScores.reduce((sum, score) => sum + score, 0) / validScores.length
  );
};

// Format evaluation metrics
const formatMetric = (value) => {
  return typeof value !== "number" || !Number.isFinite(value)
    ? "N/A"
    : value.toFixed(2);
};

// Run RAG evaluation
const evaluateRag = async () => {
  console.log("\n========== RAG EVALUATION ==========");
  console.log(`Total test cases: ${evaluationDataset.length}`);
  console.log(`Top-K: ${TOP_K}`);

  if (!evaluationDataset.length) {
    console.log("Evaluation dataset is empty.");
    return;
  }

  // Initialize hybrid search services
  await initializeHybridSearchService();

  const results = [];

  for (const testCase of evaluationDataset) {
    console.log("\n==============================================");
    console.log(`Question ${testCase.id}: ${testCase.question}`);
    console.log("==============================================");

    const shouldAbstain = Boolean(testCase.shouldAbstain);

    const result = {
      questionId: testCase.id,
      question: testCase.question,
      answerable: !shouldAbstain,

      retrievedCount: 0,
      relevantCount: testCase.relevantChunkIds.length,
      relevantRetrievedCount: 0,

      precision: null,
      recall: null,
      reciprocalRank: null,

      faithfulness: null,
      answerRelevancy: null,
      answerCorrectness: null,
      abstentionCorrectness: null,

      reason: "",
      error: null,
    };

    try {
      // 1. Retrieve relevant document chunks
      const retrievedChunks = await getRelevantDocumentChunksService(
        testCase.question,
        TOP_K,
      );

      console.log("\n========== RETRIEVED CHUNKS ==========");
      console.log(retrievedChunks.map((chunk) => chunk.id));

      // 2. Evaluate retrieval performance
      const retrievalMetrics = evaluateRetrievalService(
        retrievedChunks,
        testCase.relevantChunkIds,
        TOP_K,
      );

      Object.assign(result, {
        retrievedCount: retrievalMetrics.retrievedCount,
        relevantCount: retrievalMetrics.relevantCount,
        relevantRetrievedCount: retrievalMetrics.relevantRetrievedCount,

        precision: retrievalMetrics.precision,
        recall: retrievalMetrics.recall,
        reciprocalRank: retrievalMetrics.reciprocalRank,
      });

      console.log("\n========== RETRIEVAL METRICS ==========");

      console.log(`Precision@${TOP_K}:`, formatMetric(result.precision));

      console.log(`Recall@${TOP_K}:`, formatMetric(result.recall));

      console.log("Reciprocal Rank:", formatMetric(result.reciprocalRank));

      // 3. Generate an answer using LangChain
      const actualAnswer = await generateAnswerForEvaluationService({
        question: testCase.question,
        retrievedChunks,
      });

      console.log("\n========== GENERATED ANSWER ==========");

      console.log("Expected answer:");
      console.log(testCase.expectedAnswer);

      console.log("\nActual answer:");
      console.log(actualAnswer || "[Empty answer]");

      // 4. Evaluate generated answer
      const generationMetrics = await evaluateGenerationService({
        question: testCase.question,
        expectedAnswer: testCase.expectedAnswer,
        actualAnswer,
        retrievedChunks,
        shouldAbstain,
      });

      Object.assign(result, {
        faithfulness: generationMetrics.faithfulness,
        answerRelevancy: generationMetrics.answerRelevancy,
        answerCorrectness: generationMetrics.answerCorrectness,
        abstentionCorrectness: generationMetrics.abstentionCorrectness,
        reason: generationMetrics.reason,
      });

      console.log("\n========== GENERATION METRICS ==========");

      console.log("Faithfulness:", formatMetric(result.faithfulness));

      console.log("Answer Relevancy:", formatMetric(result.answerRelevancy));

      console.log(
        "Answer Correctness:",
        formatMetric(result.answerCorrectness),
      );

      if (shouldAbstain) {
        console.log(
          "Abstention Correctness:",
          formatMetric(result.abstentionCorrectness),
        );
      }

      console.log("Evaluation reason:", result.reason);
    } catch (error) {
      result.error = error.message;

      console.error(
        `Failed to evaluate question ${testCase.id}:`,
        error.message,
      );
    }

    results.push(result);
  }

  // 5. Display individual results
  console.log("\n========== INDIVIDUAL RESULTS ==========");
  console.table(results);

  // 6. Separate retrieval and generation results
  const retrievalResults = results.filter(
    (result) => result.answerable && result.precision !== null,
  );

  const generationResults = results.filter(
    (result) => result.faithfulness !== null,
  );

  const answerableResults = generationResults.filter(
    (result) => result.answerable,
  );

  const unanswerableResults = generationResults.filter(
    (result) => !result.answerable,
  );

  console.log("\n========== EVALUATION SUMMARY ==========");

  console.log("Total questions:", results.length);

  console.log("Completed retrieval evaluations:", retrievalResults.length);

  console.log(
    "Questions with retrieved chunks:",
    results.filter((result) => result.retrievedCount > 0).length,
  );

  console.log(
    "Questions with relevant chunks retrieved:",
    results.filter((result) => result.relevantRetrievedCount > 0).length,
  );

  console.log("Successful generations:", generationResults.length);

  console.log(
    "Failed evaluations:",
    results.filter((result) => result.error !== null).length,
  );

  // 7. Average retrieval metrics (answerable questions only)
  console.log("\n========== AVERAGE RETRIEVAL METRICS ==========");

  console.log(
    `Average Precision@${TOP_K}:`,
    formatMetric(
      calculateAverage(retrievalResults.map((result) => result.precision)),
    ),
  );

  console.log(
    `Average Recall@${TOP_K}:`,
    formatMetric(
      calculateAverage(retrievalResults.map((result) => result.recall)),
    ),
  );

  console.log(
    "Mean Reciprocal Rank (MRR):",
    formatMetric(
      calculateAverage(retrievalResults.map((result) => result.reciprocalRank)),
    ),
  );

  // 8. Average generation metrics
  console.log("\n========== AVERAGE GENERATION METRICS ==========");

  console.log(
    "Average Faithfulness:",
    formatMetric(
      calculateAverage(generationResults.map((result) => result.faithfulness)),
    ),
  );

  console.log(
    "Average Answer Relevancy:",
    formatMetric(
      calculateAverage(
        generationResults.map((result) => result.answerRelevancy),
      ),
    ),
  );

  console.log(
    "Average Answer Correctness:",
    formatMetric(
      calculateAverage(
        generationResults.map((result) => result.answerCorrectness),
      ),
    ),
  );

  console.log(
    "Average Abstention Correctness:",
    formatMetric(
      calculateAverage(
        unanswerableResults.map((result) => result.abstentionCorrectness),
      ),
    ),
  );

  // 9. Dataset breakdown
  console.log("\n========== DATASET BREAKDOWN ==========");

  console.log("Answerable questions:", answerableResults.length);
  console.log("Unanswerable questions:", unanswerableResults.length);

  // 10. Answerable question generation metrics
  console.log("\n========== ANSWERABLE QUESTION METRICS ==========");

  console.log(
    "Faithfulness:",
    formatMetric(
      calculateAverage(answerableResults.map((result) => result.faithfulness)),
    ),
  );

  console.log(
    "Answer Relevancy:",
    formatMetric(
      calculateAverage(
        answerableResults.map((result) => result.answerRelevancy),
      ),
    ),
  );

  console.log(
    "Answer Correctness:",
    formatMetric(
      calculateAverage(
        answerableResults.map((result) => result.answerCorrectness),
      ),
    ),
  );

  console.log("\n========== EVALUATION COMPLETED ==========");
};

// Start evaluation
evaluateRag().catch((error) => {
  console.error("RAG evaluation initialization failed:", error);
  process.exitCode = 1;
});
