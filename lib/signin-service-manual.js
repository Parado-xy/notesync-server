const express = require("express");
const User = require("./models/original-user"); // Adjust path as needed
const bcrypt = require("bcryptjs");

// Validation middleware
const validateAuthInput = (req, res, next) => {
  const { email, password } = req.body;

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res
      .status(400)
      .json({ message: "Please provide a valid email address" });
  }

  // Password validation
  if (!password || password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long" });
  }

  next();
};

// Sign Up Handler
const signUpManualHandler = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validate full name
    if (!fullName || fullName.trim() === "") {
      return res.status(400).json({ success: false, message: "Please provide your full name" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }

    // Create a new user
    const newUser = new User({
      firstName: fullName,
      email,
      password: password,
      savedNotes: [], // Initialize empty notes array
    });

    const savedUser = await newUser.save();

    // Store user ID in session
    req.session._id = savedUser.id;
    req.session.user = { id: savedUser.id, firstName: savedUser.firstName };

    // Redirect to the home page
    res.status(200).json({
      success: true,
      redirectUrl: `/?user=${req.session._id}&new=true`,
      message: "Account created successfully!",
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ success: false, message: "Server error during signup" });
  }
};

// Sign In Handler
const signInManualHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    req.session._id = user.id;
    req.session.user = { id: user.id, firstName: user.firstName };

    // Redirect to the home page
    res.status(200).json({
      success: true,
      redirectUrl: `/?user=${req.session._id}`,
      message: "Login successful!",
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ success: false, message: "Server error during signin" });
  }
};

module.exports = {
  validateAuthInput,
  signUpManualHandler,
  signInManualHandler,
};