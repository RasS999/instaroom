import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, get, set, update, remove } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, updateEmail, updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider, onAuthStateChanged, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Create a secondary Firebase app instance for user creation
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

document.getElementById("add-btn").addEventListener("click", function () {
    if (validateForm()) {
      addUserWithAuth().then(() => {
            resetAdminForm();
        });
    }
  });
  
async function addUserWithAuth() {
    try {
      // Get form values
      const fullName = document.getElementById("full_name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const age = document.getElementById("age").value;
      
      // Get formatted contact number and country code
      const contactNumberInput = document.getElementById("contact_number");
      const iti = window.intlTelInputGlobals.getInstance(contactNumberInput);
      
      // Get the country code and local number
      const countryCode = `+${iti.getSelectedCountryData().dialCode}`; // Ensure it includes '+'
      const localNumber = iti.getNumber().replace(countryCode, '');
  
      // Create user with the secondary auth instance
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const user = userCredential.user;
  
      await sendEmailVerification(user);
      console.log(`Verification email sent to: ${email}`);
  
      // Store user details in Firebase Realtime Database with separated country code and contact number
      const userRef = ref(db, 'Users/' + user.uid);
      await set(userRef, {
        full_name: fullName,
        email: email,
        age: age,
        country_code: countryCode, // Store country code with '+'
        contact_number: localNumber, // Store local number (without country code)
      });
  
      alert('User added successfully. Please check email for verification.');

      // Sign out from the secondary auth instance to clean up
      await secondaryAuth.signOut();

      loadUsers();
    } catch (error) {
      console.error('Error adding user: ', error.message);
      alert(`Error adding user: ${error.message}`);
    }
  }



async function getUserInfo(userId) {
    if (!userId) {
        alert("Please select a user.");
        return;
    }
  
    try {
        const userRef = ref(db, 'Users/' + userId);
        const snapshot = await get(userRef);
  
        if (snapshot.exists()) {
            const userData = snapshot.val();
            return userData;
        } else {
            alert("User not found.");
            return null;
        }
    } catch (error) {
        console.error("Error fetching user data:", error.message);
        alert("Error fetching user data: " + error.message);
    }
  }
  

let selectedRowId = null; // Keep track of the selected row

function showError(input, message) {
  let errorElement = input.nextElementSibling;
  if (!errorElement || !errorElement.classList.contains('error-message')) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      input.parentNode.appendChild(errorElement);
  }
  
  // Ensure the message is only set once and not duplicated
  if (errorElement.textContent !== message) {
      errorElement.textContent = message;
  }
  
  input.classList.add('is-invalid');
}

function clearError(input) {
  let errorElement = input.nextElementSibling;
  if (errorElement && errorElement.classList.contains('error-message')) {
      errorElement.remove();
  }
  input.classList.remove('is-invalid');
}

function validateInput(input) {
    let fieldName = input.getAttribute('name');
    let value = input.value.trim();
    let isValid = true;
    let errorMessage = '';
  
    switch (fieldName) {
        case 'full_name':
            if (!value || value.length < 3) {
                errorMessage = 'Please enter a full name.';
                isValid = false;
            } else if (!/^[A-Za-z. ]+$/.test(value)) {
                errorMessage = 'Full name can only contain letters and periods.';
                isValid = false;
            }
            break;
  
        case 'email':
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value) {
                errorMessage = 'Please enter an email address.';
                isValid = false;
            } else if (!emailPattern.test(value)) {
                errorMessage = 'Please enter a valid email address.';
                isValid = false;
            }
            break;
  
        case 'age':
            if (!value) {
                errorMessage = 'Please enter your age.';
                isValid = false;
            } else if (!/^\d{2}$/.test(value) || parseInt(value) < 18) {
                errorMessage = 'Age must be at least 18.';
                isValid = false;
            }
            break;
        }
            
  
    if (fieldName !== 'password' && fieldName !== 'contact_number') {
        if (isValid) {
            clearError(input);
        } else {
            showError(input, errorMessage);
        }
    }
  
    // ** Password Validation **
    const passwordInput = document.getElementById('password');
    const passwordError = document.getElementById('password-error');
  
    passwordError.innerHTML = "";
    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/;
  
    if (!passwordInput.value.trim()) {
        passwordError.innerHTML = "Please enter a password.";
        passwordError.style.color = "red";
        isValid = false;
    } else if (!passwordPattern.test(passwordInput.value)) {
        passwordError.innerHTML = "Password must be 8-30 characters, with at least one uppercase letter, one number, and one special character.";
        passwordError.style.color = "red";
        isValid = false;
    }
  
    // ** Contact Number Validation **
    const contactNumberInput = document.getElementById("contact_number");
    const contactError = document.getElementById("contact-error"); // Add an error container in HTML
    contactError.innerHTML = "";
  
    const iti = window.intlTelInputGlobals.getInstance(contactNumberInput);
  
    if (!contactNumberInput.value.trim()) {
        contactError.innerHTML = "Please enter a contact number.";
        contactError.style.color = "red";
        isValid = false;
    } else if (!iti.isValidNumber()) {
        contactError.innerHTML = "Please enter a valid contact number based on the selected country.";
        contactError.style.color = "red";
        isValid = false;
    }
  
    return isValid;
  }
  

