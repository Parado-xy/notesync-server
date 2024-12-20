function initializeNote() {
  const noteService = new NoteService(indexedDB, new Logger(false));
  const noteID = crypto.randomUUID();

  try {
    history.pushState(null, "", `?note=${noteID}`);
  } catch (error) {
    console.error("Failed to update URL:", error);
  }

  // DOM Elements
  const title = document.getElementById("noteTitleInput");
  const tags = document.getElementById("tagContainer");

  // Initial note data
  const initialNoteData = {
    id: noteID,
    title: title.value,
    preview: "",
    tags: [],
    body: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    synced: false,
  };

  noteService.saveToIndexDB(initialNoteData);
  return noteID;
}

// Listener for the editor's content change
function handleEditorChange(delta, oldDelta, source) {
  const noteService = new NoteService(indexedDB, new Logger(false));
  const currentNoteID = new URLSearchParams(window.location.search).get("note");

  if (!currentNoteID) {
    console.error("No note ID found");
    return;
  }

  const content = quill.getContents();
  const preview =
    content.ops
      .slice(0, 10) // Take the first 10 operations
      .map((op) => {
        if (op.insert && typeof op.insert === "object" && op.insert.image) {
          // If the operation is an image, return a placeholder emoji
          return "🖼️";
        }
        return op.insert || ""; // Otherwise, return the text
      })
      .join("")
      .substring(0, 100) + "..."; // Limit preview to 100 characters

  const contentString = JSON.stringify(content);

  try {
    noteService.updateNote(currentNoteID, {
      body: contentString,
      preview: preview,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to update note:", err);
  }
}

// Listener for the title input
function handleTitleChange(event) {
  const noteService = new NoteService(indexedDB, new Logger(false));
  const currentNoteID = new URLSearchParams(window.location.search).get("note");

  if (!currentNoteID) {
    console.error("No note ID found");
    return;
  }

  try {
    noteService.updateNote(currentNoteID, {
      title: event.target.value,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to update title:", err);
  }
}

// Listener for tags change
function handleTagsChange(event) {
  const noteService = new NoteService(indexedDB, new Logger(false));
  const currentNoteID = new URLSearchParams(window.location.search).get("note");

  if (!currentNoteID) {
    console.error("No note ID found");
    return;
  }

  const tags = Array.from(document.querySelectorAll("#tagContainer input")).map(
    (input) => input.value
  );

  try {
    noteService.updateNote(currentNoteID, {
      tags: tags,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to update tags:", err);
  }
}

// Cleanup autosave interval on unload
function handleBeforeUnload() {
  if (autosaveInterval) {
    clearInterval(autosaveInterval);
  }
}

// Main window load event
document.addEventListener("DOMContentLoaded", () => {
  const indexedDB = window.indexedDB;
  const noteService = new NoteService(indexedDB, new Logger(false));

  // Retrieve the note ID from history state or URL
  const state = window.history.state;
  const urlParams = new URLSearchParams(window.location.search);
  const noteId = state?.noteId || urlParams.get("note");

  let autosaveInterval;
  let lastSavedState = {
    title: "",
    content: "",
    tags: "",
  };

  function hasChanges(currentState) {
    return (
      lastSavedState.title !== currentState.title ||
      lastSavedState.content !== currentState.content ||
      lastSavedState.tags !== currentState.tags
    );
  }

  function updateLastSavedState(currentState) {
    lastSavedState = { ...currentState };
  }

  if (noteId) {
    // Fetch and populate the note data
    try {
      noteService.getSingleNote(noteId, (note) => {
        const title = note.title || "";
        const content = JSON.stringify(JSON.parse(note.body || "{}"));
        const tags = document.getElementById("tagContainer").value || "";

        document.getElementById("noteTitleInput").value = title;
        quill.setContents(JSON.parse(note.body || "{}"));

        updateLastSavedState({ title, content, tags });
      });
    } catch (error) {
      console.error("Failed to fetch note:", error);
      alert("Error loading note. Please try again.");
    }

    // Set up listeners for changes
    document
      .getElementById("noteTitleInput")
      .addEventListener("input", handleTitleChange);
    document
      .getElementById("tagContainer")
      .addEventListener("change", handleTagsChange);
    quill.on("text-change", handleEditorChange);

    // PUSH NOTE ID TO HISTORY
    try {
      history.pushState(null, "", `?note=${noteId}`);
    } catch (error) {
      console.error("Failed to update URL:", error);
    }

    // Start autosave
    autosaveInterval = setInterval(() => {
      const currentTitle = document.getElementById("noteTitleInput").value;
      const currentContent = JSON.stringify(quill.getContents());
      const currentTags = document.getElementById("tagContainer").value;

      const currentState = {
        title: currentTitle,
        content: currentContent,
        tags: currentTags,
      };

      if (hasChanges(currentState)) {
        try {
          noteService.updateNote(noteId, {
            title: currentTitle,
            body: currentContent,
            updatedAt: new Date().toISOString(),
          });

          updateLastSavedState(currentState);
        } catch (err) {
          console.error("Failed to autosave:", err);
        }
      }
    }, 5000);
  } else {
    // Initialize note
    const noteID = initializeNote();

    // Set listeners
    document
      .getElementById("noteTitleInput")
      .addEventListener("input", handleTitleChange);
    document
      .getElementById("tagContainer")
      .addEventListener("change", handleTagsChange);
    quill.on("text-change", handleEditorChange);

    // Start autosave
    autosaveInterval = setInterval(() => {
      const currentNoteID = new URLSearchParams(window.location.search).get(
        "note"
      );

      if (!currentNoteID) {
        console.error("No note ID found for autosave");
        return;
      }

      const currentTitle = document.getElementById("noteTitleInput").value;
      const currentContent = JSON.stringify(quill.getContents());
      const currentTags = document.getElementById("tagContainer").value;

      const currentState = {
        title: currentTitle,
        content: currentContent,
        tags: currentTags,
      };

      if (hasChanges(currentState)) {
        try {
          noteService.updateNote(currentNoteID, {
            title: currentTitle,
            body: currentContent,
            updatedAt: new Date().toISOString(),
          });

          updateLastSavedState(currentState);
        } catch (err) {
          console.error("Failed to autosave:", err);
        }
      }
    }, 5000);
  }

  // Cleanup autosave interval on unload
  window.addEventListener("beforeunload", () => {
    if (autosaveInterval) {
      clearInterval(autosaveInterval);
    }
  });
});
