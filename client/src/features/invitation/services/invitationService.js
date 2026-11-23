const API_URL = "/api";

const getTenantHeaders = () => {
  const activeTenant = JSON.parse(
    localStorage.getItem("activeTenant") || "null",
  );

  if (!activeTenant?.id) {
    throw new Error("Please select a company workspace first.");
  }

  return {
    "Content-Type": "application/json",
    "x-tenant-id": activeTenant.id,
  };
};

export const createInvitation = async ({ email, message }) => {
  const response = await fetch(`${API_URL}/invitations`, {
    method: "POST",
    headers: getTenantHeaders(),
    credentials: "include",
    body: JSON.stringify({ email, message }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to send invitation");
  }

  return data;
};

export const getInvitations = async () => {
  const response = await fetch(`${API_URL}/invitations`, {
    headers: getTenantHeaders(),
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to load invitations");
  }

  return data.invitations;
};

export const resendInvitation = async (invitationId) => {
  const response = await fetch(
    `${API_URL}/invitations/${invitationId}/resend`,
    {
      method: "POST",
      headers: getTenantHeaders(),
      credentials: "include",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to resend invitation");
  }

  return data;
};

export const revokeInvitation = async (invitationId) => {
  const response = await fetch(
    `${API_URL}/invitations/${invitationId}/revoke`,
    {
      method: "PATCH",
      headers: getTenantHeaders(),
      credentials: "include",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to revoke invitation");
  }

  return data;
};
export const acceptExistingInvitation = async (token) => {
  const response = await fetch(`${API_URL}/invitations/accept-existing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ token }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to accept invitation");
  }

  return data;
};

export const validateInvitationService = async (token) => {
  const response = await fetch(
    `${API_URL}/invitations/validate/${encodeURIComponent(token)}`,
    {
      credentials: "include",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Invalid or expired invitation");
  }

  return data.invitation;
};
// Accept invitation and create employee account
export const acceptInvitation = async (formData) => {
  const response = await fetch(`${API_URL}/invitations/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(formData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to accept invitation");
  }

  return data;
};