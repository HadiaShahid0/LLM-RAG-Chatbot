const API_URL = "http://localhost:5000/api";

export const getDocumentsService = async () => {
  const response = await fetch(`${API_URL}/documents`, {
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) throw new Error(data.error || "Failed to fetch documents");

  return data.documents;
};

export const uploadDocumentService = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(`${API_URL}/documents/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) throw new Error(data.error || "Failed to upload document");

  return data.document;
};

export const deleteDocumentService = async (documentId) => {
  const response = await fetch(`${API_URL}/documents/${documentId}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) throw new Error(data.error || "Failed to delete document");
  return data;
};
