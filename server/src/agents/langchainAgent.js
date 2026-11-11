import { createAgent } from "langchain";

import {model} from "../config/langchain.js";
import {systemPrompt} from "../prompts/systemPrompts.js";

import { createLangChainTools } from "../tools/langchainTools.js";

import { convertMessages } from "../services/langchainServices.js";
import { formatCitationsService } from "../services/citationsService.js";

export const generateGeminiResponseWithTools = async (messages) => {
  console.log("Starting LangChain Agent...");

  const citations = [];

  const tools = createLangChainTools(citations);

  const agent = createAgent({
    model,
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
