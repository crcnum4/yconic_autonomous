"""
S3 Document Loader
Loads documents from S3 bucket and extracts text
"""
import os
import boto3
from typing import List
from langchain_community.document_loaders import S3DirectoryLoader, S3FileLoader
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter


class S3DocumentLoader:
    def __init__(
        self,
        bucket_name: str,
        prefix: str = "",
        aws_access_key_id: str = None,
        aws_secret_access_key: str = None,
        region_name: str = "us-east-1"
    ):
        self.bucket_name = bucket_name
        self.prefix = prefix

        # Initialize S3 client
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key_id or os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=aws_secret_access_key or os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=region_name or os.getenv('AWS_REGION', 'us-east-1')
        )

        # Text splitter for chunking
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )

    def load_documents(self) -> List[Document]:
        """Load all documents from S3 bucket"""
        print(f"Loading documents from s3://{self.bucket_name}/{self.prefix}")

        try:
            # Use LangChain's S3DirectoryLoader
            loader = S3DirectoryLoader(
                bucket=self.bucket_name,
                prefix=self.prefix
            )
            documents = loader.load()

            print(f"Loaded {len(documents)} documents from S3")
            return documents

        except Exception as e:
            print(f"Error loading from S3: {e}")
            return []

    def load_and_split(self) -> List[Document]:
        """Load documents and split into chunks"""
        documents = self.load_documents()

        if not documents:
            return []

        # Split documents into chunks
        chunks = self.text_splitter.split_documents(documents)
        print(f"Split into {len(chunks)} chunks")

        return chunks

    def list_documents(self) -> List[str]:
        """List all document keys in the S3 bucket"""
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=self.prefix
            )

            if 'Contents' not in response:
                return []

            keys = [obj['Key'] for obj in response['Contents']]
            print(f"Found {len(keys)} files in S3")
            return keys

        except Exception as e:
            print(f"Error listing S3 objects: {e}")
            return []


if __name__ == "__main__":
    # Test the loader
    from dotenv import load_dotenv
    load_dotenv()

    loader = S3DocumentLoader(
        bucket_name=os.getenv('S3_BUCKET_NAME'),
        prefix=os.getenv('S3_DOCUMENTS_PREFIX', '')
    )

    # List files
    files = loader.list_documents()
    print(f"Files: {files}")

    # Load and split
    chunks = loader.load_and_split()
    print(f"Loaded {len(chunks)} chunks")
    if chunks:
        print(f"Sample chunk: {chunks[0].page_content[:200]}")
