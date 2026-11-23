import { useEffect, useState } from "react";

import {
  FiMail,
  FiPlus,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiTrash2,
  FiSend,
  FiX,
  FiCalendar,
  FiShield,
  FiInbox,
} from "react-icons/fi";

import {
  createInvitation,
  getInvitations,
  resendInvitation,
  revokeInvitation,
} from "../services/invitationService.js";

export const TeamInvitationsPage = () => {
  const [invitations, setInvitations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    message: "You have been invited to join our company workspace.",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getInvitations();

      setInvitations(data || []);
    } catch (err) {
      setError(err.message || "Failed to load invitations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const pendingCount = invitations.filter(
    (item) => item.status === "pending",
  ).length;

  const acceptedCount = invitations.filter(
    (item) => item.status === "accepted",
  ).length;

  const expiredCount = invitations.filter(
    (item) => item.status === "expired",
  ).length;

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSendInvitation = async (event) => {
    event.preventDefault();

    if (!formData.email.trim()) {
      setError("Please enter an employee email.");
      return;
    }

    try {
      setSending(true);
      setError("");
      setSuccess("");

      await createInvitation({
        email: formData.email.trim().toLowerCase(),
        message: formData.message.trim(),
      });

      setSuccess("Invitation sent successfully!");

      setFormData({
        email: "",
        message: "You have been invited to join our company workspace.",
      });

      setShowModal(false);

      await loadInvitations();
    } catch (err) {
      setError(err.message || "Failed to send invitation.");
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (invitationId) => {
    try {
      setActionId(invitationId);
      setError("");
      setSuccess("");

      await resendInvitation(invitationId);

      setSuccess("Invitation resent successfully!");

      await loadInvitations();
    } catch (err) {
      setError(err.message || "Failed to resend invitation.");
    } finally {
      setActionId(null);
    }
  };

  const handleRevoke = async (invitationId) => {
    const confirmed = window.confirm(
      "Are you sure you want to revoke this invitation?",
    );

    if (!confirmed) return;

    try {
      setActionId(invitationId);
      setError("");
      setSuccess("");

      await revokeInvitation(invitationId);

      setSuccess("Invitation revoked successfully.");

      await loadInvitations();
    } catch (err) {
      setError(err.message || "Failed to revoke invitation.");
    } finally {
      setActionId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        label: "Pending",
        className: "bg-warning-subtle text-warning-emphasis",
        icon: <FiClock />,
      },
      accepted: {
        label: "Accepted",
        className: "bg-success-subtle text-success",
        icon: <FiCheckCircle />,
      },
      expired: {
        label: "Expired",
        className: "bg-danger-subtle text-danger",
        icon: <FiXCircle />,
      },
      revoked: {
        label: "Revoked",
        className: "bg-secondary-subtle text-secondary",
        icon: <FiXCircle />,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`badge rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2 ${config.className}`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="container-fluid p-3 p-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center"
              style={{
                width: "42px",
                height: "42px",
                backgroundColor: "#eef2ff",
                color: "#4f46e5",
              }}
            >
              <FiUsers size={21} />
            </div>

            <span className="text-primary fw-semibold small">
              TEAM MANAGEMENT
            </span>
          </div>

          <h3 className="fw-bold mb-1">Team Invitations</h3>

          <p className="text-secondary mb-0">
            Invite employees and manage access to your workspace.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 rounded-3 shadow-sm"
          onClick={() => {
            setError("");
            setShowModal(true);
          }}
        >
          <FiPlus size={18} />
          Add Employee
        </button>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between">
          <span>{error}</span>

          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          />
        </div>
      )}

      {success && (
        <div className="alert alert-success d-flex align-items-center justify-content-between">
          <span>{success}</span>

          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess("")}
          />
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-secondary small mb-2">
                    Total Invitations
                  </p>

                  <h3 className="fw-bold mb-0">{invitations.length}</h3>
                </div>

                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: "48px",
                    height: "48px",
                    background: "#eef2ff",
                    color: "#4f46e5",
                  }}
                >
                  <FiMail size={22} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-secondary small mb-2">
                    Pending
                  </p>

                  <h3 className="fw-bold mb-0">{pendingCount}</h3>
                </div>

                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: "48px",
                    height: "48px",
                    background: "#fff7e6",
                    color: "#d97706",
                  }}
                >
                  <FiClock size={22} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-secondary small mb-2">
                    Accepted
                  </p>

                  <h3 className="fw-bold mb-0">{acceptedCount}</h3>
                </div>

                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: "48px",
                    height: "48px",
                    background: "#e8f8ef",
                    color: "#16a34a",
                  }}
                >
                  <FiCheckCircle size={22} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-secondary small mb-2">
                    Expired
                  </p>

                  <h3 className="fw-bold mb-0">{expiredCount}</h3>
                </div>

                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: "48px",
                    height: "48px",
                    background: "#fff0f0",
                    color: "#dc2626",
                  }}
                >
                  <FiXCircle size={22} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-header bg-white border-0 p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-1">Invitation History</h5>

              <p className="text-secondary small mb-0">
                Track and manage your employee invitations.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-light border rounded-3 d-flex align-items-center gap-2"
              onClick={loadInvitations}
              disabled={loading}
            >
              <FiRefreshCw className={loading ? "spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" />

              <p className="text-secondary mb-0">
                Loading invitations...
              </p>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-5 px-3">
              <div
                className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "75px",
                  height: "75px",
                  background: "#eef2ff",
                  color: "#4f46e5",
                }}
              >
                <FiInbox size={32} />
              </div>

              <h5 className="fw-bold">No invitations yet</h5>

              <p
                className="text-secondary mx-auto mb-4"
                style={{ maxWidth: "350px" }}
              >
                Start building your team by inviting employees to your
                company workspace.
              </p>

              <button
                type="button"
                className="btn btn-primary rounded-3 px-4"
                onClick={() => setShowModal(true)}
              >
                <FiPlus className="me-2" />
                Invite Your First Employee
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="py-3">Role</th>
                    <th className="py-3">Invited On</th>
                    <th className="py-3">Expires On</th>
                    <th className="py-3">Status</th>
                    <th className="py-3 text-end pe-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {invitations.map((invitation) => (
                    <tr key={invitation.id}>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                            style={{
                              width: "42px",
                              height: "42px",
                              background: "#eef2ff",
                              color: "#4f46e5",
                            }}
                          >
                            {invitation.email?.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <div className="fw-semibold">
                              {invitation.email}
                            </div>

                            <small className="text-secondary">
                              Employee invitation
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="d-inline-flex align-items-center gap-2 text-secondary">
                          <FiShield size={15} />
                          Employee
                        </span>
                      </td>

                      <td>
                        <span className="text-secondary small">
                          <FiCalendar className="me-2" />
                          {formatDate(invitation.createdAt)}
                        </span>
                      </td>

                      <td>
                        <span className="text-secondary small">
                          {formatDate(invitation.expiresAt)}
                        </span>
                      </td>

                      <td>{getStatusBadge(invitation.status)}</td>

                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end gap-2">
                          {(invitation.status === "pending" ||
                            invitation.status === "expired") && (
                            <button
                              type="button"
                              className="btn btn-sm btn-light border rounded-3"
                              title="Resend invitation"
                              disabled={actionId === invitation.id}
                              onClick={() => handleResend(invitation.id)}
                            >
                              {actionId === invitation.id ? (
                                <span className="spinner-border spinner-border-sm" />
                              ) : (
                                <FiRefreshCw size={16} />
                              )}
                            </button>
                          )}

                          {invitation.status === "pending" && (
                            <button
                              type="button"
                              className="btn btn-sm btn-light border text-danger rounded-3"
                              title="Revoke invitation"
                              disabled={actionId === invitation.id}
                              onClick={() => handleRevoke(invitation.id)}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {invitations.length > 0 && (
          <div className="card-footer bg-white border-0 px-4 py-3">
            <small className="text-secondary">
              Showing {invitations.length} invitation
              {invitations.length !== 1 ? "s" : ""}
            </small>
          </div>
        )}
      </div>

      {showModal && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 rounded-4 shadow-lg">
                <div className="modal-header border-0 px-4 pt-4">
                  <div>
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center mb-3"
                      style={{
                        width: "45px",
                        height: "45px",
                        background: "#eef2ff",
                        color: "#4f46e5",
                      }}
                    >
                      <FiSend size={21} />
                    </div>

                    <h5 className="modal-title fw-bold">
                      Invite a Team Member
                    </h5>

                    <p className="text-secondary small mb-0 mt-1">
                      Send an invitation to join your workspace.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn-close align-self-start"
                    onClick={() => setShowModal(false)}
                    disabled={sending}
                  />
                </div>

                <form onSubmit={handleSendInvitation}>
                  <div className="modal-body px-4 py-3">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Employee Email
                      </label>

                      <div className="input-group">
                        <span className="input-group-text bg-white">
                          <FiMail />
                        </span>

                        <input
                          type="email"
                          name="email"
                          className="form-control py-2"
                          placeholder="employee@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          disabled={sending}
                        />
                      </div>

                      <small className="text-secondary">
                        The invitation will be sent to this email address.
                      </small>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Invitation Message
                      </label>

                      <textarea
                        name="message"
                        className="form-control"
                        rows="4"
                        placeholder="Write a personal invitation message..."
                        value={formData.message}
                        onChange={handleChange}
                        disabled={sending}
                      />
                    </div>

                    <div className="alert alert-primary border-0 rounded-3 small mb-0">
                      <FiClock className="me-2" />
                      This invitation will remain valid for 7 days.
                    </div>
                  </div>

                  <div className="modal-footer border-0 px-4 pb-4">
                    <button
                      type="button"
                      className="btn btn-light border rounded-3 px-4"
                      onClick={() => setShowModal(false)}
                      disabled={sending}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary rounded-3 px-4 d-flex align-items-center gap-2"
                      disabled={sending}
                    >
                      {sending ? (
                        <>
                          <span className="spinner-border spinner-border-sm" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <FiSend size={16} />
                          Send Invitation
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
};

export default TeamInvitationsPage;