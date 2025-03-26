import { User, InsertUser } from '@shared/schema';
import { storage } from '../storage';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-jwt-secret';
const JWT_EXPIRES_IN = '24h';

export class AuthService {
  private static instance: AuthService;
  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, hashedPassword: string): boolean {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  async register(userData: InsertUser): Promise<User> {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = this.hashPassword(userData.password);

    // Create user
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword
    });

    return user;
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!this.verifyPassword(password, user.password)) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Update last login
    await storage.updateUserLogin(user.id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return { user, token };
  }

  async verifyToken(token: string): Promise<{ userId: number; email: string; role: string }> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string };
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!this.verifyPassword(currentPassword, user.password)) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = this.hashPassword(newPassword);
    return storage.changePassword(userId, hashedPassword);
  }

  async deactivateAccount(userId: number): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return storage.updateUser(userId, { isActive: false });
  }
}

export const authService = AuthService.getInstance(); 