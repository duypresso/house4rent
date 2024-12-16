const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/test-user', async (req, res) => {
  try {
    const user = new User({
      name: "Test User",
      email: "test@example.com",
      password: "123456",
      role: "student"
    });
    
    await user.save();
    res.status(201).json({ message: "Test user created successfully", user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/test-connection', (req, res) => {
  res.json({ message: "Backend is connected!" });
});

module.exports = router; 