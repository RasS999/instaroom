import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, get, update } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
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

const updateRoomBtn = document.getElementById('update-room-btn');

// Load Existing Room Details
async function loadRoomDetails() {
    const roomRef = ref(db, 'Hotel_Room');
    const snapshot = await get(roomRef);

    if (snapshot.exists()) {
        const roomData = snapshot.val();

        if (roomData.room_letter) {
            // Extract the last letter from "A - X" format (e.g., "A - J" → "J")
            const extractedLetter = roomData.room_letter.split(" - ").pop();
            document.getElementById('room_letter').value = extractedLetter;
        }

        if (roomData.room_number) {
            document.getElementById('room_number').value = roomData.room_number;
        }

        if (roomData.floor_level) {
            document.getElementById('floor_level').value = roomData.floor_level;
        }
    }
}

// Update Room Details
updateRoomBtn.addEventListener('click', async () => {
    const roomLetter = document.getElementById('room_letter').value;
    const roomNumber = document.getElementById('room_number').value;
    const floorLevel = document.getElementById('floor_level').value;

    if (!roomLetter || !roomNumber || !floorLevel) {
        alert("Please fill in all required fields.");
        return;
    }

    const roomData = {
        floor_level: floorLevel,
        room_letter: `A - ${roomLetter}`, // Ensure format "A - X"
        room_number: roomNumber
    };

    await update(ref(db, `Hotel_Room`), roomData);
    alert("Room details updated successfully!");
});

// Load Room Types and Set Checkbox States
async function loadRoomTypes() {
    const roomTypesRef = ref(db, 'Room_Type');
    const snapshot = await get(roomTypesRef);

    if (snapshot.exists()) {
        const roomTypesData = snapshot.val();
        document.querySelectorAll('input[name="room_type"]').forEach((checkbox) => {
            const roomType = checkbox.value;
            checkbox.checked = roomTypesData[roomType]?.room_availability === "available";
        });
    }
}

// Update Firebase on Checkbox Change
function setupCheckboxListeners() {
    document.querySelectorAll('input[name="room_type"]').forEach((checkbox) => {
        checkbox.addEventListener('change', async function () {
            const roomType = this.value;
            const roomAvailability = this.checked ? "available" : "unavailable";

            await update(ref(db, `Room_Type/${roomType}`), { room_availability: roomAvailability });
        });
    });
}

// Ensure DOM is Fully Loaded
document.addEventListener("DOMContentLoaded", () => {
    loadRoomDetails(); // Load Room Details into Form
    loadRoomTypes().then(setupCheckboxListeners);
});
