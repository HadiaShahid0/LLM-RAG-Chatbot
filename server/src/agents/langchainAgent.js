import { createAgent } from "langchain";

import {
  groqModel,
  model as geminiModel,
  groqClient,
} from "../config/langchain.js";

import { SystemMessage } from "@langchain/core/messages";
import { systemPrompt } from "../prompts/systemPrompts.js";

import { createLangChainTools } from "../tools/langchainTools.js";

import { convertMessages } from "../services/langchainServices.js";
import { formatCitationsService } from "../services/citationsService.js";
import { retrieveDocumentContextService } from "../services/documentServices.js";

const models = { gemini: geminiModel, groq: groqModel };

const checkToolUsage = (message = []) => {
  return message.some((message) => {
    const messageType = message._getType?.();
    return (
      messageType === "tool" ||
      message.tool_calls?.length > 0 ||
      message.additional_kwargs?.tool_calls?.length > 0
    );
  });
};

const groqToolResponse = async (model, messages, shouldSearchDocuments) => {
  const convertedMessages = messages.map((message) => {
    const type = message._getType();

    return {
      role: type === "human" ? "user" : type === "ai" ? "assistant" : "system",
      content:
        typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content),
    };
  });

  const response = await groqClient.chat.completions.create({
    model: "openai/gpt-oss-120b",

    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...convertedMessages,
    ],

    ...(shouldSearchDocuments
      ? {}
      : {
          tools: [{ type: "browser_search" }],
        }),

    temperature: 0.7,
  });

  const finalMessage = response.choices[0].message;

  const groqUsedTools =
    Array.isArray(finalMessage.executed_tools) &&
    finalMessage.executed_tools.length > 0;

  return {
    content: finalMessage.content || "",
    usedTools: shouldSearchDocuments || groqUsedTools,
  };
};

export const generateGeminiResponseWithTools = async (
  messages,
  selectedModel = "gemini",
  userId,
  tenantId,
) => {
  if (!userId) throw new Error("User Id is required");
  if (!tenantId) throw new Error("Tenant Id is required");

  const convertedMessages = convertMessages(messages);

  const lastUserMessage = [...convertedMessages]
    .reverse()
    .find((message) => message._getType() === "human");

  const question = Array.isArray(lastUserMessage?.content)
    ? lastUserMessage.content.map((item) => item.text || "").join("\n")
    : lastUserMessage?.content || "";

  const conversationContext = convertedMessages
    .slice(-6)
    .map((message) => `${message._getType()}: ${message.content}`)
    .join("\n");

  const start = Date.now();

  const documentContext = await retrieveDocumentContextService(
    question,
    userId,
    tenantId,
    conversationContext,
    selectedModel,
  );

  console.log("Document retrieval:", Date.now() - start, "ms");

  const shouldSearchDocuments = documentContext?.shouldSearchDocuments ?? false;

  const documentResults = documentContext?.results ?? [];

  const documentMessage = shouldSearchDocuments
    ? new SystemMessage({
        content: `
DOCUMENT CONTEXT:

The following information was retrieved from the user's authorized documents.

${JSON.stringify(documentResults)}

STRICT INSTRUCTIONS:

1. Use the retrieved document context as the source for your answer.
2. Do not answer document-related questions using general knowledge.
3. Do not add information that is not supported by the retrieved context.
4. If the context does not contain enough information, clearly explain this.
5. When the user asks whether an answer came from a document, check the actual source information.
6. Mention the source document's filename when available.
`,
      })
    : null;

  const messagesWithDocuments = documentMessage
    ? [documentMessage, ...convertedMessages]
    : convertedMessages;

  if (selectedModel === "groq") {
    return await groqToolResponse(
      selectedModel,
      messagesWithDocuments,
      shouldSearchDocuments,
    );
  }

  const citations = [];

  const tools = createLangChainTools(userId, tenantId, citations, false);

  const agent = createAgent({
    model: models[selectedModel] || geminiModel,
    tools,
    systemPrompt,
  });

  const agentStart = Date.now();

  const response = await agent.invoke({
    messages: messagesWithDocuments,
  });

  console.log("Agent execution:", Date.now() - agentStart, "ms");

  const finalMessage = response.messages[response.messages.length - 1];

  const answer = finalMessage.content;

  const answerText =
    typeof answer === "string"
      ? answer
      : Array.isArray(answer)
        ? answer.map((item) => item.text || "").join("\n")
        : String(answer ?? "");

  const citationText = formatCitationsService(citations);

  const agentUsedTools = checkToolUsage(response.messages);

  const usedTools =
    shouldSearchDocuments || agentUsedTools || citations.length > 0;
  return { content: answerText + citationText, usedTools };
};
