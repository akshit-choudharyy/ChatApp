import express from "express"
import cors from "cors"
import "dotenv/config"
import http from "http"
import { dbConnection } from "./lib/db.js"
import userRouter from "./routes/user.routes.js"
import messageRouter from "./routes/message.route.js"
import { Server } from "socket.io"

// Create express and Http server
const app = express()
const server = http.createServer(app)

// Initialize socket.io server
export const io = new Server(server, {
  cors: {
    origin: "*"
  }
})

// Store Online users
export const userSocketMap = {} // { userId : socketId }

// Socket IO Connection Handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId
  console.log("User Connected:", userId)

  if (userId) userSocketMap[userId] = socket.id

  // Emit online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap))

  socket.on("disconnect", () => {
    console.log("User disconnected:", userId)
    delete userSocketMap[userId]
    io.emit("getOnlineUsers", Object.keys(userSocketMap))
  })
})

// Middleware Setup
app.use(express.json({ limit: "4mb" }))
app.use(cors())

const PORT = process.env.PORT || 5001

// Connect to the Database
await dbConnection()

// Routes Setup
app.use("/api/status", (req, res) => res.send("Server is live"))
app.use("/api/auth", userRouter)
app.use("/api/messages", messageRouter)


if(process.env.NODE_DEV !== "production"){
    server.listen(PORT, () =>
  console.log(`Server is running on port ${PORT}`)
)
}

export default server

