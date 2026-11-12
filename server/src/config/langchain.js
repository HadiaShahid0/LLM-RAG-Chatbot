import { ChatGoogle } from "@langchain/google";
import { ChatGroq } from "@langchain/groq";
import Groq from "groq-sdk";

export const model = new ChatGoogle({
  model: "gemini-3.1-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.7,
  safetySettings: [
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_LOW_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_LOW_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
  ],
});

export const groqModel = new ChatGroq({
  model: "openai/gpt-oss-120b",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.7,
});

export const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});