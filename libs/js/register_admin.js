// Import Firebase
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";  

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Initialize intl-tel-input for contact number
const phoneInput = document.getElementById('contact_number');
const iti = window.intlTelInput(phoneInput, {
    initialCountry: "ph", // Default to Philippines
    separateDialCode: true, // Shows country code separately
    preferredCountries: ["ph", "us", "gb"], // Preferred options at top
    utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js", // For validation
});

// Add event listeners for real-time validation
document.getElementById('full_name').addEventListener('input', () => validateFullName(document.getElementById('full_name').value));
document.getElementById('email').addEventListener('input', () => validateEmail(document.getElementById('email').value));
document.getElementById('password').addEventListener('input', () => validatePassword(document.getElementById('password').value));
document.getElementById('contact_number').addEventListener('input', () => validatePhoneNumber(phoneInput.value));
document.getElementById('confirm_password').addEventListener('input', () => validateConfirmPassword(document.getElementById('password').value, document.getElementById('confirm_password').value));

// Add focus event listeners to trigger validation when user clicks on the field
document.getElementById('full_name').addEventListener('focus', () => validateFullName(document.getElementById('full_name').value));
document.getElementById('email').addEventListener('focus', () => validateEmail(document.getElementById('email').value));
document.getElementById('contact_number').addEventListener('focus', () => validatePhoneNumber(phoneInput.value));
document.getElementById('password').addEventListener('focus', () => validatePassword(document.getElementById('password').value));
document.getElementById('confirm_password').addEventListener('focus', () => validateConfirmPassword(document.getElementById('password').value, document.getElementById('confirm_password').value));

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get values from form fields
    const fullName = document.getElementById('full_name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const contactNumber = phoneInput.value.trim();
    const countryCode = iti.getSelectedCountryData().dialCode; // Get the selected country code

    // Real-time validation
    if (!validateFullName(fullName) || !validateEmail(email) || 
        !validatePassword(password) || !validatePhoneNumber(contactNumber, countryCode)) {
        alert("Please fix the errors before submitting.");
        return;
    }

    try {
        console.log("Creating user...");
        // Create the user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("Sending email verification...");
        // Send email verification
        await sendEmailVerification(user);

        console.log("Saving to Realtime Database...");
        // Save user information to Firebase Realtime Database
        await set(ref(db, "System_Users/" + user.uid), {
            full_name: fullName,
            email: email,
            user_level: 1,  // Default user level
            user_status: "active",  // Default status
            contact_number: contactNumber, // Store the contact number without the country code
            country_code: `+${countryCode}`, // Store the country code separately
            last_login: new Date().toISOString() // Set current timestamp as last login
        });

        alert("Successfully registered account! Please verify your email.");
        // Reset the form after successful registration
        document.getElementById('register-form').reset();

    } catch (error) {
        console.error("Error:", error.message);
        alert(`Error: ${error.message}`);
    }
});

// Phone number validator with country code check
function validatePhoneNumber(contactNumber, countryCode) {
    const phoneNumberError = document.getElementById('contact_number-error');
    phoneNumberError.innerHTML = ""; 

    const isValidNumber = iti.isValidNumber();
    if (!contactNumber || !isValidNumber) {
        // Display a message only if country code is available
        const countryMessage = countryCode ? `for +${countryCode}` : '';
        phoneNumberError.innerHTML = `Please enter a valid contact number ${countryMessage}.`;
        return false;
    }
    return true;
}

// Full Name Validator Function
function validateFullName(fullName) {
    const fullNameError = document.getElementById('full_name-error');
    fullNameError.innerHTML = ""; 
    
    if (!fullName) {
        fullNameError.innerHTML = "Please enter a full name.";
        return false;
    }
    return true;
}

// Email Validator Function
function validateEmail(email) {
    const emailError = document.getElementById('email-error');
    emailError.innerHTML = ""; 

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        emailError.innerHTML = "Please enter an email address.";
        return false;
    } else if (!emailPattern.test(email)) {
        emailError.innerHTML = "Please enter a valid email address.";
        return false;
    }
    return true;
}

// Password Validator Function
function validatePassword(password) {
    const passwordError = document.getElementById('password-error');
    passwordError.innerHTML = ""; 
    
    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/;

    if (!password) {
        passwordError.innerHTML = "Please enter a password.";
        return false;
    } else if (!passwordPattern.test(password)) {
        passwordError.innerHTML = "Password must be 8-30 characters with an uppercase letter, number, and special character.";
        return false;
    }
    return true;
}

// Confirm Password Validator
function validateConfirmPassword(password, confirmPassword) {
    const confirmPasswordError = document.getElementById('confirm_password-error');
    confirmPasswordError.innerHTML = "";

    if (!confirmPassword) {
        confirmPasswordError.innerHTML = "Please confirm your password.";
        return false;
    } else if (confirmPassword !== password) {
        confirmPasswordError.innerHTML = "Passwords do not match.";
        return false;
    }
    return true;
}


