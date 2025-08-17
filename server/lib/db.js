import mongoose from "mongoose";

export const dbConnection = async() =>{
    try {
        mongoose.connection.on('connected', () => 
            console.log("Database Connected"))
        await mongoose.connect(`${process.env.MONGO_URI}/chat-app`)
    } catch (error) {
        console.log(error)
    }
}