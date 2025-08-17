import cloudinary from "../lib/cloudinary.js"
import { generateToken } from "../lib/token.js"
import { User } from "../models/User.js"
import bcrypt from "bcryptjs"

// Sign up a new user
export const signup = async(req, res) =>{
   try {
     const {fullName, password, email ,bio} = req.body
    if(!email || !password || !fullName || !bio){
        return res.json({success:false,message:"All fields are required"})
    }
    const existUser = await User.findOne({email})
    if(existUser){
        return res.json({success:false, message:"You are already have an account"})
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password,salt);

    const newUser = await User.create({
        fullName,
        email,
        password:hashedPassword,
        bio
    })

    const token = generateToken(newUser._id)
    res.json({success:true, userData:newUser, token, message:"User registered successfully!!"})
   } catch (error) {
    console.log(error.message)
    res.json({success:false, message:error.message})
   }


}

// Login User

export const login = async(req,res) =>{
    try {
        const {email,password} = req.body
        if(!email || !password){
            return res.json({success:false,message:"Enter all required fields"})
        }
        const userData = await User.findOne({email})
        const isPasswordCorrect = await bcrypt.compare(password, userData.password)

        if(!isPasswordCorrect){
            return res.json({success:false, message:"Credentials Invalid"})
        }

        const token = generateToken(userData._id)
        res.json({success:true, userData, token, message:"Login Successfully"})
    } catch (error) {
            console.log(error.message)
    res.json({success:false, message:error.message})
    }
}

// Controller to check is user is auntheticated or not

export const checkAuth = (req, res) => {
    console.log("CheckAuth - req.user:", req.user);
    
    if (!req.user) {
        return res.status(401).json({success: false, message: "User not authenticated"});
    }
    
    res.json({success: true, user: req.user});
}

// Controller to upadte user profile details

export const updateProfile = async(req,res) =>{
    try {
        const {profilePic, bio, fullName} = req.body
        const userId = req.user._id;
        let updatedUser;

        if(!profilePic){
           updatedUser =  await User.findByIdAndUpdate(userId, {bio, fullName}, {new:true})
        } else{
            const upload = await cloudinary.uploader.upload(profilePic)
            updatedUser = await User.findByIdAndUpdate(userId,{profilePic: upload.secure_url, bio, fullName}, {new:true} )
        }

        res.json({success:true, updatedUser})
    } catch (error) {
    console.log(error.message)
    res.json({success:false, message:error.message})
    }
}