import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'lumina-secret-key';
const SALT_ROUNDS = 10;

export class AuthService {
  static async register(username: string, email: string, password: string): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      // Validate input
      if (!username || !email || !password) {
        return { success: false, message: 'Username, email, and password are required' };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, message: 'Please provide a valid email address' };
      }

      // Validate password strength
      if (password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters long' };
      }

      // Check if user already exists with the same email
      const existingEmailUser = await db.select().from(users).where(eq(users.email, email));
      if (existingEmailUser.length > 0) {
        return { success: false, message: 'User with this email already exists' };
      }

      // Check if user already exists with the same username
      const existingUsernameUser = await db.select().from(users).where(eq(users.username, username));
      if (existingUsernameUser.length > 0) {
        return { success: false, message: 'Username is already taken' };
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create new user
      const newUser = await db.insert(users).values({
        username,
        email,
        password: hashedPassword
      }).returning();

      return { 
        success: true, 
        message: 'User registered successfully', 
        user: { id: newUser[0].id, username: newUser[0].username, email: newUser[0].email } 
      };
    } catch (error) {
      console.error('Registration error:', error);
      // Return more detailed error information
      if (error instanceof Error) {
        // Handle specific database errors
        if (error.message.includes('users_email_unique') || error.message.includes('duplicate key value violates unique constraint')) {
          // This is a fallback check in case the pre-checks didn't catch it
          return { success: false, message: 'User with this email or username already exists' };
        }
        return { success: false, message: error.message };
      }
      return { success: false, message: 'Registration failed due to an unknown error' };
    }
  }

  static async login(email: string, password: string): Promise<{ success: boolean; message: string; token?: string; user?: any }> {
    try {
      // Find user by email
      const userResult = await db.select().from(users).where(eq(users.email, email));
      if (userResult.length === 0) {
        return { success: false, message: 'Invalid email or password' };
      }

      const user = userResult[0];

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return { 
        success: true, 
        message: 'Login successful', 
        token,
        user: { id: user.id, username: user.username, email: user.email } 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    }
  }

  static async verifyToken(token: string): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      
      // Get user details
      const userResult = await db.select().from(users).where(eq(users.id, decoded.userId));
      if (userResult.length === 0) {
        return { success: false, message: 'User not found' };
      }

      const user = userResult[0];
      return { 
        success: true, 
        message: 'Token verified', 
        user: { id: user.id, username: user.username, email: user.email } 
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return { success: false, message: 'Invalid token' };
    }
  }
}