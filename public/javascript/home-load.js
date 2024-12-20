// Fetch and display user info and notes
// Fetch and display user info and notes
document.addEventListener("DOMContentLoaded", async () => {
  // GET URL SEARCH PARAMS;
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("user");
  const isNew = params.get("new");
  const USER_KEY = "USERS-OF-DEVICE-NOTESYNC";

  // Add loading SVG function
  function createLoadingSVG() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "50");
    svg.setAttribute("height", "50");
    svg.setAttribute("viewBox", "0 0 50 50");
    svg.classList.add("loading-spinner");
    svg.style.display = "block";
    svg.style.margin = "20px auto";

    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("cx", "25");
    circle.setAttribute("cy", "25");
    circle.setAttribute("r", "20");
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", "#007bff");
    circle.setAttribute("stroke-width", "4");
    circle.setAttribute("stroke-dasharray", "125");
    circle.setAttribute("stroke-dashoffset", "0");

    const animation = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "animate"
    );
    animation.setAttribute("attributeName", "stroke-dashoffset");
    animation.setAttribute("dur", "1.5s");
    animation.setAttribute("from", "0");
    animation.setAttribute("to", "250");
    animation.setAttribute("repeatCount", "indefinite");

    circle.appendChild(animation);
    svg.appendChild(circle);

    return svg;
  }

  // Show loading indicator
  const notesGrid = document.getElementById("notesGrid");
  const welcomeMessage = document.getElementById("welcomeMessage");

  // Clear existing content and add loading spinner
  welcomeMessage.textContent = "";
  notesGrid.innerHTML = "";
  notesGrid.appendChild(createLoadingSVG());

  try {
    // Fetch user data
    const response = await fetch("/api/user", { method: "GET" });

    if (response.ok) {
      const userData = await response.json();

      if (userData) {
        // User is logged in
        welcomeMessage.textContent = `Welcome back, ${userData.user.firstName || "User"}!`;

        // Clear loading spinner
        notesGrid.innerHTML = "";

        // SET THE CURRENT USER IN THE LOCAL STORAGE
        let noteSyncUsers = localStorage.getItem(USER_KEY);

        if (!noteSyncUsers) {
          noteSyncUsers = "";
        } else {
          noteSyncUsers = noteSyncUsers;
        }

        noteSyncUsers = userData.user.firstName;
        localStorage.setItem(USER_KEY, noteSyncUsers);

        // SET INSTANCE ID
        const instanceController = new SetInstanceIDs(localStorage, {} , false);
        instanceController.setInstance(
          userData.user.firstName,
          userData.user._id ? userData.user._id : userData.user.id
        );

        // Add loading spinner for notes
        notesGrid.appendChild(createLoadingSVG());

        // Render user's notes
        const noteService = new NoteService(window.indexedDB);
        noteService.fetchNotes(true, (notes) => {
          // Clear loading spinner
          notesGrid.innerHTML = "";

          if (notes && notes.length > 0) {
            renderNotes(notes);
          } else {
            // Show no notes message
            notesGrid.innerHTML = `<p class="text-center">You don't have any notes yet. 😔</p>`;
          }
        });
      } else {
        displaySignInMessage();
      }
    } else {
      console.error("Failed to fetch user data:", response.statusText);
      displaySignInMessage();
    }
  } catch (error) {
    console.error("An error occurred:", error);
    displaySignInMessage();
  }
});

function displaySignInMessage() {
  const welcomeMessage = document.getElementById("welcomeMessage");
  welcomeMessage.textContent = `Hello Human! Unfortunately, we don't know who you are.`;
  const notesGrid = document.getElementById("notesGrid");
  notesGrid.innerHTML = `<p class="text-center">So, do you mind <a href='/signon'> signing in? </a> </p>`;
}

// Insert a single note card
function insertNoteCard(noteData) {
  const notesGrid = document.getElementById("notesGrid");

  // Create column div with a unique identifier for easy removal
  const colDiv = document.createElement("div");
  colDiv.className = "col-md-4 mb-4";
  colDiv.dataset.noteId = noteData.id; // Add data attribute for specific note identification

  // Create note card div
  const cardDiv = document.createElement("div");
  cardDiv.className = "card note-card";

  // Create card body
  const cardBody = document.createElement("div");
  cardBody.className = "card-body";

  // Title
  const titleElement = document.createElement("h5");
  titleElement.className = "card-title";
  titleElement.textContent = noteData.title || "Untitled Note";

  // Preview text
  const previewElement = document.createElement("p");
  previewElement.className = "card-text text-muted";
  previewElement.textContent = noteData.preview || "No preview available...";

  // Footer with creation date and action buttons
  const footerDiv = document.createElement("div");
  footerDiv.className =
    "d-flex justify-content-between align-items-center mt-3";

  // Creation date
  const dateElement = document.createElement("small");
  dateElement.className = "text-muted";
  dateElement.textContent = `Created: ${
    noteData.createdAt
      ? new Date(noteData.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Unknown Date"
  }`;

  // Action buttons container
  const actionButtonsDiv = document.createElement("div");

  // Edit button
  const editButton = document.createElement("button");
  editButton.className = "btn btn-sm btn-outline-primary me-2";
  editButton.innerHTML = '<i data-lucide="edit-2"></i>';
  editButton.addEventListener("click", () => {
    const noteId = noteData.id; // The note ID to pass
    history.pushState({ noteId }, "", "/notepad"); // Update the URL and store the note ID in state
    window.location.href = "/notepad"; // Navigate to the edit page
  });

  // Delete button
  const deleteButton = document.createElement("button");
  deleteButton.className = "btn btn-sm btn-outline-danger";
  deleteButton.innerHTML = '<i data-lucide="trash-2"></i>';
  deleteButton.addEventListener("click", () => {
    // Confirm deletion
    if (confirm("Are you sure you want to delete this note?")) {
      const noteService = new NoteService(window.indexedDB);
      try {
        noteService.deleteNote(noteData.id);

        // Find and remove the specific note's column from the DOM
        const noteToRemove = document.querySelector(
          `[data-note-id="${noteData.id}"]`
        );
        if (noteToRemove) {
          noteToRemove.remove();
        }
      } catch (err) {
        console.error("Failed to delete note:", err);
        alert("Failed to delete note. Please try again.");
      }
    }
  });

  // Assemble the note card
  actionButtonsDiv.appendChild(editButton);
  actionButtonsDiv.appendChild(deleteButton);

  footerDiv.appendChild(dateElement);
  footerDiv.appendChild(actionButtonsDiv);

  cardBody.appendChild(titleElement);
  cardBody.appendChild(previewElement);
  cardBody.appendChild(footerDiv);

  cardDiv.appendChild(cardBody);
  colDiv.appendChild(cardDiv);

  // Add to notes grid
  notesGrid.appendChild(colDiv);

  // Reinitialize Lucide icons
  lucide.createIcons();

  return colDiv;
}

// Render notes with sorting
function renderNotes(notes) {
  // Clear existing notes
  const notesGrid = document.getElementById("notesGrid");
  notesGrid.innerHTML = "";

  // Sort notes by createdAt or updatedAt in descending order (newest first)
  const sortedNotes = notes.sort((a, b) => {
    const dateA = new Date(b.updatedAt || b.createdAt);
    const dateB = new Date(a.updatedAt || a.createdAt);
    return dateA - dateB;
  });

  // Render each note
  sortedNotes.forEach((note) => {
    insertNoteCard(note);
  });
}
