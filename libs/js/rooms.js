import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, get, set, push, update, remove } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

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



// Function to load floor levels dynamically from Firebase (Hotel_Room)
function loadFloorLevels() {
    const floorLevelSelect = document.getElementById("floor-level");
    const hotelRoomRef = ref(db, "Hotel_Room");

    get(hotelRoomRef).then((snapshot) => {
        if (snapshot.exists()) {
            const roomData = snapshot.val();

            // Clear existing options
            floorLevelSelect.innerHTML = '<option value="">Select Floor</option>';

            // Populate dropdown from floor_level in Hotel_Room
            for (let i = 1; i <= roomData.floor_level; i++) {
                const option = document.createElement("option");
                option.value = i;
                
                // Determine ordinal suffix
                let suffix = "th";
                if (i % 10 === 1 && i !== 11) {
                    suffix = "st";
                } else if (i % 10 === 2 && i !== 12) {
                    suffix = "nd";
                } else if (i % 10 === 3 && i !== 13) {
                    suffix = "rd";
                }

                option.textContent = `${i}${suffix} Floor`;
                floorLevelSelect.appendChild(option);
            }
        } else {
            console.log("No floor level data found in Hotel_Room.");
        }
    }).catch((error) => {
        console.error("Error fetching floor levels:", error);
    });
}

// Load floor levels on page load
document.addEventListener("DOMContentLoaded", loadFloorLevels);

// Function to filter table rows based on selected floor level, status, and search query
function filterTable() {
    const selectedFloor = document.getElementById('floor-level').value.trim(); // Get value directly
    const selectedStatus = document.getElementById('room-status').value.trim().toLowerCase();
    const searchQuery = document.getElementById('search')?.value.trim().toLowerCase() || "";

    const rows = document.querySelectorAll("#room-table-body tr");

    let hasVisibleRows = false; // Track if any row is visible

    rows.forEach(row => {
        const cells = row.getElementsByTagName("td");
        if (cells.length < 6) return; // Skip rows with missing data

        const floorLevel = cells[2]?.textContent.trim(); // Assuming floor level is in column 3 (index 2)
        const roomStatusSelect = cells[5]?.querySelector(".room-status-select");
        const roomStatus = roomStatusSelect ? roomStatusSelect.value.trim().toLowerCase() : ""; // Get selected value
        const rowText = row.textContent.trim().toLowerCase();

        // Normalize floor level comparison by removing the ordinal suffix (st, nd, rd, th)
        const floorNumber = parseInt(floorLevel); // Convert floor level to a number

        // Debugging Logs
        console.log(`Row Data -> Floor: ${floorLevel}, Status: "${roomStatus}"`);
        console.log(`Selected -> Floor: ${selectedFloor}, Status: "${selectedStatus}", Search: ${searchQuery}`);

        // Room Status Dropdown Logic: Show all rows if "Select Status" or empty is selected
        const isDefaultStatus = selectedStatus === "" || selectedStatus === "select status";
        const matchFloor = !selectedFloor || floorNumber === parseInt(selectedFloor); // Compare only the floor number
        const matchStatus = isDefaultStatus || roomStatus === selectedStatus;  
        const matchSearch = !searchQuery || rowText.includes(searchQuery);

        const shouldShow = matchFloor && matchStatus && matchSearch;

        row.style.display = shouldShow ? "" : "none";
        if (shouldShow) hasVisibleRows = true;
    });

    // Show message if no rows are visible
    document.getElementById("no-results")?.remove();
    if (!hasVisibleRows) {
        const messageRow = document.createElement("tr");
        messageRow.id = "no-results";
        messageRow.innerHTML = `<td colspan="18" style="text-align:center; color:red;">No matching results found.</td>`;
        document.querySelector("#room-table-body").appendChild(messageRow);
    }
}

// Attach event listeners
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('floor-level').addEventListener('change', filterTable);
    document.getElementById('room-status').addEventListener('change', filterTable); // Room status change
    document.getElementById('search').addEventListener('input', filterTable);
    document.getElementById('search-button')?.addEventListener('click', filterTable);
});


// Function to load Hotel Room dropdowns
function loadHotelRoomDropdowns() {
    const floorLevelSelect = document.getElementById('floor_level');
    const roomLetterSelect = document.getElementById('room_letter');
    const roomNumberSelect = document.getElementById('room_number');

    // Get the available values from Firebase
    const roomRef = ref(db, 'Hotel_Room');
    
    get(roomRef).then((snapshot) => {
        if (snapshot.exists()) {
            const roomData = snapshot.val();
            
            // Floor Level: 1 to roomData.floor_level
            floorLevelSelect.innerHTML = '<option value="">Select Floor Level</option>';
            for (let i = 1; i <= roomData.floor_level; i++) {
                floorLevelSelect.innerHTML += `<option value="${i}">${i}${getNumberSuffix(i)} Floor</option>`;
            }

            // Room Letter: A to the last letter in roomData.room_letter (e.g., A to H)
            const roomLetters = generateRoomLettersFromRange(roomData.room_letter);
            roomLetterSelect.innerHTML = '<option value="">Select Letter</option>';
            roomLetters.forEach(letter => {
                roomLetterSelect.innerHTML += `<option value="${letter}">${letter}</option>`;
            });

            // Room Number: 1 to roomData.room_number (e.g., 1 to 20)
            roomNumberSelect.innerHTML = '<option value="">Select Number</option>';
            for (let i = 1; i <= roomData.room_number; i++) {
                roomNumberSelect.innerHTML += `<option value="${i}">${i}</option>`;
            }
        } else {
            console.log("No room data available.");
        }
    }).catch((error) => {
        console.error("Error fetching data from Firebase:", error);
    });
}

