const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');
const historyList = document.getElementById('history-list');
const newChatBtn = document.getElementById('new-chat-btn');
const welcomeMessage = document.getElementById('welcome-message');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');

// Image upload elements
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image-btn');

// Landing screen & Auth elements
const landingScreen = document.getElementById('landing-screen');
const landingTitle = document.getElementById('landing-title');
const landingSubtitle = document.getElementById('landing-subtitle');
const enterBtn = document.getElementById('enter-btn');
const authCard = document.getElementById('auth-card');
const appContainer = document.getElementById('app-container');
const logoutBtn = document.getElementById('logout-btn');

let welcomeState = 'welcome'; // 'welcome', 'auth', 'transitioning'

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');

const authForm = document.getElementById('auth-form');
const authUsernameInput = document.getElementById('auth-username');
const authPasswordInput = document.getElementById('auth-password');
const authError = document.getElementById('auth-error');
const authSuccess = document.getElementById('auth-success');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authBtnText = document.getElementById('auth-btn-text');

let authMode = 'login'; // 'login' or 'register'

const userAvatar = document.getElementById('user-avatar');
const userUsername = document.getElementById('user-username');

let currentChatId = null;
let selectedImage = null;
let currentUser = null;

// --- Authentication Controllers ---

async function checkAuthStatus(immediate = false) {
    try {
        const res = await fetch('/api/auth/me');
        if (res.status === 200) {
            currentUser = await res.json();
            
            // Set user profile in sidebar
            if (userUsername) userUsername.textContent = currentUser.username;
            if (userAvatar) userAvatar.textContent = currentUser.username.substring(0, 1).toUpperCase();
            
            // If logged in, skip/exit landing overlay
            if (immediate) {
                landingScreen.style.display = 'none';
                appContainer.classList.remove('hidden');
                appContainer.classList.add('show');
            } else {
                welcomeState = 'transitioning';
                const room = document.getElementById('room');
                if (room) {
                    room.style.transition = 'transform 1.2s cubic-bezier(0.7, 0, 0.3, 1), opacity 1s ease';
                    room.style.transform = 'translate3d(0, 0, 800px) rotateX(0deg) rotateY(0deg)';
                }
                landingScreen.classList.add('exit');
                appContainer.classList.remove('hidden');
                void appContainer.offsetWidth; // force reflow
                appContainer.classList.add('show');
                setTimeout(() => {
                    landingScreen.style.display = 'none';
                }, 1200);
            }
            
            loadChats();
            createNewChat();
        } else {
            handleUnauthenticated();
        }
    } catch (e) {
        handleUnauthenticated();
    }
}

function handleUnauthenticated() {
    currentUser = null;
    currentChatId = null;
    welcomeState = 'welcome';
    authMode = 'login';
    
    // Reset inputs & messages
    if (authUsernameInput) authUsernameInput.value = '';
    if (authPasswordInput) authPasswordInput.value = '';
    if (authError) authError.style.display = 'none';
    if (authSuccess) authSuccess.style.display = 'none';
    
    // Reset tab headers
    if (tabLogin) tabLogin.classList.add('active');
    if (tabRegister) tabRegister.classList.remove('active');
    if (authBtnText) authBtnText.textContent = 'Sign In';
    if (authPasswordInput) authPasswordInput.placeholder = 'Alphanumeric (6 chars)';
    
    // Reset welcome screen elements to default state
    if (landingTitle) {
        landingTitle.classList.remove('shifted');
        landingTitle.style.transform = '';
    }
    if (landingSubtitle) {
        landingSubtitle.classList.remove('shifted');
        landingSubtitle.style.transform = '';
    }
    if (enterBtn) {
        enterBtn.classList.remove('hidden');
        enterBtn.style.transform = '';
    }
    if (authCard) {
        authCard.classList.remove('visible');
        authCard.style.transform = '';
        authCard.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.8s';
    }
    const room = document.getElementById('room');
    if (room) {
        room.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        room.style.transform = 'translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg)';
    }
    
    // Clear cookie & memory, return to login overlay
    appContainer.classList.remove('show');
    appContainer.classList.add('hidden');
    landingScreen.style.display = 'flex';
    void landingScreen.offsetWidth; // force reflow
    landingScreen.classList.remove('exit');
}

