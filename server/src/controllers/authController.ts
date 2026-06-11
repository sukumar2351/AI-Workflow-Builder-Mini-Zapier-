import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const getJWTSecret = () => process.env.JWT_SECRET || 'supersecretflowgeniuskey12345!';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      apiKeys: { geminiApiKey: '' }
    });

    await newUser.save();

    // Sign JWT
    const token = jwt.sign(
      { userId: newUser._id.toString(), email: newUser.email },
      getJWTSecret(),
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        apiKeys: newUser.apiKeys
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Sign JWT
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      getJWTSecret(),
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        apiKeys: user.apiKeys
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
};

export const googleOAuth = async (req: Request, res: Response) => {
  try {
    const { googleId, email, name, avatar } = req.body;

    if (!googleId || !email || !name) {
      return res.status(400).json({ message: 'Google authentication requires googleId, email, and name.' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // If user exists but didn't have googleId linked, link it
      if (!user.googleId) {
        user.googleId = googleId;
        if (avatar && !user.avatar) {
          user.avatar = avatar;
        }
        await user.save();
      }
    } else {
      // Create new OAuth user
      user = new User({
        name,
        email,
        googleId,
        avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        apiKeys: { geminiApiKey: '' }
      });
      await user.save();
    }

    // Sign JWT
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      getJWTSecret(),
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        apiKeys: user.apiKeys
      }
    });
  } catch (error: any) {
    console.error('Google OAuth error:', error);
    return res.status(500).json({ message: 'Server error during Google OAuth.', error: error.message });
  }
};
