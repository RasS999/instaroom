// libs\server\server.js

const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const cors = require('cors');
const app = express();

// Initialize Firebase Admin SDK with the service account credentials
const serviceAccount = require(path.join(__dirname, 'firebase-credentials.json'));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://insta-room-4b79a-default-rtdb.firebaseio.com' // Your Firebase Database URL
});

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors()); // Allow cross-origin requests (optional)

// POST route to delete a user by UID
app.post('/deleteUser', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // Delete user from Firebase Authentication
        await admin.auth().deleteUser(userId);
        console.log(`Successfully deleted user with UID: ${userId}`);

        // Delete user from Firebase Realtime Database
        const userRef = admin.database().ref(`System_Users/${userId}`);
        await userRef.remove();
        console.log("Successfully deleted user from database");

        return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error("Error deleting user:", error);

        // Respond with a detailed error message
        return res.status(500).json({
            error: 'Error deleting user',
            message: error.message || 'Unknown server error'
        });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
