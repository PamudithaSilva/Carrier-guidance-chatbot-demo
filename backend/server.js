require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Career guidance system prompt
const SYSTEM_PROMPT = `You are CareerGuide AI, an expert career counselor and mentor with deep knowledge in:
- Career exploration and planning across all industries and sectors
- Resume writing, LinkedIn optimization, and personal branding
- Interview preparation, mock interviews, and negotiation tips
- Higher education guidance (degrees, certifications, bootcamps)
- Skills gap analysis and learning roadmaps
- Job search strategies and networking
- Internships, freelancing, and entrepreneurship
- Career transitions and pivots
- Workplace challenges and professional development

Your personality:
- Warm, encouraging, and empathetic
- Practical and action-oriented — give specific, actionable advice
- Honest about challenges while staying motivational
- Tailor advice to the user's unique situation
- Ask clarifying questions when needed to give better advice
- Use bullet points and structured formatting for clarity

Always start by understanding the user's current situation before giving advice. Keep responses concise yet comprehensive.`;

// In-memory session store (conversation history per session)
const sessions = {};

// Test route
app.get("/", (req, res) => {
  res.send("Career Guidance Chatbot Backend is running 🚀");
});

// Chat API with conversation history
app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const sid = sessionId || "default";

    // Initialize session history if not exists
    if (!sessions[sid]) {
      sessions[sid] = [];
    }

    // Add user message to history
    sessions[sid].push({
      role: "user",
      parts: [{ text: message }],
    });

    // Start chat with history
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [
            {
              text: "Hello! I'm CareerGuide AI, your personal career counselor. I'm here to help you navigate your career journey — whether you're just starting out, looking to grow, or considering a change. What can I help you with today?",
            },
          ],
        },
        ...sessions[sid].slice(0, -1), // all history except latest user message
      ],
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    // Add assistant reply to history
    sessions[sid].push({
      role: "model",
      parts: [{ text: reply }],
    });

    // Keep session history manageable (last 20 exchanges)
    if (sessions[sid].length > 40) {
      sessions[sid] = sessions[sid].slice(-40);
    }

    res.json({ reply, sessionId: sid });
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    res.status(500).json({
      error: "Failed to get response from AI. Please try again.",
    });
  }
});

// Clear session
app.delete("/session/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  delete sessions[sessionId];
  res.json({ message: "Session cleared" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
