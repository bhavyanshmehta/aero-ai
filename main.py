import os
import asyncio
import uuid
import mimetypes
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, HTTPException, Request, Form, UploadFile, File, Depends, Cookie, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
import database
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))
model = genai.GenerativeModel("gemini-2.5-flash")

app = FastAPI()

# Make sure uploads directory exists
UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount the static directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Database initialization
database.init_db()

# --- Auth Helpers & Models ---

class RegisterRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class ChatCreateRequest(BaseModel):
    title: str

class ChatRenameRequest(BaseModel):
    title: str

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    pwd_bytes = password.encode('utf-8')
    salt_bytes = salt.encode('utf-8')
    # Using PBKDF2 with SHA-256
    key = hashlib.pbkdf2_hmac('sha256', pwd_bytes, salt_bytes, 100000)
    return key.hex(), salt

def get_current_user(session_token: Optional[str] = Cookie(None)):
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = database.get_session(session_token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    try:
        expires_at = datetime.fromisoformat(session["expires_at"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid expiration format")
        
    if expires_at < datetime.now():
        database.delete_session(session_token)
        raise HTTPException(status_code=401, detail="Session expired")
        
    user = database.get_user_by_id(session["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# --- Authentication Routes ---

@app.post("/api/auth/register")
async def register(req: RegisterRequest):
    username = req.username.strip().lower()
    password = req.password.strip()
    
    # 1. Username must end with @gmail.com
    if not username.endswith("@gmail.com") or len(username) < 11:
        raise HTTPException(status_code=400, detail="Username must be a valid Gmail address (ending in @gmail.com)")
        
    # 2. Password must be exactly 6 characters and contain both letters and digits
    has_digit = any(c.isdigit() for c in password)
    has_letter = any(c.isalpha() for c in password)
    
    if len(password) != 6 or not has_digit or not has_letter:
        raise HTTPException(
            status_code=400, 
            detail="Password must be exactly 6 characters long and contain both letters and numbers"
        )
        
    existing = database.get_user_by_username(username)
    if existing:
        raise HTTPException(status_code=400, detail="Gmail username already registered")
        
    pwd_hash, salt = hash_password(password)
    user_id = database.create_user(username, pwd_hash, salt)
    if not user_id:
        raise HTTPException(status_code=500, detail="Failed to register account")
        
    return {"status": "success", "message": "Account registered successfully"}

@app.post("/api/auth/login")
async def login(req: LoginRequest, response: Response):
    username = req.username.strip().lower()
    password = req.password.strip()
    
    user = database.get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid Gmail or password")
        
    pwd_hash, _ = hash_password(password, user["salt"])
    if pwd_hash != user["password_hash"]:
        raise HTTPException(status_code=401, detail="Invalid Gmail or password")
        
    # Generate token
    token = secrets.token_hex(32)
    expires_at = datetime.now() + timedelta(days=7)
    if not database.create_session(token, user["id"], expires_at):
        raise HTTPException(status_code=500, detail="Failed to create session")
        
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        max_age=7 * 24 * 60 * 60, # 7 days
        expires=7 * 24 * 60 * 60,
        samesite="lax",
        secure=False
    )
    return {"status": "success", "username": username}

@app.post("/api/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(None)):
    if session_token:
        database.delete_session(session_token)
    response.delete_cookie("session_token")
    return {"status": "success"}

@app.get("/api/auth/me")
async def get_me(user = Depends(get_current_user)):
    return {"id": user["id"], "username": user["username"]}

# --- Frontend Route ---

@app.get("/", response_class=HTMLResponse)
async def read_root():
    index_path = os.path.join("static", "index.html")
    if not os.path.exists(index_path):
        return HTMLResponse(content="static/index.html not found", status_code=404)
    with open(index_path, "r") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content, status_code=200)

# --- Chat API Routes (Protected) ---

@app.post("/api/chats")
async def create_new_chat(req: ChatCreateRequest, user = Depends(get_current_user)):
    chat_id = database.create_chat(req.title, user["id"])
    if chat_id:
         return {"id": chat_id, "title": req.title}
    raise HTTPException(status_code=500, detail="Could not create chat")

@app.get("/api/chats")
async def get_all_chats(user = Depends(get_current_user)):
    return database.get_chats(user["id"])

@app.put("/api/chats/{chat_id}")
async def rename_chat(chat_id: int, req: ChatRenameRequest, user = Depends(get_current_user)):
    chats = database.get_chats(user["id"])
    if not any(c["id"] == chat_id for c in chats):
        raise HTTPException(status_code=403, detail="Not authorized to modify this chat")
    database.rename_chat(chat_id, req.title)
    return {"status": "success"}

@app.get("/api/chats/{chat_id}")
async def get_chat_messages(chat_id: int, user = Depends(get_current_user)):
    chats = database.get_chats(user["id"])
    if not any(c["id"] == chat_id for c in chats):
        raise HTTPException(status_code=403, detail="Not authorized to access this chat")
    return database.get_messages(chat_id)

@app.post("/api/chats/{chat_id}/messages")
async def send_message(
    chat_id: int, 
    content: str = Form(...), 
    image: UploadFile = File(None), 
    user = Depends(get_current_user)
):
    chats = database.get_chats(user["id"])
    if not any(c["id"] == chat_id for c in chats):
        raise HTTPException(status_code=403, detail="Not authorized to access this chat")
        
    image_path = None
    if image and image.filename:
        filename = f"{uuid.uuid4()}_{image.filename}"
        image_path = os.path.join(UPLOAD_DIR, filename)
        with open(image_path, "wb") as f:
            f.write(await image.read())
            
    # Save user message
    database.add_message(chat_id, "user", content, image_path)
    
    try:
        # Load all messages for context
        past_msgs = database.get_messages(chat_id)
        
        history = []
        for msg in past_msgs[:-1]: 
            role = "user" if msg["role"] == "user" else "model"
            parts = [msg["content"]]
            if msg.get("image_path") and os.path.exists(msg["image_path"]):
                mime_type, _ = mimetypes.guess_type(msg["image_path"])
                with open(msg["image_path"], "rb") as f:
                    parts.append({"mime_type": mime_type or "image/jpeg", "data": f.read()})
            history.append({"role": role, "parts": parts})
        
        chat = model.start_chat(history=history)
        
        current_parts = [content]
        if image_path and os.path.exists(image_path):
            mime_type, _ = mimetypes.guess_type(image_path)
            with open(image_path, "rb") as f:
                current_parts.append({"mime_type": mime_type or "image/jpeg", "data": f.read()})
            
        response = chat.send_message(current_parts)
        ai_response = response.text
        
    except Exception as e:
        ai_response = f"I'm having trouble connecting to my AI brain. Did you forget to set the GEMINI_API_KEY in the .env file? Details: {str(e)}"

    database.add_message(chat_id, "assistant", ai_response)
    return {"role": "assistant", "content": ai_response}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
