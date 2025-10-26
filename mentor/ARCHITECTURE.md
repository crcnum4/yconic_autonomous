# Yconic Mentor - Architecture Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                        │
│                  (Your Teammate Building)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Server (api.py)                   │
│  Endpoints: /ask, /health, /clear, /reload                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  RAG Chain (rag_chain.py)                    │
│  - Conversational retrieval                                  │
│  - System prompts with rubrics                               │
│  - Memory management                                         │
└──────────┬──────────────────────────────────┬───────────────┘
           │                                   │
           ▼                                   ▼
┌──────────────────────┐          ┌──────────────────────────┐
│  Vector Store        │          │   LLM Wrapper            │
│  (vector_store.py)   │          │   (llm_wrapper.py)       │
│                      │          │                          │
│  - ChromaDB          │          │  Primary: Ollama (local) │
│  - Embeddings        │          │  Fallback: OpenAI        │
│  - Similarity search │          │                          │
└──────────┬───────────┘          └──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                Document Pipeline                             │
│                                                              │
│  S3 Bucket  →  S3 Loader  →  Text Splitter  →  Embeddings  │
│  (s3_loader.py)                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Component Breakdown

### 1. **Document Loading** (`src/loaders/s3_loader.py`)
- Connects to S3 bucket
- Downloads documents (PDFs, DOCX, TXT, etc.)
- Splits into chunks (1000 chars with 200 overlap)
- Preserves metadata (source, type)

**Key Features:**
- Supports directory loading
- Automatic text splitting
- Metadata preservation

### 2. **Vector Store** (`src/embeddings/vector_store.py`)
- Manages ChromaDB vector database
- Handles embeddings (Ollama or OpenAI)
- Provides similarity search
- Persists to disk for reuse

**Key Features:**
- Automatic fallback (Ollama → OpenAI)
- Persistent storage
- Configurable search parameters

### 3. **LLM Wrapper** (`src/llm/llm_wrapper.py`)
- Unified interface for LLMs
- Ollama for local/private inference
- OpenAI as reliable fallback
- Automatic connection testing

**Key Features:**
- Smart fallback mechanism
- Model configuration
- Health checks

### 4. **RAG Chain** (`src/retrieval/rag_chain.py`)
- Conversational retrieval
- Rubrics integration
- Context-aware responses
- Source attribution

**Key Features:**
- Conversation memory
- Custom system prompts
- Source tracking
- Rubrics-based analysis

### 5. **API Server** (`api.py`)
- FastAPI REST endpoints
- CORS for Next.js
- Health checks
- Error handling

**Key Features:**
- OpenAPI docs
- Type validation
- Singleton pattern

### 6. **Main Entry** (`main.py`)
- Orchestrates all components
- Interactive CLI
- Configuration management
- Initialization flow

## 🔄 Request Flow

```
User Question (Next.js)
    ↓
FastAPI /ask endpoint
    ↓
RAG Chain processes question
    ↓
├─→ Vector Store: Find relevant documents (similarity search)
│   └─→ Returns top 6 chunks
└─→ LLM: Generate answer with context + rubrics
    └─→ Returns answer + sources
        ↓
Response sent to Next.js
```

## 🗂️ Directory Structure

```
mentor/
├── main.py                    # Main entry point & CLI
├── api.py                     # FastAPI server
├── test_local.py             # Local testing (no S3)
├── requirements.txt          # Python dependencies
├── .env.example              # Environment template
├── QUICKSTART.md            # Hackathon quick start
├── README.md                # Full documentation
├── ARCHITECTURE.md          # This file
│
├── src/
│   ├── loaders/
│   │   └── s3_loader.py     # S3 document loading
│   ├── embeddings/
│   │   └── vector_store.py  # ChromaDB management
│   ├── llm/
│   │   └── llm_wrapper.py   # LLM interface
│   ├── retrieval/
│   │   └── rag_chain.py     # RAG implementation
│   └── rubrics/
│       └── example_rubrics.json  # Evaluation criteria
│
├── data/                     # Local document cache
└── chroma_db/               # Vector database storage
```

## 🎯 Design Decisions

### Why ChromaDB?
- ✅ Zero setup (no separate DB server)
- ✅ Persistent storage
- ✅ Great performance for <100K documents
- ✅ Easy to use

### Why LangChain?
- ✅ S3 integration built-in
- ✅ Text splitting utilities
- ✅ Conversational retrieval patterns
- ✅ Works with multiple LLMs

### Why Ollama + OpenAI Fallback?
- ✅ Ollama: Free, private, unlimited
- ✅ OpenAI: Reliable, fast, quality
- ✅ Best of both worlds

### Why FastAPI?
- ✅ Type validation
- ✅ Auto-generated docs
- ✅ Fast development
- ✅ Perfect for Next.js integration

## 🔧 Configuration

### Environment Variables

```env
# LLM Selection
USE_OLLAMA=true              # false for OpenAI only

# Ollama Config
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# OpenAI Config
OPENAI_API_KEY=sk-...

# S3 Config
S3_BUCKET_NAME=your-bucket
S3_DOCUMENTS_PREFIX=documents/
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# System Config
TEMPERATURE=0.3              # Lower = more focused
MAX_TOKENS=2000             # Response length limit
CHROMA_PERSIST_DIRECTORY=./chroma_db
```

### Rubrics Configuration

Edit `src/rubrics/example_rubrics.json` to customize:
- Evaluation categories
- Weights
- Red/green flags
- Criteria

The RAG chain automatically includes rubrics in the system prompt.

## 🚀 Scaling Considerations

### Current Limits (Hackathon MVP)
- **Documents**: ~1,000 files (ChromaDB handles well)
- **Concurrent Users**: ~10-20 (single instance)
- **Response Time**: 2-5 seconds

### Future Improvements
1. **Add Pinecone/Weaviate** for production vector storage
2. **Add Redis** for conversation caching
3. **Deploy API** to AWS Lambda/ECS
4. **Add authentication** for multi-user
5. **Stream responses** for better UX
6. **Fine-tune embeddings** for domain specificity

## 📊 Performance

### Typical Request Latency
```
Document Retrieval:  ~100-200ms  (ChromaDB)
LLM Generation:      ~2-4s       (depends on model)
Total:               ~2-5s
```

### Memory Usage
```
ChromaDB:           ~500MB (for 1000 docs)
Python Process:     ~200-300MB
Ollama (if used):   ~4-8GB GPU RAM
```

## 🔒 Security Notes

- AWS credentials stored in `.env` (never commit!)
- OpenAI keys in `.env` (never commit!)
- S3 bucket should use read-only credentials
- CORS restricted to localhost:3000/3001
- No authentication (add before production!)

## 🧪 Testing

### Unit Tests (Future)
```bash
pytest tests/
```

### Integration Test
```bash
python test_local.py
```

### API Test
```bash
# Start server
python api.py

# In another terminal
curl http://localhost:8000/health
```

## 📈 Monitoring (Production)

Future additions:
- Request logging
- Error tracking (Sentry)
- Performance metrics (Prometheus)
- Cost tracking (OpenAI usage)

---

**Built for Yconic Hackathon 2024**
