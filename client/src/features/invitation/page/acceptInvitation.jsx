import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiCheckCircle, FiAlertCircle, FiLoader } from "react-icons/fi";

import CreateEmployeeAccountPage from "../components/createEmployeeAccount.jsx";

import {
  validateInvitationService,
  acceptInvitation,
} from "../services/invitationService";

import {
  getUserTenantsService,
  selectTenantService,
} from "../../chat/services/tenantService.js";

const AcceptInvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkInvitation = async () => {
      try {
        const data = await validateInvitationService(token);
        setInvitation(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkInvitation();
  }, [token]);

  const openCompanyDashboard = async (tenantId) => {
    const tenants = await getUserTenantsService();

    const tenant = tenants.find(
      (item) => Number(item.id) === Number(tenantId),
    );

    if (!tenant) 
      throw new Error("Company membership was created, but the company could not be found.");
    

    await selectTenantService(tenantId);

    localStorage.setItem(
      "activeTenant",
      JSON.stringify({
        id: tenant.id,
        name: tenant.name,
        role: tenant.role,
      }),
    );

    window.location.assign("/chat");
  };

  const handleCreateAccount = async (formData) => {
    try {
      setSubmitting(true);
      setError("");

      const result = await acceptInvitation({
        token,
        ...formData,
      });

      await openCompanyDashboard(result.tenantId);
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center">
        <FiLoader className="text-primary mb-3" size={32} />
        <p className="text-secondary">Checking your invitation...</p>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
        <div className="card border-0 shadow-sm rounded-4 text-center p-4" style={{ maxWidth: "450px", width: "100%" }}>
          <FiAlertCircle className="text-danger mx-auto mb-3" size={42} />

          <h4 className="fw-bold">Invitation Unavailable</h4>

          <p className="text-secondary">{error}</p>

          <Link to="/login" className="btn btn-primary">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-3">
      <div style={{ maxWidth: "480px", width: "100%" }}>
        {invitation?.hasAccount ? (
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4 p-md-5 text-center">
              <FiCheckCircle
                className="text-success mb-3"
                size={42}
              />

              <h3 className="fw-bold mb-2">You're Invited!</h3>

              <p className="text-secondary">
                <strong>{invitation.companyName}</strong> has invited you
                to join their workspace.
              </p>

              <div className="bg-light rounded-3 p-3 my-4 text-start">
                <small className="text-secondary d-block">
                  Invitation sent to
                </small>
                <strong>{invitation.email}</strong>
              </div>

              <p className="text-secondary small">
                An account already exists with this email. Log in with
                that account to accept the invitation.
              </p>

              <Link
                to="/login"
                state={{ invitationToken: token }}
                className="btn btn-primary w-100 py-2"
              >
                Login & Continue
              </Link>
            </div>
          </div>
        ) : (
          <CreateEmployeeAccountPage
            invitation={invitation}
            onSubmit={handleCreateAccount}
            loading={submitting}
            error={error}
          />
        )}
      </div>
    </div>
  );
};

export default AcceptInvitationPage;