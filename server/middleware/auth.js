import { User } from "../models/User.js"
import jwt from "jsonwebtoken"
// Middleware to protect routes



export const protectRoute = async(req, res, next) => {
  try {
    // Handle both token formats from frontend
    const token = req.headers.authorization?.split(' ')[1] || req.headers.token;
    
    console.log("Middleware - Token received:", token ? token.substring(0, 20) + "..." : "No token");
    
    if (!token) {
      console.log("Middleware - No token provided");
      return res.status(401).json({success: false, message: "Access denied. No token provided."});
    }
    
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Middleware - Token decoded, userId:", decode.userId);
    
    const user = await User.findById(decode.userId).select("-password");
    
    if (!user) {
      console.log("Middleware - User not found in database");
      return res.status(401).json({success: false, message: "User not found"});
    }
    
    console.log("Middleware - User found:", user._id);
    req.user = user;
    next();
    
  } catch (error) {
    console.log("Middleware error:", error.message);
    
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({success: false, message: "Token expired"});
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({success: false, message: "Invalid token"});
    }
    
    res.status(500).json({success: false, message: "Server error"});
  }
}

