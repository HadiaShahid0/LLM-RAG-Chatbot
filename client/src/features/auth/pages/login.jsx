import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiLogIn,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

import { loginUser } from "../services/authServices";
import {
  acceptExistingInvitation,
} from "../../invitation/services/invitationService.js";

import {
  getUserTenantsService,
  selectTenantService,
} from "../../chat/services/tenantService.js";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!formData.password) {
      setError("Password is required.");
      return;
    }

    try {
      setLoading(true);

      await loginUser(formData);

      const invitationToken = location.state?.invitationToken;

      if (invitationToken) {
        const result = await acceptExistingInvitation(invitationToken);

        const tenants = await getUserTenantsService();

        const tenant = tenants.find(
          (item) => Number(item.id) === Number(result.tenantId),
        );

        if (!tenant)
          throw new Error("Company membership could not be found.");

        await selectTenantService(tenant.id);

        localStorage.setItem(
          "activeTenant",
          JSON.stringify({
            id: tenant.id,
            name: tenant.name,
            role: tenant.role,
          }),
        );

        window.location.assign("/chat");
        return;
      }

      navigate("/select-tenant");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-3">
      <div
        className="card border-0 shadow-sm rounded-4 w-100"
        style={{ maxWidth: "450px" }}
      >
        <div className="card-body p-4 p-md-5">
          {/* Header */}
          <div className="text-center mb-4">
            <div
              className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-4"
              style={{
                width: "60px",
                height: "60px",
                backgroundColor: "#eef2ff",
                color: "#6366f1",
              }}
            >
              <FiLogIn size={28} />
            </div>

            <h2 className="fw-bold mb-2">Welcome Back</h2>

            <p className="text-secondary mb-0">
              {location.state?.invitationToken
                ? "Login to accept your company invitation."
                : "Login to continue chatting with AI."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Email</label>

              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FiMail />
                </span>

                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Password</label>

              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FiLock />
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-control"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword((previous) => !previous)}
                  disabled={loading}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  />
                  {location.state?.invitationToken
                    ? "Accepting invitation..."
                    : "Logging in..."}
                </>
              ) : location.state?.invitationToken ? (
                "Login & Join Company"
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="text-center mt-4">
            <span className="text-secondary">
              Don't have an account?{" "}
            </span>

            <Link
              to="/register"
              className="text-decoration-none fw-semibold"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;