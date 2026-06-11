import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { User } from '../models/User';
import { verifyGoogleToken } from '../services/googleAuth';

const getJWTSecret = () => process.env.JWT_SECRET || 'supersecretflowgeniuskey12345!';
const getJWTRefreshSecret = () => process.env.JWT_REFRESH_SECRET || 'supersecretflowgeniusrefreshkey54321!';

const generateTokens = async (res: Response, user: any) => {
  const accessToken = jwt.sign(
    { userId: user._id.toString(), email: user.email },
    getJWTSecret(),
    { expiresIn: '15m' } // Short-lived access token
  );

  const refreshToken = jwt.sign(
    { userId: user._id.toString() },
    getJWTRefreshSecret(),
    { expiresIn: '7d' } // Long-lived refresh token
  );

  // Store refresh token in user profile
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push(refreshToken);

  // Limit to last 5 active refresh tokens
  if (user.refreshTokens.length > 5) {
    user.refreshTokens.shift();
  }
  await user.save();

  // Secure cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none' as const, // Cross-domain cookies for Vercel + Render
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  return accessToken;
};

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

    // Sign Access & Refresh Tokens
    const token = await generateTokens(res, newUser);

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

    // Sign Access & Refresh Tokens
    const token = await generateTokens(res, user);

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

export const googleRedirect = async (req: Request, res: Response) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

    if (!clientId || !callbackUrl) {
      return res.status(500).json({ message: 'Google OAuth configuration is missing on the server.' });
    }

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=openid%20email%20profile&prompt=select_account`;
    
    return res.redirect(googleAuthUrl);
  } catch (error: any) {
    console.error('Google Redirect Error:', error);
    return res.status(500).json({ message: 'Failed to initiate Google OAuth redirect.', error: error.message });
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const { code, error } = req.query;

    if (error) {
      return res.redirect(`${frontendUrl}?error=${encodeURIComponent(error.toString())}`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}?error=${encodeURIComponent('Authorization code is missing.')}`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

    if (!clientId || !clientSecret || !callbackUrl) {
      return res.redirect(`${frontendUrl}?error=${encodeURIComponent('Server Google OAuth configuration is missing.')}`);
    }

    // Exchange authorization code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const { id_token } = tokenResponse.data;
    if (!id_token) {
      throw new Error('Google token response did not include ID token.');
    }

    // Verify Google ID token using our helper
    const payload = await verifyGoogleToken(id_token);
    const { googleId, email, name, avatar } = payload;

    // Resolve user in MongoDB
    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        if (avatar && !user.avatar) {
          user.avatar = avatar;
        }
        await user.save();
      }
    } else {
      user = new User({
        name,
        email,
        googleId,
        avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        apiKeys: { geminiApiKey: '' }
      });
      await user.save();
    }

    // Generate Access and Refresh Tokens
    const accessToken = await generateTokens(res, user);

    // Redirect user back to the client dashboard with token
    return res.redirect(`${frontendUrl}?token=${accessToken}`);
  } catch (err: any) {
    console.error('Google Callback Error:', err);
    const errorMessage = err.response?.data?.error_description || err.message || 'Google authentication failed.';
    return res.redirect(`${frontendUrl}?error=${encodeURIComponent(errorMessage)}`);
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found.' });
    }

    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, getJWTRefreshSecret());
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired refresh token.' });
    }

    // Find user by ID
    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ message: 'Invalid refresh token session.' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      getJWTSecret(),
      { expiresIn: '15m' }
    );

    return res.status(200).json({ token: newAccessToken });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ message: 'Server error during token refresh.', error: error.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Clear cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none' as const
      });

      // Verify and remove from database
      try {
        const decoded = jwt.verify(refreshToken, getJWTRefreshSecret()) as { userId: string };
        const user = await User.findById(decoded.userId);
        if (user && user.refreshTokens) {
          user.refreshTokens = user.refreshTokens.filter((t: string) => t !== refreshToken);
          await user.save();
        }
      } catch (err) {
        // Ignored
      }
    }

    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error: any) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Server error during logout.', error: error.message });
  }
};
