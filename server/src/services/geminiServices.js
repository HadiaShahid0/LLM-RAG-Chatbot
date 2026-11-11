import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const uploadFileToGemini = async (file) => {
  try {
    const uploadedFile = await ai.files.upload({
      file: file.path,
      config: {
        mimeType: file.mimetype,
      },
    });

    return uploadedFile;
  } catch (error) {
    console.error("Gemini file upload failed:", error.message);
    throw new Error("Unable to upload the file to Gemini.");
  }
};