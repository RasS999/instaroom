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

            // Filter bookings that are NOT 'Checked-out'
            if (bookingData.booking_status === 'Checked-out') {
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
            }
        });

        // Sort from highest to lowest booking_trans_ref
        return bookings.sort((a, b) => b.booking_trans_ref - a.booking_trans_ref);
    } catch (error) {
        console.error('Error fetching Booking data:', error.message);
        alert('Error fetching data. Please try again.');
        return [];
    }
};


// Update Payment Status and Sync Booking Status
const updatePaymentStatus = async (booking_trans_ref, payment_status) => {
    try {
        const bookingRef = ref(db, `Bookings/${booking_trans_ref}`);
        await update(bookingRef, { payment_status });

        // Update booking status based on payment status
        if (payment_status === 'Paid') {
            await update(bookingRef, { booking_status: 'Confirmed' });
        } else if (payment_status === 'Cancelled') {
            await update(bookingRef, { booking_status: 'Cancelled' });
        } else if (payment_status === 'Pending') {
            await update(bookingRef, { booking_status: 'Pending' });
        }

        // Update the room status and reference if applicable (Checked-in / Cancelled)
        if (payment_status === 'Cancelled') {
            await updateRoomStatusAndClearBookingReference(booking_trans_ref, bookingRef, 'Available');
        }

        alert(`Payment status for Booking Trans Ref ${booking_trans_ref} updated to ${payment_status}`);
        populateBookingTable();
    } catch (error) {
        console.error('Error updating Payment Status:', error.message);
        alert('Error updating payment status. Please try again.');
    }
};

// Update Booking Status and Sync Payment Status & Room Status
const updateBookingStatus = async (booking_trans_ref, booking_status, room_number) => {
    try {
        const bookingRef = ref(db, `Bookings/${booking_trans_ref}`);
        const roomRef = ref(db, `Rooms/${room_number}`);

        // Update booking status
        await update(bookingRef, { booking_status });

        // If booking status is "Checked-in", "Checked-out", or "Confirmed", set payment status to "Paid"
        if (booking_status === 'Checked-in' || booking_status === 'Checked-out' || booking_status === 'Confirmed') {
            await update(bookingRef, { payment_status: 'Paid' });
        }

        // Handle payment status and room status based on booking status
        if (booking_status === 'Cancelled') {

            // Clear booking reference, booking status, set room status to Available, and turn off room power
            await update(roomRef, {
                booking_trans_ref: '',
                booking_status: '',
                room_status: 'Available',
                room_power: 'Off'
            });
        } else if (booking_status === 'Pending') {
            await update(bookingRef, { payment_status: 'Pending' });
        }

        // If booking status is "Checked-in", update room status and booking reference
        if (booking_status === 'Checked-in') {
            await update(roomRef, {
                booking_trans_ref: booking_trans_ref,
                room_status: 'Occupied',
                booking_status: '',
                room_power: 'Off'
            });
        }

        // If booking status is "Checked-out", turn off room power
        if (booking_status === 'Checked-out') {
            await update(roomRef, {
                room_power: 'Off'
            });
        }

        alert(`Booking status for Booking Trans Ref ${booking_trans_ref} updated to ${booking_status}`);
        populateBookingTable();
    } catch (error) {
        console.error('Error updating Booking Status:', error.message);
        alert('Error updating booking status. Please try again.');
    }
};

// Helper function to update room status and booking reference
const updateRoomStatusAndBookingReference = async (room_number, booking_trans_ref, room_status) => {
    const room_letter = room_number.charAt(0); // Get the first character (room letter)
    const room_num = room_number.slice(1); // Get the rest of the room number

    const roomRef = ref(db, `Rooms/${room_letter}${room_num}`);
    await update(roomRef, { room_status, booking_reference: booking_trans_ref });
};

// Helper function to clear booking reference in Room
const updateRoomStatusAndClearBookingReference = async (booking_trans_ref, bookingRef, room_status) => {
    const room_number = (await get(bookingRef)).val().room_number;
    const room_letter = room_number.charAt(0); // Get the room letter (A, B, etc.)
    const room_num = room_number.slice(1); // Get the numeric part of the room number

    const roomRef = ref(db, `Rooms/${room_letter}${room_num}`);
    await update(roomRef, { room_status, booking_reference: null });
};

// Make functions globally accessible
window.updatePaymentStatus = updatePaymentStatus;
window.updateBookingStatus = updateBookingStatus;

