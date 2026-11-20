import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBriefcase,
  FiUsers,
  FiShield,
  FiArrowRight,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

import { getUserTenants, selectTenant } from "../services/tenantService.js";

const TenantSelectionPage = () => {
  const navigate = useNavigate();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTenants = async () => {
      try {
        const data = await getUserTenants();
        setTenants(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadTenants();
  }, []);

  const handleSelectTenant = async (tenantId) => {
    try {
      setSelecting(tenantId);
      setError("");

      const tenant = await selectTenant(tenantId);

      localStorage.setItem("activeTenant", JSON.stringify(tenant));

      navigate("/chat");
    } catch (error) {
      setError(error.message);
      setSelecting(null);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light">
        <div
          className="spinner-border text-primary mb-3"
          role="status"
          style={{ width: "3rem", height: "3rem" }}
        ></div>
        <h6 className="text-secondary">Loading your workspaces...</h6>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light py-5">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-5">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-4 bg-primary bg-opacity-10 text-primary mb-3"
            style={{ width: "65px", height: "65px" }}
          >
            <FiBriefcase size={30} className="text-white" />
          </div>

          <h2 className="fw-bold mb-2">Select Your Workspace</h2>

          <p className="text-muted mb-0">
            Choose a company workspace to continue to your AI assistant.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
            <FiAlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Workspace Cards */}
        {tenants.length === 0 ? (
          <div
            className="card border-0 shadow-sm rounded-4 mx-auto text-center p-5"
            style={{ maxWidth: "500px" }}
          >
            <div className="text-muted mb-3">
              <FiBriefcase size={45} />
            </div>

            <h5 className="fw-bold">No Workspaces Found</h5>

            <p className="text-muted mb-0">
              You are not currently a member of any company workspace.
            </p>
          </div>
        ) : (
          <>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold mb-0">Your Workspaces</h5>

              <span className="badge bg-primary bg-opacity-10 text-white rounded-pill px-3 py-2 ">
                {tenants.length} Workspace{tenants.length !== 1 && "s"}
              </span>
            </div>

            <div className="row g-4">
              {tenants.map((tenant) => {
                const isAdmin = tenant.role === "admin";
                const isSelecting = selecting === tenant.id;

                return (
                  <div className="col-md-6 col-lg-4" key={tenant.id}>
                    <div
                      className="card border-0 shadow-sm rounded-4 h-100"
                      style={{ transition: "0.2s ease" }}
                    >
                      <div className="card-body p-4">
                        {/* Workspace Icon and Role */}
                        <div className="d-flex justify-content-between align-items-start mb-4">
                          <div
                            className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-white"
                            style={{ width: "52px", height: "52px" }}
                          >
                            <FiBriefcase size={24} />
                          </div>

                          <span
                            className={`badge rounded-pill px-3 py-2 text-white ${
                              isAdmin
                                ? "bg-success bg-opacity-10 text-success"
                                : "bg-info bg-opacity-10 text-info"
                            }`}
                          >
                            {isAdmin ? (
                              <FiShield className="me-1 text-white"  />
                            ) : (
                              <FiUsers className="me-1 text-white" />
                            )}
                            {tenant.role}
                          </span>
                        </div>

                        {/* Workspace Details */}
                        <h5 className="fw-bold mb-2 ">{tenant.name}</h5>

                        <p className="text-muted small mb-4">
                          {isAdmin
                            ? "Manage your company workspace and employees."
                            : "Access your company workspace and shared documents."}
                        </p>

                        {/* Select Button */}
                        <button
                          className="btn btn-primary w-100 rounded-3 py-2 d-flex align-items-center justify-content-center gap-2"
                          disabled={selecting !== null}
                          onClick={() => handleSelectTenant(tenant.id)}
                        >
                          {isSelecting ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                              ></span>
                              Selecting...
                            </>
                          ) : (
                            <>
                              Select Workspace
                              <FiArrowRight />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="text-center mt-5">
          <p className="text-muted small mb-0">
            <FiCheckCircle className="text-success me-1" />
            Your workspace access is managed securely.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TenantSelectionPage;
