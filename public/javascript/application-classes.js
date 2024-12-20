/**
 * @class VoiceSearchService
 * @description Main service class for managing voice search functionality, including speech recognition and manual fallback.
 */
class VoiceSearchService {
  /**
   * @constructor
   * @param {SpeechRecognition} Recognition - The SpeechRecognition API class (or a polyfill).
   * @param {boolean} useGrammar - Whether to use pre-defined command grammar.
   * @param {HTMLElement|null} element - The target element to populate with recognized text, if applicable.
   * @param {Object} options - Configuration options for speech recognition.
   * @param {boolean} [options.debugMode=false] - Enable or disable debug logging.
   * @param {string} [options.lang='en-US'] - Language for speech recognition.
   * @param {boolean} [options.continuous=true] - Whether recognition should continue without stopping.
   * @param {boolean} [options.interimResults=false] - Whether to capture interim results during recognition.
   */
  constructor(Recognition, useGrammar, element = null, options = {}) {
    this.logger = new Logger(options.debugMode || false);

    // CHECK BROWSER SUPPORT
    if (!Recognition) {
      this.logger.error("Speech Recognition is not supported in this browser");
      this.isSupported = false;
      return;
    }

    // CONFIGURATION WITH DEFAULTS
    this.config = {
      lang: options.lang || "en-US",
      continuous: options.continuous ?? true,
      interimResults: options.interimResults ?? false,
      ...options,
    };

    this.recognition = new Recognition();
    this.useGrammar = useGrammar;
    this.element = element;
    this.isSupported = true;

    // Track recognition state
    this.isListening = false;

    // APPLY CONFIGURATIONS
    Object.assign(this.recognition, this.config);
  }

  /**
   * @method toggleService
   * @description Toggles the voice search service on and off
   * @param {HTMLButtonElement} micButton - The microphone button element
   */
  toggleService(micButton) {
    if (!this.isSupported) {
      this.fallbackToManualInput();
      return;
    }

    // If currently listening, stop the recognition
    if (this.isListening) {
      this.stopService(micButton);
    } else {
      this.startService(micButton);
    }
  }

