const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    preview: {
        type: String,
        default: ''
    },
    tags: {
        type: [String],
        default: []
    },
    body: {
        type: String,
        default: ''
    },
    createdAt: {
        type: String,
        default: () => new Date().toISOString()
    },
    updatedAt: {
        type: String,
        default: () => new Date().toISOString()
    },
    synced: {
        type: Boolean,
        default: false
    },
    userID: {
        type: String,
        required: true
    }
});

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;