import cloudinary from "../lib/cloudinary.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { io, userSocketMap } from "../server.js";


// Get all user except logged in

export const getUsersForSideBar = async (req, res) => {
    try {
            const userId = req.user._id;
    const filteredUsers = await User.find({_id: {$ne: userId}}).select("-password")

    // Count no of msg not seen
    const unseenMessages = {}
    const promises = filteredUsers.map(async (user) => {
        const messages = await Message.find({senderId:user._id, recieverId:userId, seen:false})
        if(messages.length > 0){
            unseenMessages[user._id] = messages.length
        }
    })
    await Promise.all(promises)
    res.json({success:true, filteredUsers, unseenMessages})
    } catch (error) {
        console.log(error.message)
        res.json({success:false, messages:error.message})
    }
}

// Get all messages from selected users

export const getMessages = async (req, res) =>{
    try {
        const{id: selectedUserId} = req.params
        const myId = req.user._id

        const messages = await Message.find({
            $or: [
                {senderId:myId, recieverId:selectedUserId},
                {senderId:selectedUserId, recieverId:myId}
            ]
        })

        await Message.updateMany({senderId:selectedUserId, recieverId:myId}, {seen:true})

        res.json({success:true, messages:messages})
        
    } catch (error) {
         console.log(error.message)
        res.json({success:false, messages:error.message})    
    }
}

// Api to mark message sas seen using message id

export const markMessageAsSeen = async (req, res) =>{
    try {
        const {id} = req.params
        await Message.findByIdAndUpdate(id, {seen:true})
        res.json({success:true, })
    } catch (error) {
        console.log(error.message)
        res.json({success:false, messages:error.message})    
    }
}

// send message to the selected user

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body
        const recieverId = req.params.id
        const senderId = req.user._id // from middleware
        
        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;
        }
        
        const newMessage = await Message.create({
            senderId,
            recieverId,
            text,           // ✅ Added missing text field
            image: imageUrl
        })
        
        // Emit the new message to the receiver's socket
        const recieverSocketId = userSocketMap[recieverId];
        if (recieverSocketId) {  // ✅ Fixed: check socket exists, not just recieverId
            io.to(recieverSocketId).emit("newMessage", newMessage)  // ✅ Fixed: case-sensitive event name
        }
        
        res.json({ success: true, newMessage })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })  // ✅ Changed 'messages' to 'message' for consistency
    }

}