// Client Side Form Validation helper
function validateCredentials(email, password) {
    const isGmail = email.toLowerCase().endsWith('@gmail.com');
    const is6Chars = password.length === 6;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    
    if (!isGmail) {
        return "Gmail address must be valid and end with @gmail.com";
    }
    if (!is6Chars || !hasLetter || !hasDigit) {
        return "Password must be exactly 6 characters long and contain both letters and numbers";
    }
    return null;
}

// Unified Form Submit
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        authError.style.display = 'none';
        authSuccess.style.display = 'none';
        
        const username = authUsernameInput.value.trim();
        const password = authPasswordInput.value.trim();
        
        // Front-end check
        const validationError = validateCredentials(username, password);
        if (validationError) {
            authError.textContent = validationError;
            authError.style.display = 'block';
            return;
        }
        
        if (authMode === 'login') {
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (res.ok) {
                    authUsernameInput.value = '';
                    authPasswordInput.value = '';
                    checkAuthStatus(false);
                } else {
                    authError.textContent = data.detail || 'Invalid Gmail or password.';
                    authError.style.display = 'block';
                }
            } catch (err) {
                authError.textContent = 'Connection error. Please try again.';
                authError.style.display = 'block';
            }
        } else {
            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (res.ok) {
                    authSuccess.style.display = 'block';
                    authUsernameInput.value = '';
                    authPasswordInput.value = '';
                    // Switch to login tab
                    setTimeout(() => {
                        tabLogin.click();
                    }, 1500);
                } else {
                    authError.textContent = data.detail || 'Registration failed.';
                    authError.style.display = 'block';
                }
            } catch (err) {
                authError.textContent = 'Connection error. Please try again.';
                authError.style.display = 'block';
            }
        }
    });
}

// Wire up logout button
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error("Logout failed on server");
        }
        handleUnauthenticated();
    });
}

// Auth Tabs Toggle logic (Zero layout-shift state changes)
if (tabLogin && tabRegister) {
    tabLogin.addEventListener('click', () => {
        if (authMode === 'login') return;
        authMode = 'login';
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        if (authBtnText) authBtnText.textContent = 'Sign In';
        if (authError) authError.style.display = 'none';
        if (authSuccess) authSuccess.style.display = 'none';
        if (authPasswordInput) authPasswordInput.placeholder = 'Alphanumeric (6 chars)';
    });
    
    tabRegister.addEventListener('click', () => {
        if (authMode === 'register') return;
        authMode = 'register';
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        if (authBtnText) authBtnText.textContent = 'Create Account';
        if (authError) authError.style.display = 'none';
        if (authSuccess) authSuccess.style.display = 'none';
        if (authPasswordInput) authPasswordInput.placeholder = 'Alphanumeric (6 chars)';
    });
}

// --- Theme Toggle Logic ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if (themeIcon) themeIcon.textContent = '🌙';
        if (themeText) themeText.textContent = 'Dark Mode';
    }
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        
        if (isLight) {
            localStorage.setItem('theme', 'light');
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Dark Mode';
        } else {
            localStorage.setItem('theme', 'dark');
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Light Mode';
        }
    });
}

initTheme();

// --- Image Upload Listeners ---
if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            selectedImage = this.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreviewContainer.style.display = 'block';
            }
            reader.readAsDataURL(selectedImage);
            sendBtn.disabled = false;
        }
    });

    removeImageBtn.addEventListener('click', () => {
        selectedImage = null;
        fileInput.value = '';
        imagePreviewContainer.style.display = 'none';
        imagePreview.src = '';
        sendBtn.disabled = messageInput.value.trim() === '';
    });
}

// Adjust textarea height automatically
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    sendBtn.disabled = this.value.trim() === '' && !selectedImage;
});

messageInput.addEventListener('focus', () => {
    document.body.classList.add('input-focused');
});

messageInput.addEventListener('blur', () => {
    document.body.classList.remove('input-focused');
});

messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);
newChatBtn.addEventListener('click', createNewChat);

// --- Chat Operations ---

