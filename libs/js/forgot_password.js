// Import Firebase and config
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js"; 

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Get the form and input elements
const form = document.getElementById("forgot-password-form");
const emailInput = document.getElementById("email");
const errorMessage = document.getElementById("error-message");
const successMessage = document.getElementById("success-message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();

  // Reset messages
  errorMessage.textContent = "";
  successMessage.textContent = "";
  errorMessage.style.display = "none";
  successMessage.style.display = "none";

  if (!email) {
    errorMessage.textContent = "Please enter a valid email address.";
    errorMessage.style.display = "block";
    return;
  }

  try {
    // Send password reset email
    await sendPasswordResetEmail(auth, email);
    
    // Show success message
    successMessage.textContent = "Password reset email sent! Check your inbox.";
    successMessage.style.display = "block";

    // Alert box for confirmation
    alert("Password reset email has been sent! Please check your inbox.");
    
  } catch (error) {
    console.error("Error sending password reset email:", error);

    // Improved error handling
    let errorMsg = "An error occurred. Please try again.";
    if (error.code === "auth/user-not-found") {
      errorMsg = "No account found with this email.";
    } else if (error.code === "auth/invalid-email") {
      errorMsg = "Invalid email format.";
    } else if (error.code === "auth/network-request-failed") {
      errorMsg = "Network error. Check your internet connection.";
    }

    errorMessage.textContent = errorMsg;
    errorMessage.style.display = "block";
  }
});
