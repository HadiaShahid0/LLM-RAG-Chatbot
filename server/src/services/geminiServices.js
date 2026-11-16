import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const uploadFileToGemini = async (file) => {
  try {
    if (!file?.buffer) {
      throw new Error("File buffer is required");
    }

    const fileBlob = new Blob([file.buffer], {
      type: file.mimetype,
    });

    const uploadedFile = await ai.files.upload({
      file: fileBlob,
      config: {
        mimeType: file.mimetype,
        displayName: file.originalname,
      },
    });

    return uploadedFile;
  } catch (error) {
    console.error("Gemini file upload failed:", error);
    throw new Error("Unable to upload the file to Gemini.");
  }
};