async function loadChats() {
    try {
        const res = await fetch('/api/chats');
        if (res.status === 401) {
            handleUnauthenticated();
            return;
        }
        const chats = await res.json();
        historyList.innerHTML = '';
        chats.forEach(chat => {
            const div = document.createElement('div');
            div.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'history-item-title';
            titleSpan.textContent = chat.title;
            titleSpan.onclick = () => loadChat(chat.id);
            
            const renameBtn = document.createElement('button');
            renameBtn.className = 'rename-btn';
            renameBtn.innerHTML = '✎';
            renameBtn.title = "Rename chat";
            renameBtn.onclick = (e) => {
                e.stopPropagation();
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'rename-input';
                input.value = chat.title;
                input.onclick = (ev) => ev.stopPropagation();
                
                input.onkeydown = async (ev) => {
                    if (ev.key === 'Enter') {
                        ev.preventDefault();
                        const newTitle = input.value.trim();
                        if (newTitle && newTitle !== chat.title) {
                            try {
                                const response = await fetch(`/api/chats/${chat.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ title: newTitle })
                                });
                                if (response.status === 401) {
                                    handleUnauthenticated();
                                    return;
                                }
                            } catch(err) {
                                console.error("Rename failed");
                            }
                        }
                        loadChats();
                    } else if (ev.key === 'Escape') {
                        loadChats();
                    }
                };
                
                input.onblur = () => loadChats();
                
                div.innerHTML = '';
                div.appendChild(input);
                input.focus();
            };
            
            div.appendChild(titleSpan);
            div.appendChild(renameBtn);
            historyList.appendChild(div);
        });
    } catch (e) {
        console.error("Failed to load chats API");
    }
}

async function createNewChat() {
    currentChatId = null;
    chatMessages.innerHTML = getWelcomeHTML();
    initSuggestionCards();
    updateSidebarSelection();
}

function updateSidebarSelection() {
    document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
    loadChats();
}

async function loadChat(chatId) {
    currentChatId = chatId;
    updateSidebarSelection();
    
    try {
        const res = await fetch(`/api/chats/${chatId}`);
        if (res.status === 401) {
            handleUnauthenticated();
            return;
        }
        const messages = await res.json();
        
        chatMessages.innerHTML = '';
        if (messages.length === 0) {
            chatMessages.innerHTML = getWelcomeHTML();
            initSuggestionCards();
        } else {
            messages.forEach(m => {
                const imgUrl = m.image_path ? `/${m.image_path}` : null;
                appendMessage(m.role, m.content, imgUrl);
            });
            scrollToBottom();
        }
    } catch(e) {
        console.error("Failed to load chat messages");
    }
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text && !selectedImage) return;
    
    const currentText = text || "Attached Image";

    // Disable input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendBtn.disabled = true;
    imagePreviewContainer.style.display = 'none';
    
    // Store image for rendering
    const fileToSend = selectedImage;
    const localImageSrc = imagePreview.src;
    
    selectedImage = null;
    fileInput.value = '';
    imagePreview.src = '';
    
    if (document.getElementById('welcome-message')) {
        document.getElementById('welcome-message').remove();
    }
    
    // If no chat selected, create one based on message title
    if (!currentChatId) {
        const title = text ? (text.substring(0, 30) + (text.length > 30 ? '...' : '')) : 'Image Chat';
        try {
            const res = await fetch('/api/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });
            if (res.status === 401) {
                handleUnauthenticated();
                return;
            }
            const data = await res.json();
            currentChatId = data.id;
            loadChats(); // refresh sidebar
        } catch(e) {
            console.error("Failed creating chat");
            return;
        }
    }
    
    // Append user message
    appendMessage('user', currentText, fileToSend ? localImageSrc : null);
    scrollToBottom();
    
    // Show typing indicator
    const indicatorId = 'typing-' + Date.now();
    appendTypingIndicator(indicatorId);
    scrollToBottom();
    
    // Send to API via FormData
    try {
        const formData = new FormData();
        formData.append('content', currentText);
        if (fileToSend) {
            formData.append('image', fileToSend);
        }

        const res = await fetch(`/api/chats/${currentChatId}/messages`, {
            method: 'POST',
            body: formData
        });
        if (res.status === 401) {
            handleUnauthenticated();
            return;
        }
        const data = await res.json();
        
        // Remove typing
        const typingEl = document.getElementById(indicatorId);
        if(typingEl) typingEl.remove();
        
        // Append bot message
        appendMessage('assistant', data.content);
        scrollToBottom();
    } catch(e) {
        const typingEl = document.getElementById(indicatorId);
        if(typingEl) typingEl.innerHTML = "Error getting response.";
    }
}

function appendMessage(role, content, imageSrc = null) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? (currentUser ? currentUser.username.substring(0,1).toUpperCase() : 'U') : 'AI';
    
    const contentContainer = document.createElement('div');
    contentContainer.className = 'message-content';
    
    if (imageSrc) {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.className = 'message-image';
        contentContainer.appendChild(img);
    }
    
    const textDiv = document.createElement('div');
    
    if (role === 'assistant' || role === 'model') {
        textDiv.innerHTML = marked.parse(content);
        textDiv.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    } else {
        textDiv.textContent = content; // User text escapes HTML
    }
    
    contentContainer.appendChild(textDiv);
    
    if (role === 'user') {
        div.appendChild(contentContainer);
        div.appendChild(avatar);
    } else {
        div.appendChild(avatar);
        div.appendChild(contentContainer);
    }
    
    chatMessages.appendChild(div);
}

function appendTypingIndicator(id) {
    const div = document.createElement('div');
    div.className = 'message assistant';
    div.id = id;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'AI';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content typing-indicator';
    contentDiv.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    
    div.appendChild(avatar);
    div.appendChild(contentDiv);
    
    chatMessages.appendChild(div);
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Welcome HTML generator & Suggestions Tilt Logic
function getWelcomeHTML() {
    return `
        <div class="welcome-message" id="welcome-message">
            <div class="welcome-header">
                <h1>How can I help you today?</h1>
                <p class="subtitle">Select a prompt below or type a message to start chatting with Aero Ai.</p>
            </div>
            <div class="suggestions-grid">
                <div class="suggestion-card" data-prompt="Analyze an image and describe its contents in detail.">
                    <div class="card-icon">👁️</div>
                    <h3>Analyze Image</h3>
                    <p>Upload a photo and let Aero Ai explain what's inside.</p>
                </div>
                <div class="suggestion-card" data-prompt="Write a Python function to check if a string is a palindrome, including unit tests.">
                    <div class="card-icon">💻</div>
                    <h3>Python Coding</h3>
                    <p>Ask for code help, debugging, or script generation.</p>
                </div>
                <div class="suggestion-card" data-prompt="Explain the difference between classical mechanics and quantum mechanics in simple terms.">
                    <div class="card-icon">🧠</div>
                    <h3>Explain Physics</h3>
                    <p>Break down complex science or mathematical theories.</p>
                </div>
                <div class="suggestion-card" data-prompt="Draft a professional email requesting a meeting with a client to discuss a new project.">
                    <div class="card-icon">✉️</div>
                    <h3>Draft Email</h3>
                    <p>Write emails, blogs, or essays with professional formatting.</p>
                </div>
            </div>
        </div>
    `;
}

function initSuggestionCards() {
    const cards = document.querySelectorAll('.suggestion-card');
    cards.forEach(card => {
        // Click action to auto-send prompt
        card.addEventListener('click', () => {
            const prompt = card.getAttribute('data-prompt');
            messageInput.value = prompt;
            messageInput.dispatchEvent(new Event('input')); // Adjust height
            sendMessage();
        });

        // 3D Tilt Effect - Cache bounding rect on enter to avoid layout thrashing
        let rect = null;
        card.addEventListener('mouseenter', () => {
            rect = card.getBoundingClientRect();
        });

        card.addEventListener('mousemove', (e) => {
            if (!rect) {
                rect = card.getBoundingClientRect();
            }
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((centerY - y) / centerY) * 8;
            const rotateY = ((x - centerX) / centerX) * 8;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) translateZ(15px)`;
        });

        card.addEventListener('mouseleave', () => {
            rect = null;
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) translateZ(0px)';
        });
    });
}

// Generate 3D ambient floating sparks inside the room
function createSparks(container) {
    const sparkCount = 18;
    for (let i = 0; i < sparkCount; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        
        // Random layout coordinates
        const left = Math.random() * 100; // in %
        const top = Math.random() * 100;  // in %
        const zDepth = -200 + Math.random() * 400; // translateZ between -200px and 200px
        const driftX = -40 + Math.random() * 80;   // drift range X
        const driftY = -40 + Math.random() * 80;   // drift range Y
        const size = 2 + Math.random() * 4;        // size 2px to 6px
        const duration = 12 + Math.random() * 18;  // animation duration 12s to 30s
        
        spark.style.left = `${left}%`;
        spark.style.top = `${top}%`;
        spark.style.width = `${size}px`;
        spark.style.height = `${size}px`;
        spark.style.setProperty('--z-depth', `${zDepth}px`);
        spark.style.setProperty('--drift-x', `${driftX}px`);
        spark.style.setProperty('--drift-y', `${driftY}px`);
        spark.style.animationDuration = `${duration}s`;
        
        container.appendChild(spark);
    }
}

// 3D Landing Screen Title Mouse Tilt & Enter Transition Logic
function initLandingScreen() {
    const room = document.getElementById('room');
    if (landingScreen && room) {
        // Generate sparks on landing load
        createSparks(room);

        landingScreen.addEventListener('mousemove', (e) => {
            if (welcomeState === 'transitioning') return;
            
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            const mouseX = e.clientX - width / 2;
            const mouseY = e.clientY - height / 2;
            
            // Calculate pitch (X) and yaw (Y) rotations
            const rX = -(mouseY / (height / 2)) * 10;
            const rY = (mouseX / (width / 2)) * 12;
            
            let baseTranslate = 'translate3d(0, 0, 0)';
            if (welcomeState === 'auth') {
                baseTranslate = 'translate3d(0, 0, 55px)';
            }
            
            room.style.transform = `rotateX(${rX}deg) rotateY(${rY}deg) ${baseTranslate}`;
            
            // Set relative cursor position for CSS grid spotlight glow (0% to 100%)
            const percentX = (e.clientX / width) * 100;
            const percentY = (e.clientY / height) * 100;
            room.style.setProperty('--mouse-x', `${percentX}%`);
            room.style.setProperty('--mouse-y', `${percentY}%`);
        });
        
        landingScreen.addEventListener('mouseleave', () => {
            if (welcomeState === 'transitioning') return;
            
            let baseTranslate = 'translate3d(0, 0, 0)';
            if (welcomeState === 'auth') {
                baseTranslate = 'translate3d(0, 0, 55px)';
            }
            room.style.transform = `rotateX(0deg) rotateY(0deg) ${baseTranslate}`;
            room.style.setProperty('--mouse-x', '50%');
            room.style.setProperty('--mouse-y', '50%');
        });
    }

    // Enter Button click transition logic
    if (enterBtn) {
        enterBtn.addEventListener('click', () => {
            if (currentUser) {
                // Already authenticated: Go straight to the chat workspace
                welcomeState = 'transitioning';
                
                // Camera fly-through zoom animation
                if (room) {
                    room.style.transition = 'transform 1.2s cubic-bezier(0.7, 0, 0.3, 1), opacity 1s ease';
                    room.style.transform = 'translate3d(0, 0, 800px) rotateX(0deg) rotateY(0deg)';
                }
                
                landingScreen.classList.add('exit');
                appContainer.classList.remove('hidden');
                void appContainer.offsetWidth; // force reflow
                appContainer.classList.add('show');
                setTimeout(() => {
                    landingScreen.style.display = 'none';
                }, 1200);
            } else {
                // Unauthenticated: Slide to Auth Card view
                welcomeState = 'transitioning';
                
                // Add shifted classes to trigger CSS 3D translations
                if (landingTitle) landingTitle.classList.add('shifted');
                if (landingSubtitle) landingSubtitle.classList.add('shifted');
                enterBtn.classList.add('hidden');
                
                // Slide in auth card
                if (authCard) {
                    authCard.classList.add('visible');
                }
                
                // Zoom camera in 3D
                if (room) {
                    room.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                    room.style.transform = 'translate3d(0, 0, 55px) rotateX(0deg) rotateY(0deg)';
                }
                
                // Restore interactive mouse-tilt responsiveness after transition finishes
                setTimeout(() => {
                    welcomeState = 'auth';
                    if (room) {
                        room.style.transition = 'none';
                    }
                    if (authCard) {
                        // Crucial: remove CSS transform transition so that JS mouse-tilt doesn't jitter
                        authCard.style.transition = 'opacity 0.8s ease, visibility 0.8s';
                    }
                }, 800);
            }
        });
    }
}

// Initial load check
checkAuthStatus(true);
initLandingScreen();
