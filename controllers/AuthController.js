// controllers/AuthController.js
const { User } = require('../models'); // Import User model
const bcrypt = require('bcryptjs'); // Import bcrypt for password hashing
const jwt = require('jsonwebtoken'); // Import JWT for token generation
require('dotenv').config(); // Load environment variables

// User login
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists in the database
    const user = await User.findOne({ where: { email } });

    // If user is not found
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare provided password with hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate a JWT token (including the user's role)
    const token = jwt.sign(
      { 
        id: user.id, 
        name: user.name, 
        email: user.email,  // Ensure email is in the token for future use
        role: user.role,
      },
      process.env.JWT_SECRET, // Use the secret from environment variables
      { expiresIn: '1h' } // Token expiration time
    );

    // Return the token and user details (including role)
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role // Include the user's role
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// User signup
const signup = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user in the database
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    // Send the new user as a response
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

module.exports = {
  login,
  signup
};
