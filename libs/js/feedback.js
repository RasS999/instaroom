import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getDatabase, ref, get, update } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is authenticated
        fetchFeedbackData();  // Proceed to fetch data
    } else {
        // User is not authenticated
        console.log("User is not logged in");
        alert("Please log in first.");
    }
});

// Fetch Feedback data
const fetchFeedbackData = async () => {
    try {
        const feedbackRef = ref(db, 'Feedback');
        const snapshot = await get(feedbackRef);

        if (!snapshot.exists()) {
            console.log('No feedback available');
            return [];
        }

        const feedbacks = [];
        snapshot.forEach((childSnapshot) => {
            const feedbackData = childSnapshot.val();
            const feedback_trans_ref = childSnapshot.key;

            feedbacks.push({
                feedback_trans_ref,
                booking_trans_ref: feedbackData.booking_trans_ref || 'N/A',
                full_name: feedbackData.full_name || 'N/A',
                email: feedbackData.email || 'N/A',
                contact_number: feedbackData.contact_number || 'N/A',
                country_code: feedbackData.country_code || 'N/A',
                room_number: feedbackData.room_number || 'N/A',
                room_type: feedbackData.room_type || 'N/A',
                rating: feedbackData.rating || '0',
                comment: feedbackData.comment || 'No comment',
                check_in_date: feedbackData.check_in_date || 'N/A',
                check_in_time: feedbackData.check_in_time || 'N/A',
                check_out_date: feedbackData.check_out_date || 'N/A',
                check_out_time: feedbackData.check_out_time || 'N/A',
                stay_duration: feedbackData.stay_duration || 'N/A',
                timestamp: feedbackData.timestamp || 'N/A',
                feedback_display: feedbackData.feedback_display || '', 
            });
            
        });

        // Sort feedback by booking reference (highest to lowest)
        return feedbacks.sort((a, b) => b.feedback_trans_ref - a.feedback_trans_ref);
    } catch (error) {
        console.error('Error fetching Feedback data:', error.message);
        alert('Error fetching feedback. Please try again.');
        return [];
    }
};


// Handle status change (Hide/Show) with confirmation
document.addEventListener('change', function (event) {
    if (event.target.classList.contains('status-dropdown')) {
        const selectedStatus = event.target.value;
        const feedbackRef = event.target.getAttribute('data-feedback-ref');

        // Capitalize the first letter of each word for visual effect
        const capitalizedStatus = selectedStatus
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        // Show confirmation dialog before updating the status
        const confirmation = confirm(`Are you sure you want to change the status to "${capitalizedStatus}"?`);

        if (confirmation) {
            updateFeedbackStatus(feedbackRef, selectedStatus);
        } else {
            // Reset the dropdown to the previous status if user cancels
            event.target.value = event.target.dataset.previousValue;
        }
    }
});

// Update feedback status in the database (you should implement this)
const updateFeedbackStatus = async (feedbackRef, status) => {
    try {
        // Log the feedbackRef and status for debugging
        console.log("Updating feedback status:", feedbackRef, status);

        // Here you should send the status update request to your backend or Firebase
        await updateFeedbackInDatabase(feedbackRef, status);
        alert('Feedback status updated successfully!');
    } catch (error) {
        console.error('Error updating feedback status:', error);
        alert('Failed to update feedback status. Check the console for details.');
    }
};

// You may want to keep track of the previous value for canceling the change
document.addEventListener('DOMContentLoaded', () => {
    const statusDropdowns = document.querySelectorAll('.status-dropdown');
    statusDropdowns.forEach(dropdown => {
        dropdown.dataset.previousValue = dropdown.value;  // Store the initial value
    });
});

const updateFeedbackInDatabase = async (feedbackRef, status) => {
    try {
        const feedbackRefPath = `Feedback/${feedbackRef}`; // Corrected path to match the database structure
        const feedbackRefDB = ref(db, feedbackRefPath); // Use `ref` to create a reference

        // Check if feedback exists before attempting to update
        const snapshot = await get(feedbackRefDB); // Use `get` to retrieve data
        if (!snapshot.exists()) {
            throw new Error('Feedback not found!');
        }

        await update(feedbackRefDB, { feedback_display: status }); // Corrected field name to `feedback_display`
        console.log(`Feedback status for ${feedbackRef} updated to ${status}`);
    } catch (error) {
        console.error('Error in updating feedback in the database:', error);
        throw error; // Re-throw the error for the outer catch block
    }
};

// Make sure that the feedbacks array is globally accessible
let feedbacks = [];


