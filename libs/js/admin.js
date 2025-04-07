import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, get, set, update, remove } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, updateEmail, updatePassword, deleteUser, onAuthStateChanged, signInWithEmailAndPassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Function to check if the logged-in user has access to manage_admin.html
function checkAdminAccess() {
    onAuthStateChanged(auth, async (loggedInUser) => {
        if (!loggedInUser) {
            window.location.href = "/login"; // Redirect to login page
            return;
        }

        try {
            const userRef = ref(db, `System_Users/${loggedInUser.uid}`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                const userData = snapshot.val();
                if (userData.user_level !== 1) {
                    window.history.back(); // Redirect back to the previous page
                }
            } else {
                alert("User data not found.");
                window.history.back(); // Redirect back to the previous page
            }
        } catch (error) {
            console.error("Error checking admin access:", error.message);
            alert("An error occurred while verifying access.");
            window.history.back(); // Redirect back to the previous page
        }
    });
}

// Call the function on page load
document.addEventListener("DOMContentLoaded", checkAdminAccess);

// Function to delete user from Firebase Auth and Database
async function deleteAdmin(userId) {
    if (!userId) {
        alert("Please select a user to delete.");
        return;
    }

    const loggedInUser = auth.currentUser;
    if (loggedInUser && loggedInUser.uid === userId) {
        alert("You cannot delete the currently logged-in admin.");
        return;
    }

    if (userId === "slh62GJI90S6qIknbO7qXjmbZPz1") {
        alert("This admin cannot be deleted.");
        return;
    }

    const confirmation = confirm("Are you sure you want to delete this admin? This action cannot be undone.");
    if (!confirmation) return;

    try {
        // Remove user from Realtime Database
        const userRef = ref(db, `System_Users/${userId}`);
        await remove(userRef);
        console.log("User removed from database.");

        // Call backend to delete user from Firebase Auth
        const response = await fetch('http://localhost:3000/deleteUser', {  // Ensure backend URL is correct
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Unknown error occurred while deleting user.");
        }

        // Try parsing JSON response from the backend
        let data;
        try {
            data = await response.json();
        } catch (error) {
            throw new Error("Received an empty or invalid JSON response.");
        }

        alert("User deleted successfully.");
        console.log(data.message);
        loadUsers(); // Refresh user list
    } catch (error) {
        console.error("Error deleting admin:", error.message);
        alert(`Error deleting admin: ${error.message}`);
    }
}

// Handle Delete Button Click
document.getElementById('delete-btn').addEventListener('click', async function (event) {
    event.preventDefault();
    console.log("Attempting to delete user:", selectedUserId);

    if (!selectedUserId) {
        alert("No user selected for deletion.");
        return;
    }

    await deleteAdmin(selectedUserId);
});

// Create a secondary Firebase Auth instance
const secondaryAuth = getAuth(initializeApp(firebaseConfig, "Secondary"));

document.getElementById("add-btn").addEventListener("click", function () {
    if (validateForm()) {
      addAdminWithAuth().then(() => {
        resetAdminForm(); // Reset the form after successful admin addition
      });
    }
  });
  
  async function addAdminWithAuth() {
    try {
      // Get form values
      const fullName = document.getElementById("full_name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const userStatus = document.getElementById("user_status").value;
      const userLevel = parseInt(document.getElementById("user_level").value);
  
      // Get formatted contact number and country code
      const contactNumberInput = document.getElementById("contact_number");
      const iti = window.intlTelInputGlobals.getInstance(contactNumberInput);
      
      // Get the country code and local number
      const countryCode = `+${iti.getSelectedCountryData().dialCode}`; // Ensure it includes '+'
      const localNumber = iti.getNumber().replace(countryCode, ''); // Example: 13998765432
  
      // Create user with the secondary Auth instance
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const user = userCredential.user;
  
      await sendEmailVerification(user);
      console.log(`Verification email sent to: ${email}`);
  
      // Store user details in Firebase Realtime Database with separated country code and contact number
      const adminRef = ref(db, 'System_Users/' + user.uid);
      await set(adminRef, {
        full_name: fullName,
        email: email,
        country_code: countryCode, // Store country code with '+'
        contact_number: localNumber, // Store local number (without country code)
        user_status: userStatus,
        user_level: userLevel,
        last_login: new Date().toISOString(),
      });
  
      // Sign out from the secondary Auth instance to prevent session conflicts
      await secondaryAuth.signOut();

      alert('Admin added successfully. Please check email for verification.');
      
      // Reload users list
      loadUsers();
  
      // Reset the form
      resetAdminForm();
  
    } catch (error) {
      console.error('Error adding admin: ', error.message);
      alert(`Error adding admin: ${error.message}`);
    }
  }
// Function to Get User Info (Email & Other Details)
async function getUserInfo(userId) {
  if (!userId) {
      alert("Please select a user.");
      return;
  }

  try {
      const userRef = ref(db, 'System_Users/' + userId);
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

      case 'user_status':
      case 'user_level':
          if (!value) {
              errorMessage = `Please select a ${fieldName.replace('_', ' ')}.`;
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
  
  // Function to reset form fields
  function resetAdminForm() {
    document.getElementById("full_name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
    document.getElementById("contact_number").value = "";
    document.getElementById("user_status").value = "active"; // Reset to default
    document.getElementById("user_level").value = "1"; // Reset to default Admin
  }
  

let selectedUserId;  // Declare globally

// Function to select a row and fill the form with user data
function selectUserRow(row, userData) {
    // Fill the form with user data
    document.getElementById('full_name').value = userData.full_name || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('contact_number').value = userData.contact_number || '';
    document.getElementById('user_level').value = userData.user_level || 1;
    document.getElementById('user_status').value = userData.user_status || 'active';
    // document.getElementById('last_login').value = userData.last_login || 'N/A';

    // Set the selected user ID for future updates
    selectedUserId = userData.user_id;
    // console.log("Selected User ID: ", selectedUserId);

    // Highlight the selected row
    const rows = document.querySelectorAll('#user-table-body tr');
    rows.forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');
}

// Event listener for user row click
document.getElementById('user-table-body').addEventListener('click', (event) => {
  const row = event.target.closest('tr');
  if (row) {
      const userId = row.getAttribute('data-user-id');
      const userData = userDataCache[userId]; // Get user data from cache
      selectUserRow(row, userData);
  }
});

// Ensure selectedUserId updates when a row is clicked
document.getElementById('user-table-body').addEventListener('click', (event) => {
  const row = event.target.closest('tr');
  if (row) {
      const userId = row.getAttribute('data-user-id');
      if (userId) {
          selectedUserId = userId; // Ensure selectedUserId is updated
        //   console.log("Row clicked, selected user ID:", selectedUserId);
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
        const userRef = ref(db, 'System_Users');
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const users = [];

            snapshot.forEach(childSnapshot => {
                const user = childSnapshot.val();
                const userId = childSnapshot.key;

                let lastLoginFormatted = 'N/A';
                if (user.last_login) {
                    const lastLoginDate = new Date(user.last_login);
                    if (!isNaN(lastLoginDate.getTime())) {
                        lastLoginFormatted = lastLoginDate.toLocaleString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        });
                    }
                }

                const countryCode = user.country_code || 'N/A';
                const contactNumber = user.contact_number || 'N/A';
                const adminType = user.admin_type || 'N/A'; // Default admin_type

                userDataCache[userId] = {
                    user_id: userId,
                    full_name: user.full_name || 'N/A',
                    email: user.email || 'N/A',
                    password: user.password || "N/A",
                    contact_number: contactNumber,
                    country_code: countryCode,
                    user_status: user.user_status || 'Active',
                    user_level: user.user_level || 1,
                    admin_type: adminType,
                    last_login: lastLoginFormatted,
                };

                users.push(userDataCache[userId]);
            });

            users.sort((a, b) => a.full_name.localeCompare(b.full_name));

            users.forEach(user => {
                const isSuperAdmin = user.admin_type === "super_admin"; // Check if user is super admin

                const row = document.createElement('tr');
                row.setAttribute('data-user-id', user.user_id);
                row.innerHTML = `
                    <td>${user.full_name}</td>
                    <td>${user.email}</td>
                    <td>${user.country_code} ${user.contact_number}</td>
                    <td>
                        <select class="user-level-select" data-user-id="${user.user_id}" ${isSuperAdmin ? 'disabled' : ''}>
                            <option value="1" ${user.user_level == 1 ? 'selected' : ''}>Admin</option>
                            <option value="2" ${user.user_level == 2 ? 'selected' : ''}>Staff</option>
                        </select>
                    </td>
                    <td>
                        <select class="user-status-select" data-user-id="${user.user_id}" ${isSuperAdmin ? 'disabled' : ''}>
                            <option value="active" ${user.user_status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${user.user_status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        </select>
                    </td>
                    <td>${user.last_login}</td>
                `;
                userTableBody.appendChild(row);
            });
        } else {
            userTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No users found.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        userTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Failed to load users.</td></tr>';
    }
}


  async function updateUserLevel(userId, newLevel) {
    const userRef = ref(db, `System_Users/${userId}`);
    try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.admin_type === "super_admin") {
                alert("You cannot update a Super Admin's level.");
                
                // Rollback selection
                document.querySelector(`.user-level-select[data-user-id="${userId}"]`).value = userDataCache[userId]?.user_level || "1";
                return;
            }
        }

        await update(userRef, { user_level: newLevel });
        userDataCache[userId].user_level = newLevel; // Update cache
        const userName = userDataCache[userId]?.full_name || "Unknown User";
        alert(`User level updated: ${userName} is now ${newLevel === "1" ? "Admin" : "Staff"}`);
    } catch (error) {
        console.error("Error updating user level:", error);
        alert("Failed to update user level. Please try again.");
    }
}

async function updateUserStatus(userId, newStatus) {
    const userRef = ref(db, `System_Users/${userId}`);
    try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.admin_type === "super_admin") {
                alert("You cannot update a Super Admin's status.");
                
                // Rollback selection
                document.querySelector(`.user-status-select[data-user-id="${userId}"]`).value = userDataCache[userId]?.user_status || "active";
                return;
            }
        }

        await update(userRef, { user_status: newStatus });
        userDataCache[userId].user_status = newStatus; // Update cache
        const userName = userDataCache[userId]?.full_name || "Unknown User";
        alert(`User status updated: ${userName} is now ${newStatus}`);
    } catch (error) {
        console.error("Error updating user status:", error);
        alert("Failed to update user status. Please try again.");
    }
}



// ✅ Use Event Delegation to handle dropdown changes dynamically
document.getElementById('user-table-body').addEventListener('change', async function (event) {
  const target = event.target;
  const userId = target.getAttribute('data-user-id');

  if (!userId) return;

  if (target.classList.contains('user-level-select')) {
      const newLevel = target.value;
      await updateUserLevel(userId, newLevel);
  } else if (target.classList.contains('user-status-select')) {
      const newStatus = target.value;
      await updateUserStatus(userId, newStatus);
  }
});


document.addEventListener('DOMContentLoaded', function () {
  loadUsers();
});



let userDataCache = {}; // Store user data by user ID


function clearFields() {
  document.getElementById('admin-form').reset();
}

document.getElementById('clear-btn').addEventListener('click', clearFields);