// Helper function to generate room letters from a range like "A - H"
function generateRoomLettersFromRange(range) {
    // Split the range like "A - H" into two parts: start and end
    const [startLetter, endLetter] = range.split(' - ');

    // Generate an array of letters from startLetter to endLetter
    const letters = [];
    let startCharCode = startLetter.charCodeAt(0);  // Starting from the first letter (e.g., 'A')
    let endCharCode = endLetter.charCodeAt(0);  // The last letter (e.g., 'H')

    for (let i = startCharCode; i <= endCharCode; i++) {
        letters.push(String.fromCharCode(i)); // Convert charCode to letter
    }
    
    return letters;
}

// Helper function to get the floor suffix (st, nd, rd, th)
function getNumberSuffix(number) {
    const suffix = ['th', 'st', 'nd', 'rd'];
    const value = number % 100;
    return suffix[(value - 20) % 10] || suffix[value] || suffix[0];
}

// Function to load available Room Types
function loadRoomTypes() {
    const roomTypeSelect = document.getElementById('room_type');
    const roomTypeRef = ref(db, 'Room_Type');

    get(roomTypeRef).then((snapshot) => {
        if (snapshot.exists()) {
            roomTypeSelect.innerHTML = '<option value="">Select Room Type</option>';
            snapshot.forEach((childSnapshot) => {
                const roomData = childSnapshot.val();
                if (roomData.room_availability === 'available') {
                    roomTypeSelect.innerHTML += `<option value="${roomData.room_type}">${roomData.room_type}</option>`;
                }
            });
        }
    }).catch((error) => {
        console.error("Error loading room types:", error);
    });
}

// Load dropdowns on page load
document.addEventListener("DOMContentLoaded", () => {
    loadHotelRoomDropdowns();
    loadRoomTypes();
});

// Show error function with single validation message
function showError(input, message) {
    if (!input.classList.contains('is-invalid')) {
        input.classList.add('is-invalid');
    }

    let errorDiv = input.parentNode.querySelector('.invalid-feedback');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.classList.add('invalid-feedback');
        input.parentNode.appendChild(errorDiv);
    }

    errorDiv.innerText = message;
}


// Clear error
function clearError(input) {
    input.classList.remove('is-invalid');
    let errorDiv = input.parentNode.querySelector('.invalid-feedback');
    if (errorDiv) {
        errorDiv.innerText = '';
    }
}

document.getElementById('room_price').addEventListener('change', function() {
    const customPriceInput = document.getElementById('custom_price');
    const roomPriceError = document.getElementById('room_price_error');

    if (this.value === 'other') {
        customPriceInput.style.display = 'block';
        customPriceInput.setAttribute('required', 'true');
    } else {
        customPriceInput.style.display = 'none';
        customPriceInput.removeAttribute('required');
        roomPriceError.style.display = 'none';
    }
});


document.getElementById('extra_bed_price').addEventListener('change', function() {
    const customExtraBedPriceInput = document.getElementById('custom_extra_bed_price');
    const extraBedPriceError = document.getElementById('extra_bed_price_error');

    if (this.value === 'other') {
        customExtraBedPriceInput.style.display = 'block';
        customExtraBedPriceInput.setAttribute('required', 'true');
    } else {
        customExtraBedPriceInput.style.display = 'none';
        customExtraBedPriceInput.removeAttribute('required');
        extraBedPriceError.style.display = 'none';
    }
});


// Function to display error messages
function displayErrorMessage(input, message) {
    let errorDiv = input.nextElementSibling;
    
    if (!errorDiv || !errorDiv.classList.contains('text-danger')) {
        errorDiv = document.createElement('div');
        errorDiv.classList.add('text-danger');
        input.parentNode.appendChild(errorDiv);
    }

    errorDiv.textContent = message;
}

