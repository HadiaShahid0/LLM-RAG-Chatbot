import {
  createInvitationService,
  getInvitationsService,
  resendInvitationService,
  revokeInvitationService,
  validateInvitationService,
  acceptInvitationService,
  acceptExistingInvitationService,
} from "../services/invitationService.js";

export const createInvitationController = async (req, res) => {
  try {
    const { email, message } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result = await createInvitationService(
      req.tenant.id,
      req.user.id,
      email,
      message || "",
    );

    return res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInvitationsController = async (req, res) => {
  try {
    const invitations = await getInvitationsService(req.tenant.id, req.user.id);

    return res.status(200).json({
      success: true,
      invitations,
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }
};

export const resendInvitationController = async (req, res) => {
  try {
    const result = await resendInvitationService(
      req.params.id,
      req.tenant.id,
      req.user.id,
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const revokeInvitationController = async (req, res) => {
  try {
    const result = await revokeInvitationService(
      req.params.id,
      req.tenant.id,
      req.user.id,
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


// Validate invitation link
export const validateInvitationController = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Invitation token is required",
      });
    }

    const invitation = await validateInvitationService(token);

    return res.status(200).json({
      success: true,
      invitation,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Register new employee and accept invitation
export const acceptInvitationController = async (req, res) => {
  try {
    const { token, username, password } = req.body;

    if (!token || !username?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Token, username and password are required",
      });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Username must contain at least 3 characters",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    const result = await acceptInvitationService(
      token,
      username,
      password,
    );

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "Account created and invitation accepted",
      user: result.user,
      tenantId: result.tenantId,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Existing user accepts invitation
export const acceptExistingInvitationController = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Invitation token is required",
      });
    }

    const result = await acceptExistingInvitationService(
      token,
      req.user.id,
    );

    return res.status(200).json({
      success: true,
      message: "Invitation accepted successfully",
      user: result.user,
      tenantId: result.tenantId,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};