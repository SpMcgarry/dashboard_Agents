import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { LoginInput, RegisterInput, UserProfileInput } from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Secret for JWT (in production this would be an environment variable)
const JWT_SECRET = "your_jwt_secret_key";

// User Session type
export interface UserSession {
  id: number;
  username: string;
  role: string;
}

// User registration
export async function registerUser(userData: RegisterInput) {
  // Check if user already exists
  const existingUser = await storage.getUserByUsername(userData.username);
  if (existingUser) {
    throw new Error("Username already taken");
  }
  
  // Check if email already exists
  const existingEmail = await storage.getUserByEmail(userData.email);
  if (existingEmail) {
    throw new Error("Email already in use");
  }
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);
  
  // Create new user with hashed password (exclude confirmPassword)
  const { confirmPassword, ...userDataToSave } = userData;
  const newUser = await storage.createUser({
    ...userDataToSave,
    password: hashedPassword
  });
  
  return {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    fullName: newUser.fullName,
    role: newUser.role
  };
}

// User login
export async function loginUser(credentials: LoginInput) {
  // Find user
  const user = await storage.getUserByUsername(credentials.username);
  if (!user) {
    throw new Error("Invalid username or password");
  }
  
  // Check password
  const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid username or password");
  }
  
  // Update last login time
  await storage.updateUserLogin(user.id);
  
  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "1d" }
  );
  
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    }
  };
}

// Authentication middleware
export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Get token from header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as UserSession;
    
    // Add user to request object
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Update user profile
export async function updateUserProfile(userId: number, profileData: UserProfileInput) {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error("User not found");
  }
  
  const updatedUser = await storage.updateUser(userId, profileData);
  
  return {
    id: updatedUser?.id,
    username: updatedUser?.username,
    email: updatedUser?.email,
    fullName: updatedUser?.fullName,
    role: updatedUser?.role
  };
}

// Change password
export async function changeUserPassword(userId: number, currentPassword: string, newPassword: string) {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error("User not found");
  }
  
  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new Error("Current password is incorrect");
  }
  
  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  
  // Update password
  await storage.changePassword(userId, hashedPassword);
  
  return true;
}

// Get current user profile
export async function getCurrentUser(userId: number) {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error("User not found");
  }
  
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatar: user.avatar,
    lastLogin: user.lastLogin,
    isActive: user.isActive,
    created: user.created
  };
}