import sqlite3
from sqlite3 import Error

DB_FILE = 'chat_app.db'

def create_connection():
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    except Error as e:
        print(e)
    return conn

def init_db():
    conn = create_connection()
    if conn is not None:
        try:
            c = conn.cursor()
            c.execute('''CREATE TABLE IF NOT EXISTS users (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            username TEXT UNIQUE NOT NULL,
                            email TEXT UNIQUE,
                            mobile TEXT UNIQUE,
                            password_hash TEXT,
                            salt TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );''')
            c.execute('''CREATE TABLE IF NOT EXISTS otps (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            contact TEXT NOT NULL,
                            code TEXT NOT NULL,
                            expires_at TIMESTAMP NOT NULL,
                            verified INTEGER DEFAULT 0
                        );''')
            c.execute('''CREATE TABLE IF NOT EXISTS sessions (
                            token TEXT PRIMARY KEY,
                            user_id INTEGER NOT NULL,
                            expires_at TIMESTAMP NOT NULL,
                            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                        );''')
            c.execute('''CREATE TABLE IF NOT EXISTS chats (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id INTEGER,
                            title TEXT NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                        );''')
            c.execute('''CREATE TABLE IF NOT EXISTS messages (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            chat_id INTEGER NOT NULL,
                            role TEXT NOT NULL,
                            content TEXT NOT NULL,
                            image_path TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
                        );''')
            
            # Schema migrations for existing databases
            try:
                c.execute("ALTER TABLE users ADD COLUMN email TEXT UNIQUE;")
            except sqlite3.OperationalError:
                pass # Column already exists
                
            try:
                c.execute("ALTER TABLE users ADD COLUMN mobile TEXT UNIQUE;")
            except sqlite3.OperationalError:
                pass # Column already exists
                
            try:
                c.execute("ALTER TABLE chats ADD COLUMN user_id INTEGER;")
            except sqlite3.OperationalError:
                pass # Column already exists
                
            try:
                c.execute("ALTER TABLE messages ADD COLUMN image_path TEXT;")
            except sqlite3.OperationalError:
                pass # Column already exists
            
            conn.commit()
        except Error as e:
            print(e)
        finally:
            conn.close()

def create_chat(title, user_id):
    conn = create_connection()
    chat_id = None
    if conn is not None:
        try:
            sql = ''' INSERT INTO chats(title, user_id) VALUES(?,?) '''
            cur = conn.cursor()
            cur.execute(sql, (title, user_id))
            conn.commit()
            chat_id = cur.lastrowid
        except Error as e:
            print(e)
        finally:
            conn.close()
    return chat_id

def get_chats(user_id):
    conn = create_connection()
    chats = []
    if conn is not None:
        try:
            cur = conn.cursor()
            cur.execute("SELECT id, title, created_at FROM chats WHERE user_id=? ORDER BY created_at DESC", (user_id,))
            rows = cur.fetchall()
            for row in rows:
                chats.append({"id": row[0], "title": row[1], "created_at": row[2]})
        except Error as e:
            print(e)
        finally:
            conn.close()
    return chats

def add_message(chat_id, role, content, image_path=None):
    conn = create_connection()
    if conn is not None:
        try:
            sql = ''' INSERT INTO messages(chat_id, role, content, image_path) VALUES(?,?,?,?) '''
            cur = conn.cursor()
            cur.execute(sql, (chat_id, role, content, image_path))
            conn.commit()
        except Error as e:
            print(e)
        finally:
            conn.close()

def get_messages(chat_id):
    conn = create_connection()
    messages = []
    if conn is not None:
        try:
            cur = conn.cursor()
            cur.execute("SELECT role, content, image_path FROM messages WHERE chat_id=? ORDER BY created_at ASC", (chat_id,))
            rows = cur.fetchall()
            for row in rows:
                messages.append({"role": row[0], "content": row[1], "image_path": row[2]})
        except Error as e:
            print(e)
        finally:
            conn.close()
    return messages

def rename_chat(chat_id, new_title):
    conn = create_connection()
    if conn is not None:
        try:
            sql = ''' UPDATE chats SET title = ? WHERE id = ? '''
            cur = conn.cursor()
            cur.execute(sql, (new_title, chat_id))
            conn.commit()
        except Error as e:
            print(e)
        finally:
            conn.close()

# --- Auth Database Operations ---

def create_user(username, password_hash, salt):
    conn = create_connection()
    user_id = None
    if conn is not None:
        try:
            sql = ''' INSERT INTO users(username, password_hash, salt) VALUES(?,?,?) '''
            cur = conn.cursor()
            cur.execute(sql, (username, password_hash, salt))
            conn.commit()
            user_id = cur.lastrowid
        except Error as e:
            print("create_user db error:", e)
        finally:
            conn.close()
    return user_id

