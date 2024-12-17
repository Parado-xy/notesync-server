        // Lucide Icons Initialization
        lucide.createIcons();

        // Dark/Light Mode Toggle
        const modeToggle = document.getElementById('modeToggle');
        const sunIcon = document.getElementById('sunIcon');
        const moonIcon = document.getElementById('moonIcon');
        const body = document.body;

        // Check for saved theme preference
        const savedTheme = localStorage.getItem('noteAppTheme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
            sunIcon.classList.add('d-none');
            moonIcon.classList.remove('d-none');
        }

        modeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            
            // Toggle icon visibility
            sunIcon.classList.toggle('d-none');
            moonIcon.classList.toggle('d-none');

            // Save theme preference
            const isDarkMode = body.classList.contains('dark-mode');
            localStorage.setItem('noteAppTheme', isDarkMode ? 'dark' : 'light');
        });

        // Add Note Button
        const addNoteBtn = document.getElementById('addNoteBtn');
        addNoteBtn.addEventListener('click', () => {
            //Navigate to a new note page
            window.location.href = 'notepad'
        });

        // Search Functionality
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            let searchTerm = e.target.value.toLowerCase();
            let noteCards = document.querySelectorAll('.note-card');
            
            noteCards.forEach(card => {
                let title = card.querySelector('.card-title').textContent.toLowerCase();
                let content = card.querySelector('.card-text').textContent.toLowerCase();

                // CLEAN THE SEARCHTERM, CONTENT AND TITLE FOR PROPER MATCHING
                searchTerm = searchTerm.replace(/[.,\/#!$%\^&\*;:{}=\-_~()]/g, '')
                content = content.replace(/[.,\/#!$%\^&\*;:{}=\-_~()]/g, '')
                title = title.replace(/[.,\/#!$%\^&\*;:{}=\-_~()]/g, '')

                if (title.includes(searchTerm) || content.includes(searchTerm)) {
                    card.parentElement.style.display = 'block';
                } else {
                    card.parentElement.style.display = 'none';
                }
            });
        });

        