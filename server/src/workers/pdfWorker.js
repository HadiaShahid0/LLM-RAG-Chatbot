import { Worker } from "bullmq";

import connection from "../config/queueRedis.js";

import Document from "../models/documentModel.js";

import { processDocumentService } from "../services/documentServices.js";
const worker = new Worker(
  "pdf-processing",
  async (job) => {
    const { documentId, tenantId, userId } = job.data;

    console.log(`Processing PDF job ${job.id} for document ${documentId}`);

    const document = await Document.findOne({
      where: {
        id: documentId,
        tenantId,
        userId,
      },
    });

    if (!document) throw new Error("Document not found");

    if (document.status === "completed") {
      console.log(`Document ${documentId} is already completed`);

      return {
        success: true,
        message: "Document already processed",
      };
    }

    await document.update({
      status: "processing",
    });
    return await processDocumentService({
      documentId,
      tenantId,
      userId,
    });
  },
  {
    connection,
    concurrency: 2,
  },
);

worker.on("completed", (job) => {
  console.log(`PDF job ${job.id} completed successfully`);
});

worker.on("failed", async (job, error) => {
  if (!job) return;

  console.error(`PDF job ${job.id} failed: `, error.message);

  const maxAttempts = job.opts.attempts ?? 1;
  if (job.attemptsMade >= maxAttempts) {
    try {
      const { documentId, tenantId, userId } = job.data;
      await Document.update(
        { status: "failed" },
        {
          where: {
            id: documentId,
            tenantId,
            userId,
          },
        },
      );
      console.log(`Document ${documentId} marked as failed`);
    } catch (updatedError) {
      console.error("Failed to update document status: ", updatedError);
    }
  }
});

worker.on("error", (error) => {
  console.error("PDF worker error:", error);
});

console.log("PDF worker started and waiting for jobs...");

export default worker;
