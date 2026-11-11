import { SystemMessage, HumanMessage } from "@langchain/core/messages";

import { model } from "../config/langchain.js";
import { validateAIInputService } from "./guardrailsServices.js";

const MAX_RESPONSE_LENGTH = 4000;

// Extract text from a LangChain response
const getResponseText = (content) => {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("");
  }

  return "";
};

// Build context from retrieved document chunks
const buildDocumentContext = (chunks = []) => {
  if (!chunks.length) return "";

  return chunks
    .map((chunk, index) => {
      return `Document Context ${index + 1}:\n${chunk.text}`;
    })
    .join("\n\n");
};

// Generate an answer for RAG evaluation
export const generateAnswerForEvaluationService = async ({
  question,
  retrievedChunks,
}) => {
  const documentContext = buildDocumentContext(retrievedChunks);

  const response = await model.invoke([
    new SystemMessage(`
You are an AI assistant answering questions using retrieved document context.

Rules:
- Answer using the provided document context.
- Do not invent facts or use outside knowledge for document-specific questions.
- If the answer is not available in the context, clearly state that.
- Give accurate, simple, and relevant answers.
`),

    new HumanMessage(`
DOCUMENT CONTEXT:
${documentContext || "[No context retrieved]"}

QUESTION:
${question}
`),
  ]);

  const completeResponse = getResponseText(response.content);

  const limitedResponse = completeResponse.slice(
    0,
    MAX_RESPONSE_LENGTH,
  );

  return validateAIInputService(limitedResponse);
};

// Parse JSON response from the evaluator
const parseJudgeResponse = (text) => {
  const cleanedText = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  return JSON.parse(cleanedText);
};

// Evaluate the generated RAG answer
export const evaluateGenerationService = async ({
  question,
  expectedAnswer,
  actualAnswer,
  retrievedChunks,
  shouldAbstain,
}) => {
  const context = buildDocumentContext(retrievedChunks);

  const prompt = `
You are an impartial evaluator for a Retrieval-Augmented Generation (RAG) system.

Evaluate the generated answer using the question, expected answer,
and retrieved document context.

QUESTION:
${question}

EXPECTED ANSWER:
${expectedAnswer}

ACTUAL ANSWER:
${actualAnswer || "[Empty answer]"}

RETRIEVED DOCUMENT CONTEXT:
${context || "[No context retrieved]"}

SHOULD_ABSTAIN:
${shouldAbstain}

Score each metric between 0 and 1.

1. faithfulness:
Measure whether factual claims in the actual answer are supported
by the retrieved document context.
Penalize unsupported claims, invented facts, and contradictions.
A score of 1 means the factual claims are supported by the context.

2. answerRelevancy:
Measure how directly the answer addresses the question.
A score of 1 means the answer directly addresses the question.

3. answerCorrectness:
Compare the actual answer with the expected answer.
Accept equivalent wording and correct paraphrases.
Penalize factual errors and important missing information.
A score of 1 means the answer is accurate and sufficiently complete.

4. abstentionCorrectness:
When SHOULD_ABSTAIN is true:
- Score 1 if the answer correctly states that the requested
  information is unavailable and does not invent an answer.
- Score 0 if the answer invents information or incorrectly claims
  the requested information is available.

When SHOULD_ABSTAIN is false, return null.

Additional rules:
- Evaluate factual support using the retrieved context.
- Do not reward unsupported claims merely because they match
  the expected answer.
- Judge meaning rather than exact wording.
- A correct explanation that information is unavailable should
  receive a high abstentionCorrectness score.
- Return only valid JSON without Markdown fences.

Return this exact structure:
{
  "faithfulness": 0,
  "answerRelevancy": 0,
  "answerCorrectness": 0,
  "abstentionCorrectness": null,
  "reason": "Brief explanation of the scores"
}
`;

  const response = await model.invoke([
    new SystemMessage(
      "You are a strict RAG evaluation judge. Return only valid JSON.",
    ),
    new HumanMessage(prompt),
  ]);

  const result = parseJudgeResponse(
    getResponseText(response.content),
  );

  // Validate evaluation scores
  const scoreFields = [
    "faithfulness",
    "answerRelevancy",
    "answerCorrectness",
  ];

  for (const field of scoreFields) {
    if (
      typeof result[field] !== "number" ||
      !Number.isFinite(result[field]) ||
      result[field] < 0 ||
      result[field] > 1
    ) {
      throw new Error(`Invalid evaluation score: ${field}`);
    }
  }

  // Validate abstention score
  if (shouldAbstain) {
    if (
      typeof result.abstentionCorrectness !== "number" ||
      !Number.isFinite(result.abstentionCorrectness) ||
      result.abstentionCorrectness < 0 ||
      result.abstentionCorrectness > 1
    ) {
      throw new Error("Invalid abstention correctness score.");
    }
  } else {
    result.abstentionCorrectness = null;
  }

  if (typeof result.reason !== "string") {
    result.reason = "";
  }

  return result;
};