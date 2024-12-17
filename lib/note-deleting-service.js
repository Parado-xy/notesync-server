const Note = require('./models/note-model');

module.exports = async (req, res) => {
    const { user_id,  deletedNoteID } = req.body;

    // Validate request payload
    if (!user_id) {
        return res.status(400).json({
            message: 'Invalid request. UserID is required.',
        });
    }

    try {

            let deletedProcessed = false;   

            // Process deleted notes
            if (deletedNoteID) {
                    const deletedNote = await Note.findOneAndDelete({
                        id: deletedNoteID,
                        userID: user_id,
                    });

                    if (deletedNote) {
                        console.log(`Deleted note with ID: ${deletedNoteID}`);
                    } else {
                        console.warn(`No note found with ID: ${deletedNoteID} to delete.`);
                    }
                }
                deletedProcessed = true

                res.status(200).json({
                    message: 'Note Deleted Succesfully',
                    deletedProcessed,
                });
        }catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({
            message: 'An error occurred while deleting note',
            error: error.message,
        });
    }
};
