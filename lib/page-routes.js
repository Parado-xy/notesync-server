// THIS IS THE PAGE ROUTING MODULE HEREIN ALL PAGES WILL BE ROUTED.

// GET METHODS FOR THE SIGNIN SERVICE;
const {initializeAuthentication, handleCallback} = require('./signin-service')

const syncingService = require('./note-syncing-service');
const frontEndSyncingService = require('./front-end-syncing-service');
const noteDeletingService = require('./note-deleting-service');

module.exports = (server) => {
    server.get('/', (req, res)=> {
        res.sendFile('./client/index.html',{root:'./'})
    });

    server.get('/notepad', (req, res) => {
        res.sendFile('./client/notepad.html',{root:'./'})
    });

    server.get('/offline', (req, res)=> {
        res.sendFile('./client/offline.html',{root:'./'})
    });

    server.get('/signon', (req, res)=> {
        res.sendFile('./client/signon.html', {root:'./'})
    });

    server.get('/auth/google', initializeAuthentication);

    server.get('/auth/google/callback', handleCallback);

    server.get('/api/user', (req, res)=> {
        res.json({'user':req.session.user});
    })

    server.post('/api/syncnotes', syncingService);

    server.get('/api/fetchnotes', frontEndSyncingService);

    server.post('/api/deletenote', noteDeletingService);
}