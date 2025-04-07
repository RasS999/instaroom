<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php'; // Use Composer autoloader

// Firebase API URL
$firebase_url = 'https://insta-room-4b79a-default-rtdb.firebaseio.com/System_Users.json';

// Get the raw POST data (email from JavaScript)
$email = isset($_POST['email']) ? $_POST['email'] : '';

// If email is missing, send an error response
if (empty($email)) {
    echo json_encode(['status' => 'error', 'message' => 'Missing email.']);
    exit;
}

// Fetch user data from Firebase by email
$response = file_get_contents($firebase_url);
$users = json_decode($response, true);

// Initialize variables for full name
$full_name = '';

foreach ($users as $uid => $user) {
    if (isset($user['email']) && $user['email'] == $email) {
        $full_name = $user['full_name'] ?? '';
        break;
    }
}

// If no user found, send an error
if (empty($full_name)) {
    echo json_encode(['status' => 'error', 'message' => 'User not found or email mismatch.']);
    exit;
}

// Create the email content
$subject = 'Alert: Failed Login Attempts';
$body = "<p>Dear $full_name,</p><p>We have detected 3 failed login attempts on your account. Please ensure your account is secure and reset your password if necessary.</p><p>Regards,</p><p>Support Team</p>";

// Initialize PHPMailer
$mail = new PHPMailer(true);  // Enable exceptions

try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'insta.room.1000@gmail.com';
    $mail->Password = 'mudivopncsdzltii'; // Ensure this is correct
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;

    $mail->setFrom('insta.room.1000@gmail.com', 'InstaRoom Support');
    $mail->addAddress($email);

    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body    = $body;

    // Send the email
    if ($mail->send()) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => $mail->ErrorInfo]);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
