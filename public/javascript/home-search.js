// DEFINE THE RECOGNITION OBJECT WITH IMPROVED BROWSER COMPATIBILITY
const RecognitionClass = window.SpeechRecognition 
    || window.webkitSpeechRecognition
    || window.mozSpeechRecognition
    || window.msSpeechRecognition;



// HTML ELEMENTS SUITABLE FOR THIS SERVICE.
const HTMLElements = {
    'searchBar': document.getElementById('searchInput'),
     'micButton': document.getElementById('micButton'),
    'searchInput': document.getElementById('searchInput')
};



// INITIALIZE THE SERVICE IN DEBUG MODE
const service = new VoiceSearchService(RecognitionClass, true, null, {
    debugMode: false,
    lang: 'en-US'
});


// Updated usage in the main script
document.addEventListener('DOMContentLoaded', () => {
    const micButton = document.getElementById('micButton');
    const searchInput = document.getElementById('searchInput');


    // Check for speech recognition support
    if ('webkitSpeechRecognition' in window) {
        const voiceSearchService = new VoiceSearchService(
            webkitSpeechRecognition, 
            true,  // Use grammar
            searchInput,  // Target element
            {
                debugMode: true,  // Enable debug logging
                lang: 'en-US'
            }
        );

        micButton.addEventListener('click', () => {
            try {
                voiceSearchService.toggleService(micButton);
            } catch (error) {
                voiceErrorMessage.textContent = 'Voice recognition failed. Please try again.';
                voiceErrorMessage.style.display = 'block';
                micButton.classList.remove('recording');
                console.error('Voice search error:', error);
            }
        });
    } else {
        // Hide mic button if speech recognition is not supported
        micButton.style.display = 'none';
    }
});