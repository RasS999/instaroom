const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const admin = require('firebase-admin');

const app = express();

// Firebase Admin
const serviceAccount = require('./firebase-credentials.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://insta-room-4b79a-default-rtdb.firebaseio.com'
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Static files
app.use('/libs', express.static(path.resolve(__dirname, 'libs')));

// Views redirection
app.use('/views', (req, res, next) => {
    const urlMapping = {
'/bookings/booking_history.html': '/booking-history',
        '/bookings/bookings.html': '/bookings',
        '/bookings/feedback.html': '/feedback',
        '/bookings/all_transaction_report.html': '/all-transaction-report',
        '/users/manage_user.html': '/users',
        '/users/user_report_and_analysis.html': '/user-report-and-analysis',
        '/dashboard/dashboard.html': '/dashboard',
        '/rooms/manage_rooms.html': '/rooms',
        '/rooms/room_settings.html': '/room-settings',
        '/system_users/manage_system_user.html': '/system-users',
        '/profile/profile.html': '/profile',
        '/login/index.html': '/login',
    };
    const newPath = urlMapping[req.path];
<<<<<<< HEAD
    if (newPath) {
        return res.redirect(newPath);
    }
    next(); // If no mapping is found, proceed to the next middleware
=======
    if (newPath) return res.redirect(newPath);
    next();
>>>>>>> d4a81c30e9a51e0d53f621234cdc184e82748d12
});

// Session route
app.post('/set-session', (req, res) => {
    const { userId, email, userLevel, fullName } = req.body;
    if (!userId || !email) return res.status(400).send('Invalid session data.');
    req.session.user = { userId, email, userLevel, fullName };
    res.status(200).send('Session set successfully.');
});

// Routes
const viewRoutes = require('./routes/views'); // adjust path if needed
app.use('/', viewRoutes);

// Catch-all route (for client-side routing like React or Vue apps)
app.all('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Adjust based on your app structure
});

// Export the app as a handler (for serverless function)
module.exports = app;

// Vercel's platform will automatically handle the serverless environment for you.
// If testing locally, you can start the app like this:
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
