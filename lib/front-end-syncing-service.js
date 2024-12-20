const deletedNotes = require("./models/deleted-notes");
const Note = require("./models/note-model");

module.exports = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const notes = await Note.find({ userID: user_id });
    const deletedNoteIDs = await deletedNotes.find({ userId: user_id });

    res.status(200).json({
      notes,
      deletedNoteIDs,
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    res
      .status(500)
      .json({ message: "Error fetching notes.", error: error.message });
  }
};
