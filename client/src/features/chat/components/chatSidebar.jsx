import {
  FiPlus,
  FiMessageSquare,
  FiStar,
  FiChevronRight,
  FiLogOut,
  FiTrash2,
  FiX
} from "react-icons/fi";

const ChatSidebar = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onLogout,
  onDeleteConversation,
  onCloseSidebar,
}) => {
  const handleDelete=(e,conversationId)=>{
    e.stopPropagation()
    onDeleteConversation(conversationId)
  }

 return (
    <aside className="chat-sidebar ">
      {/* Sidebar Header */}
      <div className="sidebar-brand">
        <div className="brand-left p-2">
          <div className="brand-icon">
            <FiStar size={19} />
          </div>

          <div>
            <h5>AI Chat</h5>
            <small>Your AI workspace</small>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-close-btn"
          onClick={onCloseSidebar}
          title="Close sidebar"
        >
          <FiX size={20} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="new-chat-wrapper">
        <button
          type="button"
          className="new-chat-btn"
          onClick={onNewChat}
        >
          <span className="new-chat-icon">
            <FiPlus size={18} />
          </span>

          <span>New conversation</span>

          <FiChevronRight size={17} className="ms-auto" />
        </button>
      </div>

      {/* Conversation List */}
      <div className="conversation-area">
        <div className="conversation-heading">
          <span>Recent conversations</span>

          <span className="conversation-count">
            {conversations.length}
          </span>
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
                  <FiChevronRight
                    size={15}
                    className="conversation-arrow"
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="assistant-status">
          <div className="assistant-status-icon">
            <FiStar size={16} />
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
