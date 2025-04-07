// app/app.js

const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const admin = require('firebase-admin');
const app = express();

require('dotenv').config(); // Load environment variables from .env file

// Initialize Firebase Admin SDK with environment variables
const serviceAccount = require(path.join(__dirname, 'firebase-credentials.json'));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL // Use the database URL from the .env file
});

// Middleware for session and CORS
app.use(express.json());
app.use(cors());
app.use(session({
    secret: process.env.SESSION_SECRET, // Use session secret from the .env file
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Ensure cookies are not secure for local development
}));

// Serve static files (CSS, JS, images) from the 'libs' folder
app.use('/libs', express.static(path.resolve(__dirname, '../libs'))); // Ensure correct path resolution

// Redirect old '/views/...' URLs to the new cleaner routes
app.use('/views', (req, res, next) => {
    const urlMapping = {
        '/bookings/booking_history.html': '/booking-history',
        '/bookings/bookings.html': '/bookings',
        '/bookings/feedback.html': '/feedback',
        '/dashboard/dashboard.html': '/dashboard',
        '/users/manage_user.html': '/users',
        '/rooms/manage_rooms.html': '/rooms',
        '/rooms/room_settings.html': '/room-settings',
        '/system_users/manage_system_user.html': '/system-users',
        '/profile/profile.html': '/profile',
        '/login/index.html': '/login',
    };

    const newPath = urlMapping[req.path];
    if (newPath) {
        return res.redirect(newPath);
    }

    next(); // If no mapping is found, proceed to the next middleware
});

// Default route for the login page
app.get('/', (req, res) => {
    res.redirect('/login'); // Redirect to the cleaner login route
});

// Route to set session data
app.post('/set-session', (req, res) => {
    const { userId, email, userLevel, fullName } = req.body;

    if (!userId || !email) {
        return res.status(400).send('Invalid session data.');
    }

    req.session.user = {
        userId,
        email,
        userLevel,
        fullName,
    };

    res.status(200).send('Session set successfully.');
});

// Import routes
const viewRoutes = require('../routes/views');
app.use('/', viewRoutes);  // Main route for views (without '/views' prefix)

// Start the server on the port specified in the .env file (or default to 5001)
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});