function validateForm() {
    let isValid = true;

    document.querySelectorAll('.form-control').forEach(input => {
        if (!input.value.trim()) {
            let fieldName = input.getAttribute('name');
            let errorMessage = '';
    
            console.log(`Validating field: ${fieldName}`); // Log field name
    
            switch (fieldName) {
                case 'room_letter':
                    errorMessage = 'Please select a room letter.';
                    break;
                case 'room_number':
                    errorMessage = 'Please enter a room number.';
                    break;
                case 'telephone_number':
                    errorMessage = 'Please enter a telephone number.';
                    break;
                case 'room_type':
                    errorMessage = 'Please select a room type.';
                    break;
                case 'floor_level':
                    errorMessage = 'Please enter the floor level.';
                    break;
                case 'room_size':
                    errorMessage = 'Please enter the room size.';
                    break;
                case 'room_price': 
                case 'custom_price':
                    errorMessage = 'Please enter the price.';
                    break;
                case 'extra_bed_price': 
                case 'custom_extra_bed_price':
                    errorMessage = 'Please enter the extra bed price.';
                    break;
                case 'bed_type':
                    errorMessage = 'Please select a bed type.';
                    break;
                case 'number_of_bed':
                    errorMessage = 'Please enter the number of beds.';
                    break;
                case 'adult':
                    errorMessage = 'Please enter the number of adults.';
                    break;
                case 'children':
                    errorMessage = 'Please enter the number of children.';
                    break;
                case 'baby':
                    errorMessage = 'Please enter the number of babies.';
                    break;
                case 'max_number_adult':
                    errorMessage = 'Please enter the maximum number of adults.';
                    break;
                case 'max_number_children':
                    errorMessage = 'Please enter the maximum number of children.';
                    break;
                case 'max_number_baby':
                    errorMessage = 'Please enter the maximum number of babies.';
                    break;
                case 'extra_bed_type':
                    errorMessage = 'Please select an extra bed type.';
                    break;
                case 'max_occupancy':
                    errorMessage = 'Please enter the maximum occupancy.';
                    break;
                case 'bed_occupancy':
                    errorMessage = 'Please enter the maximum occupancy.';
                    break;
                default:
                    errorMessage = 'This field is required.';
            }
    
            console.log(`Error message: ${errorMessage}`); // Log the error message
            showError(input, errorMessage);
            isValid = false;
        } else {
            console.log(`Field ${input.getAttribute('name')} is valid.`); // Log valid fields
            clearError(input);
        }
    });
    
    // Get input fields
    const adultInput = document.getElementById("max_number_adult");
    const childrenInput = document.getElementById("children");
    const babyInput = document.getElementById("baby");
    const maxOccupancyInput = document.getElementById("max_occupancy");
    const maxChildrenInput = document.getElementById("max_number_children");
    const maxBabyInput = document.getElementById("max_number_baby");
 

    // Get error message containers
    const adultError = document.getElementById("adult-error");
    const childrenError = document.getElementById("children-error");
    const babyError = document.getElementById("baby-error");
    const maxOccupancyError = document.getElementById("max_occupancy-error");
    const maxChildrenError = document.getElementById("max_number_children-error");
    const maxBabyError = document.getElementById("max_number_baby-error");


    // Clear previous errors
    adultError.innerHTML = "";
    childrenError.innerHTML = "";
    babyError.innerHTML = "";
    maxOccupancyError.innerHTML = "";

    // Validate Adults
    if (adultInput.value < 1 || adultInput.value === "") {
        adultError.innerHTML = "At least one adult is required!";
        adultError.style.color = "red";
        isValid = false;
    }

    // Validate Children
    if (childrenInput.value < 0 || childrenInput.value === "") {
        childrenError.innerHTML = "Children count cannot be negative!";
        childrenError.style.color = "red";
        isValid = false;
    }


    // Validate Babies
    if (babyInput.value < 0 || babyInput.value === "") {
        babyError.innerHTML = "Babies count cannot be negative!";
        babyError.style.color = "red";
        isValid = false;
    }

    // Validate Max Occupancy
if (maxOccupancyInput.value < 1 || maxOccupancyInput.value === "") {
    maxOccupancyError.innerHTML = "Max occupancy must be at least 1.";
    maxOccupancyError.style.color = "red";
    isValid = false;
}

// Validate Max Number of Children
if (maxChildrenInput.value < 0 || maxChildrenInput.value === "") {
    maxChildrenError.innerHTML = "Max number of children cannot be negative!";
    maxChildrenError.style.color = "red";
    isValid = false;
}

// Validate Max Number of Babies
if (maxBabyInput.value < 0 || maxBabyInput.value === "") {
    maxBabyError.innerHTML = "Max number of babies cannot be negative!";
    maxBabyError.style.color = "red";
    isValid = false;
}

    
    // Validate telephone number format (XXX-XXX-XXXX)
    const phoneInput = document.getElementById('telephone_number');
    const phonePattern = /^\d{3}-\d{3}-\d{4}$/;
    if (!phonePattern.test(phoneInput.value)) {
        showError(phoneInput, 'Please enter a valid phone number (XXX-XXX-XXXX).');
        isValid = false;
    } else {
        clearError(phoneInput);
    }

    // Validate price input (room_price or custom_price)
    const roomPrice = document.getElementById('room_price');
    const customPrice = document.getElementById('custom_price');

    if (roomPrice.value === '' && customPrice.value.trim() === '') {
        showError(customPrice, 'Please enter the price.');
        isValid = false;
    } else if (roomPrice.value === 'other') {
        const customPriceValue = parseFloat(customPrice.value.trim());
        if (isNaN(customPriceValue) || customPriceValue <= 0) {
            showError(customPrice, 'Please enter a valid custom price.');
            isValid = false;
        } else {
            clearError(customPrice);
        }
    } else {
        clearError(customPrice);
    }

    // Validate extra bed price input (extra_bed_price or custom_extra_bed_price)
    const extraBedPrice = document.getElementById('extra_bed_price');
    const customExtraBedPrice = document.getElementById('custom_extra_bed_price');

    if (extraBedPrice.value === '' && customExtraBedPrice.value.trim() === '') {
        showError(customExtraBedPrice, 'Please enter the extra bed price.');
        isValid = false;
    } else if (extraBedPrice.value === 'other') {
        const customExtraBedPriceValue = parseFloat(customExtraBedPrice.value.trim());
        if (isNaN(customExtraBedPriceValue) || customExtraBedPriceValue <= 0) {
            showError(customExtraBedPrice, 'Please enter a valid custom extra bed price.');
            isValid = false;
        } else {
            clearError(customExtraBedPrice);
        }
    } else {
        clearError(customExtraBedPrice);
    }

    // Validate room size (numeric and within range)
    const roomSizeInput = document.getElementById('room_size');
    const roomSizeValue = parseFloat(roomSizeInput.value.trim());

    if (isNaN(roomSizeValue) || roomSizeValue <= 0 || roomSizeValue > 100) {
        showError(roomSizeInput, 'Room size must be between 1 and 100 sqm.');
        isValid = false;
    } else {
        clearError(roomSizeInput);
    }

    return isValid;
}



