# 🏃‍♂️ QUICKSTART - Yconic Mentor (Hackathon Edition)

Get the RAG chatbot running in 5 minutes!

## ⚡ Speed Run (For Hackathon)

### Step 1: Install Dependencies (2 min)

```bash
cd /mnt/c/yconic/side-projects/yconic_autonomous/mentor
pip install -r requirements.txt
```

### Step 2: Configure Environment (1 min)

```bash
# Copy template
cp .env.example .env

# Edit .env - MINIMUM required:
# - OPENAI_API_KEY=sk-your-key-here
# - USE_OLLAMA=false (use OpenAI for speed)
```

### Step 3: Test Locally (1 min)

```bash
# Test without S3 (uses sample data)
python test_local.py
```

If this works, you're golden! ✅

### Step 4: Run Full System (1 min)

**Option A: Interactive Chat**
```bash
python main.py
```

**Option B: API Server (for Next.js)**
```bash
python api.py
```

---

## 🔥 Hackathon Fast Track

### If Ollama Setup Fails:

**DON'T WASTE TIME!** Just use OpenAI:

```env
USE_OLLAMA=false
OPENAI_API_KEY=your-key
```

You can switch to Ollama later.

### If S3 Not Ready:

Use local documents:

```python
# Modify main.py to skip S3
mentor = YconicMentor(
    s3_bucket=None,  # This will use dummy data
    use_ollama=False
)
```

Or just use `test_local.py` - it works without S3!

---

## 🎯 Integration with Next.js

### 1. Start the API Server

```bash
python api.py
# Runs on http://localhost:8000
```

### 2. Test API from Next.js

```typescript
// pages/api/ask.ts or app/api/ask/route.ts
export async function POST(req: Request) {
  const { question } = await req.json();

  const response = await fetch('http://localhost:8000/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });

  const data = await response.json();
  return Response.json(data);
}
```

### 3. Frontend Component

```tsx
const [answer, setAnswer] = useState('');

const askQuestion = async (question: string) => {
  const res = await fetch('/api/ask', {
    method: 'POST',
    body: JSON.stringify({ question })
  });

  const data = await res.json();
  setAnswer(data.answer);
};
```

---

## 📝 Customize Your Rubrics

Edit `src/rubrics/example_rubrics.json`:

```json
{
  "evaluation_framework": {
    "categories": [
      {
        "name": "Your Custom Category",
        "weight": 0.3,
        "criteria": [
          "What you care about",
          "Another thing you care about"
        ]
      }
    ]
  },
  "red_flags": ["Bad thing to watch for"],
  "green_flags": ["Good thing to celebrate"]
}
```

The LLM will automatically use these in its analysis!

---

## 🐛 Quick Troubleshooting

**"Module not found"**
```bash
pip install -r requirements.txt
```

**"OpenAI API key not set"**
```bash
# Add to .env
OPENAI_API_KEY=sk-your-key-here
```

**"No documents found"**
```bash
# Use test mode:
python test_local.py
```

**"Ollama connection failed"**
```bash
# Just use OpenAI for the hackathon:
# In .env:
USE_OLLAMA=false
```

---

## 🎨 What Your Teammate Needs

**API Endpoints:**

```
GET  /health          - Check if system is ready
POST /ask             - Ask a question
POST /clear           - Clear conversation
POST /reload          - Reload S3 documents
```

**Request Format:**
```json
POST /ask
{
  "question": "What's our fundraising status?"
}
```

**Response Format:**
```json
{
  "question": "What's our fundraising status?",
  "answer": "Based on the meeting minutes...",
  "sources": ["meeting_jan_2024.txt", "email_investor.txt"]
}
```

---

## ✅ Success Checklist

- [ ] Dependencies installed
- [ ] .env configured with OPENAI_API_KEY
- [ ] `test_local.py` runs successfully
- [ ] Can ask questions and get answers
- [ ] API server starts on port 8000
- [ ] Next.js can call API endpoints

---

## 🚀 You're Ready!

The RAG system is complete. Now focus on:
1. Creating your custom rubrics
2. Uploading documents to S3 (or using local test data)
3. Building the Next.js UI
4. Demo prep!

**Questions during hackathon? Check README.md for details.**

Good luck! 🍀
