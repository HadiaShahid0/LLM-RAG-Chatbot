const API_URL = "/api";

export const getDocumentsService = async () => {
  const tenant = JSON.parse(localStorage.getItem("activeTenant"));

  const response = await fetch(`${API_URL}/documents`, {
    credentials: "include",
    headers: {
      "x-tenant-id": tenant.id,
    },
  });

  const data = await response.json();

  if (!response.ok) throw new Error(data.error || "Failed to fetch documents");

  return data.documents;
};

export const uploadDocumentService = async (file, accessSettings) => {
  const tenant = JSON.parse(localStorage.getItem("activeTenant"));

  const formData = new FormData();

  formData.append("file", file);
  formData.append("visibility", accessSettings.visibility);
  formData.append(
    "permissions",
    JSON.stringify(accessSettings.permissions || []),
  );

  const response = await fetch(`${API_URL}/documents/upload`, {
    method: "POST",
    credentials: "include",
    headers: {
      "x-tenant-id": tenant.id,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) throw new Error(data.error || "Failed to upload document");

  return data.document;
};

export const deleteDocumentService = async (documentId) => {
  const tenant = JSON.parse(localStorage.getItem("activeTenant"));

  const response = await fetch(`${API_URL}/documents/${documentId}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "x-tenant-id": tenant.id,
    },
  });

  const data = await response.json();

  if (!response.ok) throw new Error(data.error || "Failed to delete document");

  return data;
};