// Room data cache
let roomDataCache = {}; // Store room data by ID

// Check if Room Already Exists (excluding the current room)
async function roomExists(roomLetter, roomNumber, excludeRoomId = null) {
    const roomRef = ref(db, 'Rooms');
    const snapshot = await get(roomRef);

    if (snapshot.exists()) {
        for (const [key, childSnapshot] of Object.entries(snapshot.val())) {
            if (key !== excludeRoomId && 
                childSnapshot.room_letter.toLowerCase() === roomLetter.toLowerCase() &&
                childSnapshot.room_number.toLowerCase() === roomNumber.toLowerCase()) {
                return true; // Room already exists
            }
        }
    }
    return false; // Room is unique
}

async function addRoom(event) {
    event.preventDefault(); // Prevent form submission

    if (!validateForm()) {
        return;
    }

    const roomLetter = document.getElementById('room_letter').value.trim();
    const roomNumber = document.getElementById('room_number').value.trim();
    const telephoneNumber = document.getElementById('telephone_number').value.trim();
    const roomType = document.getElementById('room_type').value.trim();
    const floorLevel = document.getElementById('floor_level').value.trim();
    const bedType = document.getElementById('bed_type').value.trim();
    const numberOfBed = document.getElementById('number_of_bed').value.trim();
    const roomSize = document.getElementById('room_size').value.trim();

    // Getting occupancy data
    const adult = parseInt(document.getElementById('adult').value.trim(), 10);
    const children = parseInt(document.getElementById('children').value.trim(), 10);
    const baby = parseInt(document.getElementById('baby').value.trim(), 10);
    const maxAdult = parseInt(document.getElementById('max_number_adult').value.trim(), 10);
    const maxChildren = parseInt(document.getElementById('max_number_children').value.trim(), 10);
    const maxBaby = parseInt(document.getElementById('max_number_baby').value.trim(), 10);

    // Calculate max occupancy
    const maxOccupancy = maxAdult + maxChildren + maxBaby;

    // Extra bed type
    const extraBedType = document.getElementById('extra_bed_type').value.trim();

    // Determine the room price (either from room_price or custom_price)
    let price = document.getElementById('room_price').value.trim();
    if (price === 'other') {
        price = document.getElementById('custom_price').value.trim();
    }

    // Determine the extra bed price (either from extra_bed_price or custom_extra_bed_price)
    let extraBedPrice = document.getElementById('extra_bed_price').value.trim();
    if (extraBedPrice === 'other') {
        extraBedPrice = document.getElementById('custom_extra_bed_price').value.trim();
    }

    if (price && !price.includes('.')) {
        price += '.00';
    }

    if (extraBedPrice && !extraBedPrice.includes('.')) {
        extraBedPrice += '.00';
    }

    if (isNaN(price) || parseFloat(price) <= 0) {
        showError(document.getElementById('room_price'), 'Please enter a valid price.');
        return;
    }

    if (isNaN(extraBedPrice) || parseFloat(extraBedPrice) < 0) {
        showError(document.getElementById('extra_bed_price'), 'Please enter a valid extra bed price.');
        return;
    }

    // Check if room already exists based on room_letter + room_number
    const roomId = roomLetter + roomNumber;
    
    // Only check for room existence if "other" is not selected for price
    if (price !== 'other' && await roomExists(roomLetter, roomNumber)) {
        showError(document.getElementById('room_number'), `Room ${roomLetter}${roomNumber} already exists.`);
        return;
    } else {
        // Clear the previous error if the room exists check passes
        hideError(document.getElementById('room_number'));
    }

    const newRoomRef = ref(db, 'Rooms/' + roomId);

    await set(newRoomRef, {
        room_letter: roomLetter,
        room_number: roomNumber,
        telephone_number: telephoneNumber,
        room_type: roomType,
        floor_level: floorLevel,
        bed_type: bedType,
        number_of_bed: parseInt(numberOfBed, 10),
        room_size: parseInt(roomSize, 10),
        price: price,
        extra_bed_price: extraBedPrice,
        room_status: 'Available',
        booking_status: '',
        booking_trans_ref: '',
        room_power: 'Off',
        extra_bed_type: extraBedType,
        // Storing occupancy data
        adult: adult,
        children: children,
        baby: baby,
        max_number_adult: maxAdult,
        max_number_children: maxChildren,
        max_number_baby: maxBaby,
        max_occupancy: maxOccupancy, // <-- Added max_occupancy
        bed_occupancy: parseInt(numberOfBed, 10) // <-- Added bed_occupancy
    });

    alert('Room added successfully!');
    document.getElementById('room-form').reset();
    loadRooms();
}



