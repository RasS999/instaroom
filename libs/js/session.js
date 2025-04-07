// Ensure user cannot access this page if not logged in
window.onload = function () {
    const profileName = localStorage.getItem('full_name');

    if (!profileName) {
        // If no user is logged in, redirect to login page
        window.location.href = '/login';  // Updated path to match Express route
    } else {
        // Update the profile name in the profile section
        document.getElementById('profile-name').innerText = profileName;
    }
};

// Logout function
function logout() {
    // Clear all session data
    localStorage.clear();

    // Replace current state to prevent back navigation
    history.replaceState(null, null, '/login');  // Updated path to match Express route
    window.location.href = '/login'; // Redirect to login page after logout
}

// Prevent back button navigation to restricted pages
window.addEventListener('popstate', function () {
    const profileName = localStorage.getItem('full_name');
    if (!profileName) {
        // Redirect to login if trying to go back after logout
        window.location.href = '/login';  // Updated path to match Express route
    }
});
