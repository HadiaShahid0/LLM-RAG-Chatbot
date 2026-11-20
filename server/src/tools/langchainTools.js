import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { searchDocuments } from "./toolRegistoery.js";
import { searchWikipedia } from "./toolService.js";

export const createLangChainTools = (
  userId,
  tenantId,
  citations = [],
  includeDocumentSearch = true,
) => {
  const tools = [];

  if (includeDocumentSearch) {
    tools.push(
      tool(
        async ({ question }) => {
          const results = await searchDocuments({ question, userId ,tenantId});
          return JSON.stringify(results);
        },
        {
          name: "searchDocuments",
          description: "Search the authenticated user's is authorized to access",
          schema: z.object({
            question: z.string(),
          }),
        },
      ),
    );
  }

  tools.push(
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
        description: "Search Wikipedia for background information.",
        schema: z.object({
          topic: z.string(),
        }),
      },
    ),
  );

  return tools;
};