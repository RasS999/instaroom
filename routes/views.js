// routes/views.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const path = require('path');

// Function to safely serve HTML files and handle errors
function servePage(res, pagePath) {
    const filePath = path.join(__dirname, '/../views', pagePath);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(500).send('Error loading page: ' + err.message);
        }
    });
}

// Login page (no auth required)
router.get('/login', (req, res) => {
    servePage(res, 'login/index.html');
});

// Register Admin page (no auth required)
router.get('/register', (req, res) => {
    servePage(res, 'register/register_admin.html');
});

// Forgot Password page (no auth required)
router.get('/forgot-password', (req, res) => {
    servePage(res, 'forgot_password/forgot_password.html');
});

// Default route for root access
router.get('/', (req, res) => {
    res.redirect('/login'); // Redirect to the login route
});

// Dashboard (auth required)
router.get('/dashboard', authMiddleware, (req, res) => {
    servePage(res, 'dashboard/dashboard.html');
});

// Users Management (auth required)
router.get('/users', authMiddleware, (req, res) => {
    servePage(res, 'users/manage_user.html');
});

// Bookings (auth required)
router.get('/bookings', authMiddleware, (req, res) => {
    servePage(res, 'bookings/bookings.html');
});

// Booking History (auth required)
router.get('/booking-history', authMiddleware, (req, res) => {
    servePage(res, 'bookings/booking_history.html');
});

// Feedback (auth required)
router.get('/feedback', authMiddleware, (req, res) => {
    servePage(res, 'bookings/feedback.html');
});

// Rooms (auth required)
router.get('/rooms', authMiddleware, (req, res) => {
    servePage(res, 'rooms/manage_rooms.html');
});

// Room Settings (auth required)
router.get('/room-settings', authMiddleware, (req, res) => {
    servePage(res, 'rooms/room_settings.html');
});

// System Users (auth required)
router.get('/system-users', authMiddleware, (req, res) => {
    servePage(res, 'system_users/manage_system_user.html');
});

// Profile (auth required)
router.get('/profile', authMiddleware, (req, res) => {
    servePage(res, 'profile/profile.html');
});

module.exports = router;
