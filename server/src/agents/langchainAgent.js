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

const groqToolResponse = async (selectedModel,messages) => {
  if (selectedModel === "groq") {
    const convertedMessage = convertMessages(messages);
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
        ...groqMessages,
      ],
      tools: [
        {
          type: "browser_search",
        },
      ],
      temperature: 0.7,
    });
    return response.choices[0].message.content;
  }
};
export const generateGeminiResponseWithTools = async (
  messages,
  selectedModel = "gemini",
) => {
  console.log("Starting LangChain Agent...");
  if (selectedModel === "groq") {
    return await groqToolResponse(selectedModel,messages);
  }
  const citations = [];

  const tools = createLangChainTools(citations);

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
