// SERVER ENTRY POINT.

const express = require('express'),
      express_session = require('express-session'),
      mongoose = require('mongoose'),
      credentials = require('./credentials.json'),
      body_parser = require('body-parser');


// SET UP DOTENV
require("dotenv").config();      
// INSTANTIATE SERVER
const server =  express(); 

// CONNECT DATABASE
mongoose
  .connect(process.env.MONGODB_URI + "notesync")
  .then(() => {
    console.log("Database Connected");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', () => {
    console.log('Database connection is open');
});


// USE MIDDLEWARE
server.use(require('./lib/logger'));

server.use(express.static('public'));

server.use(express_session({secret: process.env.SESSION_SECRET,
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