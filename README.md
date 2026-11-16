# 🤖 LLM-RAG-Chatbot

An advanced full-stack AI chatbot built using **React, Vite, Node.js, Express, MySQL, Sequelize, LangChain, Google Gemini, and Groq**.

The chatbot supports conversational AI, multiple LLM models, persistent chat history, conversation summarization, document and image uploads, AI agents, tool calling, source citations, and Retrieval-Augmented Generation (RAG).

It can retrieve relevant information from uploaded PDF documents and use that information to answer document-related questions while handling general questions separately.

## ✨ Features

### 🔐 Authentication

- User registration and login.
- JWT-based authentication using HTTP-only cookies.
- Protected routes and user-specific conversations.
- Password hashing using bcrypt.

### 💬 AI Chat and Conversation Management

- Chat with multiple AI models, including Gemini and Groq.
- Switch between available AI models.
- Create, view, and delete conversations.
- Save user and assistant messages in MySQL.
- Maintain conversation context using recent messages.
- Summarize longer conversations and save summaries in the database.
- Automatically generate meaningful conversation titles.
- Stream AI responses through the backend.
- Stop response generation.
- Copy and regenerate AI responses.

### 📄 Document and Image Uploads

- Upload supported PDF documents and images.
- Process uploaded files and associate them with chat messages.
- Extract and process PDF content for RAG.
- Generate document summaries and identify important topics.
- Save document metadata, including filename, summary, topics, and processing status.
- View and manage uploaded documents.
- Delete documents and their associated vector data.
- Ask questions about uploaded documents.

### 🧠 Retrieval-Augmented Generation (RAG)

The chatbot uses RAG to retrieve relevant information from uploaded PDF documents before generating answers.

#### Document Processing

- Extract text from PDF files using PDF-Parse.
- Clean extracted PDF content.
- Split documents into smaller chunks.
- Generate document embeddings using Google's `gemini-embedding-001`.
- Store document chunks, embeddings, and metadata in ChromaDB.
- Generate document summaries and topic lists using an LLM.
- Save document metadata in MySQL.

#### Document Catalog

The chatbot maintains a document catalog containing:

- Document ID.
- Filename.
- Generated summary.
- Important topics and concepts.

The catalog helps the chatbot identify which uploaded documents are relevant to a user's question.

#### Intelligent Document Routing

Before retrieving document chunks, the chatbot uses an LLM-based relevance classifier.

- Compare the user's question with uploaded document summaries and topics.
- Use semantic matching instead of exact keyword matching.
- Consider conversation context for incomplete follow-up questions.
- Avoid retrieving documents for unrelated general questions.
- Retrieve document content only when a relevant document is identified.

#### Retrieval Features

- Generate query embeddings.
- Search relevant document chunks in ChromaDB.
- Apply metadata filtering for document and user-level access.
- Retrieve relevant chunks using Top-K retrieval.
- Use retrieved document information as context for AI-generated answers.
- Keep document-specific answers grounded in retrieved information.

#### RAG Workflow

**Document Processing**

```text
PDF Upload
    |
    v
Extract PDF Text
    |
    v
Clean Extracted Text
    |
    v
Split Text into Chunks
    |
    v
Generate Document Embeddings
(gemini-embedding-001)
    |
    v
Store Chunks and Metadata
in ChromaDB
    |
    v
Generate Document Summary
and Important Topics
    |
    v
Save Metadata in MySQL
```

**Question Retrieval**

```text
User Question
    |
    v
Get Uploaded Document Catalog
    |
    v
Compare Question with
Document Summaries and Topics
    |
    v
LLM Document Relevance Classifier
    |
    +----------------------+
    |                      |
    v                      v
Relevant Documents     No Relevant Documents
    |                      |
    v                      v
Generate Query          Skip Document
Embedding               Retrieval
    |                      |
    v                      |
Search ChromaDB             |
    |                      |
    v                      |
Retrieve Relevant Chunks    |
    |                      |
    v                      |
Provide Document Context    |
    |                      |
    +----------+-----------+
               |
               v
        AI Agent Generates
           Final Answer
               |
               v
          Display Answer
```

**Retrieval method:** Embedding-based similarity search with Top-K retrieval and metadata filtering. Retrieved chunks provide document context to the AI agent.

### 🛠️ AI Agents and LLM Tool Calling

The chatbot uses the **LangChain framework** to create AI agents that can interact with available tools.

The agent analyzes the user's question and determines which tools are needed to retrieve additional information.

#### Supported Models

- Google Gemini.
- Groq-hosted LLM models.
- Model selection through the chatbot interface.

#### Custom Tools

