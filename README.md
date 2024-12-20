# NoteSync

NoteSync is a voice-first note-taking application that allows users to create, edit, and manage notes with voice input capabilities. The application supports offline functionality (It's a PWA), note synchronization, and PDF export.
The project is live at: https://notesync-fyvo.onrender.com/

## Features

- **Voice Input**: Create and edit notes using voice commands.
- **Offline Support**: Access and edit notes even when offline.
- **Note Synchronization**: Sync notes across devices when online.
- **PDF Export**: Save notes as PDF files.
- **Dark Mode**: Toggle between light and dark themes.
- **Tag Management**: Organize notes with tags.
- **Search Functionality**: Search notes by title or content.

## Project Structure

```
server/
    .gitignore
    client/
        index.html
        notepad.html
        offline.html
        signon.html
    codestats.js
    credentials.json
    credentials2.json
    lib/
        front-end-syncing-service.js
        logger.js
        models/
            deleted-notes.js
            google-user.js
            note-model.js
            original-user.js
        note-deleting-service.js
        note-syncing-service.js
        page-routes.js
        signin-service.js
    logs.csv
    package.json
    public/
        .empty
        assets/
        javascript/
            application-classes.js
            home.js
            home-load.js
            lucide.js
            notepad.js
            notepad-auto-read.js
            notepad-save.js
            notepad-to-pdf.js
            notepad-voice.js
        manifest.json
    server.js
```

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/parado-xy/notesync-server.git
    cd notesync
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Start the server:
    ```sh
    npm start
    ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`.
2. Sign up or sign in to start using NoteSync.
3. Create, edit, and manage your notes using the provided interface.

## API Endpoints

- **GET `/api/user`**: Fetch user information.
- **POST `/api/syncnotes`**: Sync notes with the server.
- **GET `/api/fetchnotes`**: Fetch notes from the server.
- **POST `/api/deletenote`**: Delete a note.
- **GET `/signon`**: Serve the sign-on page.
- **GET `/auth/google`**: Initiate Google authentication.
- **GET `/auth/google/callback`**: Handle Google authentication callback.

## Scripts

- **`start`**: Start the server using nodemon.
- **`test`**: Run tests (currently not specified).

## Dependencies

- bcryptjs
- body-parser
- express
- express-session
- googleapis
- mongoose
- nodemon
- passport
- passport-google-oauth20

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add new feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Create a new Pull Request.

## Contact

For any inquiries, please contact the project maintainer at [jallaamaju@gmail.com].

