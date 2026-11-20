import { useEffect, useState } from "react";
import {
  getTenantEmployees,
  getDocumentAccess,
  updateDocumentVisibility,
} from "../../services/tenantService.js";

const ManageDocumentAccess = ({ document, onClose }) => {
  const [employees, setEmployees] = useState([]);
  const [visibility, setVisibility] = useState("employee");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAccessData = async () => {
      try {
        setLoading(true);
        setError("");

        const [employeeList, accessData] = await Promise.all([
          getTenantEmployees(),
          getDocumentAccess(document.id),
        ]);

        setEmployees(employeeList);
        setVisibility(accessData.document.visibility);

        // Get only the selected employee IDs.
        setSelectedEmployeeIds(
          accessData.permissions.map((permission) =>
            String(permission.userId ?? permission),
          ),
        );
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadAccessData();
  }, [document.id]);

  const handleEmployeeChange = (userId) => {
    setSelectedEmployeeIds((prev) => {
      const id = String(userId);

      if (prev.includes(id)) {
        return prev.filter((selectedId) => selectedId !== id);
      }

      return [...prev, id];
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const permissions =
        visibility === "selected" ? selectedEmployeeIds : [];

      await updateDocumentVisibility(
        document.id,
        visibility,
        permissions,
      );

      alert("Document access updated successfully!");
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="modal d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content p-4 text-center">
            Loading access settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal d-block" tabIndex="-1">
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Manage Document Access</h5>

            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={saving}
            />
          </div>

          <div className="modal-body">
            <h6>{document.fileName}</h6>

            {error && (
              <div className="alert alert-danger">{error}</div>
            )}

            <label className="form-label mt-3">
              Document Visibility
            </label>

            <select
              className="form-select"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="private">
                Private (Uploader and Admin)
              </option>

              <option value="employee">
                All Employees
              </option>

              <option value="selected">
                Selected Employees
              </option>
            </select>

            {visibility === "selected" && (
              <div className="mt-4">
                <h6>Select Employees</h6>

                <p className="text-muted small">
                  Only the selected employees, document uploader,
                  and workspace admin can access this document.
                </p>

                {employees.length === 0 ? (
                  <p className="text-muted">
                    No active employees found.
                  </p>
                ) : (
                  employees.map((employee) => {
                    const isSelected = selectedEmployeeIds.includes(
                      String(employee.id),
                    );

                    return (
                      <div
                        key={employee.id}
                        className="border rounded p-3 mb-2"
                      >
                        <label className="d-flex align-items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              handleEmployeeChange(employee.id)
                            }
                          />

                          <div>
                            <strong>{employee.username}</strong>

                            <small className="d-block text-muted">
                              {employee.email}
                            </small>
                          </div>
                        </label>
                      </div>
                    );
                  })
                )}

                <small className="text-muted">
                  {selectedEmployeeIds.length} employee(s) selected.
                </small>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={
                saving ||
                (visibility === "selected" &&
                  selectedEmployeeIds.length === 0)
              }
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageDocumentAccess;