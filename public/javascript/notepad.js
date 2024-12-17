        // Lucide Icons Initialization
        lucide.createIcons();

        // Dark/Light Mode Toggle (Similar to previous script)
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

        // Tag Management
        const tagInput = document.getElementById('tagInput');
        const addTagBtn = document.getElementById('addTagBtn');
        const tagContainer = document.getElementById('tagContainer');

        addTagBtn.addEventListener('click', () => {
            const tagText = tagInput.value.trim();
            if (tagText) {
                const tagBadge = document.createElement('span');
                tagBadge.className = 'badge bg-primary tag-badge';
                tagBadge.innerHTML = `
                    ${tagText} 
                    <button class="btn btn-sm btn-close" aria-label="Remove tag"></button>
                `;
                
                // Remove tag functionality
                const removeBtn = tagBadge.querySelector('.btn-close');
                removeBtn.addEventListener('click', () => {
                    tagContainer.removeChild(tagBadge);
                });

                tagContainer.appendChild(tagBadge);
                tagInput.value = ''; // Clear input
            }
        });

        // Save Note Button
        const saveNoteBtn = document.getElementById('saveNoteBtn');
        saveNoteBtn.addEventListener('click', () => {
            // In a real app, this would save the note
            alert('Note Saved!');
        });