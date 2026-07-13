// controllers/AuthController.js
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();


// controllers/AuthController.js - Keep the hardcoded fallback
const DATABASE_URL = 'postgresql://ajeku_agro_28ie_user:Lz33s2Yw32NpZ6F7oTWYYDf8DVcWcNas@dpg-d99mqlbtqb8s73aqm0og-a.oregon-postgres.render.com/ajeku_agro_28ie';

// Generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// User login
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate access token
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Generate refresh token
    const refreshToken = generateRefreshToken();

    // Save refresh token in database
    user.refresh_token = refreshToken;
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        contactNumber: user.contactNumber,
        city: user.city,
        state: user.state,
        profileImage: user.profileImage,
        gender: user.gender,
        referralSource: user.referralSource,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// User signup
const signup = async (req, res) => {
  const { name, email, password, role, firstName, lastName } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const finalFirstName = firstName || (name ? name.split(' ')[0] : '');
    const finalLastName = lastName || (name ? name.split(' ').slice(1).join(' ') : '');

    const newUser = await User.create({
      name,
      firstName: finalFirstName,
      lastName: finalLastName,
      email,
      password: hashedPassword,
      role: role || 'client',
      refresh_token: generateRefreshToken()
    });

    const accessToken = jwt.sign(
      { 
        id: newUser.id, 
        role: newUser.role,
        email: newUser.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      accessToken,
      refreshToken: newUser.refresh_token,
      expiresIn: 3600,
      user: newUser
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Refresh access token
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const user = await User.findOne({ 
      where: { refresh_token: refreshToken }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Generate new refresh token (rotation)
    const newRefreshToken = generateRefreshToken();
    user.refresh_token = newRefreshToken;
    await user.save();

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 3600
    });

  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ message: 'Error refreshing token', error });
  }
};

// Logout - clear refresh token
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const user = await User.findOne({ 
        where: { refresh_token: refreshToken }
      });
      
      if (user) {
        user.refresh_token = null;
        await user.save();
      }
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error logging out', error });
  }
};

module.exports = {
  login,
  signup,
  refresh,
  logout
};