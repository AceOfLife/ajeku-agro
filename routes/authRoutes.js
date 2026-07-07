// routes/authRoutes.js
const express = require('express');
const AuthController = require('../controllers/AuthController');
const UserController = require('../controllers/UserController');
require('dotenv').config();

const router = express.Router();

// Authentication routes
router.post('/login', AuthController.login);
router.post('/signup', AuthController.signup);

// Password reset routes
router.post('/forgot-password', UserController.forgotPassword);
router.post('/reset-password', UserController.resetPassword);

module.exports = router;