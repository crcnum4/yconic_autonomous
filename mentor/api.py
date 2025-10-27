"""
FastAPI wrapper for Yconic Mentor
Provides REST API endpoints for the Next.js frontend
"""
import os
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from main import YconicMentor

# Load environment
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Yconic Mentor API",
    description="RAG-powered startup advisor chatbot",
    version="1.0.0"
)

# Add CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001","https://m3qknejspz.us-east-1.awsapprunner.com/"],  # Next.js ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize mentor (singleton)
mentor: Optional[YconicMentor] = None


@app.on_event("startup")
async def startup_event():
    """Initialize mentor on startup"""
    global mentor
    print("🚀 Initializing Yconic Mentor...")
    mentor = YconicMentor(
        use_ollama=os.getenv('USE_OLLAMA', 'true').lower() == 'true',
        force_reload=False
    )
    print("✅ Mentor ready!")


# Request/Response models
class Question(BaseModel):
    question: str
    user_id: str
    conversation_id: Optional[str] = None


class Answer(BaseModel):
    question: str
    answer: str
    sources: list[str]
    conversation_id: Optional[str] = None


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "Yconic Mentor API",
        "version": "1.0.0"
    }


@app.post("/ask", response_model=Answer)
async def ask_question(question: Question):
    """Ask the mentor a question"""
    if not mentor:
        raise HTTPException(status_code=503, detail="Mentor not initialized")

    try:
        # Always reload documents for this specific user (for hackathon - ensures fresh data)
        current_user_prefix = f"user/{question.user_id}/"
        should_reload = (
            not hasattr(mentor, 'current_user_prefix') or
            mentor.current_user_prefix != current_user_prefix
        )

        # Force reload every time for hackathon (comment out for production)
        should_reload = True

        if should_reload:
            print(f"📂 Loading documents for user: {question.user_id}")
            mentor.load_user_documents(question.user_id)
            mentor.current_user_prefix = current_user_prefix

        result = mentor.ask(question.question)

        return Answer(
            question=result['question'],
            answer=result['answer'],
            sources=list(set(result['sources'])),  # Deduplicate sources
            conversation_id=question.conversation_id
        )

    except Exception as e:
        print(f"❌ Error processing question: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/clear")
async def clear_conversation():
    """Clear conversation history"""
    if not mentor:
        raise HTTPException(status_code=503, detail="Mentor not initialized")

    mentor.rag_chain.clear_history()
    return {"status": "ok", "message": "Conversation cleared"}


@app.post("/reload")
async def reload_documents():
    """Reload documents from S3"""
    if not mentor:
        raise HTTPException(status_code=503, detail="Mentor not initialized")

    try:
        mentor.add_documents_from_s3()
        return {"status": "ok", "message": "Documents reloaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    """Detailed health check"""
    if not mentor:
        return {
            "status": "initializing",
            "mentor": False
        }

    model_info = mentor.llm_wrapper.get_model_info()

    return {
        "status": "healthy",
        "mentor": True,
        "model": model_info['model_name'],
        "is_ollama": model_info['is_ollama'],
        "is_openai": model_info['is_openai']
    }


if __name__ == "__main__":
    import uvicorn

    print("🚀 Starting Yconic Mentor API...")
    print("📖 API docs: http://localhost:8000/docs")
    print("🔗 Health check: http://localhost:8000/health")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
