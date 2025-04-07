import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, onAuthStateChanged, sendEmailVerification, updateEmail, reauthenticateWithCredential, EmailAuthProvider, updatePassword, sendPasswordResetEmail,fetchSignInMethodsForEmail } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getDatabase, ref, get, update } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let currentUserId = null;

// Get email input and button elements
const emailInput = document.getElementById("email");
const saveEmailBtn = document.getElementById("saveEmailBtn");
const emailError = document.getElementById("emailError");

// Disable button initially
if (saveEmailBtn) saveEmailBtn.disabled = true;

// Email validation function
function validateEmail() {
    if (!emailInput || !saveEmailBtn) return;

    const newEmail = emailInput.value.trim();
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (newEmail === "") {
        emailError.innerText = "Email is required."; // Show error immediately if empty
        emailInput.classList.add("is-invalid");
        saveEmailBtn.disabled = true;
    } else if (!emailPattern.test(newEmail)) {
        emailError.innerText = "Please enter a valid email address.";
        emailInput.classList.add("is-invalid");
        saveEmailBtn.disabled = true;
    } else if (newEmail.length < 5 || newEmail.length > 100) {
        emailError.innerText = "Email must be between 5 and 100 characters.";
        emailInput.classList.add("is-invalid");
        saveEmailBtn.disabled = true;
    } else {
        emailError.innerText = "";
        emailInput.classList.remove("is-invalid");
        saveEmailBtn.disabled = false; // Enable button if valid
    }
}

// Attach validation to input events
if (emailInput) {
    emailInput.addEventListener("input", validateEmail); // Validate on typing
    emailInput.addEventListener("focus", validateEmail); // Validate immediately when clicked
}

// Function to send an email using PHP backend
async function sendEmail(to, subject, oldEmail, newEmail, verificationUrl) {
    try {
        const serverIP = "192.168.208.80";
        const response = await fetch(`http://${serverIP}:8000/send_email.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ to, subject, oldEmail, newEmail, verificationUrl }),
        });

        const result = await response.json();
        console.log("Email Response:", result);

        if (!result.success) {
            console.error("Email sending failed:", result.message);
        }
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

async function saveEmail() {
    validateEmail();

    if (saveEmailBtn.disabled) return;

    const newEmail = emailInput.value.trim();
    const user = auth.currentUser;

    if (!user) {
        alert("User is not authenticated.");
        return;
    }

    try {
        // 1. Check if email is already in Firebase Authentication
        const signInMethods = await fetchSignInMethodsForEmail(auth, newEmail);
        if (signInMethods && signInMethods.length > 0) {
            alert("This email is already in use. Please enter a different email.");
            return;
        }

        // 2. Check if email exists in "System_Users" in Firebase Realtime Database
        const systemUsersRef = ref(db, "System_Users");
        const systemUsersSnapshot = await get(systemUsersRef);

        if (systemUsersSnapshot.exists()) {
            const systemUsersData = systemUsersSnapshot.val();
            for (const userId in systemUsersData) {
                if (systemUsersData[userId].user_email === newEmail) {
                    alert("This email is already in use in System_Users. Please enter a different email.");
                    return;
                }
            }
        }

        // 3. Check if email exists in "Users" in Firebase Realtime Database
        const usersRef = ref(db, "Users");
        const usersSnapshot = await get(usersRef);

        if (usersSnapshot.exists()) {
            const usersData = usersSnapshot.val();
            for (const userId in usersData) {
                if (usersData[userId].email === newEmail) {
                    alert("This email is already in use in Users. Please enter a different email.");
                    return;
                }
            }
        }

        const oldEmail = user.email;

        if (oldEmail === newEmail) {
            alert("You are already using this email.");
            return;
        }

        const userRef = ref(db, `System_Users/${currentUserId}`);
        const userSnapshot = await get(userRef);

        if (!userSnapshot.exists()) {
            alert("User data not found.");
            return;
        }

        // Construct verification link dynamically
        const serverIP = "192.168.76.80";
        const oldEmailVerificationUrl = `http://${serverIP}:8000/verify_old_email.php?uid=${user.uid}&newEmail=${encodeURIComponent(newEmail)}`;

        await sendEmail(
            oldEmail,  // Ipinapadala ang kasalukuyang email ng user
            "Confirm Email Change",  
            oldEmail,  // Tamang parameter para sa PHP
            newEmail,  // Tamang parameter para sa PHP
            oldEmailVerificationUrl // Tamang verification URL
        );
        
        
        alert(`A confirmation email has been sent to your current email (${oldEmail}). Please confirm before proceeding.`);

    } catch (error) {
        console.error("Error updating email:", error);
        alert("Failed to update email: " + error.message);
    }
}




window.saveEmail = saveEmail;




// Get the current user from Firebase Auth
const currentUser = auth.currentUser;

function sendPasswordReset() {
    const currentUser = auth.currentUser;

    if (currentUser) {
        const email = currentUser.email; // Get the email of the logged-in user
        sendPasswordResetEmail(auth, email)
            .then(() => {
                // Password reset email sent!
                alert('Password reset email sent. Please check your inbox.');

                // Use Bootstrap's modal methods to hide the modal
                const resetPasswordModal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));
                resetPasswordModal.hide(); // Hide the modal
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                // Handle errors
                alert(`Error: ${errorMessage}`);
            });
    } else {
        alert('No user is logged in!');
    }
}

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Set current user when logged in
        console.log('User is logged in:', user.email);
    } else {
        // No user is logged in
        console.log('No user is logged in');
    }
});


