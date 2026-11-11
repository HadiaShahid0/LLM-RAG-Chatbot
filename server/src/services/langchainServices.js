import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";

import {model} from "../config/langchain.js";
import {systemPrompt} from "../prompts/systemPrompts.js";

export const convertMessages = (contents) => {
  return contents.map((message) => {
    const text = message.parts
      ?.map((parts) => {
        if (parts.text) return { type: "text", text: parts.text };
        if (parts.fileData)
          return {
            type: "media",
            mimeType: parts.fileData.mimeType,
            fileUri: parts.fileData.fileUri,
          };
        return null;
      })
      .filter(Boolean);
      
    if (message.role === "model") return new AIMessage({ content: text });

    return new HumanMessage({ content: text });
  });
};

export const generateGeminiResponse = async (contents) => {
  console.log("Sending request through LangChain...");

  const messages = [
    new SystemMessage(systemPrompt),
    ...convertMessages(contents),
  ];

  const response = await model.invoke(messages);

  console.log("LangChain response received.");

  return response.text;
};

export const generateGeminiResponseStream = async (contents) => {
  console.log("Starting LangChain streaming...");

  const messages = [
    new SystemMessage(systemPrompt),
    ...convertMessages(contents),
  ];

  return await model.stream(messages);
};