| Tool | Description |
|---|---|
| `searchDocuments` | Retrieves relevant information from uploaded PDF documents. |
| `searchWikipedia` | Searches Wikipedia and returns relevant page information and URLs. |

#### Tool Execution Features

- Define custom tools for the AI agent.
- Allow the agent to select relevant tools.
- Execute tool calls based on user questions.
- Handle tool execution results and errors.
- Support multiple tool calls when needed.
- Return tool results to the agent for further processing.
- Generate final responses using available tool results.

#### Agent Workflow

```text
User Question
     |
     v
LangChain Agent
     |
     v
Analyze User Question
     |
     v
Select Relevant Tool(s)
     |
     v
Execute Tool Calls
     |
     v
Receive Tool Results
     |
     v
Analyze Tool Results
     |
     v
More Tool Calls Needed?
     |
     +------ Yes ------> Execute Tools Again
     |
     +------ No
              |
              v
       Generate Final Answer
              |
              v
        Display Response
```

### 🔗 Source Citations

The chatbot supports collecting and displaying references used in AI-generated responses.

- Extract source information from available grounding metadata.
- Collect citations from custom tool results.
- Support Google Search grounding references where available.
- Collect Wikipedia source titles and URLs.
- Include uploaded document references when returned by document retrieval.
- Remove duplicate citations based on URLs.
- Format citations as Markdown links.
- Display clickable source references using React Markdown.

#### Citation Workflow

```text
AI Response / Tool Results
          |
          v
    Collect Citations
          |
          v
   Extract Titles and URLs
          |
          v
    Remove Duplicates
          |
          v
   Format Markdown Links
          |
          v
    Append to Response
          |
          v
 Display Clickable Sources
```

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- JavaScript
- Bootstrap 5
- React Icons
- React Markdown

### Backend

- Node.js
- Express.js
- Sequelize ORM
- MySQL
- JWT Authentication
- HTTP-only Cookies
- bcrypt
- Multer

### AI and LLM

- Google Gemini API
- Groq API
- LangChain
- LangChain Agents
- LLM Tool Calling
- Custom AI Tools
- Prompt Engineering
- Conversation Summarization
- Source Citation Handling

### RAG

- Gemini Embeddings (`gemini-embedding-001`)
- ChromaDB
- PDF-Parse
- Text Chunking and Overlap
- Vector Similarity Search
- Top-K Retrieval
- Metadata Filtering
- Document Catalog
- LLM-Based Document Routing

## 📁 Project Structure

```text
LLM-RAG-Chatbot/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatHeader/
│   │   │   ├── ChatSidebar/
│   │   │   ├── MessageInput/
│   │   │   └── MessageList/
│   │   ├── features/
│   │   │   └── auth/
│   │   ├── services/
│   │   │   └── chatServices.js
│   │   └── ...
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── services/
│   │   ├── citationsService.js
│   │   ├── documentServices.js
│   │   └── ...
│   ├── tools/
│   │   ├── langchainTools.js
│   │   └── toolRegistry.js
│   ├── rag/
│   │   └── services/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── uploads/
│   ├── config/
│   └── ...
│
├── .gitignore
└── README.md
```

The structure is a simplified overview. Actual filenames and folders may differ as the project evolves.

## 🔄 Application Workflow

```text
User
 |
 v
React Frontend
 |
 | HTTP Requests
 v
Express Backend
 |
 +-------------------+
 |                   |
 v                   v
MySQL              AI Models
 |                Gemini / Groq
 |                   |
 |                   v
 |              LangChain Agent
 |                   |
 |                   v
 |              Tool Selection
 |                   |
 |          +--------+--------+
 |          |                 |
 |          v                 v
 |    Document Search    Wikipedia Search
 |          |                 |
 |          v                 v
 |       ChromaDB         Wikipedia API
 |          |                 |
 |          +--------+--------+
 |                   |
 |                   v
 |              Tool Results
 |                   |
 |                   v
 |             Final Response
 |                   |
 |                   v
 |             Source Citations
 |                   |
 +-------------------+
          |
          v
    Saved Chat History
          |
          v
    React Frontend
          |
          v
    Display Response
```

For document-related questions, the backend first checks document relevance and retrieves relevant chunks from ChromaDB when necessary.

## 🧠 Conversation Context and Memory

The chatbot maintains conversation continuity using:

- Conversation summaries saved in MySQL.
- A limited number of recent messages.
- Relevant document context retrieved through RAG.

Conversation summaries help reduce the amount of previous conversation content sent to the model while preserving important information.

Recent messages provide immediate conversational context, while retrieved document content provides additional knowledge from uploaded files.

## 🗄️ Database

The application uses **MySQL with Sequelize ORM** for persistent data storage.

