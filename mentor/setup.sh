#!/bin/bash

echo "🚀 Setting up Yconic Mentor..."

# Create virtual environment
echo "📦 Creating virtual environment..."
python -m venv venv

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate || source venv/Scripts/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Create .env from example
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your credentials!"
else
    echo "✓ .env already exists"
fi

# Create directories
echo "📁 Creating directories..."
mkdir -p data chroma_db

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your AWS and OpenAI credentials"
echo "2. (Optional) Set up Ollama: ollama pull llama3.1 && ollama pull nomic-embed-text"
echo "3. Run: python main.py"
echo ""
