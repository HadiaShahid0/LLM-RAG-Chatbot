

export const generateDocumentMetadataService = async (text) => {
  if (!text?.trim()) {
    throw new Error("Document text is required for metadata generation");
  }

  const prompt = `
Analyze the following PDF content.

Generate:
1. A short summary (2-3 sentences).
2. A list of important topics and concepts.

Return ONLY valid JSON in this format:

{
  "summary": "Short document summary",
  "topics": ["Topic 1", "Topic 2", "Topic 3"]
}

PDF CONTENT:
${text.slice(0, 15000)}
`;

  const response = await model.invoke(prompt);

  let content =
    typeof response.content === "string"
      ? response.content
      : Array.isArray(response.content)
        ? response.content
            .map((item) =>
              typeof item === "string" ? item : item.text || "",
            )
            .join("")
        : "";

  // Remove Markdown code fences if present.
  content = content
    .trim();

  // Extract JSON object.
  const startIndex = content.indexOf("{");
  const endIndex = content.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1) {
    throw new Error("Invalid JSON response from metadata generation");
  }

  const jsonContent = content.slice(startIndex, endIndex + 1);

  const metadata = JSON.parse(jsonContent);

  // Validate the generated metadata.
  if (
    typeof metadata.summary !== "string" ||
    !Array.isArray(metadata.topics)
  ) {
    throw new Error("Invalid document metadata format");
  }

  return {
    summary: metadata.summary,
    topics: metadata.topics,
  };
};