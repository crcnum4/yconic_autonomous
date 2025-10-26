"""
LLM Wrapper with Ollama and OpenAI fallback
"""
import os
from typing import Optional
from langchain_community.llms import Ollama
from langchain_openai import ChatOpenAI
from langchain.schema import BaseLanguageModel


class LLMWrapper:
    def __init__(
        self,
        use_ollama: bool = True,
        ollama_model: str = "llama3.1",
        ollama_base_url: str = "http://localhost:11434",
        openai_model: str = "gpt-4o-mini",
        temperature: float = 0.3,
        max_tokens: int = 2000
    ):
        self.use_ollama = use_ollama
        self.llm: Optional[BaseLanguageModel] = None
        self.model_name = ""

        if use_ollama:
            try:
                print(f"Attempting to use Ollama: {ollama_model}")
                self.llm = Ollama(
                    model=ollama_model,
                    base_url=ollama_base_url,
                    temperature=temperature
                )

                # Test connection with a simple query
                test_response = self.llm.invoke("Say 'OK'")
                print(f"✓ Ollama working! Response: {test_response[:50]}")
                self.model_name = f"Ollama ({ollama_model})"

            except Exception as e:
                print(f"✗ Ollama failed: {e}")
                print("Falling back to OpenAI...")
                self._init_openai(openai_model, temperature, max_tokens)
        else:
            self._init_openai(openai_model, temperature, max_tokens)

    def _init_openai(self, model: str, temperature: float, max_tokens: int):
        """Initialize OpenAI LLM"""
        print(f"Using OpenAI: {model}")
        self.llm = ChatOpenAI(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens
        )
        self.model_name = f"OpenAI ({model})"
        print(f"✓ OpenAI initialized")

    def get_llm(self) -> BaseLanguageModel:
        """Get the active LLM instance"""
        if not self.llm:
            raise ValueError("LLM not initialized")
        return self.llm

    def invoke(self, prompt: str) -> str:
        """Simple invoke method"""
        if not self.llm:
            raise ValueError("LLM not initialized")
        return self.llm.invoke(prompt)

    def get_model_info(self) -> dict:
        """Get information about the active model"""
        return {
            "model_name": self.model_name,
            "is_ollama": "Ollama" in self.model_name,
            "is_openai": "OpenAI" in self.model_name
        }


if __name__ == "__main__":
    # Test the LLM wrapper
    from dotenv import load_dotenv
    load_dotenv()

    # Try Ollama first
    print("Testing with Ollama...")
    llm_wrapper = LLMWrapper(
        use_ollama=True,
        ollama_model=os.getenv('OLLAMA_MODEL', 'llama3.1')
    )

    print(f"\nModel info: {llm_wrapper.get_model_info()}")

    # Test query
    response = llm_wrapper.invoke("What is a startup?")
    print(f"\nResponse: {response}")
