const mongoose = require('mongoose');

const deletedNoteSchema = new mongoose.Schema({
    deletedNoteId: {
        type:String,
        unique: true
    },
    userId: {
        type:String,
        unique: false
    }
})

module.exports = mongoose.model('deletedNote', deletedNoteSchema);