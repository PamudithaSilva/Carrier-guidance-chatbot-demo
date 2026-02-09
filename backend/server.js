require("dotenv").config()
const express = require("express")
const cors = require("cors")

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())

// Test route
app.get("/", (req, res) => {
  res.send("Career Guidance Chatbot Backend is running 🚀")
})

// Chat API
app.post("/chat", (req, res) => {
  const userMessage = req.body.message

  console.log("User message:", userMessage)

  res.json({
    reply: `You said: ${userMessage}`
  })
})


// Start server
const PORT = 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})