function hideError(element) {
    // Find the error message associated with the form field
    const errorMessage = element.nextElementSibling; // Assuming error message is right after the input field

    // Only hide the error if it exists
    if (errorMessage && errorMessage.classList.contains('error-message')) {
        errorMessage.style.display = 'none';
    }
}

async function updateRoom() {
    if (!selectedRoomId) {
        alert('Please select a room to update.');
        return;
    }

    const roomLetter = document.getElementById('room_letter').value.trim();
    const roomNumber = document.getElementById('room_number').value.trim();
    const newRoomId = roomLetter + roomNumber;

    // Log both room IDs for debugging
    console.log("Selected Room ID: " + selectedRoomId);
    console.log("New Room ID: " + newRoomId);

    if (newRoomId !== selectedRoomId && await roomExists(roomLetter, roomNumber, selectedRoomId)) {
        showError(document.getElementById('room_number'), `Room ${roomLetter}${roomNumber} already exists.`);
        return;
    }

    const telephoneNumber = document.getElementById('telephone_number').value.trim();
    const roomType = document.getElementById('room_type').value.trim();
    const floorLevel = document.getElementById('floor_level').value.trim();

    // Validate and format room price
    let price = document.getElementById('room_price').value.trim();
    if (price === 'other') {
        price = document.getElementById('custom_price').value.trim();
    }

    if (price && !price.includes('.')) {
        price += '.00';
    }

    if (isNaN(price) || parseFloat(price) <= 0) {
        showError(document.getElementById('room_price'), 'Please enter a valid price.');
        return;
    }

    // Validate and format extra bed price
    let extraBedPrice = document.getElementById('extra_bed_price').value.trim();
    if (extraBedPrice === 'other') {
        extraBedPrice = document.getElementById('custom_extra_bed_price').value.trim();
    }

    if (extraBedPrice && !extraBedPrice.includes('.')) {
        extraBedPrice += '.00';
    }

    if (isNaN(extraBedPrice) || parseFloat(extraBedPrice) <= 0) {
        showError(document.getElementById('extra_bed_price'), 'Please enter a valid extra bed price.');
        return;
    }

    // Get room details
    const bedType = document.getElementById('bed_type').value.trim();
    const numberOfBed = document.getElementById('number_of_bed').value.trim();
    const roomSize = document.getElementById('room_size').value.trim();
    const adult = document.getElementById('adult').value.trim();
    const children = document.getElementById('children').value.trim();
    const baby = document.getElementById('baby').value.trim();
    const maxAdult = document.getElementById('max_number_adult').value.trim();
    const maxChildren = document.getElementById('max_number_children').value.trim();
    const maxBaby = document.getElementById('max_number_baby').value.trim();
    const extraBedType = document.getElementById('extra_bed_type').value.trim();
    const maxOccupancy = document.getElementById('max_occupancy').value.trim();
    const bedOccupancy = document.getElementById('bed_occupancy').value.trim();

    const bookingTransRefElement = document.getElementById('booking_trans_ref');
    let bookingTransRef = bookingTransRefElement ? bookingTransRefElement.value.trim() : '';

    // Fetch the current room_status from Firebase
    let roomStatus = 'Available';
    try {
        const snapshot = await get(ref(db, `Rooms/${selectedRoomId}/room_status`));
        if (snapshot.exists()) {
            roomStatus = snapshot.val();
        }
    } catch (error) {
        console.error('Error fetching room_status:', error);
    }

    if (newRoomId !== selectedRoomId) {
        if (!selectedRoomId) {
            alert('Selected Room ID is missing.');
            return;
        }

        // Remove old room data
        await remove(ref(db, `Rooms/${selectedRoomId}`));

        // Set new room data
        await set(ref(db, `Rooms/${newRoomId}`), {
            room_letter: roomLetter,
            room_number: roomNumber,
            telephone_number: telephoneNumber,
            room_type: roomType,
            floor_level: floorLevel,
            price: price,
            bed_type: bedType,
            number_of_bed: parseInt(numberOfBed, 10),
            room_size: parseInt(roomSize, 10),
            adult: parseInt(adult, 10),
            children: parseInt(children, 10),
            baby: parseInt(baby, 10),
            max_number_adult: parseInt(maxAdult, 10),
            max_number_children: parseInt(maxChildren, 10),
            max_number_baby: parseInt(maxBaby, 10),
            extra_bed_type: extraBedType,
            extra_bed_price: extraBedPrice,
            max_occupancy: parseInt(maxOccupancy, 10),
            bed_occupancy: parseInt(bedOccupancy, 10),
            booking_trans_ref: bookingTransRef,
            room_status: roomStatus
        });
    } else {
        // Update existing room data
        await update(ref(db, `Rooms/${selectedRoomId}`), {
            room_letter: roomLetter,
            room_number: roomNumber,
            telephone_number: telephoneNumber,
            room_type: roomType,
            floor_level: floorLevel,
            price: price,
            bed_type: bedType,
            number_of_bed: parseInt(numberOfBed, 10),
            room_size: parseInt(roomSize, 10),
            adult: parseInt(adult, 10),
            children: parseInt(children, 10),
            baby: parseInt(baby, 10),
            max_number_adult: parseInt(maxAdult, 10),
            max_number_children: parseInt(maxChildren, 10),
            max_number_baby: parseInt(maxBaby, 10),
            extra_bed_type: extraBedType,
            extra_bed_price: extraBedPrice,
            max_occupancy: parseInt(maxOccupancy, 10),
            bed_occupancy: parseInt(bedOccupancy, 10),
            booking_trans_ref: bookingTransRef,
            room_status: roomStatus
        });
    }

    alert('Room updated successfully!');
    document.getElementById('room-form').reset();
    loadRooms();
}


