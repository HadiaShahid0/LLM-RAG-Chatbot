import { useEffect, useState, useRef } from "react";

import {
  getConversationsServices,
  createConversationServices,
  getMessagesServices,
  sendMessageServices,
  logoutServices,
  regenerateMessageServices,
  deleteConversationService,
} from "../services/chatServices";

import ChatSidebar from "../components/chatSidebar";
import MessageList from "../components/messageList";
import MessageInput from "../components/messageInput";
import DocumentsPage from "./documentPage";
import "./chatPage.css";

import { FiMenu } from "react-icons/fi";

import {
  getDocumentsService,
  uploadDocumentService,
  deleteDocumentService,
} from "../services/documentService.js";
const ChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState("chat");

  const abortControllerRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutServices();

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const loadConversations = async () => {
    try {
      const conversations = await getConversationsServices();

      setConversations(conversations);

      if (conversations.length > 0) {
        setActiveConversationId(conversations[0].id);

        await loadMessages(conversations[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const messages = await getMessagesServices(conversationId);

      console.log("Loaded messages:", messages);

      setMessages(messages);
    } catch (error) {
      console.error(error);
      setMessages([]);
    }
  };

  const handleNewChat = async () => {
    try {
      const conversation = await createConversationServices();

      setConversations((previous) => [conversation, ...previous]);

      setActiveConversationId(conversation.id);
      setMessages([]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectConversation = async (conversationId) => {
    setActiveConversationId(conversationId);

    await loadMessages(conversationId);
  };

  const handleDeleteConversation = async (conversationId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this comversation?",
    );
    if (!confirmed) return;

    try {
      await deleteConversationService(conversationId);
      const updatedConversations = conversations.filter(
        (conversation) => conversation.id !== conversationId,
      );

      setConversations(updatedConversations);

      if (activeConversationId === conversationId) {
        if (updatedConversations.length > 0) {
          const nextConversation = updatedConversations[0];
          setActiveConversationId(nextConversation.id);
          await loadMessages(nextConversation.id);
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Delete conversation error", error);
    }
  };

  const handleSendMessage = async (content, file, selectedModel) => {
    if ((!content.trim() && !file) || !activeConversationId || loading) {
      return;
    }
    const conversationId = activeConversationId;
    const userContent = content.trim();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const userMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userContent,
      model: selectedModel,
      file: file || null,
      fileName: file?.name || null,
      fileType: file?.type || null,
    };

    const assistantMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content: "",
      versions: [""],
      currentVersion: 0,
    };

    setMessages((previous) => [...previous, userMessage, assistantMessage]);

    setLoading(true);

    try {
      await sendMessageServices(
        conversationId,
        userContent,
        file,
        selectedModel,
        (chunk) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessage.id
                ? {
                    ...message,
                    content: message.content + chunk,
                  }
                : message,
            ),
          );
        },
        controller.signal,
      );
      if (activeConversationId === conversationId) {
        await loadConversations();
        await loadMessages(conversationId);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantMessage.id
              ? {
                  ...message,
                  status: "interrupted",
                }
              : message,
          ),
        );
      } else {
        console.error("Send message error:", error);
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  const handleStopGeneration = () => {
    abortControllerRef.current?.abort();
  };

  const handleRegenerate = async (userMessage, assistantMessage) => {
    if (!activeConversationId || loading) return;

    const conversationId = activeConversationId;

    const versions = assistantMessage.versions || [
      assistantMessage.content || "",
    ];
    const newVersionIndex = versions.length;
    setLoading(true);

    setMessages((prev) =>
      prev.map((message) =>
        message.id === assistantMessage.id
          ? {
              ...message,
              versions: [...versions, ""],
              currentVersion: newVersionIndex,
            }
          : message,
      ),
    );
    let generatedContent = "";
    try {
      await regenerateMessageServices(
        conversationId,
        userMessage.id,
        userMessage.model || "gemini",
        (chunk) => {
          generatedContent += chunk;
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessage.id
                ? {
                    ...message,
                    versions: message.versions.map((version, index) =>
                      index === newVersionIndex ? generatedContent : version,
                    ),
                  }
                : message,
            ),
          );
        },
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                versions: message.versions.filter(
                  (_, index) => index !== newVersionIndex,
                ),
                currentVersion: Math.max(0, newVersionIndex - 1),
              }
            : message,
        ),
      );
      console.log("Regenerate message error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchVersion = (messageId, versionIndex) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? {
              ...message,
              currentVersion: versionIndex,
            }
          : message,
      ),
    );
  };

  const loadDocuments = async () => {
    try {
      const data = await getDocumentsService();
      setDocuments(data);
    } catch (error) {
      console.error("Load Documents error", error);
    }
  };

  const handleDocumentUpload = async (files) => {
    setUploading(true);
    try {
      for (const file of files) {
        const document = await uploadDocumentService(file);
        setDocuments((prev) => [document, ...prev]);
      }
    } catch (error) {
      console.error("Document upload error: ", error);
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentDelete = async (documentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this document",
    );
    if (!confirmed) return;
    try {
      await deleteDocumentService(documentId)
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (error) {
      console.error("Document delete error: ", error);
    }
  };
  useEffect(() => {
  if (currentPage !== "documents") return;

  loadDocuments();
}, [currentPage]);

useEffect(() => {
  if (currentPage !== "documents") return;

  const interval = setInterval(() => {
    loadDocuments();
  }, 3000);

  return () => clearInterval(interval);
}, [currentPage]);
  if (initialLoading) {
    return (
      <div className="chat-loading vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="ai-loading-icon mb-3">✦</div>

          <div className="spinner-border text-primary mb-3" />

          <p className="text-muted mb-0">Preparing your AI workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-page ${sidebarOpen ? "" : "sidebar-closed"}`}>
      {/* Sidebar */}
      {sidebarOpen && (
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={(id) => {
            setCurrentPage("chat");
            handleSelectConversation(id);
          }}
          onNewChat={() => {
            setCurrentPage("chat");
            handleNewChat();
          }}
          onLogout={handleLogout}
          onDeleteConversation={handleDeleteConversation}
          onCloseSidebar={() => setSidebarOpen(false)}
          onOpenDocuments={() => setCurrentPage("documents")}
        />
      )}

      {/* Main Content */}
      <main className="chat-main">
        {/* Open Sidebar Button */}
        {!sidebarOpen && (
          <button
            type="button"
            className="sidebar-open-btn"
            onClick={() => setSidebarOpen(true)}
            title="Open sidebar"
            aria-label="Open sidebar"
          >
            <FiMenu size={21} />
          </button>
        )}

        {/* Documents Page */}
        {currentPage === "documents" ? (
          <DocumentsPage
            documents={documents}
            onUpload={handleDocumentUpload}
            onDelete={handleDocumentDelete}
            uploading={uploading}
          />
        ) : (
          /* Chat Page */
          <>
            <div className="chat-messages">
              <MessageList
                messages={messages}
                loading={loading}
                onRegenerate={handleRegenerate}
                onSwitchVersion={handleSwitchVersion}
              />
            </div>

            <MessageInput
              onSend={handleSendMessage}
              onStop={handleStopGeneration}
              disabled={loading}
            />
          </>
        )}
      </main>
    </div>
  );
};
export default ChatPage;
