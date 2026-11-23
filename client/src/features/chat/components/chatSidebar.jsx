import {
  FiPlus,
  FiMessageSquare,
  FiChevronRight,
  FiLogOut,
  FiTrash2,
  FiFileText,
  FiUsers,
  FiMail,
  FiRepeat,
  FiBriefcase,
  FiShield,
  FiUser,
  FiX,
} from "react-icons/fi";

const ChatSidebar = ({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onLogout,
  onDeleteConversation,
  onOpenDocuments,
  onOpenEmployees,
  onOpenInvitations,
  onSwitchCompany,
  onCloseSidebar,
  companyName = "My Company",
  isAdmin = false,
}) => {
  const handleDelete = (e, conversationId) => {
    e.stopPropagation();
    onDeleteConversation(conversationId);
  };

  return (
    <aside className="chat-sidebar">
      <div className="px-3 py-3 border-bottom">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <FiBriefcase size={17} className="text-primary" />

            <small className="text-muted fw-semibold">COMPANY WORKSPACE</small>
          </div>

          <button
            type="button"
            className="btn btn-sm border-0"
            onClick={onCloseSidebar}
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="d-flex align-items-center justify-content-between gap-2">
          <div className="text-truncate">
            <div className="fw-semibold text-truncate" title={companyName}>
              {companyName}
            </div>
          </div>

          <span
            className={`badge rounded-pill ${
              isAdmin
                ? "bg-primary bg-opacity-10 text-white"
                : "bg-success bg-opacity-10 text-white"
            }`}
          >
            {isAdmin ? (
              <FiShield size={12} className="me-1" />
            ) : (
              <FiUser size={12} className="me-1" />
            )}

            {isAdmin ? "Admin" : "Employee"}
          </span>
        </div>

        {!isAdmin && (
          <button
            type="button"
            className="btn btn-outline-primary btn-sm w-100 mt-3 d-flex align-items-center justify-content-center gap-2"
            onClick={onSwitchCompany}
          >
            <FiRepeat size={15} />
            Switch Company
          </button>
        )}
      </div>

      <div className="new-chat-wrapper">
        <button type="button" className="new-chat-btn" onClick={onNewChat}>
          <span className="new-chat-icon">
            <FiPlus size={18} />
          </span>

          <span>New conversation</span>

          <FiChevronRight size={17} className="ms-auto" />
        </button>

        <button
          type="button"
          className="documents-btn"
          onClick={onOpenDocuments}
        >
          <FiFileText size={18} />
          <span>Documents</span>
          <FiChevronRight size={17} className="ms-auto" />
        </button>

        {isAdmin && (
          <>
            <button
              type="button"
              className="documents-btn"
              onClick={onOpenEmployees}
            >
              <FiUsers size={18} />
              <span>Employees</span>
              <FiChevronRight size={17} className="ms-auto" />
            </button>

            <button
              type="button"
              className="documents-btn"
              onClick={onOpenInvitations}
            >
              <FiMail size={18} />
              <span>Team Invitations</span>
              <FiChevronRight size={17} className="ms-auto" />
            </button>
          </>
        )}
      </div>

      <div className="conversation-area">
        <div className="conversation-heading">
          <span>Recent conversations</span>

          <span className="conversation-count">{conversations.length}</span>
        </div>

        <div className="conversation-list">
          {conversations.length === 0 ? (
            <div className="empty-conversations">
              <div className="empty-icon">
                <FiMessageSquare size={23} />
              </div>

              <h6>No conversations</h6>

              <p>Start a new conversation with your AI assistant.</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`conversation-item ${
                  activeConversationId === conversation.id ? "active" : ""
                }`}
                onClick={() => onSelectConversation(conversation.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSelectConversation(conversation.id);
                  }
                }}
              >
                <span className="conversation-icon">
                  <FiMessageSquare size={16} />
                </span>

                <span className="conversation-title">
                  {conversation.title || "New Chat"}
                </span>

                <button
                  type="button"
                  className="conversation-delete-btn"
                  title="Delete conversation"
                  aria-label="Delete conversation"
                  onClick={(e) => handleDelete(e, conversation.id)}
                >
                  <FiTrash2 size={15} />
                </button>

                {activeConversationId === conversation.id && (
                  <FiChevronRight size={15} className="conversation-arrow" />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="assistant-status">
          <div className="assistant-status-icon">
            <FiBriefcase size={16} />
          </div>

          <div className="assistant-status-text">
            <strong>AI Assistant</strong>

            <span>
              <i />
              Ready to help
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-light w-100 d-flex align-items-center gap-2 text-danger text-start border-0"
          onClick={onLogout}
        >
          <FiLogOut size={17} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default ChatSidebar;
