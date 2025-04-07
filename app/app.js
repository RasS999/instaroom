const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const admin = require('firebase-admin');
const app = express();

// Load environment variables
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, 'firebase-credentials.json'));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL || 'https://insta-room-4b79a-default-rtdb.firebaseio.com', // Use environment variable for DB URL
});

// Middleware for session and CORS
app.use(express.json());
app.use(cors());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Use an environment variable for the secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Secure cookies in production only
}));

// Serve static files from the 'public' folder (instead of using relative paths like '../libs')
app.use('/libs', express.static(path.resolve(__dirname, 'public/libs'))); // Assuming you have a 'public/libs' folder

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

// Import routes for views (no '/views' prefix)
const viewRoutes = require('../routes/views');
app.use('/', viewRoutes);

// Start the server on port from environment variable (default to 5001)
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});
