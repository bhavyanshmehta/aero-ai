# Aero Ai (formerly ChatGPT Clone)

A lightweight, locally-hosted AI chat assistant built using Python (FastAPI), HTML/Vanilla JS, and Google's Gemini API. The application includes a clean, dark-themed web interface to chat with the AI, supports image uploads, and saves chat history using a local SQLite database.

## Features

- **Gemini-powered Chat**: Uses the `gemini-2.5-flash` model for fast, smart, and context-aware responses.
- **Multimodal Capabilities**: Support for image uploads alongside text queries, leveraging Gemini's vision capabilities.
- **Session Management**: Sidebar to create new chats, switch between them, and delete previous conversations.
- **Chat History**: Automatically saves your conversations in a local database so you don't lose them across restarts.
- **Premium UI**: A sleek, responsive, modern interface inspired by top-tier chat platforms.
- **Markdown & Syntax Highlighting**: Properly parses markdown and colors code blocks for readable code outputs.

## Tech Stack

- **Backend**: Python 3, FastAPI, SQLite
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **AI Model**: Google Generative AI (Gemini 2.5 Flash)

## Prerequisites

- Python 3.8+
- A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/).

## Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repository-url>
   cd chatgpt-clone
   ```

2. **Create a virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   Copy the example environment file and add your Gemini API key.
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and replace `your_gemini_api_key_here` with your actual API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

## Running the Application

Start the backend server using Uvicorn:

```bash
python3 main.py
```

Or run it directly with Uvicorn:

```bash
uvicorn main:app --reload
```

Then, open your web browser and navigate to:
**http://127.0.0.1:8000**

## Project Structure

- `main.py`: The FastAPI application, API endpoints, and Gemini integration.
- `database.py`: SQLite database setup and query functions.
- `static/`: Contains the frontend assets (`index.html`, `style.css`, `script.js`, etc.).
- `requirements.txt`: Python dependencies.
- `.env`: Environment variables (do not commit this file).
- `.gitignore`: Specifies intentionally untracked files to ignore.

## License

This project is open-source and available under the MIT License.
