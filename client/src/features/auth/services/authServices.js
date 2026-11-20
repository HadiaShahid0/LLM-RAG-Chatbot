const API_URL = "/api";
const handleResponse = async (response) => {
  const text = await response.text();

  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `Server returned invalid JSON. Status: ${response.status}. Response: ${text.slice(0, 200)}`,
      );
    }
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
};
export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(userData),
  });

  return handleResponse(response);
};

export const loginUser = async (loginData) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(loginData),
  });

  return handleResponse(response);
};
export const logoutUser = async () => {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  return handleResponse(response);
};

export const verifyUser = async () => {
  const response = await fetch(`${API_URL}/auth/verify`, {
    credentials: "include",
  });

  return handleResponse(response);
};
