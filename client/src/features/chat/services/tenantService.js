const API_URL="/api"
export const getUserTenants = async () => {
  const response = await fetch(`${API_URL}/tenants`, {
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch tenants");
  }

  return data.tenants;
};

export const selectTenant = async (tenantId) => {
  const response = await fetch(`${API_URL}/tenants/${tenantId}/select`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to select tenant");
  }

  return data.tenant;
};

// Fetch employees from the active tenant
export const getTenantEmployees = async () => {
  const activeTenant = JSON.parse(
    localStorage.getItem("activeTenant") || "null",
  );

  if (!activeTenant?.id) {
    throw new Error("Please select a workspace first.");
  }

  const response = await fetch(`${API_URL}/tenants/employees`, {
    credentials: "include",
    headers: {
      "x-tenant-id": String(activeTenant.id),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch employees");
  }

  return data.employees;
};

// Fetch document visibility and permissions
export const getDocumentAccess = async (documentId) => {
  const response = await fetch(`${API_URL}/tenants/${documentId}/access`, {
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch document access");
  }

  return data;
};

// Update document visibility and permissions
export const updateDocumentVisibility = async (
  documentId,
  visibility,
  permissions = [],
) => {
  const response = await fetch(
    `${API_URL}/documents/${documentId}/visibility`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ visibility, permissions }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update document access");
  }

  return data;
};