// Make sure that the bookings array is globally accessible
let bookings = [];


// Populate the booking table (existing function)
const populateBookingTable = async () => {
    const bookingRequestsContainer = document.getElementById('booking-requests');
    bookingRequestsContainer.innerHTML = ''; // Clear existing rows

    // Fetch booking data and store it in the global bookings variable
    bookings = await fetchBookingData();

    if (bookings.length === 0) {
        bookingRequestsContainer.innerHTML = '<tr><td colspan="7">No booking requests found.</td></tr>';
        return;
    }

    bookings.forEach((booking) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${booking.booking_trans_ref}</td>
            <td>${booking.full_name}</td>
            <td>${booking.room_number}</td>
            <td>${booking.room_type}</td>
            <td>
                <select class="form-control" disabled>
                    <option value="Paid" ${booking.payment_status === 'Paid' ? 'selected' : ''}>Paid</option>
                </select>
            </td>
            <td>
                <select class="form-control" disabled>
                    <option value="Checked-out" ${booking.booking_status === 'Checked-out' ? 'selected' : ''}>Checked-out</option>
                </select>
            </td>
            <td>
            <button class="btn btn-primary view-btn" data-bs-toggle="modal" data-bs-target="#bookingDetailsModal"
                data-booking-ref="${booking.booking_trans_ref}"
                data-full-name="${booking.full_name}"
                data-email="${booking.email}"
                data-contact="${booking.country_code} ${booking.contact_number}"
                data-room-number="${booking.room_number}"
                data-room-type="${booking.room_type}"
                data-bed-type="${booking.bed_type}"
                data-room-size="${booking.room_size}"
                data-floor-level="${booking.floor_level}"
                data-check-in-date="${booking.check_in_date}"
                data-check-in-time="${booking.check_in_time}"
                data-check-out-date="${booking.check_out_date}"
                data-check-out-time="${booking.check_out_time}"
                data-stay-duration="${booking.stay_duration}"
                data-price="${booking.price}"
                data-total-amount="${booking.total_amount}"
                data-booking-status="${booking.booking_status}"
                data-payment-status="${booking.payment_status}"
                data-adult="${booking.adult}"
                data-children="${booking.children}"
                data-baby="${booking.baby}"
                data-additional-beds="${booking.additional_beds}"
                data-extra-bed-price="${booking.extra_bed_price}"
                data-total-extra-bed-price="${booking.total_extra_bed_price}">
                View
            </button>
            <button class="btn btn-success print-btn" onclick="printReceipt('${booking.booking_trans_ref}')">Print</button>
            </td>
        `;
        bookingRequestsContainer.appendChild(row);
    });

  // Event listener for the View button (shows modal with booking details)
document.addEventListener("click", function (event) {
    if (event.target.classList.contains("view-btn")) {
        const bookingRef = event.target.getAttribute("data-booking-ref");
        const fullName = event.target.getAttribute("data-full-name");
        const email = event.target.getAttribute("data-email");
        const contact = event.target.getAttribute("data-contact");
        const roomNumber = event.target.getAttribute("data-room-number");
        const roomType = event.target.getAttribute("data-room-type");
        const bedType = event.target.getAttribute("data-bed-type");
        const roomSize = event.target.getAttribute("data-room-size") + " sqm";
        const floorLevel = formatFloorLevel(event.target.getAttribute("data-floor-level"));
        const checkInDate = event.target.getAttribute("data-check-in-date");
        const checkInTime = event.target.getAttribute("data-check-in-time");
        const checkOutDate = event.target.getAttribute("data-check-out-date");
        const checkOutTime = event.target.getAttribute("data-check-out-time");
        const stayDuration = event.target.getAttribute("data-stay-duration");
        const formattedStayDuration = stayDuration + (stayDuration === "1" ? " Day" : " Days");
        const price = event.target.getAttribute("data-price");
        const totalAmount = event.target.getAttribute("data-total-amount");
        const bookingStatus = event.target.getAttribute("data-booking-status");
        const paymentStatus = event.target.getAttribute("data-payment-status");
        const adult = event.target.getAttribute("data-adult");
        const children = event.target.getAttribute("data-children");
        const baby = event.target.getAttribute("data-baby");
        const additionalBeds = event.target.getAttribute("data-additional-beds") || ""; // Ensure it's not null

        // Set Extra Bed Price and Total Extra Bed Price to 0.00 if no additional beds
        const noExtraBed = additionalBeds.trim() === "" || additionalBeds === "None" || additionalBeds === "0";
        const extraBedPrice = noExtraBed ? "0.00" : event.target.getAttribute("data-extra-bed-price");
        const totalExtraBedPrice = noExtraBed ? "0.00" : event.target.getAttribute("data-total-extra-bed-price");

        // Set modal values
        document.getElementById("modalBookingRef").textContent = bookingRef;
        document.getElementById("modalFullName").textContent = fullName;
        document.getElementById("modalEmail").textContent = email;
        document.getElementById("modalContact").textContent = contact;
        document.getElementById("modalRoomNumber").textContent = roomNumber;
        document.getElementById("modalRoomType").textContent = roomType;
        document.getElementById("modalBedType").textContent = bedType;
        document.getElementById("modalRoomSize").textContent = roomSize;
        document.getElementById("modalFloorLevel").textContent = floorLevel;
        document.getElementById("modalCheckInDate").textContent = checkInDate;
        document.getElementById("modalCheckInTime").textContent = checkInTime;
        document.getElementById("modalCheckOutDate").textContent = checkOutDate;
        document.getElementById("modalCheckOutTime").textContent = checkOutTime;
        document.getElementById("modalStayDuration").textContent = formattedStayDuration;
        document.getElementById("modalPrice").textContent = price;
        document.getElementById("modalTotalAmount").textContent = totalAmount;
        document.getElementById("modalBookingStatus").textContent = bookingStatus;
        document.getElementById("modalPaymentStatus").textContent = paymentStatus;
        document.getElementById("modalAdult").textContent = adult;
        document.getElementById("modalChildren").textContent = children;
        document.getElementById("modalBaby").textContent = baby;
        document.getElementById("modalAdditionalBeds").textContent = additionalBeds || "None";
        document.getElementById("modalExtraBedPrice").textContent = extraBedPrice;
        document.getElementById("modalTotalExtraBedPrice").textContent = totalExtraBedPrice;

        // Open modal
        const modalElement = document.getElementById("bookingDetailsModal");
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
});


function formatFloorLevel(level) {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = level % 100;
    const suffix = (v >= 11 && v <= 13) ? "th" : suffixes[v % 10] || "th";
    return `${level}${suffix} Floor`;
}

};

// Remove the backdrop manually when the modal is hidden
document.addEventListener('hidden.bs.modal', function () {
    const modalBackdrops = document.getElementsByClassName('modal-backdrop');
    for (let i = 0; i < modalBackdrops.length; i++) {
        modalBackdrops[i].remove();
    }
});

const printReceipt = async (bookingRef) => {
    console.log('Booking Reference:', bookingRef);

    // Ensure Firebase Authentication
    const user = getAuth().currentUser;
    if (!user) {
        console.error('User not authenticated');
        alert("You must be logged in to print a receipt.");
        return;
    }

    // Fetch booking from Firebase
    try {
        const bookingSnapshot = await get(ref(db, `Bookings/${bookingRef}`)); // Updated to use modular API
        if (!bookingSnapshot.exists()) {
            console.log('Booking not found');
            alert("Booking not found.");
            return;
        }

        const booking = bookingSnapshot.val();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const formatDate = (date) => date ? date.replace(/-/g, '/') : 'N/A';

        doc.setFontSize(12);

        // Add Logo
        const logoUrl = "/libs/logo/logo.png";
        doc.addImage(logoUrl, 'PNG', 10, 10, 20, 20);

        // Add Title beside Logo
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text("InstaRoom", 35, 24);
        doc.setFont('helvetica', 'normal');

        const currentDate = new Date().toLocaleDateString();
        doc.setFontSize(12);
        doc.text("Issued Date: " + currentDate, 140, 10);
        doc.text("Due Date: " + (formatDate(booking.check_out_date) || 'N/A'), 140, 16);

        const spaceAfterTitle = 30;

        const drawLabelValue = (label, value, x, y) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label, x, y);
            doc.setFont('helvetica', 'normal');
            doc.text(value.toString(), x + 40, y);
        };

        drawLabelValue("Booking Ref:", booking.booking_trans_ref || 'N/A', 10, 16 + spaceAfterTitle);
        drawLabelValue("Booking Status:", booking.booking_status || 'N/A', 120, 16 + spaceAfterTitle);

        // Separator Line
        doc.setLineWidth(0.5);
        doc.setDrawColor(191, 140, 93);
        doc.line(10, 60, 200, 60);

        // Guest Details
        drawLabelValue("Guest Name:", booking.full_name || 'N/A', 10, 40 + spaceAfterTitle);
        drawLabelValue("Email:", booking.email || 'N/A', 10, 46 + spaceAfterTitle);
        drawLabelValue("Contact Number:", (booking.country_code || '') + ' ' + (booking.contact_number || 'N/A'), 10, 52 + spaceAfterTitle);

        // Room Details Left
        drawLabelValue("Room Number:", booking.room_number || 'N/A', 10, 62 + spaceAfterTitle);
        drawLabelValue("Room Type:", booking.room_type || 'N/A', 10, 68 + spaceAfterTitle);
        drawLabelValue("Room Size:", (booking.room_size || 'N/A') + ' sqm', 10, 74 + spaceAfterTitle);

        // Room Details Right
        drawLabelValue("Bed Type:", booking.bed_type || 'N/A', 110, 62 + spaceAfterTitle);
        drawLabelValue("Additional Beds:", booking.additional_beds || '0', 110, 68 + spaceAfterTitle);

        const getFloorSuffix = (level) => {
            if (!level) return 'N/A';
            const suffixes = ['th', 'st', 'nd', 'rd'];
            const v = level % 100;
            return level + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]) + " Floor";
        };

        drawLabelValue("Floor Level:", getFloorSuffix(booking.floor_level || 'N/A'), 110, 74 + spaceAfterTitle);

        // Stay Duration
        const stayDuration = booking.stay_duration || 0;
        drawLabelValue("Stay Duration:", `${stayDuration} Day${stayDuration === 1 ? '' : 's'}`, 10, 80 + spaceAfterTitle);

        // Check-in & Check-out
        drawLabelValue("Check-in Date:", formatDate(booking.check_in_date) || 'N/A', 10, 102 + spaceAfterTitle);
        drawLabelValue("Check-in Time:", booking.check_in_time || 'N/A', 10, 108 + spaceAfterTitle);
        drawLabelValue("Check-out Date:", formatDate(booking.check_out_date) || 'N/A', 120, 102 + spaceAfterTitle);
        drawLabelValue("Check-out Time:", booking.check_out_time || 'N/A', 120, 108 + spaceAfterTitle);

        // Room Details Table
        const headers = ['Room Number', 'Room Type', 'Price', 'Extra Bed Price', 'Total Bed Price', 'Total'];
        const data = [
            [
                booking.room_number || 'N/A',
                booking.room_type || 'N/A',
                parseFloat(booking.price || 0).toFixed(2),
                parseFloat(booking.extra_bed_price || 0).toFixed(2),
                parseFloat(booking.total_extra_bed_price || 0).toFixed(2),
                parseFloat(booking.total_amount || 0).toFixed(2)
            ]
        ];

        doc.autoTable({
            head: [headers],
            body: data,
            startY: 120 + spaceAfterTitle,
            theme: 'striped',
            headStyles: { fillColor: '#BF8C5D' },
            margin: { top: 10 }
        });

        doc.text("Total Amount: " + parseFloat(booking.total_amount || 0).toFixed(2), 140, doc.lastAutoTable.finalY + 10);

        // Generate QR Code only if the Booking Status is "Checked-in"
        if (booking.booking_status === "Checked-in") {
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(booking.booking_trans_ref)}`;

            const qrImage = new Image();
            qrImage.src = qrCodeUrl;
            qrImage.onload = function () {
                const qrSize = 80;
                const xPos = (doc.internal.pageSize.getWidth() - qrSize) / 2;
                doc.addImage(qrImage, 'PNG', xPos, doc.lastAutoTable.finalY + 20, qrSize, qrSize);

                // Save PDF
                const filename = `${(booking.booking_status || 'N/A').toLowerCase().replace(/\s+/g, '_')}_${booking.booking_trans_ref}.pdf`;
                doc.save(filename);
            };
        } else {
            // Save PDF immediately if QR Code is not needed
            const filename = `${(booking.booking_status || 'N/A').toLowerCase().replace(/\s+/g, '_')}_${booking.booking_trans_ref}.pdf`;
            doc.save(filename);
        }
    } catch (error) {
        console.error("Error fetching booking data:", error);
        alert("An error occurred while fetching booking details.");
    }
};

// Export the function if using modules
window.printReceipt = printReceipt;

// Load data on page load
document.addEventListener('DOMContentLoaded', populateBookingTable);
