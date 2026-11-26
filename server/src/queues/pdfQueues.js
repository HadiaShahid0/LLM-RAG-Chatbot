import { Queue } from "bullmq";

import connection from "../config/queueRedis.js";

export const pdfQueue = new Queue("pdf-processing", {
  connection,
  defaultJobOptions: {
    attempts: 3,

    backoff: {
      type: "exponential",
      delay: 5000,
    },

    removeOnComplete: {
      age: 86400,
      count: 1000,
    },
    removeOnFail: {
      age: 604800,
    },
  },
});