function validateForm() {
  let isValid = true;
  document.querySelectorAll('.form-control').forEach(input => {
      if (!validateInput(input)) {
          isValid = false;
      }
  });
  return isValid;
}

// Real-time validation on input fields
document.querySelectorAll('.form-control').forEach(input => {
  input.addEventListener('input', () => validateInput(input));
});



function resetAdminForm() {
  document.getElementById("user-form").reset();
  selectedUserId = null; // Reset selected ID if applicable
}



//   let selectedUserId;  // Declare globally

//   // Function to select a row and fill the form with user data
//   function selectUserRow(row, userData) {
//       // Fill the form with user data
//       document.getElementById('full_name').value = userData.full_name || '';
//       document.getElementById('email').value = userData.email || '';
//       document.getElementById('contact_number').value = userData.contact_number || '';
//       document.getElementById('age').value = userData.age || ''; // Added age field
  
//       // Set the selected user ID for future updates
//       selectedUserId = userData.user_id;
//       console.log("Selected User ID: ", selectedUserId);
  
//       // Highlight the selected row
//       const rows = document.querySelectorAll('#user-table-body tr');
//       rows.forEach(r => r.classList.remove('selected'));
//       row.classList.add('selected');
//   }
  
//   // Event listener for user row click
//   document.getElementById('user-table-body').addEventListener('click', (event) => {
//       const row = event.target.closest('tr');
//       if (row) {
//           const userId = row.getAttribute('data-user-id');
//           const userData = userDataCache[userId]; // Get user data from cache
//           selectUserRow(row, userData);
//       }
//   });
  


// Ensure selectedUserId updates when a row is clicked
document.getElementById('user-table-body').addEventListener('click', (event) => {
  const row = event.target.closest('tr');
  if (row) {
      const userId = row.getAttribute('data-user-id');
      if (userId) {
          selectedUserId = userId; // Ensure selectedUserId is updated
          console.log("Row clicked, selected user ID:", selectedUserId);
      }
      const userData = userDataCache[userId]; // Get user data from cache
      selectUserRow(row, userData);
  }
});

async function loadUsers() {
    const userTableBody = document.getElementById('user-table-body');
    userTableBody.innerHTML = ''; // Clear table
    userDataCache = {}; // Reset cache

    try {
        const userRef = ref(db, 'Users'); // Changed to 'Users'
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const users = [];

            snapshot.forEach(childSnapshot => {
                const user = childSnapshot.val();
                const userId = childSnapshot.key;

                // Cache user data
                userDataCache[userId] = {
                    user_id: userId,
                    full_name: user.full_name || 'N/A',
                    email: user.email || 'N/A',
                    contact_number: user.contact_number || 'N/A',
                    country_code: user.country_code || 'N/A',
                    age: user.age || 'N/A',
                };

                // Add to users array for sorting
                users.push(userDataCache[userId]);
            });

            // Sort users alphabetically by full_name
            users.sort((a, b) => a.full_name.localeCompare(b.full_name));

            // Append sorted users to the table
            users.forEach(user => {
                const row = document.createElement('tr');
                row.setAttribute('data-user-id', user.user_id);
                row.innerHTML = `  
                    <td>${user.full_name}</td>
                    <td>${user.email}</td>
                    <td>${user.country_code} ${user.contact_number}</td>
                    <td>${user.age}</td>
                `;
                userTableBody.appendChild(row);
            });
        } else {
            userTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No users found.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        userTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Failed to load users.</td></tr>';
    }
}


let userDataCache = {}; // Store user data by user ID




// Load users when the page loads
window.addEventListener('load', loadUsers);


function clearFields() {
  document.getElementById('user-form').reset();
}

document.getElementById('clear-btn').addEventListener('click', clearFields);

