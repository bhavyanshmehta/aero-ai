# Aero AI

Aero AI is a next-generation, high-performance intelligent assistant featuring a premium, interactive 3D showroom interface. Built with a FastAPI backend and a hardware-accelerated vanilla HTML/CSS/JS frontend, the application offers dynamic 3D room viewport rotations, grid spotlights, and secure local user workspaces.

---

## 🌟 Key Features

* **Cinematic 3D Showroom Viewport**: Interactive 3D room space featuring floating gold dust particles (sparks) at various depth dimensions and a cursor-tracking grid spotlight on the floor and ceiling.
* **Cinematic Transitions**: Smooth camera flight-zoom transformations transitioning from the welcome screen, through the credential card, and directly into the chat workspace.
* **Alphanumeric Gmail Authentication**: Secure registration and login restricted to valid `@gmail.com` accounts, requiring a 6-character alphanumeric password stored using salted PBKDF2 hashing.
* **Multimodal Chat (Gemini 2.5)**: Powered by Google's `gemini-2.5-flash` model for rapid, context-aware text responses and image analysis.
* **Private Isolated Workspaces**: Automatic database-level workspace separation so each user has isolated, password-protected chat histories.
* **Premium Typography & Code Highlighting**: Uses Google Fonts Inter typography, fully formatted markdown parsing, and Atom One Dark code blocks with syntax highlighting.
* **Responsive Light/Dark Mode**: A luxury warm gold, amber, and bronze dark mode paired with a sophisticated warm champagne/ivory light mode.

---

## 🛠️ Tech Stack

* **Backend**: Python 3.9+, FastAPI, SQLite3, Pydantic, Uvicorn
* **Frontend**: HTML5, Vanilla CSS3, Vanilla ES6 JavaScript, Markdown parser (Marked), Code highlighter (Highlight.js)
* **AI Model**: Google Generative AI (Gemini 2.5 Flash API)

---

## 🚀 Getting Started

### Prerequisites
* Python 3.8+ installed on your system.
* A Gemini API Key from [Google AI Studio](https://aistudio.google.com/).

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bhavyanshmehta/aero-ai.git
   cd aero-ai
   ```

2. **Establish virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install python packages**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Copy the example environment file and insert your credentials.
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and insert your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

---

## 💻 Running the Server

Start the FastAPI application on Uvicorn:
```bash
python3 main.py
```
Or run directly using:
```bash
uvicorn main:app --reload
```
Open your web browser and navigate to:
👉 **`http://localhost:8000`**

---

## 📂 Project Directory Structure

```
├── main.py                # FastAPI endpoints, auth cookies, and Gemini APIs
├── database.py            # SQLite schema configuration and queries
├── requirements.txt       # Python dependency declarations
├── .env.example           # Reference environment template
├── static/
│   ├── index.html         # HTML layout structures
│   ├── script.js          # 3D room tilt, particles, and API calls
│   └── style.css          # Core design tokens, gradients, and animations
```

---

## 📄 License
This project is open-source and distributed under the MIT License.
