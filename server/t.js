const loadDocuments = async () => {
  try {
    const data = await getDocumentsService();
    setDocuments(data);
  } catch (error) {
    console.error("Load documents error:", error);
  }
};

const handleDocumentUpload = async (files) => {
  setUploading(true);

  try {
    for (const file of files) {
      const document = await uploadDocumentService(file);

      setDocuments((previous) => [
        document,
        ...previous,
      ]);
    }

  } catch (error) {
    console.error("Document upload error:", error);
    alert(error.message);
  } finally {
    setUploading(false);
  }
};

const handleDocumentDelete = async (documentId) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this document?"
  );

  if (!confirmed) return;

  try {
    await deleteDocumentService(documentId);

    setDocuments((previous) =>
      previous.filter((doc) => doc.id !== documentId)
    );

  } catch (error) {
    console.error("Document delete error:", error);
    alert(error.message);
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

{currentPage === "documents" ? (
  <DocumentsPage
    documents={documents}
    onUpload={handleDocumentUpload}
    onDelete={handleDocumentDelete}
    uploading={uploading}
  />
) : (
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

retrieveRelevantChunksService({
  question,
  userId: req.user.id,
  topK: 5,
});