// Make the sendPasswordReset function globally accessible
window.sendPasswordReset = sendPasswordReset;

    // Event listener to remove backdrop when modal is closed
    var resetPasswordModal = document.getElementById('resetPasswordModal');
    resetPasswordModal.addEventListener('hidden.bs.modal', function () {
        document.body.classList.remove('modal-open');  // Remove modal-open class
        document.querySelector('.modal-backdrop').remove();  // Remove backdrop
    });

// Password Validation Elements
const currentPasswordInput = document.getElementById('current_password');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm_password');
const savePasswordBtn = document.getElementById('savePasswordBtn');
const currentPasswordError = document.getElementById('currentPasswordError');
const passwordError = document.getElementById('passwordError');
const confirmPasswordError = document.getElementById('confirmPasswordError');

if (currentPasswordInput && passwordInput && confirmPasswordInput) {
    currentPasswordInput.addEventListener('input', validatePassword);
    passwordInput.addEventListener('input', validatePassword);
    confirmPasswordInput.addEventListener('input', validatePassword);
}

function validatePassword() {
    if (!currentPasswordInput || !passwordInput || !confirmPasswordInput || !savePasswordBtn) return;

    const currentPassword = currentPasswordInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    const isValidPassword = /^[A-Za-z0-9!@#$%^&*()_+]{8,20}$/.test(password);
    const isValidConfirmPassword = password === confirmPassword;

    // Current password validation
    showError(currentPasswordInput, currentPasswordError, currentPassword ? "" : "Please enter your current password.");

    // New password validation
    showError(passwordInput, passwordError, isValidPassword ? "" : "Password must be 8-20 characters long and contain letters, numbers, or special characters.");

    // Confirm password validation
    showError(confirmPasswordInput, confirmPasswordError, isValidConfirmPassword ? "" : "Passwords do not match.");

    // Enable/Disable save button based on validity
    savePasswordBtn.disabled = !(currentPassword && isValidPassword && isValidConfirmPassword);
}

function showError(inputElement, errorElement, message) {
    if (message) {
        errorElement.innerText = message;
        inputElement.classList.add('is-invalid');
    } else {
        errorElement.innerText = "";
        inputElement.classList.remove('is-invalid');
    }
}

function savePassword() {
    if (!auth.currentUser) {
        console.error('No user is logged in!');
        return;
    }

    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = passwordInput.value.trim();

    if (!currentPassword || !newPassword) return;

    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);

    reauthenticateWithCredential(auth.currentUser, credential)
        .then(() => updatePassword(auth.currentUser, newPassword))
        .then(() => {
            alert("Password updated successfully!");
            document.querySelector('#editPasswordModal .btn-close')?.click();

            // Clear the text fields after successful password update
            currentPasswordInput.value = '';
            passwordInput.value = '';
            confirmPasswordInput.value = '';

            // Reset any error messages
            showError(currentPasswordInput, currentPasswordError, "");
            showError(passwordInput, passwordError, "");
            showError(confirmPasswordInput, confirmPasswordError, "");

            // Disable the save button after clearing the fields
            savePasswordBtn.disabled = true;
        })
        .catch((error) => handleFirebaseError(error));
}

function handleFirebaseError(error) {
    let message = "An unknown error occurred. Please try again.";
    if (error.code) {
        switch (error.code) {
            case 'auth/wrong-password':
                message = "Incorrect current password. Please try again.";
                break;
            case 'auth/invalid-login-credentials':
                message = "Invalid login credentials. Please check your information.";
                break;
            case 'auth/requires-recent-login':
                message = "For security reasons, please log in again before updating your password.";
                break;
        }
    }
    showError(currentPasswordInput, currentPasswordError, message);
}

window.savePassword = savePassword;






function loadUserProfile(user) {
    if (!user) return;

    currentUserId = user.uid;
    const userRef = ref(db, 'System_Users/' + user.uid);
    
    get(userRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();

                const fullNameElement = document.getElementById('display_full_name');
                const emailElement = document.getElementById('display_email');
                const contactNumberElement = document.getElementById('display_contact_number');

                if (fullNameElement) fullNameElement.innerText = userData.full_name || 'N/A';
                if (emailElement) emailElement.innerText = userData.email || 'N/A'; // Fixed
                if (contactNumberElement) {
                    contactNumberElement.innerText = `${userData.country_code || ''} ${userData.contact_number || ''}`.trim();
                }

                const fullNameInput = document.getElementById('full_name');
                if (fullNameInput) fullNameInput.value = userData.full_name || '';

                // Load the contact number into the modal
                const contactNumberInput = document.getElementById('contact_number');
                if (contactNumberInput) {
                    contactNumberInput.value = userData.contact_number || ''; // Only load the contact number
                }
                validateFullName();
            } else {
                console.log('No user data found in database.');
            }
        })
        .catch((error) => {
            console.error('Error retrieving user data:', error);
        });
}