  /**
   * @method startService
   * @description Starts the voice search service
   * @param {HTMLButtonElement} micButton - The microphone button element
   */
  startService(micButton) {
    this.recognition.lang = this.config.lang;
    this.recognition.continuous = this.config.continuous;

    if (this.useGrammar) {
      this.recognition.onresult = (event) => {
        const last = event.results.length - 1;
        let commands = event.results[last][0].transcript.toLowerCase().trim();
        // CLEAN COMMANDS STRING
        commands = commands.replace(/[.,\/#!$%\^&\*;:{}=\-_~()]/g, "");
        this.logger.log(`Command detected: ${commands}`);

        for (const [command, details] of Object.entries(commandsGrammar)) {
          if (
            details.variations.some((variation) => commands.includes(variation))
          ) {
            this.logger.log(`Executing command: ${command}`);
            this.matchCommands(command);
            break;
          }
        }
      };
    } else {
      this._setupTextInputHandler();
    }

    this._setupRecognitionListeners(micButton);

    try {
      this.recognition.start();
      this.isListening = true;

      // Update button state
      if (micButton) {
        micButton.classList.add("recording");
        micButton.setAttribute("aria-label", "Stop Voice Search");
      }
    } catch (error) {
      this.logger.error("Error starting recognition:", error);
      this.isListening = false;
      if (micButton) {
        micButton.classList.remove("recording");
      }
    }
  }

  /**
   * @method stopService
   * @description Stops the voice search service
   * @param {HTMLButtonElement} micButton - The microphone button element
   */
  stopService(micButton) {
    try {
      this.recognition.stop();
      this.isListening = false;

      // Update button state
      if (micButton) {
        micButton.classList.remove("recording");
        micButton.setAttribute("aria-label", "Start Voice Search");
      }
    } catch (error) {
      this.logger.error("Error stopping recognition:", error);
    }
  }
  /**
   * @private
   * @method _setupTextInputHandler
   * @description Configures text input handling for populating text based on recognition results.
   */
  _setupTextInputHandler() {
    if (this.element) {
      if (this.element.tagName === "INPUT") {
        this.recognition.interimResults = true;
        this.recognition.onresult = (event) => {
          const lastResultIndex = event.results.length - 1;
          const transcript =
            event.results[lastResultIndex][0].transcript.trim();
          this.logger.log("Final transcript:", transcript);
          this.element.value = transcript;
          // TRIGGER THE INPUT EVENT TO SIMULATE TYPING.
          const inputEvent = new Event("input");
          this.element.dispatchEvent(inputEvent);
        };
        // AN INTEGRATION FOR THE QUILL.JS NOTEPAD;
      } else {
        this.recognition.onresult = (event) => {
          const lastResultIndex = event.results.length - 1;
          const transcript =
            event.results[lastResultIndex][0].transcript.trim();
          this.logger.log("Final transcript:", transcript);

          const existingText = this.element.value || "";
          this.element.value = existingText
            .split(" ")
            .concat(transcript.split(" "))
            .filter((word, index, array) => array.indexOf(word) === index)
            .join(" ");
        };
      }
    } else if (quill) {
      this.recognition.onresult = (event) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.trim();
        this.logger.log("Final transcript: ", transcript);
        // GET CURRENT QUILL SELECTION (cursor position)
        const range = quill.getSelection();
        if (range) {
          // INSERT TEXT IN THE CURRENT QUILL CURSOR POSITION;
          quill.insertText(range.index, transcript + " ");

          // MOVE CUSROSR TO THE CURRENT END OF TEXT;
          quill.setSelection(range.index + transcript.length + 1);
        } else {
          // IF NO SELECTION APPENED TEXT AT THE END
          quill.insertText(quill.getLength() - 1, transcript + " ");
        }
      };
    }
  }

  /**
   * @private
   * @method _setupRecognitionListeners
   * @description Sets up event listeners for speech recognition events like start, end, and errors.
   * @param {HTMLButtonElement} [micButton=null] An Optional element representing a microphone to be used as a toogle.
   */
  _setupRecognitionListeners(micButton = null) {
    this.recognition.addEventListener("start", () => {
      this.logger.log("Speech recognition started");
    });

    this.recognition.onend = () => {
      if (this.isListening) {
        setTimeout(() => {
          if (this.isListening) this.recognition.start();
        }, 1000);
      } else {
        this.logger.log("Speech recognition ended");
        if (micButton) {
          micButton.classList.remove("recording");
        }
      }
    };

    this.recognition.onspeechend = () => {
      this.logger.log("No speech detected. Pausing...");
      this.recognition.stop();
      this.isListening = false;
    };

    this.recognition.addEventListener("error", (event) => {
      this.logger.error("Speech recognition error:", event.error);
      if (micButton) {
        micButton.classList.remove("recording");
      }
    });
  }

  /**
   * @method matchCommands
   * @description Matches recognized commands to pre-defined actions and executes corresponding handlers.
   * @param {string} command - The recognized command to match.
   */

  matchCommands(command) {
    const commandHandlers = {
      search: () => {
        this.recognition.stop();
        const actions = new Actions(HTMLElements, this.logger);
        actions.search();
      },
      stop: () => {
        this.logger.log("Stopping...");
        this.recognition.stop();
      },
      exit: () => {
        this.logger.log("Exiting...");
        this.recognition.stop();
      },
      start: () => this.logger.log("Starting..."),
      pause: () => this.logger.log("Pausing..."),
      resume: () => this.logger.log("Resuming..."),
      play: () => this.logger.log("Playing..."),
    };

    const handler = commandHandlers[command];
    if (handler) {
      handler();
    } else {
      this.logger.log("Command not recognized");
    }
  }

  /**
   * @method fallbackToManualInput
   * @description Handles the case where speech recognition is unsupported, providing a manual input alternative.
   */
  fallbackToManualInput() {
    this.logger.error(
      "Voice recognition not supported. Falling back to manual input."
    );
    // TODO: Could disable voice features, show a message, etc.
  }
}

/**
 * @class Actions
 * @description Provides specific actions that can be triggered via voice commands or programmatically.
 */
class Actions {
  /**
   * @constructor
   * @param {Object} elements - A map of HTML elements used for various actions.
   * @param {Logger} logger - Logger instance for debugging and error reporting.
   */
  constructor(elements = {}, logger = new Logger()) {
    this.elements = elements;
    this.logger = logger;
  }