async function updateRoomPower(roomId, newPower) {
    const roomRef = ref(db, `Rooms/${roomId}`);

    try {
        await update(roomRef, { room_power: newPower });
        alert(`Room Power Updated: Room ${roomId} is now ${newPower}`);
    } catch (error) {
        console.error("Error updating room power:", error);
        alert("Failed to update room power. Please try again.");
    }
}

async function updateRoomStatus(roomId, newStatus) {
    const roomRef = ref(db, `Rooms/${roomId}`);

    try {
        await update(roomRef, { room_status: newStatus });
        alert(`Room status updated to ${newStatus}`);
    } catch (error) {
        console.error("Error updating room status:", error);
        alert("Failed to update room status. Please try again.");
    }
}

async function loadRooms() {
    const roomTableBody = document.getElementById('room-table-body');
    roomTableBody.innerHTML = '';  // Clear the current rows

    const roomRef = ref(db, 'Rooms');
    const snapshot = await get(roomRef);
    
    if (snapshot.exists()) {
        const rooms = [];
        
        snapshot.forEach(childSnapshot => {
            const room = childSnapshot.val();
            const roomId = childSnapshot.key;

            // Cache room data for later selection (optional based on your needs)
            roomDataCache[roomId] = {
                id: roomId,
                room_letter: room.room_letter,
                room_number: room.room_number,
                telephone_number: room.telephone_number,
                room_type: room.room_type,
                floor_level: room.floor_level,
                bed_type: room.bed_type,
                number_of_bed: room.number_of_bed,
                bed_occupancy: room.bed_occupancy, // Added bed_occupancy
                price: room.price,
                room_size: room.room_size,
                adult: room.adult,
                children: room.children,
                baby: room.baby,
                max_number_adult: room.max_number_adult,
                max_number_children: room.max_number_children,
                max_number_baby: room.max_number_baby,
                max_occupancy: room.max_occupancy,
                extra_bed_type: room.extra_bed_type,
                extra_bed_price: room.extra_bed_price || 'N/A',
                room_status: room.room_status || 'Available',  // Default status
                booking_trans_ref: room.booking_trans_ref || 'No Booked',
                booking_status: room.booking_status || 'Not Booked',  // Add booking status
                room_power: room.room_power || 'On',  // Add room power
            };

            // Add room to an array to sort later
            rooms.push({ roomId, room });
        });

        // Sort rooms based on room_letter (A-Z) and room_number (1-20)
        rooms.sort((a, b) => {
            if (a.room.room_letter < b.room.room_letter) return -1;
            if (a.room.room_letter > b.room.room_letter) return 1;
            return a.room.room_number - b.room.room_number;
        });

        // Append sorted rooms to the table
        rooms.forEach(({ roomId, room }) => {
            const row = document.createElement('tr');
            row.setAttribute('data-room-id', roomId);

            // Populate the table row with room details
            row.innerHTML = `
                <td>${room.room_letter}${room.room_number}</td>
                <td>${room.room_type}</td>
                <td>${formatFloorLevel(room.floor_level)}</td>
                <td>${room.price}</td>
                <td>
                    <select class="room-power-select" data-room-id="${roomId}">
                        <option value="On" ${room.room_power === 'On' ? 'selected' : ''}>On</option>
                        <option value="Off" ${room.room_power === 'Off' ? 'selected' : ''}>Off</option>
                    </select>
                </td>
                <td>
                    <select class="room-status-select" data-room-id="${roomId}">
                        <option value="Available" ${room.room_status === 'Available' ? 'selected' : ''}>Available</option>
                        <option value="Occupied" ${room.room_status === 'Occupied' ? 'selected' : ''}>Occupied</option>
                        <option value="Maintenance" ${room.room_status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                        <option value="Not Available" ${room.room_status === 'Not Available' ? 'selected' : ''}>Not Available</option>
                    </select>
                </td>
                <td><button class="btn btn-primary view-btn" data-bs-toggle="modal" data-bs-target="#roomDetailsModal"
                data-room-letter="${room.room_letter}"
                data-room-number="${room.room_number}"
                data-telephone-number="${room.telephone_number}"
                data-room-type="${room.room_type}"
                data-floor-level="${room.floor_level}"
                data-bed-type="${room.bed_type}"
                data-number-of-bed="${room.number_of_bed}"
                data-bed-occupancy="${room.bed_occupancy || 'N/A'}"
                data-price="${room.price}"
                data-room-size="${room.room_size}"
                data-adult="${room.adult}"
                data-children="${room.children}"
                data-baby="${room.baby}"
                data-max-number-adult="${room.max_number_adult}"
                data-max-number-children="${room.max_number_children}"
                data-max-number-baby="${room.max_number_baby}"
                data-max-occupancy="${room.max_occupancy}"
                data-extra-bed-type="${room.extra_bed_type || 'No Extra Bed'}"
                data-extra-bed-price="${room.extra_bed_price || 'N/A'}"
                data-room-status="${room.room_status || 'Available'}"
                data-booking-trans-ref="${room.booking_trans_ref || 'No Booked'}"
                data-booking-status="${room.booking_status || 'Not Active'}"
                data-room-power="${room.room_power || 'On'}">
                View
            </button></td>
            `;
            roomTableBody.appendChild(row);
        });

        // Add event listener to "View More" buttons
        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', function () {
                // Get the data from the button's data attributes
                const roomLetter = this.getAttribute('data-room-letter');
                const roomNumber = this.getAttribute('data-room-number');
                const telephoneNumber = this.getAttribute('data-telephone-number');
                const roomType = this.getAttribute('data-room-type');
                const floorLevel = this.getAttribute('data-floor-level');
                const bedType = this.getAttribute('data-bed-type');
                const numberOfBed = this.getAttribute('data-number-of-bed');
                const bedOccupancy = this.getAttribute('data-bed-occupancy');
                const price = this.getAttribute('data-price');
                const roomSize = this.getAttribute('data-room-size');
                const adult = this.getAttribute('data-adult');
                const children = this.getAttribute('data-children');
                const baby = this.getAttribute('data-baby');
                const maxNumberAdult = this.getAttribute('data-max-number-adult');
                const maxNumberChildren = this.getAttribute('data-max-number-children');
                const maxNumberBaby = this.getAttribute('data-max-number-baby');
                const extraBedType = this.getAttribute('data-extra-bed-type');
                const extraBedPrice = this.getAttribute('data-extra-bed-price');
                const roomStatus = this.getAttribute('data-room-status');
                const bookingTransRef = this.getAttribute('data-booking-trans-ref');
                const bookingStatus = this.getAttribute('data-booking-status');
                const roomPower = this.getAttribute('data-room-power');

                // Format the floor level
                const formattedFloorLevel = formatFloorLevel(floorLevel);

                // Populate the modal with the room details
                document.getElementById('modalRoomLetter').textContent = roomLetter;
                document.getElementById('modalRoomNumber').textContent = roomNumber;
                document.getElementById('modalTelephoneNumber').textContent = telephoneNumber;
                document.getElementById('modalRoomType').textContent = roomType;
                document.getElementById('modalFloorLevel').textContent = formattedFloorLevel;  
                document.getElementById('modalBedType').textContent = bedType;
                document.getElementById('modalNumberOfBeds').textContent = numberOfBed;
                document.getElementById('modalBedOccupancy').textContent = bedOccupancy; 
                document.getElementById('modalPrice').textContent = price;
                document.getElementById('modalRoomSize').textContent = roomSize + ' sqm';
                document.getElementById('modalAdult').textContent = adult;
                document.getElementById('modalChildren').textContent = children;
                document.getElementById('modalBaby').textContent = baby;
                document.getElementById('modalMaxAdults').textContent = maxNumberAdult;
                document.getElementById('modalMaxChildren').textContent = maxNumberChildren;
                document.getElementById('modalMaxBabies').textContent = maxNumberBaby;
                document.getElementById('modalExtraBedType').textContent = extraBedType;
                document.getElementById('modalExtraBedPrice').textContent = extraBedPrice;
                document.getElementById('modalRoomStatus').textContent = roomStatus;
                document.getElementById('modalBookingTransRef').textContent = bookingTransRef;
                document.getElementById('modalBookingStatus').textContent = bookingStatus;
                document.getElementById('modalRoomPower').textContent = roomPower;

                const modalElement = document.getElementById("roomDetailsModal");
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            });
        });
    }
}