// Populate the booking feedback table (new function)
const populateBookingFeedbackTable = async () => {
    const feedbacksContainer = document.getElementById('booking-feedbacks');
    feedbacksContainer.innerHTML = '';  // Clear the container

    // Fetch feedback data and store it in the global feedbacks variable
    feedbacks = await fetchFeedbackData();

    if (feedbacks.length === 0) {
        feedbacksContainer.innerHTML = '<tr><td colspan="9">No feedback available.</td></tr>';
        return;
    }

    feedbacks.forEach((feedback) => {
        const row = document.createElement('tr');
        
        // Set the correct selected value based on feedback_display (either 'show' or 'hide')
        const selectedShow = feedback.feedback_display === 'show' ? 'selected' : '';
        const selectedHide = feedback.feedback_display === 'hide' ? 'selected' : '';

        row.innerHTML = `
            <td>${feedback.booking_trans_ref}</td>
            <td>${feedback.full_name}</td>
            <td>${feedback.room_number}</td>
            <td>${feedback.room_type}</td>
            <td>${feedback.rating}</td>
            <td>${feedback.comment}</td>
            <td>
                <select class="status-dropdown" data-feedback-ref="${feedback.feedback_trans_ref}">
                    <option value="show" ${selectedShow}>Show</option>
                    <option value="hide" ${selectedHide}>Hide</option>
                </select>
            </td>
           <td>
  <button class="btn btn-primary view-feedback-btn" data-bs-toggle="modal" data-bs-target="#feedbackDetailsModal"
    data-feedback-ref="${feedback.feedback_trans_ref}" 
    data-booking-trans-ref="${feedback.booking_trans_ref}" 
    data-full-name="${feedback.full_name}"
    data-email="${feedback.email}" 
    data-contact="${feedback.country_code} ${feedback.contact_number}"
    data-room-number="${feedback.room_number}" 
    data-room-type="${feedback.room_type}"
    data-rating="${feedback.rating}" 
    data-comment="${feedback.comment}"
    data-check-in-date="${feedback.check_in_date}" 
    data-check-out-date="${feedback.check_out_date}"
    data-check-in-time="${feedback.check_in_time}"  
    data-check-out-time="${feedback.check_out_time}" 
    data-stay-duration="${feedback.stay_duration}" 
    data-timestamp="${feedback.timestamp}"
    data-feedback-display="${feedback.feedback_display}"> 
    View
</button>

</td>

        `;
        feedbacksContainer.appendChild(row);
    });

// Event listener for the View button (shows modal with feedback details)
document.addEventListener("click", function (event) {
    if (event.target.classList.contains("view-feedback-btn")) {
        const feedbackRef = event.target.getAttribute("data-feedback-ref");
        const bookingTransRef = event.target.getAttribute("data-booking-trans-ref");
        const fullName = event.target.getAttribute("data-full-name");
        const email = event.target.getAttribute("data-email");
        const contact = event.target.getAttribute("data-contact");
        const roomNumber = event.target.getAttribute("data-room-number");
        const roomType = event.target.getAttribute("data-room-type");
        const rating = event.target.getAttribute("data-rating");
        const comment = event.target.getAttribute("data-comment");
        const checkInDate = event.target.getAttribute("data-check-in-date");
        const checkOutDate = event.target.getAttribute("data-check-out-date");
        const checkInTime = event.target.getAttribute("data-check-in-time");
        const checkOutTime = event.target.getAttribute("data-check-out-time");
        const stayDuration = event.target.getAttribute("data-stay-duration");
        const timestamp = event.target.getAttribute("data-timestamp");
        const feedbackDisplay = event.target.getAttribute("data-feedback-display");

        // Set modal values
        document.getElementById("modalBookingTransRef").textContent = bookingTransRef;
        document.getElementById("modalFeedbackFullName").textContent = fullName;
        document.getElementById("modalFeedbackEmail").textContent = email;
        document.getElementById("modalFeedbackContact").textContent = contact; // Combined contact & country code
        document.getElementById("modalFeedbackRoomNumber").textContent = roomNumber;
        document.getElementById("modalFeedbackRoomType").textContent = roomType;
        document.getElementById("modalFeedbackRating").textContent = rating;
        document.getElementById("modalFeedbackComment").textContent = comment;
        document.getElementById("modalFeedbackCheckInDate").textContent = checkInDate;
        document.getElementById("modalFeedbackCheckOutDate").textContent = checkOutDate;
        document.getElementById("modalFeedbackCheckInTime").textContent = checkInTime;
        document.getElementById("modalFeedbackCheckOutTime").textContent = checkOutTime;
        document.getElementById("modalFeedbackStayDuration").textContent = stayDuration + (stayDuration === "1" ? " Day" : " Days");
        document.getElementById("modalFeedbackTimestamp").textContent = timestamp;
        document.getElementById("modalFeedbackDisplay").textContent = feedbackDisplay;

        // Open modal
        const modalElement = document.getElementById("feedbackDetailsModal");
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
});

};



// Remove the backdrop manually when the modal is hidden
document.addEventListener('hidden.bs.modal', function () {
    const modalBackdrops = document.getElementsByClassName('modal-backdrop');
    for (let i = 0; i < modalBackdrops.length; i++) {
        modalBackdrops[i].remove();
    }
});

// Load feedback data on page load
document.addEventListener('DOMContentLoaded', populateBookingFeedbackTable);

