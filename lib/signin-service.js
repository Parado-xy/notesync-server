/**
 * @module signin-service-application
 * @description This module handles Google OAuth2 authentication using Google's OAuth2 client library.
 * It provides methods to initialize the authentication process and handle the OAuth callback to retrieve user information.
 */

const { google } = require("googleapis");
const GoogleUser = require("./models/google-user");
const more_credentials = require("../credentials2.json");

// Initialize the OAuth2 client with the Google API credentials
const oauth2Client = new google.auth.OAuth2(
  more_credentials.web.client_id, // The client ID obtained from the Google Developer Console
  more_credentials.web.client_secret, // The client secret obtained from the Google Developer Console
  process.env.REDIRECT_URI // The URL to which Google will redirect after user authentication
);

// Log the redirect URI for debugging purposes
// console.log(credentials.redirect_uri);

// Define the scopes for accessing Google APIs, in this case, the user's profile information
const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

/**
 * @function initializeAuthentication
 * @description This function initiates the Google OAuth2 authentication process by generating an
 * authorization URL and redirecting the user to Google's sign-in page.
 *
 * @param {Object} req - The HTTP request object from Express.
 * @param {Object} res - The HTTP response object from Express.
 * @returns {void} Redirects the user to the Google OAuth2 authentication URL.
 */
const initializeAuthentication = (req, res) => {
  // Generate an authorization URL for the user to sign in with Google
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // Ensures the app gets a refresh token
    scope: SCOPES, // The permissions required to access the user profile
  });

  // Redirect the user to the generated Google sign-in page
  res.redirect(authUrl);
};

/**
 * @function handleCallback
 * @description This function handles the OAuth2 callback from Google after the user has authenticated.
 * It exchanges the authorization code for an access token, and uses the token to retrieve user profile information.
 *
 * @param {Object} req - The HTTP request object from Express, containing the authorization code.
 * @param {Object} res - The HTTP response object from Express, used to send the user information.
 * @returns {Promise<void>} Sends the user's profile data as the response, or an error message if authentication fails.
 */
const handleCallback = async (req, res) => {
  // Extract the authorization code from the query parameters
  const { code } = req.query;

  try {
    // Exchange the authorization code for an access token
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens); // Set the access token to the OAuth2 client for subsequent requests

    // Create an OAuth2 service object to interact with the Google APIs
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2", // Use version 2 of the OAuth2 API
    });

    // Retrieve the user's profile information using the access token
    const userInfo = (await oauth2.userinfo.get()).data;

    // Send a Positive response code.
    res.status(200);

    // Check if the user already exists in the database
    let userExists = await GoogleUser.findOne({ id: userInfo.id });

    // If the user does not exist, create a new user in the database
    if (!userExists) {
      await GoogleUser.create({
        id: userInfo.id, // Google user ID
        firstName: userInfo.given_name, // User's first name from the Google profile
        lastName: userInfo.family_name, // User's last name from the Google profile
        picLink: userInfo.picture, // Optional profile picture URL
      })
        .then((user) => {
          // Store the user's ID in the session, and redirect to the home page
          req.session._id = user.id;
          req.session.user = user;
          res.redirect(`/?user=${req.session._id}&new=true`);
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      // If the user already exists, store the user's ID in the session and redirect to the home page
      req.session._id = userExists.id;
      req.session.user = userExists;
      // Redirect with query params that can  be ascessed
      res.redirect(`/?user=${req.session._id}&new=false`);
    }
  } catch (error) {
    // If there is an error during authentication, send an error response
    res.status(500).send("Authentication failed");
  }
};

// Export the authentication functions
module.exports = {
  initializeAuthentication,
  handleCallback,
};
