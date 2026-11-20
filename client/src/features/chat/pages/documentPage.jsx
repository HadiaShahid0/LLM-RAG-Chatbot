import { useEffect, useRef, useState } from "react";

import {
  FiUploadCloud,
  FiFileText,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiX,
  FiShield,
  FiUsers,
  FiLock,
  FiGlobe,
} from "react-icons/fi";

import "./documentPage.css";

import ManageDocumentAccess from "../components/documents/manageDocumentAccess";
import { getTenantEmployees } from "../services/tenantService.js";

const DocumentsPage = ({
  documents = [],
  onUpload,
  onDelete,
  uploading = false,
  isAdmin = false,
}) => {
  const fileInputRef = useRef(null);
  const uploadInProgressRef = useRef(false);

  // General states
  const [search, setSearch] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadVisibility, setUploadVisibility] = useState("private");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

  // Employee states
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Load active employees when upload modal opens
  useEffect(() => {
    if (!showUploadModal) return;

    const loadEmployees = async () => {
      try {
        setLoadingEmployees(true);

        const data = await getTenantEmployees();

        setEmployees(data || []);
      } catch (error) {
        console.error("Failed to load employees:", error);
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, [showUploadModal]);

  // Handle file selection
  const handleFileUpload = (files) => {
    const selected = Array.from(files || []);

    const pdfFiles = selected.filter(
      (file) => file.type === "application/pdf",
    );

    if (pdfFiles.length === 0) {
      alert("Please select valid PDF files.");
      return;
    }

    setSelectedFiles((prev) => {
      const newFiles = pdfFiles.filter(
        (file) =>
          !prev.some(
            (existing) =>
              existing.name === file.name &&
              existing.size === file.size &&
              existing.lastModified === file.lastModified,
          ),
      );

      return [...prev, ...newFiles];
    });

    setUploadVisibility("private");
    setSelectedEmployeeIds([]);
    setSuccessMessage("");
    setShowUploadModal(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove selected file
  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Close upload modal
  const closeUploadModal = () => {
    if (uploading || uploadInProgressRef.current) return;

    setShowUploadModal(false);
    setSelectedFiles([]);
    setSelectedEmployeeIds([]);
    setUploadVisibility("private");
  };

  // Handle selected employee changes
  const handleEmployeeChange = (userId) => {
    const id = String(userId);

    setSelectedEmployeeIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((selectedId) => selectedId !== id);
      }

      return [...prev, id];
    });
  };

  // Upload files with visibility settings
  const handleUpload = async () => {
    if (
      !selectedFiles.length ||
      uploading ||
      uploadInProgressRef.current
    ) {
      return;
    }

    if (
      uploadVisibility === "selected" &&
      selectedEmployeeIds.length === 0
    ) {
      alert("Please select at least one employee.");
      return;
    }

    uploadInProgressRef.current = true;

    try {
      await onUpload?.(selectedFiles, {
        visibility: uploadVisibility,
        permissions:
          uploadVisibility === "selected"
            ? selectedEmployeeIds.map(Number)
            : [],
      });

      setSelectedFiles([]);
      setSelectedEmployeeIds([]);
      setUploadVisibility("private");
      setShowUploadModal(false);

      setSuccessMessage("PDF uploaded successfully!");
    } catch (error) {
      setSuccessMessage("");
      alert(error.message || "Failed to upload PDF.");
    } finally {
      uploadInProgressRef.current = false;
    }
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    handleFileUpload(e.dataTransfer.files);
  };

  // Document status
  const getStatus = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          icon: <FiCheckCircle />,
          className: "status-completed",
          label: "Completed",
        };

      case "failed":
        return {
          icon: <FiAlertCircle />,
          className: "status-failed",
          label: "Failed",
        };

      default:
        return {
          icon: <FiClock />,
          className: "status-processing",
          label: "Processing",
        };
    }
  };

  // Search documents
  const filteredDocuments = documents.filter((doc) =>
    doc.fileName?.toLowerCase().includes(search.toLowerCase()),
  );

  // Check whether the action column is needed
  const showActionColumn =
    isAdmin || filteredDocuments.some((doc) => doc.isOwner);

  return (
    <div className="documents-page">
      {/* Page Header */}
      <div className="documents-header">
        <div>
          <h2>My Documents</h2>
          <p>Manage your uploaded documents for AI conversations.</p>
        </div>

        <div className="documents-total">
          <span>{documents.length} Documents</span>
        </div>
      </div>

      {/* Upload Section */}
      <div
        className={`document-upload-box ${isDragging ? "dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="upload-icon">
          <FiUploadCloud size={30} />
        </div>

        <h5>Upload your documents</h5>

        <p>
          Drag and drop your PDF files here, or browse your computer.
        </p>

        <button
          type="button"
          className="upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <FiUploadCloud size={17} />
          Browse Files
        </button>

        <small>Supported format: PDF</small>

        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,application/pdf"
          multiple
          hidden
          onChange={(e) => handleFileUpload(e.target.files)}
        />
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow rounded-4">
              {/* Modal Header */}
              <div className="modal-header px-4">
                <div>
                  <h5 className="modal-title fw-bold">
                    Upload Documents
                  </h5>

                  <small className="text-muted">
                    Review your files and configure document access.
                  </small>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={closeUploadModal}
                  disabled={uploading}
                />
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4">
                {/* Selected Files */}
                <h6 className="fw-semibold mb-3">
                  Selected Files ({selectedFiles.length})
                </h6>

                <div className="border rounded-3 p-3 mb-4">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="d-flex align-items-center justify-content-between py-2"
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div className="document-pdf-icon">
                          <FiFileText size={21} />
                        </div>

                        <div>
                          <strong>{file.name}</strong>

                          <small className="d-block text-muted">
                            {formatFileSize(file.size)}
                          </small>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="document-delete-btn"
                        title="Remove file"
                        onClick={() => removeSelectedFile(index)}
                        disabled={uploading}
                      >
                        <FiX size={17} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Document Access */}
                <h6 className="fw-semibold mb-3">
                  <FiShield className="me-2" />
                  Document Access
                </h6>

                <div className="d-flex flex-column gap-2">
                  {/* Private */}
                  <label
                    className={`border rounded-3 p-3 d-flex gap-3 align-items-center ${
                      uploadVisibility === "private"
                        ? "border-primary bg-light"
                        : ""
                    }`}
                    style={{ cursor: "pointer" }}
                  >
                    <input
                      type="radio"
                      className="form-check-input"
                      name="uploadVisibility"
                      value="private"
                      checked={uploadVisibility === "private"}
                      onChange={() => setUploadVisibility("private")}
                    />

                    <FiLock size={21} className="text-primary" />

                    <div>
                      <div className="fw-semibold">Private</div>

                      <small className="text-muted">
                        Only the uploader and workspace admins can access
                        this document.
                      </small>
                    </div>
                  </label>

                  {/* All Employees */}
                  <label
                    className={`border rounded-3 p-3 d-flex gap-3 align-items-center ${
                      uploadVisibility === "employee"
                        ? "border-primary bg-light"
                        : ""
                    }`}
                    style={{ cursor: "pointer" }}
                  >
                    <input
                      type="radio"
                      className="form-check-input"
                      name="uploadVisibility"
                      value="employee"
                      checked={uploadVisibility === "employee"}
                      onChange={() => setUploadVisibility("employee")}
                    />

                    <FiGlobe size={21} className="text-primary" />

                    <div>
                      <div className="fw-semibold">All Employees</div>

                      <small className="text-muted">
                        All active employees in this workspace can access
                        this document.
                      </small>
                    </div>
                  </label>

                  {/* Admin Only - Employee Dashboard */}
                  {!isAdmin && (
                    <label
                      className={`border rounded-3 p-3 d-flex gap-3 align-items-center ${
                        uploadVisibility === "admin"
                          ? "border-primary bg-light"
                          : ""
                      }`}
                      style={{ cursor: "pointer" }}
                    >
                      <input
                        type="radio"
                        className="form-check-input"
                        name="uploadVisibility"
                        value="admin"
                        checked={uploadVisibility === "admin"}
                        onChange={() => setUploadVisibility("admin")}
                      />

                      <FiShield size={21} className="text-primary" />

                      <div>
                        <div className="fw-semibold">Admin Only</div>

                        <small className="text-muted">
                          Only the uploader and workspace admins can access
                          this document.
                        </small>
                      </div>
                    </label>
                  )}

                  {/* Selected Employees */}
                  <label
                    className={`border rounded-3 p-3 d-flex gap-3 align-items-center ${
                      uploadVisibility === "selected"
                        ? "border-primary bg-light"
                        : ""
                    }`}
                    style={{ cursor: "pointer" }}
                  >
                    <input
                      type="radio"
                      className="form-check-input"
                      name="uploadVisibility"
                      value="selected"
                      checked={uploadVisibility === "selected"}
                      onChange={() => setUploadVisibility("selected")}
                    />

                    <FiUsers size={21} className="text-primary" />

                    <div>
                      <div className="fw-semibold">
                        Selected Employees
                      </div>

                      <small className="text-muted">
                        Only selected employees, the uploader, and
                        workspace admins can access this document.
                      </small>
                    </div>
                  </label>
                </div>

                {/* Selected Employees */}
                {uploadVisibility === "selected" && (
                  <div className="mt-4">
                    <h6 className="fw-semibold mb-2">
                      Select Employees
                    </h6>

                    <p className="text-muted small">
                      Choose which active employees can access this
                      document.
                    </p>

                    {loadingEmployees ? (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm" />

                        <span className="ms-2">
                          Loading employees...
                        </span>
                      </div>
                    ) : employees.length === 0 ? (
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
                            className="border rounded-3 p-3 mb-2"
                          >
                            <label className="d-flex align-items-center gap-3">
                              <input
                                type="checkbox"
                                className="form-check-input"
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

              {/* Modal Footer */}
              <div className="modal-footer px-4">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={closeUploadModal}
                  disabled={uploading}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-primary px-4"
                  onClick={handleUpload}
                  disabled={
                    uploading ||
                    selectedFiles.length === 0 ||
                    loadingEmployees ||
                    (uploadVisibility === "selected" &&
                      selectedEmployeeIds.length === 0)
                  }
                >
                  <FiUploadCloud className="me-2" />

                  {uploading ? "Uploading..." : "Upload Documents"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="upload-success-message">
          <FiCheckCircle size={18} />
          {successMessage}
        </div>
      )}

      {/* Uploaded Documents */}
      <div className="documents-list-section">
        <div className="documents-list-header">
          <div>
            <h5>Uploaded Documents</h5>

            <span>{documents.length} files in your workspace</span>
          </div>

          {/* Search */}
          <div className="document-search">
            <FiSearch size={17} />

            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
              >
                <FiX size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {filteredDocuments.length === 0 ? (
          <div className="documents-empty">
            <div className="empty-document-icon">
              <FiFileText size={30} />
            </div>

            <h6>
              {documents.length === 0
                ? "No documents uploaded yet"
                : "No documents found"}
            </h6>

            <p>
              {documents.length === 0
                ? "Upload your first PDF to start using document-based AI conversations."
                : "Try searching with a different document name."}
            </p>
          </div>
        ) : (
          /* Documents Table */
          <div className="documents-table-wrapper">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>DOCUMENT</th>
                  <th>FILE SIZE</th>
                  <th>UPLOADED</th>
                  <th>STATUS</th>

                  {showActionColumn && <th>ACTION</th>}
                </tr>
              </thead>

              <tbody>
                {filteredDocuments.map((doc) => {
                  const status = getStatus(doc.status);

                  // Admin can manage all documents.
                  // Employees can manage their own documents.
                  const canManage = isAdmin || doc.isOwner;

                  return (
                    <tr key={doc.id}>
                      <td>
                        <div className="document-name-cell">
                          <div className="document-pdf-icon">
                            <FiFileText size={21} />
                          </div>

                          <div>
                            <strong>{doc.fileName}</strong>
                            <small>PDF Document</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="document-size">
                          {formatFileSize(doc.fileSize || 0)}
                        </span>
                      </td>

                      <td>
                        <span className="document-date">
                          {formatDate(doc.createdAt)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`document-status ${status.className}`}
                        >
                          {status.icon}
                          {status.label}
                        </span>
                      </td>

                      {/* Actions */}
                      {showActionColumn && (
                        <td>
                          {canManage && (
                            <div className="d-flex align-items-center">
                              {/* Manage Document Access */}
                              <button
                                type="button"
                                className="document-delete-btn me-2"
                                title="Manage document access"
                                onClick={() => setSelectedDocument(doc)}
                              >
                                <FiShield size={17} />
                              </button>

                              {/* Delete Document */}
                              <button
                                type="button"
                                className="document-delete-btn"
                                title="Delete document"
                                onClick={() => onDelete?.(doc.id)}
                              >
                                <FiTrash2 size={17} />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manage Existing Document Access */}
      {selectedDocument && (
        <ManageDocumentAccess
          document={selectedDocument}
          isAdmin={isAdmin}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
};

export default DocumentsPage;