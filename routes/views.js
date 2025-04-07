// routes/views.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const path = require('path');

// Login page (no auth required)
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/../views/login/index.html')); // Login page
});

// Register Admin page (no auth required)
router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '/../views/register/register_admin.html')); // Register Admin page
});

// Forgot Password page (no auth required)
router.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, '/../views/forgot_password/forgot_password.html')); // Forgot Password page
});

// Default route for root access
router.get('/', (req, res) => {
    res.redirect('/login'); // Redirect to the cleaner login route
});

// Dashboard
router.get('/dashboard', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '/../views/dashboard/dashboard.html'));  // Serving the dashboard
});

// Users Management
router.get('/users', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '/../views/users/manage_user.html'));  // Users page
});

// Bookings
router.get('/bookings', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '/../views/bookings/bookings.html')); // Bookings page
});

router.get('/booking-history', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '/../views/bookings/booking_history.html'));  // Booking History page
});

// Feedback
router.get('/feedback', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '/../views/bookings/feedback.html'));  // Feedback page
});

// Rooms
router.get('/rooms', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '/../views/rooms/manage_rooms.html'));  // Rooms page
});

router.get('/room-settings', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '/../views/rooms/room_settings.html'));  // Room Settings page
});

// System Users
router.get('/system-users', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '/../views/system_users/manage_system_user.html'));  // System Users page
});

// Profile
router.get('/profile', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '/../views/profile/profile.html'));  // Profile page
});

module.exports = router;