document.addEventListener('hidden.bs.modal', function (event) {
    const modal = event.target;
    
    // Dispose of the Bootstrap modal instance properly
    const modalInstance = bootstrap.Modal.getInstance(modal);
    if (modalInstance) {
        modalInstance.dispose();
    }

    // Remove any lingering modal backdrops
    const modalBackdrops = document.querySelectorAll('.modal-backdrop');
    modalBackdrops.forEach(backdrop => backdrop.remove());

    // Ensure the modal is not still "open" by resetting styles
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
});



// ✅ Use Event Delegation to prevent duplicate listeners
document.getElementById('room-table-body').addEventListener('change', async function (event) {
    const target = event.target;
    const roomId = target.getAttribute('data-room-id');

    if (!roomId) return; // Ignore if no roomId

    if (target.classList.contains('room-power-select')) {
        const newPower = target.value;
        await updateRoomPower(roomId, newPower);
    } else if (target.classList.contains('room-status-select')) {
        const newStatus = target.value;
        await updateRoomStatus(roomId, newStatus);
    }
});


function formatFloorLevel(level) {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = level % 100;
    const suffix = (v >= 11 && v <= 13) ? "th" : suffixes[v % 10] || "th";
    return `${level}${suffix} Floor`;
}

let selectedRoomId;  // Declare globally

