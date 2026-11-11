export const evaluationDataset = [
  {
    id: 1,
    question: "What technologies were used in the Facebook Clone?",
    expectedAnswer:
      "The Facebook Clone uses React.js, Supabase, PostgreSQL, Supabase Auth, Supabase Realtime, Supabase Storage, RLS, and Bootstrap 5.",
    relevantChunkIds: ["document=1-chunk-1", "document=1-chunk-2"],
    shouldAbstain: false,
  },
  {
    id: 2,
    question: "List all projects in the resume.",
    expectedAnswer:
      "The four projects are Facebook Clone, Real-Time Chat Application, Task Management System, and ResumEase.",
    relevantChunkIds: [
      "document=1-chunk-2",
      "document=1-chunk-3",
      "document=1-chunk-4",
      "document=1-chunk-5",
    ],
    shouldAbstain: false,
  },
  {
    id: 3,
    question: "Which database is used in ResumEase?",
    expectedAnswer: "ResumEase uses SQLite.",
    relevantChunkIds: ["document=1-chunk-5"],
    shouldAbstain: false,
  },
  {
    id: 4,
    question: "What is the person's monthly salary?",
    expectedAnswer:
      "The resume does not provide the person's monthly salary.",
    relevantChunkIds: [],
    shouldAbstain: true,
  },
  {
    id: 5,
    question: "Which CSS framework was used in the Facebook Clone?",
    expectedAnswer: "The Facebook Clone uses Bootstrap 5.",
    relevantChunkIds: ["document=1-chunk-1", "document=1-chunk-2"],
    shouldAbstain: false,
  },
  {
    id: 6,
    question:
      "Which technologies were used to build the Real-Time Chat Application?",
    expectedAnswer:
      "The Real-Time Chat Application uses React.js, Node.js, Express.js, MongoDB, Mongoose, Socket.IO, WebRTC, and JWT.",
    relevantChunkIds: ["document=1-chunk-3", "document=1-chunk-4"],
    shouldAbstain: false,
  },
  {
    id: 7,
    question: "What features does ResumEase provide?",
    expectedAnswer:
      "ResumEase provides resume uploading, candidate information extraction, skill matching, candidate shortlisting based on education, skills, and professional experience, interview scheduling support, and responsive dashboards.",
    relevantChunkIds: ["document=1-chunk-5"],
    shouldAbstain: false,
  },
  {
    id: 8,
    question: "What educational qualifications are mentioned in the resume?",
    expectedAnswer:
      "The resume lists a Bachelor of Information Engineering Technology from Superior University, Lahore, Pakistan, completed from 2021 to 2025, with a CGPA of 3.48/4.00. It also lists JavaScript Full Stack / Web Development certification from NAVTTC, AI Fundamentals certification from Cisco / IBM SkillsBuild, and an Advanced Certification in JavaScript & Full Stack Development (MEAN-MERN).",
    relevantChunkIds: ["document=1-chunk-5", "document=1-chunk-6"],
    shouldAbstain: false,
  },
  {
    id: 9,
    question: "What is the person's home address?",
    expectedAnswer:
      "The resume does not provide the person's home address.",
    relevantChunkIds: [],
    shouldAbstain: true,
  },
  {
    id: 10,
    question: "What is the person's favorite programming language?",
    expectedAnswer:
      "The resume lists programming languages but does not specify a favorite programming language.",
    relevantChunkIds: ["document=1-chunk-1"],
    shouldAbstain: true,
  },
];