// DEFINE THE RECOGNITION OBJECT WITH IMPROVED BROWSER COMPATIBILITY
const RecognitionClass = window.SpeechRecognition 
    || window.webkitSpeechRecognition
    || window.mozSpeechRecognition
    || window.msSpeechRecognition;




// Updated usage in the main script
document.addEventListener('DOMContentLoaded', () => {

    // HTML ELEMENTS SUITABLE FOR THIS SERVICE.
const HTMLElements = {
    'micButton': document.getElementById('startVoiceInput'),
};

    // Check for speech recognition support
    if ('webkitSpeechRecognition' in window) {
        const voiceSearchService = new VoiceSearchService(
            webkitSpeechRecognition, 
            false,  // Don't use grammar.
            null,  // Target element set to Null here because we use the quill editor.
            {
                debugMode: true,  // Enable debug logging
                lang: 'en-US'
            }
        );

        HTMLElements['micButton'].addEventListener('click', () => {
            try {
                voiceSearchService.toggleService(HTMLElements['mic']);
            } catch (error) {
                console.error('Voice search error:', error);
            }
        });
    } else {
        // Hide mic button if speech recognition is not supported
        HTMLElements['micButton'].style.display = 'none';
    }
});
