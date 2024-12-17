const noteServiceForSyncing = new NoteService(window.indexedDB, new Logger(false));
const logger = new Logger(true)

document.addEventListener('DOMContentLoaded', async () => {
    if (navigator.onLine){
        try {
            // Sync Notes 
            await noteServiceForSyncing.syncNotes();
            // Start an autosync mode.
            // Schedule sync every 5 minutes if the app is online
            setInterval(() => {
                if (navigator.onLine)
                    noteServiceForSyncing.syncNotes();
            }, 300_000);

        } catch (err) {
            logger.error(`An error occurred: ${err}`);
        } 
    }
 


});

window.addEventListener('offline', () => {
    console.warn('You are offline. Data syncing will resume once you are back online.');
});
