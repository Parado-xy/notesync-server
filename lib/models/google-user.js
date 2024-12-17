const mongoose = require('mongoose');

// Define the Google User Schema
const googleUserSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    picLink: {
        type: String,
        required: false // Optional field for profile picture link
    },
    // Saved notes: array of strings representing the IDs of the user's saved notes. 
    savedNotes: {
        type: [String],
        required: false,
    }
});

// Create the Google User model using the schema
const GoogleUser = mongoose.model('GoogleUser', googleUserSchema);

// Export the model
module.exports = GoogleUser;
