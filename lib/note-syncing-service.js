const Note = require('./models/note-model');

module.exports = async (req, res) => {
    const { user_id, notes, deletedNotes } = req.body;

    // Validate request payload
    if (!user_id || !notes || !Array.isArray(notes)) {
        return res.status(400).json({
            message: 'Invalid request. UserID and notes array are required.',
        });
    }

    try {
        const processedNotes = [];
        let deletedProcessed = false;

        // Process notes (add/update)
        for (const note of notes) {
            // Ensure note has a valid ID
            const noteId = note.id;
            if (!noteId) {
                console.warn('Skipping note with no ID:', note);
                continue;
            }

            // Find existing note or create/update
            let existingNote = await Note.findOne({
                id: noteId,
                userID: user_id,
            });

            if (existingNote && note.synced === false) {
                // Update existing note
                existingNote.title = note.title || existingNote.title;
                existingNote.preview = note.preview || existingNote.preview;
                existingNote.tags = note.tags || existingNote.tags;
                existingNote.body = note.body || existingNote.body;
                existingNote.updatedAt = new Date().toISOString();
                existingNote.synced = note.synced ?? existingNote.synced;

                await existingNote.save();
                processedNotes.push(existingNote);
            } else {
                // Create new note
                const newNote = new Note({
                    id: noteId,
                    title: note.title || '',
                    preview: note.preview || '',
                    tags: note.tags || [],
                    body: note.body || '',
                    createdAt: note.createdAt || new Date().toISOString(),
                    updatedAt: note.updatedAt || new Date().toISOString(),
                    synced: note.synced || false,
                    userID: user_id,
                });

                await newNote.save();
                processedNotes.push(newNote);
            }
        }

        // Process deleted notes
        if (deletedNotes && Array.isArray(deletedNotes)) {
            for (const deletedNoteId of deletedNotes) {
                const deletedNote = await Note.findOneAndDelete({
                    id: deletedNoteId,
                    userID: user_id,
                });

                if (deletedNote) {
                    console.log(`Deleted note with ID: ${deletedNoteId}`);
                } else {
                    console.warn(`No note found with ID: ${deletedNoteId} to delete.`);
                }
            }
            deletedProcessed = true
        }

        res.status(200).json({
            message: 'Notes processed successfully',
            notes: processedNotes,
            deletedProcessed,
        });
    } catch (error) {
        console.error('Error processing notes:', error);
        res.status(500).json({
            message: 'An error occurred while processing notes',
            error: error.message,
        });
    }
};
