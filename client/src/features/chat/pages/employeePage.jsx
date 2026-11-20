import { useEffect, useState } from "react";
import {
  FiUsers,
  FiSearch,
  FiRefreshCw,
  FiMail,
  FiShield,
  FiUser,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiBriefcase,
} from "react-icons/fi";

import { getTenantEmployees } from "../services/tenantService.js";

const EmployeesPage = ({ isAdmin = false }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTenantEmployees();
      setEmployees(data);
    } catch (error) {
      setError(error.message || "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadEmployees();
    }
  }, [isAdmin]);

  // Only admins can access this page
  if (!isAdmin) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <FiAlertCircle size={20} />
          You are not authorized to access employee management.
        </div>
      </div>
    );
  }

  // Search employees
  const filteredEmployees = employees.filter((employee) => {
    const user = employee.user || employee;

    const name = user.username || user.name || "";
    const email = user.email || "";

    return `${name} ${email}`.toLowerCase().includes(search.toLowerCase());
  });

  // Employee statistics
  const activeEmployees = employees.filter(
    (employee) => employee.status === "active",
  ).length;

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .trim()
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getStatusBadge = (status) => {
    if (status === "active") {
      return (
        <span className="badge rounded-pill bg-success bg-opacity-10 text-white px-3 py-2">
          <FiCheckCircle className="me-1" />
          Active
        </span>
      );
    }

    return (
      <span className="badge rounded-pill bg-warning bg-opacity-10 text-white px-3 py-2">
        <FiClock className="me-1" />
        {status || "Unknown"}
      </span>
    );
  };

  return (
    <div
      className="container-fluid p-4 p-lg-5 bg-light"
      style={{
        height: "100%",
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <div
              className="rounded-3 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center"
              style={{ width: "42px", height: "42px" }}
            >
              <FiUsers size={21} className="text-white" />
            </div>

            <span className="text-primary fw-semibold small">
              WORKSPACE MANAGEMENT
            </span>
          </div>

          <h3 className="fw-bold mb-1">Employee Directory</h3>

          <p className="text-muted mb-0">
            Manage and view members of your company workspace.
          </p>
        </div>

        <button
          className="btn btn-white border shadow-sm rounded-3 px-3 py-2"
          onClick={loadEmployees}
          disabled={loading}
        >
          <FiRefreshCw className={`me-2 ${loading ? "spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-3 bg-primary bg-opacity-10 text-primary p-3">
                <FiUsers size={23} className="text-white" />
              </div>

              <div>
                <p className="text-muted small mb-1">Total Employees</p>
                <h3 className="fw-bold mb-0">{employees.length}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-3 bg-success bg-opacity-10 text-success p-3">
                <FiCheckCircle size={23} className="text-white" />
              </div>

              <div>
                <p className="text-muted small mb-1">Active Members</p>
                <h3 className="fw-bold mb-0">{activeEmployees}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Directory */}
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-header bg-white border-0 p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h5 className="fw-bold mb-1">Workspace Members</h5>
              <p className="text-muted small mb-0">
                View all employees in this workspace.
              </p>
            </div>

            <div
              className="position-relative"
              style={{ width: "280px", maxWidth: "100%" }}
            >
              <FiSearch
                className="position-absolute text-muted"
                style={{
                  top: "50%",
                  left: "13px",
                  transform: "translateY(-50%)",
                }}
              />

              <input
                type="text"
                className="form-control rounded-3 ps-5"
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card-body p-4">
          {/* Loading */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" />

              <p className="text-muted mb-0">Loading workspace members...</p>
            </div>
          ) : error ? (
            /* Error */
            <div className="text-center py-5">
              <FiAlertCircle size={35} className="text-danger mb-3" />

              <h6 className="fw-bold">Unable to load employees</h6>

              <p className="text-muted">{error}</p>

              <button
                className="btn btn-primary rounded-3 px-4"
                onClick={loadEmployees}
              >
                Try Again
              </button>
            </div>
          ) : filteredEmployees.length === 0 ? (
            /* Empty State */
            <div className="text-center py-5">
              <FiUsers size={40} className="text-muted mb-3" />

              <h6 className="fw-bold">
                {search ? "No matching employees" : "No employees yet"}
              </h6>

              <p className="text-muted mb-0">
                {search
                  ? "Try searching with another name or email."
                  : "There are currently no employees in this workspace."}
              </p>
            </div>
          ) : (
            /* Employee Cards */
            <div className="row g-3">
              {filteredEmployees.map((employee) => {
                const user = employee.user || employee;

                const name = user.username || user.name || "Unknown User";

                const email = user.email || "No email available";

                const role = employee.role || "employee";
               const status = employee.status;
                return (
                  <div className="col-md-6 col-xl-4" key={employee.id}>
                    <div className="border rounded-4 p-3 h-100 bg-white">
                      <div className="d-flex align-items-center gap-3 mb-3">
                        {/* Avatar */}
                        <div
                          className="rounded-circle bg-primary bg-opacity-10 text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: "52px",
                            height: "52px",
                            fontSize: "17px",
                          }}
                        >
                          {getInitials(name)}
                        </div>

                        {/* Employee Info */}
                        <div className="overflow-hidden">
                          <h6 className="fw-bold mb-1 text-truncate">{name}</h6>

                          <div className="text-muted small text-truncate">
                            <FiMail className="me-1 text-white" />
                            {email}
                          </div>
                        </div>
                      </div>

                      <hr className="text-muted opacity-25" />

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-muted small">Workspace Role</span>

                        <span
                          className={`badge rounded-pill px-3 py-2 ${
                            role === "admin"
                              ? "bg-primary bg-opacity-10 text-white"
                              : "bg-secondary bg-opacity-10 text-white"
                          }`}
                        >
                          {role === "admin" ? (
                            <FiShield className="me-1" />
                          ) : (
                            <FiUser className="me-1" />
                          )}

                          {role}
                        </span>
                      </div>

                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">
                          Membership Status
                        </span>
                        {getStatusBadge(status)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-4">
        <small className="text-muted">
          <FiBriefcase className="me-1" />
          Workspace Employee Directory
        </small>
      </div>
    </div>
  );
};

export default EmployeesPage;
