import { useState } from "react";
import { FiUser, FiLock, FiUserPlus } from "react-icons/fi";

const CreateEmployeeAccountPage = ({
  invitation,
  onSubmit,
  loading,
  error,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return;
    }

    onSubmit({ username, password });
  };

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4 p-md-5">
        <div className="text-center mb-4">
          <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex p-3 mb-3">
            <FiUserPlus size={28} />
          </div>

          <h3 className="fw-bold mb-2">Create Your Account</h3>

          <p className="text-secondary mb-0">
            Join <strong>{invitation.companyName}</strong> as an employee.
          </p>
        </div>

        <div className="bg-light rounded-3 p-3 mb-4">
          <small className="text-secondary d-block mb-1">
            Invitation email
          </small>
          <div className="fw-semibold">{invitation.email}</div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-medium">Username</label>

            <div className="input-group">
              <span className="input-group-text bg-light">
                <FiUser />
              </span>

              <input
                type="text"
                className="form-control"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-medium">Password</label>

            <div className="input-group">
              <span className="input-group-text bg-light">
                <FiLock />
              </span>

              <input
                type="password"
                className="form-control"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-medium">Confirm Password</label>

            <div className="input-group">
              <span className="input-group-text bg-light">
                <FiLock />
              </span>

              <input
                type="password"
                className="form-control"
                placeholder="Enter password again"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            {confirmPassword && password !== confirmPassword && (
              <small className="text-danger">Passwords do not match.</small>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2"
            disabled={
              loading ||
              !username.trim() ||
              password.length < 8 ||
              password !== confirmPassword
            }
          >
            {loading ? "Creating account..." : "Create Account & Join"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEmployeeAccountPage;
