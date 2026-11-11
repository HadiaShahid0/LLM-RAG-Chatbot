import {PDFLoader} from "@langchain/community/document_loaders/fs/pdf";

export const extractTextFromPDFService = async (filePath) => {
  try {
    const loader = new PDFLoader(filePath)
    
    const documents=await loader.load()
    
    if(!documents.length) throw new Error("No content found in the PDF.");

    const extractedText=documents.map((document)=> document.pageContent).join("\n")

    if (!extractedText.trim())
      throw new Error(
        "No text found in the PDF. It may be scanned or image-based",
      );

    return documents;                                          
  } catch (err) {
    console.error("PDF extraction failed: ", err.message);
    throw err;
  }
};