// Auto-refresh profile page when authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User signed in:", user);
        loadUserProfile(user);
    } else {
        console.log("No user is signed in.");
        window.location.href = "../index.html";
    }
});






























// ** Contact Number Validation **
const contactNumberInput = document.getElementById("contact_number");
const contactError = document.getElementById("contactError");
const saveContactBtn = document.querySelector("#editContactModal .btn-primary");

if (contactNumberInput) {
    contactNumberInput.addEventListener("input", validateContactNumber);
    contactNumberInput.addEventListener("countrychange", validateContactNumber); // Listen for country change
}

function validateContactNumber() {
    if (!contactNumberInput || !saveContactBtn) return;

    const iti = window.intlTelInputGlobals.getInstance(contactNumberInput);
    const contactNumber = contactNumberInput.value.trim();

    // Clear previous error messages
    contactError.innerText = "";

    if (!contactNumber) {
        contactError.innerText = "Please enter a contact number.";
        contactNumberInput.classList.add("is-invalid");
        saveContactBtn.disabled = true;
        return false;
    } else if (!iti.isValidNumber()) {
        contactError.innerText = "Please enter a valid contact number based on the selected country.";
        contactNumberInput.classList.add("is-invalid");
        saveContactBtn.disabled = true;
        return false;
    } else {
        contactNumberInput.classList.remove("is-invalid");
        saveContactBtn.disabled = false;
        return true;
    }
}

// ** Save Updated Contact Number to Firebase **
function saveContactNumber() {
    if (!currentUserId) return;

    const iti = window.intlTelInputGlobals.getInstance(contactNumberInput);
    const fullNumber = iti.getNumber(); // Get the full formatted number, including country code with '+'
    const countryCode = iti.getSelectedCountryData().dialCode; // Extract country code (e.g., +1, +44)
    const contactNumber = fullNumber.replace('+' + countryCode, "").trim(); // Extract contact number without country code

    // Validate the contact number before saving
    if (!validateContactNumber()) return;

    // Save the country code with the '+' and the contact number without it
    update(ref(db, 'System_Users/' + currentUserId), { 
        contact_number: contactNumber,  // Contact number without country code
        country_code: '+' + countryCode // Store the country code with the '+'
    })
    .then(() => {
        alert("Contact number updated successfully!");
        document.querySelector("#editContactModal .btn-close")?.click(); // Close modal
    })
    .catch((error) => {
        console.error("Error updating contact number:", error);
    });
}

window.saveContactNumber = saveContactNumber;






// Full Name Validation
const fullNameInput = document.getElementById('full_name');
const saveNameBtn = document.getElementById('saveNameBtn');
const nameError = document.getElementById('nameError');

if (fullNameInput) {
    fullNameInput.addEventListener('input', validateFullName);
}

function validateFullName() {
    if (!fullNameInput || !saveNameBtn) return;

    const fullName = fullNameInput.value.trim();
    const namePattern = /^[A-Za-z. ]+$/; // Allows letters, spaces, and periods
    const isValidLength = fullName.length >= 3 && fullName.length <= 150;
    const isValidFormat = namePattern.test(fullName);

    if (!isValidLength || !isValidFormat) {
        nameError.innerText = "Full name can only contain letters and periods.";
        fullNameInput.classList.add('is-invalid');
        saveNameBtn.disabled = true;
    } else {
        nameError.innerText = "";
        fullNameInput.classList.remove('is-invalid');
        saveNameBtn.disabled = false;
    }

    // Prevent typing more than 150 characters
    if (fullName.length >= 150) {
        fullNameInput.value = fullName.substring(0, 150);
    }
}

// Save updated name to Firebase
function saveName() {
    if (!currentUserId) return;

    const newName = fullNameInput?.value.trim();
    if (!newName || newName.length < 3 || newName.length > 150 || !/^[A-Za-z. ]+$/.test(newName)) {
        return; // Prevent saving invalid data
    }

    update(ref(db, 'System_Users/' + currentUserId), { full_name: newName })
        .then(() => {
            const fullNameElement = document.getElementById('display_full_name');
            if (fullNameElement) fullNameElement.innerText = newName;

            alert("Full name updated successfully!");
            document.querySelector('#editNameModal .btn-close')?.click(); // Close modal
        })
        .catch((error) => {
            console.error("Error updating full name:", error);
        });
}

window.saveName = saveName;
