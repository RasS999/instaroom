import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, get, onValue } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();

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

// Fetch the number of "Users" and "System_Users"
async function fetchCounts() {
  try {
    const usersSnapshot = await get(ref(db, 'Users'));
    const usersCount = usersSnapshot.exists() ? Object.keys(usersSnapshot.val()).length : 0;

    const adminsSnapshot = await get(ref(db, 'System_Users'));
    const adminsCount = adminsSnapshot.exists() ? Object.keys(adminsSnapshot.val()).length : 0;

    document.getElementById('users-count').innerText = `${usersCount}`;
    document.getElementById('admins-count').innerText = `${adminsCount}`;
  } catch (error) {
    console.error('Error fetching counts: ', error.message);
    document.getElementById('users-count').innerText = 'Error loading data';
    document.getElementById('admins-count').innerText = 'Error loading data';
  }
}

// Get the full_name of the logged-in admin
async function getLoggedInAdminName() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const uid = user.uid;
      const adminRef = ref(db, `System_Users/${uid}`);

      try {
        const snapshot = await get(adminRef);
        if (snapshot.exists()) {
          const adminData = snapshot.val();
          const fullName = adminData.full_name;
          document.getElementById('profile-name').innerText = fullName;
        } else {
          console.error('Admin data not found.');
        }
      } catch (error) {
        console.error('Error fetching admin data: ', error.message);
      }
    } else {
      console.log('No user is logged in.');
    }
  });
}

const ctx = document.getElementById('bookingChart').getContext('2d');

const bookingChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Checked-out',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      },
      {
        label: 'Cancelled',
        data: [],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Bookings'
        },
        ticks: {
          precision: 0
        }
      },
      x: {
        title: {
          display: true,
          text: 'Month Year'
        }
      }
    }
  }
});

function fetchData() {
  const bookingsRef = ref(db, 'Bookings');

  onValue(bookingsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();

      const monthlyCounts = {};

      for (const bookingId in data) {
        const booking = data[bookingId];
        const status = booking.booking_status;

        if (status === 'Checked-out' || status === 'Cancelled') {
          const bookingDate = new Date(booking.check_in_date || booking.check_out_date);
          const monthYear = `${bookingDate.toLocaleString('default', { month: 'long' })} ${bookingDate.getFullYear()}`;

          if (!monthlyCounts[monthYear]) {
            monthlyCounts[monthYear] = { 'Checked-out': 0, 'Cancelled': 0 };
          }

          monthlyCounts[monthYear][status]++;
        }
      }

      const months = Object.keys(monthlyCounts);
      const checkedOutCounts = months.map(month => monthlyCounts[month]['Checked-out'] || 0);
      const cancelledCounts = months.map(month => monthlyCounts[month]['Cancelled'] || 0);

      bookingChart.data.labels = months;
      bookingChart.data.datasets[0].data = checkedOutCounts;
      bookingChart.data.datasets[1].data = cancelledCounts;
      bookingChart.update();
    }
  });
}

fetchData();

// Room types to track
const roomTypes = ['Standard Room', 'Family Room', 'Deluxe Room', 'Suite Room', 'Triple Room'];

// Fetch and rank checked-out rooms
function fetchRoomRankings() {
  const bookingsRef = ref(db, 'Bookings');

  onValue(bookingsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const roomCounts = {};

      // Initialize counts for each room type
      roomTypes.forEach(roomType => {
        roomCounts[roomType] = 0;
      });

      // Count checked-out rooms
      for (const bookingId in data) {
        const booking = data[bookingId];
        const status = booking.booking_status;
        const roomType = booking.room_type;

        if (status === 'Checked-out' && roomTypes.includes(roomType)) {
          roomCounts[roomType]++;
        }
      }

      // Sort the room types by checked-out count (descending)
      const sortedRooms = Object.entries(roomCounts).sort((a, b) => b[1] - a[1]);

      // Render the data in the table
      const tableBody = document.getElementById('roomTableBody');
      tableBody.innerHTML = '';

      sortedRooms.forEach(([roomType, count], index) => {
        const row = `<tr>
          <td>${index + 1}</td>
          <td>${roomType}</td>
          <td>${count}</td>
        </tr>`;
        tableBody.innerHTML += row;
      });
    }
  });
}

// Fetch total revenue
function fetchTotalRevenue() {
  const bookingsRef = ref(db, 'Bookings');

  onValue(bookingsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      let totalRevenue = 0;

      for (const bookingId in data) {
        const booking = data[bookingId];
        if (booking.payment_status === 'Paid' && booking.total_amount) {
          totalRevenue += parseFloat(booking.total_amount);
        }
      }

      document.getElementById('total-revenue').innerText = `${totalRevenue.toFixed(2)}`;
    }
  });
}

// Fetch data when the page loads
window.onload = function () {
  fetchRoomRankings();
  fetchTotalRevenue();
  getLoggedInAdminName();
  fetchCounts();
};

