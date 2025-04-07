// Add at the end of script.js
document.addEventListener("DOMContentLoaded", () => {
    const darkModeToggle = document.getElementById("dark-mode-toggle");
});


// Toggle dropdown visibility when clicking the caret icon
document.querySelector('.dropdown-btn').addEventListener('click', function(event) {
    var dropdownContent = this.nextElementSibling; // Get the sibling <div> containing the dropdown content
    // Toggle the dropdown display
    dropdownContent.style.display = (dropdownContent.style.display === 'block') ? 'none' : 'block';
    // Prevent the event from bubbling up to document
    event.stopPropagation();
});

// Close the dropdown if clicked outside
document.addEventListener('click', function(event) {
    var dropdownContent = document.querySelector('.dropdown-content');
    if (dropdownContent && !dropdownContent.contains(event.target) && !event.target.matches('.dropdown-btn')) {
        dropdownContent.style.display = 'none';
    }
});

// Toggle the sidebar when menu icon is clicked
const menuIcon = document.getElementById('menu-icon');
const sidebar = document.getElementById('sidebar');
const navbar = document.querySelector('.navbar');
const mainContent = document.getElementById('main-content'); // Main content element

// Menu icon click functionality
menuIcon.addEventListener('click', () => {
    sidebar.classList.toggle('active'); // Show/hide the sidebar

    // Adjust navbar and main content when sidebar is toggled
    if (sidebar.classList.contains('active')) {
        navbar.classList.add('shifted'); // Adjust navbar for sidebar open
        mainContent.classList.add('shifted'); // Shift main content
    } else {
        navbar.classList.remove('shifted'); // Reset navbar for sidebar closed
        mainContent.classList.remove('shifted'); // Reset main content
    }
});

// Open the sidebar by default when the page loads
document.addEventListener('DOMContentLoaded', function() {
    sidebar.classList.add('active'); // Automatically add 'active' class to show the sidebar
    navbar.classList.add('shifted'); // Adjust navbar for sidebar open
    mainContent.classList.add('shifted'); // Shift main content
});

// Handle submenu toggle for menu items with nested submenus
const submenuToggles = document.querySelectorAll('.submenu-toggle');
submenuToggles.forEach(function(toggle) {
    toggle.addEventListener('click', function(event) {
        // Get the closest menu-item that holds the submenu
        const menuItem = this.closest('.menu-item'); 

        // Check if the submenu is already open (active)
        const isActive = menuItem.classList.contains('active');
        
        // Close all submenus first
        const allMenuItems = document.querySelectorAll('.menu-item');
        allMenuItems.forEach(function(item) {
            item.classList.remove('active');
            item.querySelector('.submenu').style.display = 'none'; // Hide all submenus

            // Reset flip for all icons
            item.querySelector('.submenu-toggle').classList.remove('flip');
        });

        // If the clicked menu is not active, open it
        if (!isActive) {
            menuItem.classList.add('active'); // Open the clicked submenu
            menuItem.querySelector('.submenu').style.display = 'block'; // Show submenu

            // Flip the icon for the active submenu
            menuItem.querySelector('.submenu-toggle').classList.add('flip');
        }
    });
});

// Add event listener for the profile dropdown
const dropdownBtn = document.querySelector('.dropdown-btn');
const caretIcon = document.getElementById('caret-icon-nav');
const dropdownContent = document.getElementById('dropdown-content');

// Toggle the dropdown menu and flip the caret icon when clicked
dropdownBtn.addEventListener('click', function(event) {
    event.stopPropagation(); // Prevent the click event from propagating to the document

    // Toggle the visibility of the dropdown menu
    dropdownContent.classList.toggle('show');

    // Flip the caret icon when the dropdown is toggled
    dropdownBtn.classList.toggle('flip');  // Add the 'flip' class to the button itself
});

// Optional: Hide dropdown if clicking outside of it
document.addEventListener('click', function(event) {
    if (!dropdownBtn.contains(event.target) && !dropdownContent.contains(event.target)) {
        dropdownContent.classList.remove('show');  // Hide dropdown if clicked outside
        dropdownBtn.classList.remove('flip');  // Reset the flip of the caret icon
    }
});
