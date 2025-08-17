import express from "express"
import { getMessages, getUsersForSideBar, markMessageAsSeen, sendMessage } from "../controller/message.controller.js"
import { protectRoute } from "../middleware/auth.js"

const messageRouter = express.Router()

messageRouter.get('/users', protectRoute ,getUsersForSideBar)
messageRouter.get('/:id', protectRoute ,getMessages)
messageRouter.put('/mark/:id', protectRoute ,markMessageAsSeen)
messageRouter.post("/send/:id", protectRoute, sendMessage)

export default messageRouter;