import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { searchDocuments } from "./toolRegistoery.js";
import { searchWikipedia } from "./toolService.js";

export const createLangChainTools = (citations = []) => {
  return [
    tool(
      async ({ question }) => {
        const results = await searchDocuments({ question });

        return JSON.stringify(results);
      },
      {
        name: "searchDocuments",
        description:
          "Search uploaded PDF documents for information relevant to the user's question. Use this tool when the user asks about their uploaded documents.",
        schema: z.object({
          question: z
            .string()
            .describe("The question to search for in uploaded documents."),
        }),
      },
    ),

    // Search Wikipedia
    tool(
      async ({ topic }) => {
        const results = await searchWikipedia({ topic });

        citations.push(
          ...results.map((item) => ({
            title: item.title,
            url: item.url,
          })),
        );

        return JSON.stringify(results);
      },
      {
        name: "searchWikipedia",
        description:
          "Search Wikipedia for background information about a topic.",
        schema: z.object({
          topic: z.string().describe("The topic to search for."),
        }),
      },
    ),
  ];
};