def get_user_by_username(username):
    conn = create_connection()
    user = None
    if conn is not None:
        try:
            cur = conn.cursor()
            cur.execute("SELECT id, username, password_hash, salt, created_at FROM users WHERE username = ?", (username,))
            row = cur.fetchone()
            if row:
                user = {
                    "id": row[0],
                    "username": row[1],
                    "password_hash": row[2],
                    "salt": row[3],
                    "created_at": row[4]
                }
        except Error as e:
            print("get_user_by_username db error:", e)
        finally:
            conn.close()
    return user

def get_user_by_id(user_id):
    conn = create_connection()
    user = None
    if conn is not None:
        try:
            cur = conn.cursor()
            cur.execute("SELECT id, username FROM users WHERE id = ?", (user_id,))
            row = cur.fetchone()
            if row:
                user = {
                    "id": row[0],
                    "username": row[1]
                }
        except Error as e:
            print("get_user_by_id db error:", e)
        finally:
            conn.close()
    return user

def create_session(token, user_id, expires_at):
    conn = create_connection()
    success = False
    if conn is not None:
        try:
            sql = ''' INSERT INTO sessions(token, user_id, expires_at) VALUES(?,?,?) '''
            cur = conn.cursor()
            cur.execute(sql, (token, user_id, expires_at.isoformat()))
            conn.commit()
            success = True
        except Error as e:
            print("create_session db error:", e)
        finally:
            conn.close()
    return success

def get_session(token):
    conn = create_connection()
    session = None
    if conn is not None:
        try:
            cur = conn.cursor()
            cur.execute("SELECT token, user_id, expires_at FROM sessions WHERE token = ?", (token,))
            row = cur.fetchone()
            if row:
                session = {
                    "token": row[0],
                    "user_id": row[1],
                    "expires_at": row[2]
                }
        except Error as e:
            print("get_session db error:", e)
        finally:
            conn.close()
    return session

def delete_session(token):
    conn = create_connection()
    success = False
    if conn is not None:
        try:
            sql = ''' DELETE FROM sessions WHERE token = ? '''
            cur = conn.cursor()
            cur.execute(sql, (token,))
            conn.commit()
            success = True
        except Error as e:
            print("delete_session db error:", e)
        finally:
            conn.close()
    return success

# --- OTP and Passwordless auth helper functions ---

def save_otp(contact, code, expires_at):
    conn = create_connection()
    success = False
    if conn is not None:
        try:
            cur = conn.cursor()
            # Mark previous OTPs for this contact as verified/expired
            cur.execute("UPDATE otps SET verified = 1 WHERE contact = ?", (contact,))
            
            # Save new OTP
            sql = ''' INSERT INTO otps(contact, code, expires_at) VALUES(?,?,?) '''
            cur.execute(sql, (contact, code, expires_at.isoformat()))
            conn.commit()
            success = True
        except Error as e:
            print("save_otp db error:", e)
        finally:
            conn.close()
    return success

def get_active_otp(contact):
    conn = create_connection()
    otp = None
    if conn is not None:
        try:
            cur = conn.cursor()
            cur.execute("SELECT code, expires_at FROM otps WHERE contact = ? AND verified = 0 ORDER BY id DESC LIMIT 1", (contact,))
            row = cur.fetchone()
            if row:
                otp = {
                    "code": row[0],
                    "expires_at": row[1]
                }
        except Error as e:
            print("get_active_otp db error:", e)
        finally:
            conn.close()
    return otp

def mark_otp_verified(contact, code):
    conn = create_connection()
    success = False
    if conn is not None:
        try:
            cur = conn.cursor()
            cur.execute("UPDATE otps SET verified = 1 WHERE contact = ? AND code = ?", (contact, code))
            conn.commit()
            success = True
        except Error as e:
            print("mark_otp_verified db error:", e)
        finally:
            conn.close()
    return success

def get_user_by_contact(contact):
    conn = create_connection()
    user = None
    if conn is not None:
        try:
            cur = conn.cursor()
            cur.execute("SELECT id, username, email, mobile, created_at FROM users WHERE email = ? OR mobile = ?", (contact, contact))
            row = cur.fetchone()
            if row:
                user = {
                    "id": row[0],
                    "username": row[1],
                    "email": row[2],
                    "mobile": row[3],
                    "created_at": row[4]
                }
        except Error as e:
            print("get_user_by_contact db error:", e)
        finally:
            conn.close()
    return user

def create_user_by_contact(contact, is_email):
    conn = create_connection()
    user_id = None
    if conn is not None:
        try:
            cur = conn.cursor()
            if is_email:
                sql = ''' INSERT INTO users(username, email) VALUES(?,?) '''
            else:
                sql = ''' INSERT INTO users(username, mobile) VALUES(?,?) '''
            cur.execute(sql, (contact, contact))
            conn.commit()
            user_id = cur.lastrowid
        except Error as e:
            print("create_user_by_contact db error:", e)
        finally:
            conn.close()
    return user_id
