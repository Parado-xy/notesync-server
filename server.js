// SERVER ENTRY POINT.

const express = require('express'),
      express_session = require('express-session'),
      mongoose = require('mongoose'),
      credentials = require('./credentials.json'),
      more_credentials = require('./credentials2.json'),
      passport = require('passport'),
      GoogleStrategy = require('passport-google-oauth20'),
      body_parser = require('body-parser');

// INSTANTIATE SERVER
const server =  express(); 

// CONNECT DATABASE
mongoose.connect(credentials.mongodb_connection_string + 'notesync')
.then(() => {
    console.log('Database Connected');
}).catch((err) => {
    console.error('Database connection error:', err);
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', () => {
    console.log('Database connection is open');
});


// USE MIDDLEWARE
server.use(require('./lib/logger'));

server.use(express.static('public'));

server.use(express_session({secret: credentials.session_secret,
    resave: false,
    saveUninitialized: true
}));

server.use(body_parser.json());




// HANDLE ROUTES
require('./lib/page-routes')(server);

// LISTEN
const port = process.env.PORT || 3300 ;
server.listen(port, ()=> {
    console.log(`Server Listening On http://localhost:${port}`)
});