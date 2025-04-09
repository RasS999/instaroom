// Import Firebase and config
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
import { firebaseConfig } from './firebase-config.js';

// Import Firebase modules
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    sendEmailVerification, 
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.8/firebase-auth.js";

import { 
    getDatabase, 
    ref, 
    update, 
    get 
} from "https://www.gstatic.com/firebasejs/9.6.8/firebase-database.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

let failedAttempts = 0; // Track failed login attempts
const maxFailedAttempts = 3; // Maximum failed attempts before lockout
const lockoutTime = 2 * 60 * 1000; // Lockout period (2 minutes)

let lockoutTimer; // Store lockout timer

// Attach login event listener
document.getElementById('loginBtn').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the default form submission
    login();
});

// Function to validate email format
function validate_email(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Function to validate password (no length restriction)
function validate_password(password) {
    return password.length > 0;
}

function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validate inputs
    if (!validate_email(email)) {
        alert('Invalid email format.');
        return;
    }
    if (!validate_password(password)) {
        alert('Password cannot be empty.');
        return;
    }

    // If failed attempts exceed max, show lockout message
    if (failedAttempts >= maxFailedAttempts) {
        alert('Too many failed login attempts. Please try again later.');
        return;
    }

    // Authenticate user with Firebase Auth
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            failedAttempts = 0; // Reset failed attempts on successful login
            const user = userCredential.user;

            if (user.emailVerified) {
                const user_data = { last_login: new Date().toISOString() };
                const userRef = ref(database, 'System_Users/' + user.uid);

                get(userRef)
                    .then((snapshot) => {
                        if (snapshot.exists()) {
                            const userData = snapshot.val();
                        
                            if (userData.user_status !== 'active') {
                                alert('Your account is not active.');
                                signOut(auth);
                                return;
                            }

                            // Store user data in localStorage
                            localStorage.setItem('email', email);
                            localStorage.setItem('full_name', userData.full_name || '');
                            localStorage.setItem('contact_number', userData.contact_number || '');
                            localStorage.setItem('country_code', userData.country_code || '');
                            localStorage.setItem('user_level', userData.user_level || '');
                            localStorage.setItem('user_status', userData.user_status || '');

                            // Redirect based on user level
                            if (userData.user_level == 2) {
                                window.location.href = '/views/login/index.html';
                            } else {
                                window.location.href = '/views/dashboard/dashboard.html';
                            }

                        } else {
                            alert('No user data found.');
                        }
                    })
                    .catch((error) => {
                        console.error('Error retrieving user data:', error);
                        alert('Failed to retrieve user data.');
                    });
            } else {
                alert('Your account is not verified.');
                setTimeout(() => {
                    sendEmailVerification(user)
                        .then(() => {
                            alert('A verification email has been sent. Please check your inbox.');
                        })
                        .catch((error) => {
                            console.error('Error sending verification email:', error);
                            alert('Failed to send verification email.');
                        });
                    signOut(auth);
                }, 2000);
            }
        })
        .catch((error) => {
            console.error('Login error:', error);
            failedAttempts++;

            // Handle specific error codes
            if (error.code === "auth/invalid-login-credentials") {
                alert('Incorrect email or password. Please try again.');
            } else if (error.code === "auth/user-not-found") {
                alert('Email not found. Please check your email.');
            } else if (error.code === "auth/wrong-password") {
                alert('Incorrect password. Please try again.');
            } else if (error.code === "auth/invalid-email") {
                alert('Invalid email format. Please check your email.');
            } else if (error.code === "auth/too-many-requests") {
                alert('Too many login attempts. Please try again later.');
            } else {
                alert('Incorrect email or password. Please try again.');
            }

            // Call the sendLoginFailureEmail function to notify of the failed login attempt
            sendLoginFailureEmail(email);

            // Lockout mechanism if too many failed attempts
            if (failedAttempts >= maxFailedAttempts) {
                lockoutTimer = setTimeout(() => {
                    failedAttempts = 0; // Reset failed attempts after lockout period
                    alert('You can try logging in again now.');
                }, lockoutTime);
            }
        });
}


function sendLoginFailureEmail(email) {
    // For simplicity, assuming you send a failure notification email to an admin or logging service
    const full_name = 'Unknown'; // You can adjust this based on your user data
    fetch('http://localhost:8000/send_email_login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `email=${encodeURIComponent(email)}&full_name=${encodeURIComponent(full_name)}`
    })
    .then(response => response.text())
    .then(data => {
        console.log('Login failure email sent:', data);
    })
    .catch(error => {
        console.error('Error sending login failure email:', error);
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is signed in:', user.email);
    } else {
        console.log('No user is signed in.');
    }
});