  /**
   * @method search
   * @description Triggers a search action, focusing on the search bar and starting voice recognition.
   */
  search() {
    if (this.elements["searchBar"]) {
      this.elements["searchBar"].focus();
      this.logger.log("Search action triggered. Focused on the search bar.");
      const searchBarService = new VoiceSearchService(
        RecognitionClass,
        false,
        this.elements["searchBar"]
      );
      searchBarService.startService(this.elements["micButton"]);
    } else {
      this.logger.error("Search bar element not found");
    }
  }
}

/**
 * @class Logger
 * @description Provides logging functionality for debugging and error reporting.
 */
class Logger {
  /**
   * @constructor
   * @param {boolean} [debugMode=false] - Whether to enable debug logging.
   */
  constructor(debugMode = false) {
    this.debugMode = debugMode;
  }

  /**
   * @method log
   * @description Logs messages to the console if debug mode is enabled.
   * @param {...any} args - The messages or objects to log.
   */
  log(...args) {
    if (this.debugMode) {
      console.log(...args);
    }
  }

  /**
   * @method error
   * @description Logs error messages to the console.
   * @param {...any} args - The error messages or objects to log.
   */
  error(...args) {
    console.error(...args);
  }
}

/**
 * @constant
 * @name commandsGrammar
 * @description Defines a grammar of commands, including variations and contexts, for voice recognition.
 * @type {Object}
 */
const commandsGrammar = {
  search: {
    variations: ["find", "lookup", "search", "get"],
    contexts: {
      web: ["online", "internet"],
      local: ["here", "nearby"],
    },
  },
  start: {
    variations: ["begin", "launch", "start"],
    requiredConfidence: 0.7,
  },
  stop: {
    variations: ["halt", "cancel", "stop"],
  },
  pause: {
    variations: ["pause", "hold"],
  },
  resume: {
    variations: ["continue", "resume"],
  },
  play: {
    variations: ["play", "go"],
  },
  exit: {
    variations: ["quit", "exit", "end"],
  },
};

/**
 * Generate a UUID (Universally Unique Identifier) in the UUID v4 format.
 *
 * UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * - Contains 32 hexadecimal characters split into 5 groups by hyphens.
 * - The 13th character is always '4' (UUID version 4).
 * - The 17th character ('y') is a variant that must fall between '8' and 'b'.
 *
 * The function ensures uniqueness by combining:
 * - Current timestamp in milliseconds since Unix Epoch.
 * - High-resolution time in microseconds since page load (if supported).
 * - Random values for additional entropy.
 *
 * @returns {string} A randomly generated UUID v4.
 */
function generateUUID() {
  // Step 1: Get the current timestamp in milliseconds since Unix Epoch
  let d = new Date().getTime();

  // Step 2: Get high-resolution time in microseconds since page load, or 0 if unsupported
  let d2 = (performance && performance.now && performance.now() * 1000) || 0;

  // Step 3: Define the UUID template string and replace placeholders
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    /**
     * Callback function to replace 'x' and 'y' in the UUID template.
     * - 'x' is replaced with a random hexadecimal digit.
     * - 'y' is replaced with a variant-compliant hexadecimal digit.
     */

    // Generate a random number between 0 and 16
    let r = Math.random() * 16;

    if (d > 0) {
      // If timestamp `d` is available, adjust randomness using timestamp
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16); // Decrease timestamp by dividing by 16
    } else {
      // If timestamp `d` is depleted, use high-resolution time `d2`
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16); // Decrease microseconds by dividing by 16
    }

    // If the current placeholder is 'x', return the random value.
    // If 'y', ensure it follows UUID variant rules: (r & 0x3 | 0x8)
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * The NoteService Class is the class that controls all processes with the notes.
 */
class NoteService {
  /**
   * @constructor
   * @param {object} indexedDB - The IndexedDB API.
   * @param {Logger} logger - Logger instance for debug and error logging.
   * @param {number} [VERSION_NUMBER=1] - The database version number.
   */
  constructor(indexedDB, logger = new Logger(false), VERSION_NUMBER = 1) {
    this.indexedDB = indexedDB;
    this.logger = logger;
    this.VERSION_NUMBER = VERSION_NUMBER;
    this.DELETED_NOTES_KEY = "DELETED_NOTESYNC_KEYS";
    this.currentUser = localStorage.getItem("USERS-OF-DEVICE-NOTESYNC");
    this.instanceSettings = new SetInstanceIDs(
      localStorage,
      JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
    );
    this.instanceID = this.instanceSettings.getInstanceID(this.currentUser);
    this.dbPromise = this._openDatabase();

    this.fetchBackendData();
  }

