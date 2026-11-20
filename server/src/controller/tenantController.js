import {
  getTenantEmployeeService,
  getUserTenantsService,
  selectTenantService,
} from "../services/tenantService.js";

export const getUserTenants = async (req, res) => {
  try {
    const tenants = await getUserTenantsService(req.user.id);

    res.status(200).json({
      success: true,
      tenants,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const selectTenant = async (req, res) => {
  try {
    const tenantId = Number(req.params.tenantId);

    if (!Number.isInteger(tenantId) || tenantId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid tenant ID",
      });
    }

    const tenant = await selectTenantService(req.user.id, tenantId);

    if (!tenant) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this company",
      });
    }

    res.status(200).json({
      success: true,
      message: "Workspace selected successfully",
      tenant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTenantEmployees = async (req, res) => {
  try {
    const employees = await getTenantEmployeeService(
      req.tenant.id,
      req.user.id,
    );
    res.status(200).json({
      success: true,
      employees,
    });
  } catch (error) {
    res.status(403).json({
      success: false,
      message: error.message,
    });
  }
};
