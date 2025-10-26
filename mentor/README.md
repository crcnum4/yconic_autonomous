# Yconic Mentor - RAG-Powered Startup Advisor

AI-powered mentor chatbot that analyzes your startup's documents (meeting minutes, emails, calendar) to provide strategic advice and insights.

## 🏗️ Architecture

```
S3 Documents → Document Loader → Text Chunking →
→ Embeddings → ChromaDB (Vector Store) →
→ Retrieval → LLM (Ollama/OpenAI) → Answers
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd /mnt/c/yconic/side-projects/yconic_autonomous/mentor
pip install -r requirements.txt
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

Required variables:
- `S3_BUCKET_NAME` - Your S3 bucket with documents
- `S3_DOCUMENTS_PREFIX` - Folder path in S3 (e.g., "documents/")
- `OPENAI_API_KEY` - OpenAI key (fallback if Ollama fails)
- `USE_OLLAMA` - Set to `true` to use Ollama, `false` for OpenAI

### 3. (Optional) Set Up Ollama

If using local Ollama:

```bash
# Install Ollama (if not already)
# https://ollama.ai

# Pull models
ollama pull llama3.1
ollama pull nomic-embed-text

# Verify it's running
curl http://localhost:11434/api/tags
```

### 4. Run the Mentor

```bash
python main.py
```

## 📁 Project Structure

```
mentor/
├── main.py                          # Main entry point
├── requirements.txt                 # Dependencies
├── .env.example                     # Environment template
├── src/
│   ├── loaders/
│   │   └── s3_loader.py            # S3 document loader
│   ├── embeddings/
│   │   └── vector_store.py         # ChromaDB vector store
│   ├── llm/
│   │   └── llm_wrapper.py          # Ollama/OpenAI wrapper
│   ├── retrieval/
│   │   └── rag_chain.py            # RAG chain logic
│   └── rubrics/
│       └── example_rubrics.json    # Evaluation criteria
├── data/                            # Local document cache
└── chroma_db/                       # Vector database (auto-created)
```

## 🎯 Usage

### Interactive Chat

```python
python main.py
```

Then ask questions like:
- "What were the main topics discussed in our last meeting?"
- "What are our biggest challenges right now?"
- "Are we on track for our fundraising goals?"
- "What opportunities am I missing?"

### Programmatic Usage

```python
from main import YconicMentor

mentor = YconicMentor(
    s3_bucket="your-bucket",
    s3_prefix="documents/",
    use_ollama=True
)

result = mentor.ask("What's our burn rate?")
print(result['answer'])
print(result['sources'])
```

### Force Reload Documents

```python
mentor = YconicMentor(force_reload=True)
```

## 🔧 Configuration

### Rubrics

Edit `src/rubrics/example_rubrics.json` to customize:
- Evaluation criteria
- Weights for different areas
- Red flags to watch for
- Green flags to celebrate

The LLM will use these rubrics to inform its analysis.

### LLM Models

**Ollama (Local, Free, Private):**
- Recommended: `llama3.1` or `llama3.2`
- Embeddings: `nomic-embed-text`

**OpenAI (Cloud, Paid, Fast):**
- Recommended: `gpt-4o-mini` (cheap, good quality)
- Alternative: `gpt-4o` (more expensive, higher quality)

### Vector Store

- **Storage**: Persists to `./chroma_db/` directory
- **Embeddings**: Uses same model for consistency
- **Retrieval**: Top 6 most relevant chunks per query

## 🧪 Testing Individual Components

Test S3 loader:
```bash
python -m src.loaders.s3_loader
```

Test vector store:
```bash
python -m src.embeddings.vector_store
```

Test LLM:
```bash
python -m src.llm.llm_wrapper
```

Test RAG chain:
```bash
python -m src.retrieval.rag_chain
```

## 📊 Document Types Supported

- `.txt` - Plain text
- `.pdf` - PDFs
- `.docx` - Word documents
- `.pptx` - PowerPoint
- `.md` - Markdown
- `.eml` - Email files

*Note: Some formats may require additional dependencies*

## 🔒 Security Notes

- AWS credentials stored in `.env` (never commit!)
- OpenAI keys in `.env` (never commit!)
- S3 bucket should have appropriate access controls
- Consider using read-only S3 credentials

## 🐛 Troubleshooting

**Ollama not connecting:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama service
# (depends on your OS)
```

**S3 access denied:**
- Verify AWS credentials in `.env`
- Check S3 bucket permissions
- Ensure bucket and prefix names are correct

**Vector store empty:**
- Check S3 bucket has documents
- Verify `S3_DOCUMENTS_PREFIX` is correct
- Run with `force_reload=True`

**LLM errors:**
- For Ollama: Check model is pulled (`ollama list`)
- For OpenAI: Verify API key is valid

## 🚀 Next Steps for Hackathon

1. ✅ **You have**: Core RAG architecture
2. 🔄 **Your teammate**: Next.js frontend wrapper
3. 📝 **You create**: Custom rubrics for your use case
4. 🎨 **Together**: Connect frontend to this backend

### API Endpoint for Frontend

Create a simple FastAPI wrapper:

```python
# api.py
from fastapi import FastAPI
from main import YconicMentor

app = FastAPI()
mentor = YconicMentor()

@app.post("/ask")
def ask_question(question: str):
    return mentor.ask(question)
```

Run:
```bash
pip install fastapi uvicorn
uvicorn api:app --reload
```

## 📝 License

MIT
