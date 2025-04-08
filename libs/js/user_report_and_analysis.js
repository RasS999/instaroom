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
        fetchBookingData();  // Proceed to fetch data
    } else {
        // User is not authenticated
        console.log("User is not logged in");
        alert("Please log in first.");
    }
});

// Fetch Booking data
const fetchBookingData = async () => {
    try {
        const bookingsRef = ref(db, 'Bookings');
        const snapshot = await get(bookingsRef);

        if (!snapshot.exists()) {
            console.log('No data available');
            return [];
        }

        const bookings = [];
        snapshot.forEach((childSnapshot) => {
            const bookingData = childSnapshot.val();
            const booking_trans_ref = childSnapshot.key;

            bookings.push({
                booking_trans_ref,
                full_name: bookingData.full_name || 'N/A',
                email: bookingData.email || 'N/A',
                contact_number: bookingData.contact_number || 'N/A',
                country_code: bookingData.country_code || 'N/A',
                room_number: bookingData.room_number || 'N/A',
                room_type: bookingData.room_type || 'N/A',
                bed_type: bookingData.bed_type || 'N/A',
                additional_beds: bookingData.additional_beds || 'None',
                extra_bed_price: bookingData.extra_bed_price || '0.00',
                total_extra_bed_price: bookingData.total_extra_bed_price || '0.00',
                adult: bookingData.adult || 0,
                children: bookingData.children || 0,
                baby: bookingData.baby || 0,
                room_size: bookingData.room_size || 'N/A',
                floor_level: bookingData.floor_level || 'N/A',
                check_in_date: bookingData.check_in_date || 'N/A',
                check_in_time: bookingData.check_in_time || 'N/A',
                check_out_date: bookingData.check_out_date || 'N/A',
                check_out_time: bookingData.check_out_time || 'N/A',
                stay_duration: bookingData.stay_duration || 'N/A',
                price: bookingData.price || '0.00',
                total_amount: bookingData.total_amount || '0.00',
                booking_status: bookingData.booking_status || 'Pending',
                payment_status: bookingData.payment_status || 'Pending',
            });
        });

        // Sort from highest to lowest booking_trans_ref
        return bookings.sort((a, b) => b.booking_trans_ref - a.booking_trans_ref);
    } catch (error) {
        console.error('Error fetching Booking data:', error.message);
        alert('Error fetching data. Please try again.');
        return [];
    }
};


