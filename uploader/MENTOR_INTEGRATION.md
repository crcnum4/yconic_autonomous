# AI Mentor Integration Guide

This Next.js app now includes an AI Mentor chatbot that connects to the Python RAG backend.

## 🏗️ Architecture

```
User → Next.js UI (/mentor page)
         ↓
Next.js API Routes (/api/mentor/*)
         ↓
Python FastAPI Backend (../mentor/api.py)
         ↓
RAG System (S3 → ChromaDB → LLM)
```

## 🚀 Quick Start

### 1. Set Up Python Backend

```bash
# Navigate to mentor directory
cd ../mentor

# Install dependencies (first time only)
pip install -r requirements.txt

# Configure .env
# - Add your OPENAI_API_KEY
# - AWS credentials are already set

# Start the Python API server
python api.py
```

The Python API will start on **http://localhost:8000**

### 2. Set Up Next.js Frontend

```bash
# Navigate to uploader directory
cd ../uploader

# Install dependencies (first time only)
npm install

# Create .env.local from env.example
cp env.example .env.local

# Add this line to .env.local:
PYTHON_API_URL=http://localhost:8000

# Start Next.js dev server
npm run dev
```

The Next.js app will start on **http://localhost:3000**

## 📖 Usage

1. **Sign in** to the app
2. **Upload documents** via the Dashboard:
   - Meeting minutes
   - Emails
   - Calendar events
   - Any text documents
3. **Go to AI Mentor** page (navbar link)
4. **Ask questions** about your startup!

## 🎯 Example Questions

- "What were the main topics in our last meeting?"
- "What are our biggest challenges right now?"
- "How is our fundraising progressing?"
- "What opportunities am I missing?"
- "What's our current burn rate?"
- "Are we on track for our goals?"

## 📁 Files Added

### API Routes
- `src/app/api/mentor/ask/route.ts` - Main chat endpoint
- `src/app/api/mentor/clear/route.ts` - Clear conversation
- `src/app/api/mentor/health/route.ts` - Health check

### Components
- `src/components/MentorChat.tsx` - Chat UI component

### Pages
- `src/app/mentor/page.tsx` - Mentor chat page

### Updated
- `src/components/NavBar.tsx` - Added "AI Mentor" link

## 🔧 Environment Variables

Add to your `.env.local`:

```env
PYTHON_API_URL=http://localhost:8000
```

## 🐛 Troubleshooting

### "Python API is offline"

**Solution**: Make sure the Python API is running:
```bash
cd ../mentor
python api.py
```

### "Failed to get response from mentor"

**Check**:
1. Python API is running on port 8000
2. OpenAI API key is set in `../mentor/.env`
3. Documents are uploaded to S3 (or use test data)

### "No documents found"

**Options**:
1. Upload documents via Dashboard
2. Or use the test script: `cd ../mentor && python test_local.py`

## 🎨 Features

- ✅ Real-time chat interface
- ✅ Source attribution (shows which documents were used)
- ✅ Conversation memory (maintains context)
- ✅ Health status indicator
- ✅ Suggested questions
- ✅ Clear conversation option
- ✅ Loading states
- ✅ Error handling

## 🔒 Security

- API routes require authentication (NextAuth session)
- Python API runs locally (not exposed)
- All requests go through Next.js API routes

## 📊 Data Flow

1. User uploads documents → S3 bucket
2. Python backend loads from S3 → Creates embeddings → Stores in ChromaDB
3. User asks question → Next.js API → Python API
4. Python RAG system:
   - Searches ChromaDB for relevant docs
   - Sends to LLM with context
   - Returns answer + sources
5. Answer displayed in UI with source citations

## 🚀 For Production

Before deploying:

1. **Deploy Python API** to a server (AWS EC2, Railway, etc.)
2. **Update PYTHON_API_URL** to production URL
3. **Add authentication** between Next.js and Python API (API key)
4. **Enable CORS** properly in Python API
5. **Use environment-specific configs**

## 💡 Next Steps

- Customize rubrics in `../mentor/src/rubrics/example_rubrics.json`
- Add more documents to improve answers
- Experiment with different questions
- Consider using Ollama for free local LLM (vs OpenAI)

---

**Questions?** Check the main README in `../mentor/`
