const API_URL = "/api";

// Get active tenant header
const getTenantHeaders = () => {
  const tenant = JSON.parse(
    localStorage.getItem("activeTenant") || "null",
  );

  if (!tenant?.id) {
    throw new Error("Please select a workspace first");
  }

  return {
    "x-tenant-id": String(tenant.id),
  };
};

// Get conversations
export const getConversationsServices = async () => {
  const response = await fetch(`${API_URL}/conversations`, {
    credentials: "include",
    headers: getTenantHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch conversations");
  }

  return data.getUserConversations;
};

// Create conversation
export const createConversationServices = async (title = "New Chat") => {
  const response = await fetch(`${API_URL}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getTenantHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({ title }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create conversation");
  }

  return data.conversation;
};

// Get messages by conversation
export const getMessagesServices = async (conversationId) => {
  const response = await fetch(
    `${API_URL}/messages/conversations/${conversationId}`,
    {
      credentials: "include",
      headers: getTenantHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch messages");
  }

  return data.messages;
};

// Send message
export const sendMessageServices = async (
  conversationId,
  content,
  file,
  selectedModel,
  onChunk,
  signal,
) => {
  const formData = new FormData();

  formData.append("conversationId", conversationId);
  formData.append("model", selectedModel);
  formData.append("content", content);

  if (file) {
    formData.append("file", file);
  }

  const response = await fetch(`${API_URL}/messages`, {
    method: "POST",
    credentials: "include",
    headers: getTenantHeaders(),
    body: formData,
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let completeResponse = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const text = decoder.decode(value, { stream: true });

      completeResponse += text;

      if (onChunk) {
        onChunk(text);
      }
    }

    completeResponse += decoder.decode();

    return completeResponse;
  } finally {
    reader.releaseLock();
  }
};

// Regenerate assistant response
export const regenerateMessageServices = async (
  conversationId,
  messageId,
  selectedModel,
  onChunk,
) => {
  const response = await fetch(
    `${API_URL}/messages/${messageId}/regenerate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getTenantHeaders(),
      },
      credentials: "include",
      body: JSON.stringify({
        conversationId,
        model: selectedModel,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let completeResponse = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const text = decoder.decode(value, { stream: true });

      completeResponse += text;

      if (onChunk) {
        onChunk(text);
      }
    }

    completeResponse += decoder.decode();

    return completeResponse;
  } finally {
    reader.releaseLock();
  }
};

// Logout
export const logoutServices = async () => {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to logout");
  }

  return data;
};

// Delete conversation
export const deleteConversationService = async (conversationId) => {
  const response = await fetch(
    `${API_URL}/conversations/${conversationId}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: getTenantHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to delete conversation");
  }

  return data;
};