const populateBookingTable = async () => {
    const bookingRequestsContainer = document.getElementById('user-reports');
    bookingRequestsContainer.innerHTML = ''; // Clear existing rows

    // Fetch booking data
    const bookings = await fetchBookingData();

    if (bookings.length === 0) {
        bookingRequestsContainer.innerHTML = '<tr><td colspan="13">No booking requests found.</td></tr>';
        return;
    }

    // Organize data by email for the report
    const userReports = {};

    bookings.forEach((booking) => {
        const email = booking.email;

        if (!userReports[email]) {
            userReports[email] = {
                email,
                full_name: booking.full_name,
                total_bookings: 0,
                total_amount_spent: 0,
                cancellations: 0,
                check_outs: 0, // New property to track check-outs
                room_preferences: new Set(),
                total_stay_duration: 0,
                last_booking_date: '',
            };
        }

        // Update the report for the user
        const userReport = userReports[email];
        userReport.total_bookings += 1;
        userReport.total_amount_spent += parseFloat(booking.total_amount);
        if (booking.booking_status === 'Cancelled') {
            userReport.cancellations += 1;
        }
        if (booking.booking_status === 'Checked-out') {
            userReport.check_outs += 1; // Count check-outs
        }
        userReport.room_preferences.add(booking.room_type);
        userReport.total_stay_duration += parseInt(booking.stay_duration);
        if (!userReport.last_booking_date || new Date(booking.check_in_date) > new Date(userReport.last_booking_date)) {
            userReport.last_booking_date = booking.check_in_date;
        }
    });

    // Convert the reports to an array and calculate the averages
    const reportData = Object.values(userReports).map((report) => {
        const cancellation_rate = (report.cancellations / report.total_bookings) * 100;
        const check_out_rate = (report.check_outs / report.total_bookings) * 100; // Calculate check-out rate
        const avg_stay_duration = report.total_stay_duration / report.total_bookings;
        const booking_frequency = report.total_bookings === 1 ? '1 per booking' : `${report.total_bookings} bookings`;

        return {
            email: report.email,
            full_name: report.full_name,
            total_bookings: report.total_bookings,
            total_amount_spent: report.total_amount_spent.toLocaleString('en-US', { 
                style: 'decimal', 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            }),
            
            cancellations: report.cancellations,
            check_outs: report.check_outs, // Include check-out count
            check_out_rate: `${check_out_rate.toFixed(1)}%`, // Include check-out rate
            booking_frequency,
            room_preferences: Array.from(report.room_preferences).join(', '),
            avg_stay_duration: `${avg_stay_duration.toFixed(1)} days`,
            cancellation_rate: `${cancellation_rate.toFixed(1)}%`,
            last_booking_date: report.last_booking_date
        };
    });

    // Now render the report data into the table
    if (reportData.length === 0) {
        bookingRequestsContainer.innerHTML = '<tr><td colspan="13">No user reports found.</td></tr>';
        return;
    }

    reportData.forEach((report, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${report.full_name}</td>
            <td>${report.email}</td>
            <td>${report.total_bookings}</td>
            <td>${report.check_outs}</td> 
            <td>${report.cancellations}</td>
            <td>
                <button class="btn btn-primary view-booking-btn" data-bs-toggle="modal" data-bs-target="#bookingDetailsModal"
                    data-email="${report.email}" 
                    data-full-name="${report.full_name}" 
                    data-total-bookings="${report.total_bookings}" 
                    data-total-amount-spent="${report.total_amount_spent}" 
                    data-cancellations="${report.cancellations}" 
                    data-check-outs="${report.check_outs}" 
                    data-check-out-rate="${report.check_out_rate}" 
                    data-booking-frequency="${report.booking_frequency}" 
                    data-room-preferences="${report.room_preferences}" 
                    data-avg-stay-duration="${report.avg_stay_duration}" 
                    data-cancellation-rate="${report.cancellation_rate}" 
                    data-last-booking-date="${report.last_booking_date}">
                    View
                </button>
            </td>
        `;
        bookingRequestsContainer.appendChild(row);
    });
};

document.addEventListener("click", function (event) {
    if (event.target.classList.contains("view-booking-btn")) {
        const email = event.target.getAttribute("data-email");
        const fullName = event.target.getAttribute("data-full-name");
        const totalBookings = event.target.getAttribute("data-total-bookings");
        const totalAmountSpent = event.target.getAttribute("data-total-amount-spent");
        const cancellations = event.target.getAttribute("data-cancellations");
        const checkOuts = event.target.getAttribute("data-check-outs");
        const checkOutRate = event.target.getAttribute("data-check-out-rate"); 
        const bookingFrequency = event.target.getAttribute("data-booking-frequency");
        const roomPreferences = event.target.getAttribute("data-room-preferences");
        const avgStayDuration = event.target.getAttribute("data-avg-stay-duration");
        const cancellationRate = event.target.getAttribute("data-cancellation-rate");
        const lastBookingDate = event.target.getAttribute("data-last-booking-date");

        // Set modal values
        document.getElementById("modalBookingEmail").textContent = email;
        document.getElementById("modalBookingFullName").textContent = fullName;
        document.getElementById("modalBookingTotalBookings").textContent = totalBookings;
        document.getElementById("modalBookingTotalAmountSpent").textContent = totalAmountSpent;
        document.getElementById("modalBookingCancellations").textContent = cancellations;
        document.getElementById("modalBookingCheckOuts").textContent = checkOuts;
        document.getElementById("modalBookingCheckOutRate").textContent = checkOutRate; 
        document.getElementById("modalBookingBookingFrequency").textContent = bookingFrequency;
        document.getElementById("modalBookingRoomPreferences").textContent = roomPreferences;
        document.getElementById("modalBookingAvgStayDuration").textContent = avgStayDuration;
        document.getElementById("modalBookingCancellationRate").textContent = cancellationRate;
        document.getElementById("modalBookingLastBookingDate").textContent = lastBookingDate;

        // Open modal
        const modalElement = document.getElementById("bookingDetailsModal");
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
});  

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    populateBookingTable();
});