// Function to select a row and fill the form with room data
function selectRow(row, roomData) {
    // Fill the form with room data
    document.getElementById('room_letter').value = roomData.room_letter;
    document.getElementById('room_number').value = roomData.room_number;
    document.getElementById('telephone_number').value = roomData.telephone_number;
    document.getElementById('room_type').value = roomData.room_type;
    document.getElementById('floor_level').value = roomData.floor_level;
    document.getElementById('bed_type').value = roomData.bed_type;
    document.getElementById('number_of_bed').value = roomData.number_of_bed;
    document.getElementById('room_size').value = roomData.room_size;

    document.getElementById('adult').value = roomData.adult || 0;
    document.getElementById('children').value = roomData.children || 0;
    document.getElementById('baby').value = roomData.baby || 0;
    document.getElementById('max_number_adult').value = roomData.max_number_adult || 0;
    document.getElementById('max_number_children').value = roomData.max_number_children || 0;
    document.getElementById('max_number_baby').value = roomData.max_number_baby || 0;
    document.getElementById('extra_bed_type').value = roomData.extra_bed_type || 'None';

    // Set max occupancy
    document.getElementById('max_occupancy').value = roomData.max_occupancy || 0;

    // Set bed occupancy
    document.getElementById('bed_occupancy').value = roomData.bed_occupancy || 0;

    // Set the room price
    const roomPriceDropdown = document.getElementById('room_price');
    const customPriceInput = document.getElementById('custom_price');

    if ([4000.00, 6000.00, 8000.00, 12000.00].includes(roomData.price)) {
        roomPriceDropdown.value = roomData.price.toString();
        customPriceInput.style.display = 'none';
        customPriceInput.value = '';
    } else {
        roomPriceDropdown.value = 'other';
        customPriceInput.style.display = 'block';
        customPriceInput.value = roomData.price || '';
    }

    // Set the extra bed price
    const extraBedPriceDropdown = document.getElementById('extra_bed_price');
    const customExtraBedPriceInput = document.getElementById('custom_extra_bed_price');

    if ([500.00, 700.00, 1000.00, 1500.00, 2000.00].includes(roomData.extra_bed_price)) {
        extraBedPriceDropdown.value = roomData.extra_bed_price.toString();
        customExtraBedPriceInput.style.display = 'none';
        customExtraBedPriceInput.value = '';
    } else {
        extraBedPriceDropdown.value = 'other';
        customExtraBedPriceInput.style.display = 'block';
        customExtraBedPriceInput.value = roomData.extra_bed_price || '';
    }    

    // Set the selected room ID for future update
    selectedRoomId = roomData.id;
    console.log("Selected Room ID: ", selectedRoomId);

    // Highlight the selected row
    const rows = document.querySelectorAll('#room-table-body tr');
    rows.forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');
}




// Event listener for row click
document.getElementById('room-table-body').addEventListener('click', (event) => {
    const row = event.target.closest('tr');
    if (row) {
        const roomId = row.getAttribute('data-room-id');
        const roomData = roomDataCache[roomId]; // Assuming roomDataCache stores room details by ID
        selectRow(row, roomData);
    }
});



// Clear form fields and reset selection
function clearFields() {
    // Reset form fields
    document.getElementById('room-form').reset();

    // Clear the selected room ID
    selectedRoomId = null;

    // Ensure custom price field is hidden and cleared
    document.getElementById('custom_price').value = '';
    document.getElementById('custom_price').style.display = 'none';

    // Ensure room price dropdown is reset
    document.getElementById('room_price').value = '';

    // Remove the "selected" class from all rows in the table
    const rows = document.querySelectorAll('#room-table-body tr');
    rows.forEach(row => row.classList.remove('selected'));

    console.log("Form cleared successfully!");
}

// Event Listeners
window.addEventListener('load', loadRooms);
document.getElementById('add-room-btn').addEventListener('click', addRoom);
document.getElementById('update-room-btn').addEventListener('click', updateRoom);
document.getElementById('clear-btn').addEventListener('click', clearFields); // Fix incorrect ID



