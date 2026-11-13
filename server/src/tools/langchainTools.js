import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { searchDocuments } from "./toolRegistoery.js";
import { searchWikipedia } from "./toolService.js";

export const createLangChainTools = (userId, citations = []) => {
  return [
    tool(
      async ({ question }) => {
        const results = await searchDocuments({ question, userId });

        return JSON.stringify(results);
      },
      {
        name: "searchDocuments",
        description: `
Search the authenticated user's uploaded PDF documents.

Use this tool when:
- The user asks questions about uploaded documents.
- The user asks for explanations or summaries of uploaded PDFs.
- The user asks to compare information from uploaded documents.
- The user asks follow-up questions about information in uploaded PDFs.
- The user asks whether a particular topic or detail exists in their documents.

Search using a complete, meaningful question.
Only use the returned results as evidence for document-specific answers.
`,
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
