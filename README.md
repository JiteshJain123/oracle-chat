# Oracle Chat

**Ask anything. Know everything.**

A full-stack AI chatbot powered by Groq and Meta Llama — with real-time web search, image analysis, and PDF understanding. Built from scratch with Node.js, Express, and Tailwind CSS.

**Live Demo:** [oracle-chat.onrender.com](https://oracle-chat.onrender.com)
**GitHub:** [github.com/JiteshJain123/oracle-chat](https://github.com/JiteshJain123/oracle-chat)

---

## Features

- **Real-time Web Search** — Answers questions about current news, weather, stock prices, and live events using the Tavily search API
- **Image Analysis** — Upload any image and ask questions about it using Llama 4 Maverick vision model
- **PDF Understanding** — Upload a PDF document and get instant summaries or answers to questions about its content
- **Conversation Memory** — Remembers your full conversation context for 24 hours, then auto-clears for privacy
- **Fast Inference** — Powered by Groq's ultra-fast LPU inference engine

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express v5 |
| AI / LLM | Groq SDK, Llama 3.3 70B, Llama 4 Maverick |
| Web Search | Tavily API |
| File Uploads | Multer v2 |
| PDF Parsing | pdf-parse v2 |
| Conversation Cache | NodeCache (24hr TTL) |
| Frontend | HTML, Tailwind CSS v3, Vanilla JS |

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- A [Groq API key](https://console.groq.com)
- A [Tavily API key](https://tavily.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/oracle-chat.git
cd oracle-chat

# Install dependencies
npm install

# Build Tailwind CSS
npm run build:css
```

### Environment Variables

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

### Run the Project

```bash
npm start
```

Then open `frontend/index.html` in your browser.

---

## Project Structure

```
oracle-chat/
├── server.js          # Express server, file upload handling
├── chatbot.js         # LLM logic, tool calling, conversation cache
├── frontend/
│   ├── index.html     # UI layout
│   ├── script.js      # Frontend logic
│   ├── input.css      # Tailwind source
│   └── output.css     # Compiled CSS (generated)
├── tailwind.config.cjs
├── package.json
└── .env               # API keys (not committed)
```

---

## Models Used

| Purpose | Model |
|---|---|
| Text & reasoning | `llama-3.3-70b-versatile` |
| Vision / image analysis | `meta-llama/llama-4-maverick-17b-128e-instruct` |

---

## Privacy

Conversations are stored in-memory only and automatically deleted after 24 hours. No personal data is saved to any database.

---
