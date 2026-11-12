import { useState } from "react";
import { useEffect, useRef } from "react";
import {
  FiUser,
  FiStar,
  FiCode,
  FiBookOpen,
  FiHelpCircle,
  FiFile,
  FiCheck,
  FiCopy,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

import ReactMarkdown from "react-markdown";

import remarkGfm from "remark-gfm";

const MessageList = ({ messages, loading, onRegenerate, onSwitchVersion }) => {
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleCopy = async (message) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (error) {
      console.error("Copy error", error);
    }
  };

  const handleRegenerateResponse = (index) => {
    if (loading || !onRegenerate) return;

    const assistantMessage = messages[index];

    const userMessage = [...messages.slice(0, index)]
      .reverse()
      .find((message) => message.role === "user");

    if (!userMessage) return;

    onRegenerate(userMessage, assistantMessage);
  };

  if (messages.length === 0) {
    return (
      <div className="welcome-screen">
        <div className="welcome-content">
          <div className="welcome-ai-icon">
            <FiStar size={30} />
          </div>

          <div className="welcome-badge">
            <span />
            AI Assistant
          </div>

          <h1>
            How can I help
            <span> you today?</span>
          </h1>

          <p>
            Ask questions, solve problems, explain concepts, or get help with
            your code.
          </p>

          <div className="suggestion-grid">
            <button type="button" className="suggestion-card">
              <div className="suggestion-icon">
                <FiBookOpen size={19} />
              </div>

              <div>
                <strong>Explain a concept</strong>
                <span>Explain JWT in simple English</span>
              </div>
            </button>

            <button type="button" className="suggestion-card">
              <div className="suggestion-icon">
                <FiCode size={19} />
              </div>

              <div>
                <strong>Help with code</strong>
                <span>How do React protected routes work?</span>
              </div>
            </button>

            <button type="button" className="suggestion-card">
              <div className="suggestion-icon">
                <FiHelpCircle size={19} />
              </div>

              <div>
                <strong>Debug an issue</strong>
                <span>Why is my API returning 401?</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-scroll" ref={messagesContainerRef}>
      <div className="messages-content">
        {messages.map((message, index) => {
          const isUser = message.role === "user";

          const versions = message.versions || [message.content || ""];
          const currentVersion = message.currentVersion || 0;
          const currentContent = versions[currentVersion] || "";

          return (
            <div
              key={message.id}
              className={`message-row ${
                isUser ? "user-message-row" : "assistant-message-row"
              }`}
            >
              <div
                className={`message-avatar ${
                  isUser ? "user-avatar" : "assistant-avatar"
                }`}
              >
                {isUser ? <FiUser size={17} /> : <FiStar size={17} />}
              </div>

              <div className="message-body">
                <div className="message-meta">
                  <strong>{isUser ? "You" : "AI Assistant"}</strong>

                  {!isUser && <span>AI</span>}
                </div>

                <div
                  className={`message-bubble ${
                    isUser ? "user-bubble" : "assistant-bubble"
                  }`}
                >
                  {isUser ? (
                    <>
                      {(message.file || message.filePath) && (
                        <div className="chat-attachment">
                          {message.fileType?.startsWith("image/jpeg") ? (
                            <img
                              src={
                                message.file
                                  ? URL.createObjectURL(message.file)
                                  : message.filePath
                              }
                              alt={message.fileName || "Uploaded image"}
                              className="chat-image-preview"
                            />
                          ) : (
                            <div className="chat-file-preview">
                              <FiFile size={22} />

                              <div>
                                <strong>
                                  {message.fileName || "Uploaded file"}
                                </strong>

                                <small>
                                  {message.fileType === "application/pdf"
                                    ? "PDF Document"
                                    : message.fileType || "File"}
                                </small>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {message.content && (
                        <div
                          className={
                            message.file || message.fileUrl ? "mt-2" : ""
                          }
                        >
                          {message.content}
                        </div>
                      )}
                    </>
                  ) : currentContent ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {currentContent}
                    </ReactMarkdown>
                  ) : loading &&
                    message.id === messages[messages.length - 1]?.id ? (
                    <div className="typing-bubble">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : null}
                </div>
                {message.status === "interrupted" && (
                  <div className="interrupted-message">
                    <span>Response interrupted</span>
                  </div>
                )}
                {!isUser && currentContent && !loading && (
                  <div className="message-action-btn">
                    <button
                      type="button"
                      className="message-action-btn"
                      onClick={() =>
                        handleCopy({ ...message, content: currentContent })
                      }
                      title="Copy Response"
                      aria-label="Copy Response"
                    >
                      {copiedId === message.id ? (
                        <FiCheck size={15} />
                      ) : (
                        <FiCopy size={15} />
                      )}
                    </button>
                    <button
                      type="button"
                      className="message-action-btn"
                      onClick={() => handleRegenerateResponse(index)}
                      disabled={loading || !onRegenerate}
                      title="Regenerate Response"
                      aria-label="Regenerate Response"
                    >
                      <FiRefreshCw size={15} />
                    </button>
                    {versions.length > 1 && (
                      <div className="version-navigation">
                        <button
                          type="button"
                          className="version-arrow"
                          disabled={currentVersion === 0}
                          onClick={() =>
                            onSwitchVersion(message.id, currentVersion - 1)
                          }
                          title="Previous Response"
                          aria-label="Previous Response"
                        >
                          <FiChevronLeft size={16} />
                        </button>

                        <span>
                          {currentVersion + 1}/{versions.length}
                        </span>

                        <button
                          type="button"
                          className="version-arrow"
                          disabled={currentVersion === versions.length - 1}
                          onClick={() =>
                            onSwitchVersion(message.id, currentVersion + 1)
                          }
                          title="Next response"
                          aria-label="Next Response"
                        >
                          <FiChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default MessageList;
