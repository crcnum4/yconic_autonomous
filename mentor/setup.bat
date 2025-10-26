@echo off
echo 🚀 Setting up Yconic Mentor...

REM Create virtual environment
echo 📦 Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo 🔌 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
pip install -r requirements.txt

REM Create .env from example
if not exist .env (
    echo 📝 Creating .env file...
    copy .env.example .env
    echo ⚠️  Please edit .env with your credentials!
) else (
    echo ✓ .env already exists
)

REM Create directories
echo 📁 Creating directories...
if not exist data mkdir data
if not exist chroma_db mkdir chroma_db

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Edit .env with your AWS and OpenAI credentials
echo 2. (Optional) Set up Ollama: ollama pull llama3.1 ^&^& ollama pull nomic-embed-text
echo 3. Run: python main.py
echo.
pause
