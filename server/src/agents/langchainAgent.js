import { createAgent } from "langchain";

import {
  groqModel,
  model as geminiModel,
  groqClient,
} from "../config/langchain.js";
import { systemPrompt } from "../prompts/systemPrompts.js";

import { createLangChainTools } from "../tools/langchainTools.js";

import { convertMessages } from "../services/langchainServices.js";
import { formatCitationsService } from "../services/citationsService.js";

const models = { gemini: geminiModel, groq: groqModel };

const groqToolResponse = async (selectedModel, messages, userId) => {
  const convertedMessage = convertMessages(messages);

  const lastMessage = convertedMessage[convertedMessage.length - 1];

  const question = lastMessage.content;

  // Search uploaded documents first
  const documentResults = await searchDocuments({
    question,
    userId,
  });

  const hasDocumentResults = documentResults?.length > 0;

  const groqMessages = convertedMessage.map((message) => {
    const type = message._getType();

    return {
      role:
        type === "human" ? "user" : type === "ai" ? "assistant" : "system",
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
      ...(hasDocumentResults
        ? [
            {
              role: "system",
              content: `
              Relevant information retrieved from the user's uploaded documents:

              ${JSON.stringify(documentResults)}

              Instructions:
              - Answer the user's question using this document information.
              - Do not use web search to answer this question.
              - Do not add unsupported information.
              - If the retrieved information is insufficient, explain that.
              `,
            },
          ]
        : []),
      ...groqMessages,
    ],

    // Only enable web search when document results are unavailable.
    ...(hasDocumentResults
      ? {}
      : {
          tools: [{ type: "browser_search" }],
        }),

    temperature: 0.7,
  });

  return response.choices[0].message.content;
};

export const generateGeminiResponseWithTools = async (
  messages,
  selectedModel = "gemini",
  userId,
) => {
  console.log("Starting LangChain Agent...");
  if (!userId) throw new Error("User Id is required");
  if (selectedModel === "groq") {
    return await groqToolResponse(selectedModel, messages);
  }
  const citations = [];

  const tools = createLangChainTools(userId, citations);

  const agent = createAgent({
    model: models[selectedModel] || geminiModel,
    tools,
    systemPrompt,
  });
  const convertedMessages = convertMessages(messages);

  const response = await agent.invoke({ messages: convertedMessages });

  console.log("LangChain Agent completed.");

  const finalMessage = response.messages[response.messages.length - 1];

  const answer = finalMessage.content;

  const citationText = formatCitationsService(citations);

  return answer + citationText;
};
