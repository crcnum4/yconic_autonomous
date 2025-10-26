"""
Vector Store Manager using ChromaDB
Handles embeddings and retrieval
"""
import os
from typing import List
from langchain.schema import Document
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from langchain_openai import OpenAIEmbeddings


class VectorStoreManager:
    def __init__(
        self,
        persist_directory: str = "./chroma_db",
        use_ollama: bool = True,
        ollama_model: str = "nomic-embed-text",
        ollama_base_url: str = "http://localhost:11434"
    ):
        self.persist_directory = persist_directory
        self.use_ollama = use_ollama

        # Initialize embeddings
        if use_ollama:
            try:
                print(f"Using Ollama embeddings: {ollama_model}")
                self.embeddings = OllamaEmbeddings(
                    model=ollama_model,
                    base_url=ollama_base_url
                )
                # Test connection
                test = self.embeddings.embed_query("test")
                print(f"✓ Ollama embeddings working (dimension: {len(test)})")
            except Exception as e:
                print(f"✗ Ollama embeddings failed: {e}")
                print("Falling back to OpenAI embeddings")
                self.embeddings = OpenAIEmbeddings()
        else:
            print("Using OpenAI embeddings")
            self.embeddings = OpenAIEmbeddings()

        # Initialize or load vector store
        self.vectorstore = None

    def create_vectorstore(self, documents: List[Document]) -> Chroma:
        """Create a new vector store from documents"""
        if not documents:
            raise ValueError("No documents provided")

        print(f"Creating vector store with {len(documents)} documents...")

        self.vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory=self.persist_directory
        )

        print(f"✓ Vector store created and persisted to {self.persist_directory}")
        return self.vectorstore

    def load_vectorstore(self) -> Chroma:
        """Load existing vector store"""
        print(f"Loading vector store from {self.persist_directory}...")

        self.vectorstore = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings
        )

        print("✓ Vector store loaded")
        return self.vectorstore

    def add_documents(self, documents: List[Document]):
        """Add new documents to existing vector store"""
        if not self.vectorstore:
            raise ValueError("Vector store not initialized. Call create_vectorstore or load_vectorstore first")

        print(f"Adding {len(documents)} documents to vector store...")
        self.vectorstore.add_documents(documents)
        print("✓ Documents added")

    def similarity_search(self, query: str, k: int = 4) -> List[Document]:
        """Search for similar documents"""
        if not self.vectorstore:
            raise ValueError("Vector store not initialized")

        results = self.vectorstore.similarity_search(query, k=k)
        return results

    def as_retriever(self, search_kwargs: dict = None):
        """Return vectorstore as a retriever for LangChain"""
        if not self.vectorstore:
            raise ValueError("Vector store not initialized")

        search_kwargs = search_kwargs or {"k": 4}
        return self.vectorstore.as_retriever(search_kwargs=search_kwargs)

    def clear(self):
        """Clear the vector store"""
        if self.vectorstore:
            self.vectorstore.delete_collection()
            print("✓ Vector store cleared")


if __name__ == "__main__":
    # Test the vector store
    from dotenv import load_dotenv
    load_dotenv()

    # Test with sample documents
    test_docs = [
        Document(page_content="This is a test document about startups.", metadata={"source": "test1"}),
        Document(page_content="Another document about fundraising.", metadata={"source": "test2"}),
    ]

    manager = VectorStoreManager(
        use_ollama=os.getenv('USE_OLLAMA', 'true').lower() == 'true'
    )

    # Create vector store
    manager.create_vectorstore(test_docs)

    # Test search
    results = manager.similarity_search("startup funding")
    print(f"Search results: {len(results)}")
    for doc in results:
        print(f"- {doc.page_content}")
