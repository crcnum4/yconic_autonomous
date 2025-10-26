"""
Main entry point for Yconic Mentor RAG System
Orchestrates document loading, vector store creation, and chatbot interaction
"""
import os
from dotenv import load_dotenv

from src.loaders.s3_loader import S3DocumentLoader
from src.embeddings.vector_store import VectorStoreManager
from src.llm.llm_wrapper import LLMWrapper
from src.retrieval.rag_chain import RAGChain


class YconicMentor:
    def __init__(
        self,
        s3_bucket: str = None,
        s3_prefix: str = "",
        rubrics_path: str = None,
        use_ollama: bool = True,
        force_reload: bool = False
    ):
        print("=" * 60)
        print("🚀 Initializing Yconic Mentor RAG System")
        print("=" * 60)

        self.s3_bucket = s3_bucket or os.getenv('S3_BUCKET_NAME')
        self.s3_prefix = s3_prefix or os.getenv('S3_DOCUMENTS_PREFIX', '')
        self.rubrics_path = rubrics_path or os.path.join(
            os.path.dirname(__file__),
            'src/rubrics/example_rubrics.json'
        )
        self.use_ollama = use_ollama

        # Initialize components
        self.vectorstore_manager = None
        self.llm_wrapper = None
        self.rag_chain = None

        # Setup
        self._initialize_vectorstore(force_reload)
        self._initialize_llm()
        self._initialize_rag_chain()

        print("\n" + "=" * 60)
        print("✅ Yconic Mentor is ready!")
        print("=" * 60)

    def _initialize_vectorstore(self, force_reload: bool):
        """Initialize or load vector store"""
        print("\n📚 Setting up vector store...")

        self.vectorstore_manager = VectorStoreManager(
            persist_directory=os.getenv('CHROMA_PERSIST_DIRECTORY', './chroma_db'),
            use_ollama=self.use_ollama,
            ollama_model=os.getenv('OLLAMA_EMBEDDING_MODEL', 'nomic-embed-text')
        )

        # Check if we need to load from S3
        vectorstore_exists = os.path.exists(
            os.path.join(self.vectorstore_manager.persist_directory, 'chroma.sqlite3')
        )

        if force_reload or not vectorstore_exists:
            print("Loading documents from S3...")
            self._load_documents_from_s3()
        else:
            print("Loading existing vector store...")
            self.vectorstore_manager.load_vectorstore()

    def _load_documents_from_s3(self):
        """Load documents from S3 and create vector store"""
        if not self.s3_bucket:
            print("⚠️  No S3 bucket configured. Using empty vector store.")
            print("   Set S3_BUCKET_NAME in .env to load documents")
            # Create empty vectorstore for testing
            from langchain.schema import Document
            dummy_doc = [Document(page_content="No documents loaded yet.", metadata={"source": "system"})]
            self.vectorstore_manager.create_vectorstore(dummy_doc)
            return

        # Load from S3
        loader = S3DocumentLoader(
            bucket_name=self.s3_bucket,
            prefix=self.s3_prefix
        )

        # Load and split documents
        chunks = loader.load_and_split()

        if not chunks:
            print("⚠️  No documents found in S3")
            return

        # Create vector store
        self.vectorstore_manager.create_vectorstore(chunks)

    def _initialize_llm(self):
        """Initialize LLM with Ollama/OpenAI fallback"""
        print("\n🤖 Setting up LLM...")

        self.llm_wrapper = LLMWrapper(
            use_ollama=self.use_ollama,
            ollama_model=os.getenv('OLLAMA_MODEL', 'llama3.1'),
            ollama_base_url=os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434'),
            openai_model='gpt-4o-mini',
            temperature=float(os.getenv('TEMPERATURE', 0.3)),
            max_tokens=int(os.getenv('MAX_TOKENS', 2000))
        )

    def _initialize_rag_chain(self):
        """Initialize RAG chain"""
        print("\n🔗 Creating RAG chain...")

        self.rag_chain = RAGChain(
            vectorstore_manager=self.vectorstore_manager,
            llm_wrapper=self.llm_wrapper,
            rubrics_path=self.rubrics_path if os.path.exists(self.rubrics_path) else None
        )

    def ask(self, question: str) -> dict:
        """Ask the mentor a question"""
        return self.rag_chain.ask(question)

    def chat_loop(self):
        """Interactive chat loop"""
        print("\n💬 Starting chat (type 'quit' to exit, 'clear' to reset conversation)")
        print("-" * 60)

        while True:
            try:
                question = input("\nYou: ").strip()

                if not question:
                    continue

                if question.lower() in ['quit', 'exit', 'q']:
                    print("👋 Goodbye!")
                    break

                if question.lower() == 'clear':
                    self.rag_chain.clear_history()
                    continue

                # Get answer
                result = self.ask(question)

                print(f"\nMentor: {result['answer']}")
                print(f"\n📚 Sources: {', '.join(set(result['sources']))}")

            except KeyboardInterrupt:
                print("\n\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"\n❌ Error: {e}")

    def add_documents_from_s3(self):
        """Manually reload documents from S3"""
        print("\n🔄 Reloading documents from S3...")
        self._load_documents_from_s3()


def main():
    # Load environment variables
    load_dotenv()

    # Create mentor instance
    mentor = YconicMentor(
        use_ollama=os.getenv('USE_OLLAMA', 'true').lower() == 'true',
        force_reload=False  # Set to True to force reload from S3
    )

    # Start chat loop
    mentor.chat_loop()


if __name__ == "__main__":
    main()
