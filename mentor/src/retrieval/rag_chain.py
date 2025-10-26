"""
RAG Chain - Retrieval Augmented Generation
Combines vector retrieval with LLM to answer questions based on documents
"""
import os
import json
from typing import List, Optional
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import PromptTemplate
from langchain_core.documents import Document

from src.embeddings.vector_store import VectorStoreManager
from src.llm.llm_wrapper import LLMWrapper


class RAGChain:
    def __init__(
        self,
        vectorstore_manager: VectorStoreManager,
        llm_wrapper: LLMWrapper,
        rubrics_path: Optional[str] = None
    ):
        self.vectorstore_manager = vectorstore_manager
        self.llm = llm_wrapper.get_llm()
        self.model_info = llm_wrapper.get_model_info()

        # Load rubrics if provided
        self.rubrics = self._load_rubrics(rubrics_path) if rubrics_path else {}

        # Create system prompt with rubrics
        self.system_prompt = self._create_system_prompt()

        # Initialize conversation memory
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
            output_key="answer"
        )

        # Create the conversational retrieval chain
        self.chain = self._create_chain()

    def _load_rubrics(self, rubrics_path: str) -> dict:
        """Load rubrics from JSON file"""
        try:
            with open(rubrics_path, 'r') as f:
                rubrics = json.load(f)
            print(f"✓ Loaded rubrics from {rubrics_path}")
            return rubrics
        except Exception as e:
            print(f"✗ Error loading rubrics: {e}")
            return {}

    def _create_system_prompt(self) -> str:
        """Create system prompt with rubrics context"""
        base_prompt = """You are an expert startup mentor and business advisor.
You have access to detailed information about the startup from their meeting minutes, emails, and calendar data.

Your role is to:
- Provide strategic advice and insights
- Identify opportunities and risks
- Answer questions based on the provided context
- Give actionable recommendations

"""
        if self.rubrics:
            # Create a text summary of rubrics instead of raw JSON to avoid template variable conflicts
            rubric_name = self.rubrics.get('mentorship_rubric', {}).get('metadata', {}).get('name', 'Unknown')
            categories = self.rubrics.get('mentorship_rubric', {}).get('categories', [])

            rubrics_text = f"\n\nEVALUATION FRAMEWORK: {rubric_name}\n"
            rubrics_text += "You should evaluate the startup across these key areas:\n"

            for cat in categories:
                rubrics_text += f"- {cat.get('label', '')}: {cat.get('weight', 0)*100:.0f}% weight\n"

            rubrics_text += "\nUse these evaluation criteria to inform your analysis and recommendations.\n"
            base_prompt += rubrics_text

        return base_prompt

    def _create_chain(self) -> ConversationalRetrievalChain:
        """Create the conversational retrieval chain"""

        # Custom prompt template
        prompt_template = PromptTemplate(
            input_variables=["context", "question"],
            template=f"""{self.system_prompt}

CONTEXT FROM DOCUMENTS:
{{context}}

QUESTION: {{question}}

ANSWER (be specific, reference the context, and provide actionable insights):
"""
        )

        # Create the chain
        chain = ConversationalRetrievalChain.from_llm(
            llm=self.llm,
            retriever=self.vectorstore_manager.as_retriever(
                search_kwargs={"k": 6}  # Retrieve top 6 relevant chunks
            ),
            memory=self.memory,
            return_source_documents=True,
            combine_docs_chain_kwargs={"prompt": prompt_template},
            verbose=True
        )

        print(f"✓ RAG Chain created using {self.model_info['model_name']}")
        return chain

    def ask(self, question: str) -> dict:
        """Ask a question and get an answer with sources"""
        print(f"\n🤔 Question: {question}")

        response = self.chain.invoke({"question": question})

        result = {
            "question": question,
            "answer": response["answer"],
            "sources": [doc.metadata.get("source", "unknown") for doc in response["source_documents"]],
            "source_documents": response["source_documents"]
        }

        print(f"\n✓ Answer: {result['answer'][:200]}...")
        print(f"📚 Sources: {result['sources']}")

        return result

    def get_conversation_history(self) -> List[dict]:
        """Get the conversation history"""
        return self.memory.chat_memory.messages

    def clear_history(self):
        """Clear conversation history"""
        self.memory.clear()
        print("✓ Conversation history cleared")


if __name__ == "__main__":
    # Test the RAG chain
    from dotenv import load_dotenv
    load_dotenv()

    # Initialize components
    print("Initializing RAG system...")

    # Vector store
    vectorstore_manager = VectorStoreManager(
        use_ollama=os.getenv('USE_OLLAMA', 'true').lower() == 'true'
    )

    # Try to load existing vectorstore, or create a test one
    try:
        vectorstore_manager.load_vectorstore()
    except:
        test_docs = [
            Document(
                page_content="The startup had a meeting about fundraising. They plan to raise $2M.",
                metadata={"source": "meeting_2024-01.txt"}
            ),
            Document(
                page_content="Email from investor: interested in the product-market fit.",
                metadata={"source": "email_investor.txt"}
            ),
        ]
        vectorstore_manager.create_vectorstore(test_docs)

    # LLM
    llm_wrapper = LLMWrapper(
        use_ollama=os.getenv('USE_OLLAMA', 'true').lower() == 'true'
    )

    # RAG Chain
    rag_chain = RAGChain(
        vectorstore_manager=vectorstore_manager,
        llm_wrapper=llm_wrapper
    )

    # Test questions
    result = rag_chain.ask("What are the startup's fundraising plans?")
    print(f"\nFull answer: {result['answer']}")