  /**
   * @method _openDatabase
   * @description Opens the IndexedDB database and sets up event handlers as a Promise.
   * @private
   * @returns {Promise<IDBDatabase>} - A promise that resolves to the database instance.
   */
  _openDatabase() {
    return new Promise((resolve, reject) => {
      const dbRequest = this.indexedDB.open(
        `notesDatabase-${this.instanceID}`,
        this.VERSION_NUMBER
      );

      dbRequest.onupgradeneeded = (event) => {
        this._createObjectStore(event);
      };

      dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        this.logger.log("Database opened successfully.");
        resolve(db);
      };

      dbRequest.onerror = (event) => {
        this.logger.error("Database failed to open:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * @method _createObjectStore
   * @description Creates the IndexedDB object store if it doesn't exist.
   * @private
   * @param {IDBVersionChangeEvent} event - The upgrade needed event.
   */
  _createObjectStore(event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains("notes")) {
      const notesStore = db.createObjectStore("notes", { keyPath: "id" });
      notesStore.createIndex("synced", "synced", { unique: false });
      this.logger.log(`Object store 'notes' created.`);
    }
  }

  /**
   * @method saveToIndexDB
   * @description Saves a note to the IndexedDB database.
   * @param {object} note - The note to save.
   * @returns {string} - The note's ID.
   */
  async saveToIndexDB(note) {
    const db = await this.dbPromise;
    const transaction = db.transaction("notes", "readwrite");
    const store = transaction.objectStore("notes");

    store.add(note);

    transaction.oncomplete = () => {
      const NoteSaved = new Event("NoteSaved");
      document.dispatchEvent(NoteSaved);
      this.logger.log(`Note saved to IndexedDB:`, note);
    };

    transaction.onerror = (event) => {
      this.logger.error(`Error saving note to IndexedDB:`, event.target.error);
    };
    return note.id;
  }

  /**
   * @method fetchNotes
   * @description Fetches notes from IndexedDB based on sync status.
   * @param {boolean} [synced=false] - Whether to fetch synced notes or not.
   * @param {function} callback - Callback to handle fetched notes.
   */
  async fetchNotes(synced = false, callback) {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction("notes", "readonly");
      const store = transaction.objectStore("notes");
      // Use a single getAll request
      const request = store.getAll();

      request.onsuccess = async () => {
        let notes = request.result;

        if (!synced) {
          // Filter unsynced notes if synced = false
          notes = notes.filter((note) => !note.synced);
          this.logger.log(`Fetched unsynced notes:`, notes);
        } else {
          this.logger.log(`Fetched all notes:`, notes);
        }

        // Execute the callback with the fetched notes
        if (notes.length === 0) {
          await this.fetchBackendData();
          callback(notes);
        } else {
          callback(notes);
        }
      };

      request.onerror = (event) => {
        this.logger.error(`Error fetching notes:`, event.target.error);
      };
    } catch (error) {
      this.logger.error(`Error in fetchNotes:`, error);
    }
  }

  /**
   * @method updateNote
   * @description Updates a note in the IndexedDB database.
   * @param {string} noteId - The ID of the note to update.
   * @param {object} changes - The changes to apply to the note.
   */
  async updateNote(noteId, changes) {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction("notes", "readwrite");
      const store = transaction.objectStore("notes");

      const request = store.get(noteId);

      request.onsuccess = () => {
        const note = request.result;

        if (note) {
          // Apply changes and mark the note as unsynced
          Object.assign(note, changes, {
            updatedAt: new Date().toISOString(),
            synced: false,
          });

          const updateRequest = store.put(note);

          updateRequest.onsuccess = () => {
            this.logger.log(`Note updated successfully:`, note);
          };

          updateRequest.onerror = (event) => {
            this.logger.error(`Error updating note:`, event.target.error);
          };
        } else {
          this.logger.log(`Note with ID ${noteId} not found.`);
        }
      };

      request.onerror = (event) => {
        this.logger.error(
          `Error fetching note for update:`,
          event.target.error
        );
      };
    } catch (error) {
      this.logger.error(`Error in updateNote:`, error);
    }
  }

  /**
   * @method deleteNote
   * @description Deletes a note with the specified ID and tracks it for syncing.
   * @param {string} id - The ID of the note to delete.
   */
  async deleteNote(id) {
    if (!id || typeof id !== "string") {
      this.logger.error("Invalid ID provided for deletion.");
      return;
    }

    const db = await this.dbPromise;
    const transaction = db.transaction("notes", "readwrite");
    const store = transaction.objectStore("notes");

    // Attempt to delete the note
    const request = store.delete(id);

    request.onsuccess = async () => {
      this.logger.log(`Note with ID ${id} deleted successfully.`);

      if (navigator.onLine) {
        try {
          await this.syncDeleteNoteWithServer(id);
        } catch (err) {
          this.logger.error(`Failed to sync note deletion with server: ${err}`);
        }
      } else {
        // Track the deleted note for syncing
        this.addDeletedNoteId(id);
      }
    };

    request.onerror = (event) => {
      this.logger.error(`Error deleting note: ${event.target.error}`);
    };

    transaction.oncomplete = () => {
      this.logger.log(`Transaction for deleting note with ID ${id} completed.`);
    };

    transaction.onerror = (event) => {
      this.logger.error(
        `Transaction error while deleting note: ${event.target.error}`
      );
    };

    transaction.onabort = (event) => {
      this.logger.error(
        `Transaction aborted while deleting note: ${event.target.error}`
      );
    };
  }

  /**
   * @method syncDeleteNoteWithServer
   * @description Syncs the note deletion with the server.
   * @param {string} id - The ID of the note to delete on the server.
   */
  async syncDeleteNoteWithServer(id) {
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: this.instanceID, deletedNoteID: id }),
    };

    const response = await fetch("api/deletenote", options);
    if (!response.ok)
      throw new Error(`Server responded with status: ${response.status}`);
    const result = await response.json();
    this.logger.log(result.message);
  }

  /**
   * @method addDeletedNoteId
   * @description Adds the ID of a deleted note to a tracking list in localStorage.
   * @param {string} id - The ID of the deleted note to track.
   */
  addDeletedNoteId(id) {
    // Fetch the current list of deleted notes from localStorage
    let deletedNotes =
      JSON.parse(localStorage.getItem(this.DELETED_NOTES_KEY)) || [];

    // Add the new ID to the list
    if (!deletedNotes.includes(id)) {
      deletedNotes.push(id);
      this.logger.log(`Note ID ${id} added to deleted notes tracking.`);
    }

    // Save the updated list back to localStorage
    localStorage.setItem(this.DELETED_NOTES_KEY, JSON.stringify(deletedNotes));
  }
  /**
   * Returns an array containing the ID's of all deleted notes.
   * @returns {[]}
   */
  getDeletedNoteIDs() {
    return JSON.parse(localStorage.getItem(this.DELETED_NOTES_KEY)) || [];
  }

  /**
   * Clears The IDs of all deleted notes from storage.
   */
  clearDeletedNoteIds() {
    localStorage.removeItem(this.DELETED_NOTES_KEY);
  }

  /**
   * Gets a single note that matches the id given
   * @param {string} noteID  Id of the note to be fetched
   * @param {function} callback callback function containing the note
   */
  async getSingleNote(noteID, callback) {
    const db = await this.dbPromise;
    const transaction = db.transaction("notes", "readonly");
    const store = transaction.objectStore("notes");

    const request = store.get(noteID);

    request.onsuccess = () => {
      this.logger.log(`Note with ID ${noteID} fetched`);
      callback(request.result);
    };

    request.onerror = (event) => {
      this.logger.log(
        `An error occured getting note with ID : ${noteID}, error:${event.target.error}`
      );
    };
  }

  async updateSync(processedNotes) {
    if (!processedNotes || processedNotes.length === 0) {
      this.logger.log("No processed notes to update.");
      return;
    }

    try {
      const db = await this.dbPromise;
      const transaction = db.transaction("notes", "readwrite");
      const store = transaction.objectStore("notes");

      for (const processedNote of processedNotes) {
        const request = store.get(processedNote.id);

        request.onsuccess = (event) => {
          const note = event.target.result;
          if (note && !note.synced) {
            note.synced = true;
            store.put(note);
            this.logger.log("Note Updated Successfully", note);
          } else {
            this.logger.log(
              `Note with ID ${processedNote.id} not found or already synced.`
            );
          }
        };

        request.onerror = (event) => {
          this.logger.error(`Error updating note:`, event.target.error);
        };
      }
    } catch (error) {
      this.logger.error(`Database error: ${error}`);
    }
  }
  /**
   * @method syncNotes
   * @description Syncs unsynced notes with the server when the app goes online.
   */
  async syncNotes() {
    let noteObject = {
      user_id: this.instanceID,
      notes: [],
      deletedNotes: this.getDeletedNoteIDs(), // Include deleted note IDs
    };

    try {
      // Fetch unsynced notes
      this.fetchNotes(false, async (unsyncedNotes) => {
        noteObject.notes = unsyncedNotes;

        // Prepare fetch options
        let options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(noteObject),
        };

        // Send notes and deletions to the server
        fetch("/api/syncnotes", options)
          .then((response) => response.json())
          .then((response) => {
            // Update synced notes
            this.updateSync(response.notes);

            // Clear deleted notes if successfully processed
            if (response.deletedProcessed) {
              this.clearDeletedNoteIds();
            }
          })
          .catch((error) => {
            this.logger.error("Sync failed:", error);
          });
      });
    } catch (err) {
      this.logger.error(`An error occurred during sync: ${err}`);
    }
  }

  /**
   * @method fetchBackendData
   * @description Fetches all notes from the backend and syncs with the frontend storage.
   */
  async fetchBackendData() {
    try {
      const response = await fetch(
        `/api/fetchnotes?user_id=${this.instanceID}`,
        { method: "GET" }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch backend data: ${response.statusText}`);
      }

      const { notes, deletedNoteIDs } = await response.json();

      if (!Array.isArray(notes)) {
        throw new Error('Invalid "notes" format from backend');
      }
      if (!Array.isArray(deletedNoteIDs)) {
        throw new Error('Invalid "deletedNoteIDs" format from backend');
      }

      const db = await this.dbPromise;
      const transaction = db.transaction("notes", "readwrite");
      const store = transaction.objectStore("notes");

      // Sync notes from backend.
      for (const note of notes) {
        store.put(note);
      }

      // Sync deleted notes.
      for (const { deletedNoteId } of deletedNoteIDs) {
        const request = store.get(deletedNoteId);

        request.onsuccess = (event) => {
          if (event.target.result) {
            store.delete(deletedNoteId);
            this.logger.log(`Deleted note with ID: ${deletedNoteId}`);
          } else {
            this.logger.log(
              `Note with ID ${deletedNoteId} does not exist locally.`
            );
          }
        };

        request.onerror = (event) => {
          this.logger.error(
            `Error fetching note with ID ${deletedNoteId}: ${event.target.error}`
          );
        };
      }

      transaction.oncomplete = () => {
        this.logger.log("Frontend successfully synced with backend.");
      };

      transaction.onerror = (event) => {
        this.logger.error(
          `Transaction error during sync: ${event.target.error}`
        );
      };
    } catch (error) {
      this.logger.error(
        `An error occurred during fetchBackendData: ${error.message}`
      );
    }
  }
}

const STORAGE_KEY = "NOTESYNC";
/**
 * Manages instance IDs and persists them in localStorage.
 */
class SetInstanceIDs {
  constructor(localStorage, instances = {}, log = true) {
    if (!localStorage) {
      throw new Error("localStorage is not available.");
    }

    this.localStorage = localStorage;
    this.logger = new Logger(log);

    try {
      const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      this.instances = new Map(Object.entries({ ...instances, ...savedData }));
    } catch (error) {
      this.logger.error("Error parsing localStorage data:", error);
      this.instances = new Map(Object.entries(instances));
    }
  }

  setInstance(name, Id) {
    if (typeof name !== "string" || typeof Id !== "string") {
      throw new Error("Both name and Id must be strings.");
    }

    if (this.instances.has(name) && this.instances.get(name) === Id) {
      this.logger.log(
        `Instance "${name}" already exists with the same ID. No update needed.`
      );
      return;
    }

    this.instances.set(name, Id);
    this._updateLocalStorage();
    this.logger.log(`Instance "${name}" has been updated/added.`);
  }

  getInstanceID(name) {
    return this.instances.get(name) || null;
  }

  removeInstance(name) {
    if (this.instances.has(name)) {
      this.instances.delete(name);
      this._updateLocalStorage();
    }
  }

  clearInstances() {
    this.instances.clear();
    this._updateLocalStorage();
  }

  _updateLocalStorage() {
    try {
      this.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Object.fromEntries(this.instances))
      );
    } catch (error) {
      this.logger.error("Error updating localStorage:", error);
    }
  }
}
