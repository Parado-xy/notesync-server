// THIS IS A DATABASE MODEL FOR THE NON-GOOGLE SIGNON USERS;

// Import dependencies
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the User schema
const userSchema = new mongoose.Schema({
    // Username field: required string
    firstName: {
        type: String,
        required: true,
    },
    // Email field: required string
    email: {
        type: String,
        required: true,
    },
    // Password field: required string
    password: {
        type: String,
        required: true,
    },
    // Saved notes: array of strings
    savedNotes: {
        type: [String],
        required: false,
    },
});

// Pre-save middleware to hash the password before saving to the database
userSchema.pre('save', async function (next) {
    // If the password is not modified, skip the hashing process
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // Generate a salt for hashing
        const salt = await bcrypt.genSalt();
        // Hash the password with the generated salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        // Pass any error to the next middleware
        next(err);
    }
});

// Export the User model
module.exports = mongoose.model('originalUser', userSchema);
