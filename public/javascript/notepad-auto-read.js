/**
 * Class to handle reading text from an editor using the Web Speech API.
 * Supports play, pause, and stop functionalities with dynamic button updates.
 */
class EditorReader {
    /**
     * @param {SpeechSynthesis} speechSynthesis - The Web Speech API speech synthesis interface.
     * @param {Object} editor - The editor instance (e.g., Quill).
     * @param {Object} buttons - An object containing play, pause, and stop button DOM elements.
     * @param {HTMLSelectElement} voiceSelect - The dropdown for selecting voices.
     */
    constructor(speechSynthesis, editor, buttons, voiceSelect) {
        this.speechSynthesis = speechSynthesis;
        this.editor = editor;
        this.buttons = buttons; // { play, pause, stop }
        this.currentUtterance = null;
        this.voiceSelect = voiceSelect;
        this.voices = [];

        // Speech playback state
        this.state = {
            isPlaying: false,
            isPaused: false
        };

        // Handle voice list changes
        this.speechSynthesis.onvoiceschanged = () => {
            this.loadVoices();
        };

        // Populate voice options
        this.loadVoices();

        // Event listener to save selected voice
        this.voiceSelect.addEventListener("change", () => this.saveVoicePreference());

        // Initialize button states
        this.resetButtons();
    }

    /**
     * Extracts plain text from the editor and creates a SpeechSynthesisUtterance.
     * @returns {SpeechSynthesisUtterance|null} - The speech utterance or null if no text is available.
     */
    getUtterance() {
        const plainText = this.editor.getText().trim();

        if (!plainText) {
            console.warn('No text available to read');
            return null;
        }

        const utterance = new SpeechSynthesisUtterance(plainText);

        // Set selected voice
        const selectedVoiceIndex = this.voiceSelect.value;
        if (selectedVoiceIndex !== '' && this.voices[selectedVoiceIndex]) {
            utterance.voice = this.voices[selectedVoiceIndex];
        }

        utterance.rate = 1.0;  // Normal speaking rate
        utterance.pitch = 1.0; // Normal voice pitch

        return utterance;
    }

    /**
     * Starts reading the editor's content aloud.
     */
    readEditor() {
        if (this.state.isPlaying || this.state.isPaused) return; // Prevent redundant calls
        this.clearSpeech();

        this.currentUtterance = this.getUtterance();
        if (!this.currentUtterance) {
            this.resetButtons();
            return;
        }

        // Speech synthesis event handlers
        this.currentUtterance.onstart = () => {
            this.state.isPlaying = true;
            this.updateButtonStates();
        };

        this.currentUtterance.onend = () => {
            this.state.isPlaying = false;
            this.state.isPaused = false;
            this.resetButtons();
        };

        this.currentUtterance.onerror = (event) => {
            console.error('Speech Synthesis Error:', event.error);
            this.state.isPlaying = false;
            this.resetButtons();
        };

        try {
            this.speechSynthesis.speak(this.currentUtterance);
        } catch (error) {
            console.error('Error during speech synthesis:', error);
            this.resetButtons();
        }
    }

    /**
     * Pauses the ongoing speech playback.
     */
    pauseSpeech() {
        if (this.speechSynthesis.speaking && !this.speechSynthesis.paused) {
            this.speechSynthesis.pause();
            this.state.isPaused = true;
            this.state.isPlaying = false;
            this.updateButtonStates();
        }
    }

    /**
     * Resumes paused speech playback.
     */
    resumeSpeech() {
        if (this.speechSynthesis.paused) {
            this.speechSynthesis.resume();
            this.state.isPaused = false;
            this.state.isPlaying = true;
            this.updateButtonStates();
        }
    }

    /**
     * Stops the current speech playback and resets the state.
     */
    clearSpeech() {
        if (this.speechSynthesis.speaking || this.speechSynthesis.pending) {
            this.speechSynthesis.cancel();
            this.currentUtterance = null;
        }
        this.state.isPlaying = false;
        this.state.isPaused = false;
        this.resetButtons();
    }

    /**
     * Updates the button states based on the playback status.
     */
    updateButtonStates() {
        this.buttons.play.disabled = this.state.isPlaying;
        this.buttons.pause.disabled = !this.state.isPlaying;
        this.buttons.stop.disabled = !this.state.isPlaying && !this.state.isPaused;
    }

    /**
     * Resets button states to their initial configuration.
     */
    resetButtons() {
        this.buttons.play.disabled = false;
        this.buttons.pause.disabled = true;
        this.buttons.stop.disabled = true;
    }

    /**
     * Loads available voices and populates the voice selection dropdown.
     */
    loadVoices() {
        this.voiceSelect.innerHTML = `<option value="">Select a Voice</option>`;
        this.voices = this.speechSynthesis.getVoices();

        this.voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            this.voiceSelect.appendChild(option);
        });

        // Restore voice selection from localStorage
        const savedVoiceIndex = localStorage.getItem('selectedVoice');
        if (savedVoiceIndex !== null && this.voices[savedVoiceIndex]) {
            this.voiceSelect.value = savedVoiceIndex;
        }
    }

    /**
     * Saves the selected voice index to localStorage.
     */
    saveVoicePreference() {
        const selectedVoiceIndex = this.voiceSelect.value;
        localStorage.setItem('selectedVoice', selectedVoiceIndex);
    }
}

// --- Initialization and Usage Example ---
(() => {
    // Button DOM references
    const buttons = {
        play: document.getElementById('play-button'),
        pause: document.getElementById('pause-button'),
        stop: document.getElementById('stop-button'),
        voiceSelect: document.getElementById('voice-select')
    };

    // Quill or any editor instance
    const editor = quill; // Assume `quill` is initialized globally

    // Initialize EditorReader
    const editorReader = new EditorReader(window.speechSynthesis, editor, buttons, buttons['voiceSelect']);

    // Event listeners for buttons
    buttons.play.addEventListener('click', () => {
        if (!editorReader.state.isPlaying && !editorReader.state.isPaused) {
            editorReader.readEditor();
        } else if (editorReader.state.isPaused) {
            editorReader.resumeSpeech();
        }
    });

    buttons.pause.addEventListener('click', () => editorReader.pauseSpeech());
    buttons.stop.addEventListener('click', () => editorReader.clearSpeech());
})();
