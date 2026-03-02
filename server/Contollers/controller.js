import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.model.js';
import { logger } from '../utils/logger.js';
import { sendEmail } from '../services/email.service.js';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user }
  });
};

export const register = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      name,
      phone,
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        language: 'en'
      }
    });

    // Send welcome email
    await sendEmail({
      to: user.email,
      subject: 'Welcome to CSSP',
      template: 'welcome',
      context: { name: user.name }
    });

    createSendToken(user, 201, res);
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, res);
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

export const logout = (req, res) => {
  res.status(200).json({ status: 'success', message: 'Logged out successfully' });
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No user found with this email' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Save reset token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Send reset email
    const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'passwordReset',
      context: {
        name: user.name,
        resetURL,
        expiresIn: '1 hour'
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset email sent'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      _id: decoded.id,
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token is invalid or has expired' });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    logger.error('Reset password error:', error);
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    logger.error('Update password error:', error);
    next(error);
  }
};