### Main Entities

- **User:** Stores user account and authentication information.
- **Conversation:** Stores chat ownership, title, summary, and summary-tracking information.
- **Message:** Stores user and assistant messages, including associated file information.
- **Document:** Stores uploaded document information, processing status, summary, and topics.

### User

Stores authentication and account information.

### Conversation

Stores individual chat conversations.

Example fields:

```text
id
userId
title
summary
lastSummarizedMessageId
createdAt
updatedAt
```

### Message

Stores messages exchanged between the user and AI.

Example fields:

```text
id
conversationId
role
content
createdAt
updatedAt
```

### Document

Stores uploaded PDF document information and generated metadata.

Example fields:

```text
id
userId
fileName
filePath
fileSize
status
summary
topics
createdAt
updatedAt
```

### Database Relationships

```text
User
 |
 +---- hasMany ----> Conversations
 |                       |
 |                       +---- hasMany ----> Messages
 |
 +---- hasMany ----> Documents
```

ChromaDB separately stores document chunks, embeddings, and associated metadata for retrieval.

## 🔑 Environment Variables

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_db_name
DB_USER=your_db_username
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret

GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

Add any additional environment variables required by your current configuration.

Never commit your `.env` file or expose API keys and database credentials publicly.

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/HadiaShahid0/AI-Chatbot.git
cd AI-Chatbot
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Configure Environment Variables

Create `server/.env` and configure your:

- MySQL credentials.
- JWT secret.
- Gemini API key.
- Groq API key.

### 4. Create the MySQL Database

Create a database using your chosen database name:

```sql
CREATE DATABASE your_db_name;
```

Make sure your database credentials match the values in `server/.env`.

### 5. Start the Backend

From the `server` directory:

```bash
npm run dev
```

### 6. Install Frontend Dependencies

Open another terminal:

```bash
cd client
npm install
```

### 7. Start the Frontend

```bash
npm run dev
```

Open the local URL displayed by Vite in your terminal.

### 8. Start ChromaDB

Make sure your ChromaDB server is running and accessible through the backend configuration before using document retrieval.

## 🔌 API Overview

The backend provides endpoints for authentication, conversations, messages, and document management.

The following are illustrative endpoint paths; check the current Express route configuration for the exact paths.

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Conversations

```text
POST   /api/conversations
GET    /api/conversations
GET    /api/conversations/:id
DELETE /api/conversations/:id
```

### Messages

```text
GET  /api/messages/:conversationId
POST /api/messages
```

### Documents

Document endpoints support operations such as:

- Uploading documents.
- Listing uploaded documents.
- Retrieving document information.
- Deleting documents.

Check the current document router for the exact endpoint paths and HTTP methods.

## 🔐 Security Notes

- Hash passwords before storing them.
- Use HTTP-only cookies for authentication tokens.
- Protect private routes.
- Verify conversation and document ownership on the backend.
- Apply user-level filtering when retrieving document chunks.
- Validate uploaded file types and sizes.
- Keep API keys and database credentials in environment variables.
- Avoid exposing sensitive server configuration to the frontend.

## 🧪 Suggested Testing Areas

- User registration, login, logout, and protected routes.
- Conversation creation and message persistence.
- Conversation context and summary updates.
- Automatic conversation title generation.
- Response streaming and stop generation.
- Copy and regenerate message functionality.
- Gemini and Groq model selection.
- PDF and image uploads.
- PDF text extraction and chunk creation.
- Document summary and topic generation.
- Document metadata persistence in MySQL.
- ChromaDB document storage.
- Document catalog generation.
- Document relevance classification.
- Retrieval relevance and Top-K results.
- Metadata filtering and user-level access.
- RAG answers for document-related questions.
- General questions that should skip document retrieval.
- Custom tool selection and execution.
- Multiple tool calls and result handling.
- Wikipedia search results.
- Citation extraction and duplicate removal.
- Clickable source links in AI responses.

## 🎯 Learning Goals

This project provides practical experience with:

- Large Language Models (LLMs).
- Google Gemini and Groq API integration.
- LangChain framework and AI agents.
- Prompt engineering and system instructions.
- Custom tool development and tool calling.
- Multi-model AI applications.
- Conversation context and summarization.
- Token and context-window management.
- Multimodal file processing.
- Retrieval-Augmented Generation (RAG).
- Document processing and text chunking.
- Document and query embeddings.
- Vector databases and similarity search.
- Top-K retrieval and metadata filtering.
- Intelligent document routing.
- Source citations and grounding.
- REST APIs and backend development.
- React, Node.js, and Express.
- MySQL, Sequelize, and authentication.

## 👩‍💻 Author

**Hadia Shahid**