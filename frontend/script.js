// =============================================
// CAREER GUIDANCE CHATBOT - Frontend Script
// =============================================

const API_BASE = "http://localhost:5000";

// DOM Elements
const messagesContainer = document.getElementById("messagesContainer");
const welcomeScreen = document.getElementById("welcomeScreen");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const clearBtn = document.getElementById("clearBtn");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.getElementById("sidebar");
const mobileOverlay = document.getElementById("mobileOverlay");

// State
let sessionId = generateSessionId();
let isLoading = false;
let messageCount = 0;

// =============================================
// UTILITIES
// =============================================

function generateSessionId() {
  return "session_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
}

function scrollToBottom() {
  setTimeout(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 50);
}

function setLoading(loading) {
  isLoading = loading;
  sendBtn.disabled = loading || messageInput.value.trim() === "";
  messageInput.disabled = loading;
}

// =============================================
// MARKDOWN-LITE RENDERER
// =============================================

function renderMarkdown(text) {
  return text
    // Bold **text**
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic *text*
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Inline code `code`
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Headers ## and ###
    .replace(/^### (.+)$/gm, "<h4 style='color:var(--accent-secondary);margin:10px 0 4px;font-size:0.9em;'>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3 style='color:var(--accent-secondary);margin:12px 0 6px;font-size:1em;'>$1</h3>")
    // Unordered lists
    .replace(/^[\-\*] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Line breaks
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    // Wrap in paragraph
    .replace(/^(.)/s, "<p>$1")
    .replace(/(.)$/s, "$1</p>");
}

// =============================================
// MESSAGE RENDERING
// =============================================

function hideWelcomeScreen() {
  if (welcomeScreen && welcomeScreen.parentNode) {
    welcomeScreen.style.animation = "fadeOut 0.2s ease forwards";
    setTimeout(() => {
      if (welcomeScreen.parentNode) {
        welcomeScreen.remove();
      }
    }, 200);
  }
}

function addMessage(role, content) {
  if (messageCount === 0) hideWelcomeScreen();
  messageCount++;

  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", role);

  const avatarDiv = document.createElement("div");
  avatarDiv.classList.add("message-avatar");

  if (role === "user") {
    avatarDiv.textContent = "You";
  } else {
    avatarDiv.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      </svg>
    `;
  }

  const bubbleDiv = document.createElement("div");
  bubbleDiv.classList.add("message-bubble");

  if (role === "user") {
    bubbleDiv.textContent = content;
  } else {
    bubbleDiv.innerHTML = renderMarkdown(content);
  }

  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(bubbleDiv);
  messagesContainer.appendChild(messageDiv);

  scrollToBottom();
  return messageDiv;
}

function addTypingIndicator() {
  if (messageCount === 0) hideWelcomeScreen();

  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", "ai");
  messageDiv.id = "typingIndicator";

  const avatarDiv = document.createElement("div");
  avatarDiv.classList.add("message-avatar");
  avatarDiv.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    </svg>
  `;

  const bubbleDiv = document.createElement("div");
  bubbleDiv.classList.add("message-bubble");
  bubbleDiv.innerHTML = `
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;

  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(bubbleDiv);
  messagesContainer.appendChild(messageDiv);
  scrollToBottom();
}

function removeTypingIndicator() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.remove();
}

// =============================================
// API CALL
// =============================================

async function sendMessage(message) {
  if (!message.trim() || isLoading) return;

  // Add user message
  addMessage("user", message);
  messageInput.value = "";
  messageInput.style.height = "auto";
  sendBtn.disabled = true;

  // Show typing indicator
  setLoading(true);
  addTypingIndicator();

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sessionId }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Server error");
    }

    const data = await response.json();
    removeTypingIndicator();
    addMessage("ai", data.reply);

    // Update sessionId if returned
    if (data.sessionId) sessionId = data.sessionId;
  } catch (error) {
    removeTypingIndicator();
    addMessage(
      "ai",
      "⚠️ **Connection Error**\n\nI couldn't connect to the server. Please make sure the backend is running on port 5000 and try again."
    );
    console.error("API Error:", error);
  } finally {
    setLoading(false);
    messageInput.focus();
  }
}

// =============================================
// EVENT LISTENERS
// =============================================

// Send on button click
sendBtn.addEventListener("click", () => {
  sendMessage(messageInput.value.trim());
});

// Send on Enter (Shift+Enter for new line)
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) sendMessage(messageInput.value.trim());
  }
});

// Enable/disable send button based on input
messageInput.addEventListener("input", () => {
  sendBtn.disabled = messageInput.value.trim() === "" || isLoading;

  // Auto-resize textarea
  messageInput.style.height = "auto";
  messageInput.style.height = Math.min(messageInput.scrollHeight, 160) + "px";
});

// Starter chips & topic buttons
document.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip, .topic-btn");
  if (chip) {
    const prompt = chip.getAttribute("data-prompt");
    if (prompt) {
      // Close sidebar on mobile
      closeSidebar();
      sendMessage(prompt);
    }
  }
});

// New Chat button
newChatBtn.addEventListener("click", () => {
  resetChat();
  closeSidebar();
});

// Clear button
clearBtn.addEventListener("click", () => {
  if (messageCount > 0 && confirm("Clear this conversation?")) {
    resetChat();
  }
});

// Mobile sidebar toggle
mobileMenuBtn.addEventListener("click", openSidebar);
mobileOverlay.addEventListener("click", closeSidebar);

// =============================================
// SIDEBAR CONTROLS
// =============================================

function openSidebar() {
  sidebar.classList.add("open");
  mobileOverlay.classList.add("active");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  mobileOverlay.classList.remove("active");
}

// =============================================
// RESET / NEW CHAT
// =============================================

function resetChat() {
  // Clear conversation from server
  fetch(`${API_BASE}/session/${sessionId}`, { method: "DELETE" }).catch(() => {});

  // Reset state
  sessionId = generateSessionId();
  messageCount = 0;
  setLoading(false);

  // Clear DOM messages
  messagesContainer.innerHTML = "";

  // Re-add welcome screen
  const welcome = createWelcomeScreen();
  messagesContainer.appendChild(welcome);
}

function createWelcomeScreen() {
  const div = document.createElement("div");
  div.className = "welcome-screen";
  div.id = "welcomeScreen";
  div.innerHTML = `
    <div class="welcome-icon">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>
    </div>
    <h2 class="welcome-title">Welcome to CareerGuide AI</h2>
    <p class="welcome-subtitle">
      Your intelligent career mentor — here to help you explore paths,
      land opportunities, and build the career you deserve.
    </p>
    <div class="starter-chips">
      <button class="chip" data-prompt="I'm a fresh graduate. How do I start my career?">🎓 I'm a fresh graduate</button>
      <button class="chip" data-prompt="I feel stuck in my current job. What should I do?">😔 Feeling stuck in my job</button>
      <button class="chip" data-prompt="How do I get into the tech industry?">💻 Breaking into tech</button>
      <button class="chip" data-prompt="What are the highest paying careers in 2025?">💰 High-paying careers</button>
      <button class="chip" data-prompt="How do I network effectively and build professional connections?">🤝 Networking tips</button>
      <button class="chip" data-prompt="I want to start my own business. Where do I begin?">🚀 Start a business</button>
    </div>
  `;
  return div;
}

// =============================================
// INIT
// =============================================
messageInput.focus();

// Add subtle fade-out keyframe dynamically
const style = document.createElement("style");
style.textContent = `@keyframes fadeOut { to { opacity: 0; transform: translateY(-10px); } }`;
document.head.appendChild(style);
