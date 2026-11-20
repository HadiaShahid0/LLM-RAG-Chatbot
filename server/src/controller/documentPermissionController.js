import  {getDocumentAccessService,updateDocumentVisibilityService} from "../services/documentManagementService.js";

export const updateDocumentVisibilityController = async (req, res) => {
  try {
    const result = await updateDocumentVisibilityService(
      req.params.id,
      req.tenant.id,
      req.user.id,
      req.body.visibility,
      req.body.permissions || [],
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res
      .status(
        error.message === "Document not found"
          ? 404
          : error.message.includes("Only workspace admins")
            ? 403
            : 400,
      )
      .json({
        success: false,
        error: error.message,
      });
  }
};

export const getDocumentAccessController = async (req, res) => {
  try {
    const result = await getDocumentAccessService(
      req.params.id,
      req.tenant.id,
      req.user.id,
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(403).json({
      success: false,
      message: error.message,
    });
  }
};
