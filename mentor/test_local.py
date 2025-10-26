"""
Quick test script for local development
Tests the RAG system without requiring S3
"""
import os
from dotenv import load_dotenv
from langchain.schema import Document

from src.embeddings.vector_store import VectorStoreManager
from src.llm.llm_wrapper import LLMWrapper
from src.retrieval.rag_chain import RAGChain

# Load environment
load_dotenv()

print("=" * 60)
print("🧪 Testing Yconic Mentor (Local Mode)")
print("=" * 60)

# Create sample documents (simulating your S3 data)
sample_docs = [
    Document(
        page_content="""
        Meeting Minutes - January 15, 2024

        Attendees: CEO, CTO, Head of Product

        Topics Discussed:
        1. Fundraising Update: We're targeting a $2M seed round.
           Had positive conversations with 3 VCs. Term sheet expected by end of month.

        2. Product Development: Mobile app MVP is 80% complete.
           Planning beta launch in February.

        3. Customer Feedback: NPS score is 8.5/10. Main request is for offline mode.

        4. Hiring: Need to hire 2 engineers and 1 designer by Q2.

        Action Items:
        - CEO: Follow up with lead investor
        - CTO: Complete security audit before beta
        - Product: Start user testing next week
        """,
        metadata={"source": "meeting_jan_2024.txt", "type": "meeting"}
    ),
    Document(
        page_content="""
        Email Thread - January 20, 2024
        From: lead.investor@vc.com
        To: ceo@startup.com

        Subject: Re: Investment Terms

        Hi [CEO],

        Thanks for the deck and financials. Our partnership is very interested.
        A few questions:

        1. What's your current burn rate?
        2. Customer acquisition cost (CAC) trends?
        3. Technical team size and hiring plans?

        We'd like to move quickly - can we schedule a partner meeting next week?

        Best,
        Lead Investor
        """,
        metadata={"source": "email_investor.txt", "type": "email"}
    ),
    Document(
        page_content="""
        Calendar Entry - January 25, 2024

        Event: Product Demo for Beta Users
        Time: 2:00 PM - 3:30 PM
        Attendees: Product Team, 10 Beta Users

        Notes:
        - Showcased new offline mode feature
        - Received excellent feedback on UI improvements
        - 2 users expressed interest in enterprise plan
        - One bug reported in sync feature (logged as P1)

        Follow-up: Send survey to all beta users by Friday
        """,
        metadata={"source": "calendar_demo.txt", "type": "calendar"}
    ),
    Document(
        page_content="""
        Meeting Minutes - February 1, 2024

        Topics:
        1. Funding Update: Term sheet received! $2M at $8M pre-money valuation.
           Due diligence starting next week.

        2. Team Update: Made 2 engineering offers, both accepted.
           Start dates in March.

        3. Metrics:
           - MRR: $15K (up 25% from last month)
           - Active Users: 450 (up 40%)
           - Churn: 3.2% (down from 5.1%)

        4. Concerns:
           - Runway is 4 months without new funding
           - Customer support response time needs improvement
        """,
        metadata={"source": "meeting_feb_2024.txt", "type": "meeting"}
    )
]

print("\n1️⃣ Creating sample documents...")
print(f"   Created {len(sample_docs)} sample documents")

print("\n2️⃣ Initializing Vector Store...")
vectorstore_manager = VectorStoreManager(
    persist_directory="./test_chroma_db",
    use_ollama=os.getenv('USE_OLLAMA', 'false').lower() == 'true'
)

# Create vector store with sample docs
vectorstore_manager.create_vectorstore(sample_docs)

print("\n3️⃣ Initializing LLM...")
llm_wrapper = LLMWrapper(
    use_ollama=os.getenv('USE_OLLAMA', 'false').lower() == 'true',
    openai_model='gpt-4o-mini'
)

print("\n4️⃣ Creating RAG Chain...")
rag_chain = RAGChain(
    vectorstore_manager=vectorstore_manager,
    llm_wrapper=llm_wrapper,
    rubrics_path='src/rubrics/example_rubrics.json'
)

print("\n" + "=" * 60)
print("✅ System Ready! Testing with sample questions...")
print("=" * 60)

# Test questions
test_questions = [
    "What are our fundraising plans and current status?",
    "What are our biggest challenges right now?",
    "How is our product development going?",
    "What's our current MRR and growth rate?"
]

for i, question in enumerate(test_questions, 1):
    print(f"\n{'='*60}")
    print(f"Question {i}: {question}")
    print('='*60)

    result = rag_chain.ask(question)

    print(f"\n📝 Answer:")
    print(result['answer'])
    print(f"\n📚 Sources: {', '.join(set(result['sources']))}")

    if i < len(test_questions):
        input("\n[Press Enter for next question...]")

print("\n" + "=" * 60)
print("✅ Test Complete!")
print("=" * 60)
print("\nThe system is working! You can now:")
print("1. Configure your S3 bucket in .env")
print("2. Run 'python main.py' for full functionality")
print("3. Customize rubrics in src/rubrics/example_rubrics.json")
