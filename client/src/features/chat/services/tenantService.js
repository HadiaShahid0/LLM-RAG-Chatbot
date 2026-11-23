const API_URL = "/api";

export const getUserTenantsService = async () => {
  const response = await fetch(`${API_URL}/tenants`, {
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) throw new Error(data.message || "Failed to fetch tenants");

  return data.tenants;
};

export const selectTenantService = async (tenantId) => {
  const response = await fetch(`${API_URL}/tenants/${tenantId}/select`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) throw new Error(data.message || "Failed to select tenant");

  return data.tenant;
};

export const getTenantEmployeesService = async () => {
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

  if (!response.ok)
    throw new Error(data.message || "Failed to fetch employees");

  return data.employees;
};

export const getDocumentAccessService = async (documentId) => {
  const response = await fetch(`${API_URL}/tenants/${documentId}/access`, {
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok)
    throw new Error(data.message || "Failed to fetch document access");

  return data;
};

export const updateDocumentVisibilityService = async (
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

  if (!response.ok)
    throw new Error(data.message || "Failed to update document access");

  return data;
};
