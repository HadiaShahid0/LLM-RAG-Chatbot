import { useRef, useState } from "react";
import {
  FiUploadCloud,
  FiFileText,
  FiTrash2,
  FiSearch,
  FiMoreVertical,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiX,
} from "react-icons/fi";
import "./documentPage.css";
const DocumentsPage = ({
  documents = [],
  onUpload,
  onDelete,
  uploading = false,
}) => {
  const fileInputRef = useRef(null);
  const [search, setSearch] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}  KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date) => {
    if (!date) return N / A;
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleFileUpload = (files) => {
    const pdfFiles = Array.from(files).filter(
      (file) => file.type === "application/pdf",
    );
    setSelectedFiles((prev) => [...prev, ...pdfFiles]);
    setSuccessMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };
  const handleUpload = async () => {
    if (!selectedFiles.length || uploading) return;

    try {
      await onUpload?.(selectedFiles);

      setSelectedFiles([]);
      setSuccessMessage("PDF uploaded successfully!");
    } catch (error) {
      setSuccessMessage("");
      alert(error.message || "Failed to upload PDF");
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

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
          label: "Failes",
        };
      default:
        return {
          icon: <FiClock />,
          className: "status-processing",
          label: "Processing",
        };
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.fileName?.toLowerCase().includes(search.toLowerCase()),
  );

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

        <p>Drag and drop your PDF files here, or browse your computer.</p>

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

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="selected-files-section">
          <h5>Selected Files</h5>

          {selectedFiles.map((file, index) => (
            <div className="selected-file-item" key={`${file.name}-${index}`}>
              <div className="document-name-cell">
                <div className="document-pdf-icon">
                  <FiFileText size={21} />
                </div>

                <div>
                  <strong>{file.name}</strong>
                  <small>{formatFileSize(file.size)}</small>
                </div>
              </div>

              <button
                type="button"
                className="document-delete-btn"
                onClick={() => removeSelectedFile(index)}
                disabled={uploading}
                title="Remove file"
              >
                <FiX size={17} />
              </button>
            </div>
          ))}

          <button
            type="button"
            className="upload-btn mt-3"
            onClick={handleUpload}
            disabled={uploading}
          >
            <FiUploadCloud size={17} />
            {uploading ? "Uploading..." : "Upload PDF"}
          </button>
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

          <div className="document-search">
            <FiSearch size={17} />

            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button type="button" onClick={() => setSearch("")}>
                <FiX size={16} />
              </button>
            )}
          </div>
        </div>

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
          <div className="documents-table-wrapper">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>DOCUMENT</th>
                  <th>FILE SIZE</th>
                  <th>UPLOADED</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {filteredDocuments.map((doc) => {
                  const status = getStatus(doc.status);

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
                        <span className={`document-status ${status.className}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="document-delete-btn"
                          title="Delete document"
                          onClick={() => onDelete?.(doc.id)}
                        >
                          <FiTrash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
