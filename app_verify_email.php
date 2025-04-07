<!-- verify_email.php -->

<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Auth;
use Kreait\Firebase\Exception\AuthException;

require 'vendor/autoload.php';

$firebaseDatabaseURL = "https://insta-room-4b79a-default-rtdb.firebaseio.com";

// Initialize Firebase
$firebase = (new Factory)->withServiceAccount(__DIR__ . '/firebase-credentials.json');
$auth = $firebase->createAuth();

if (isset($_GET['uid']) && isset($_GET['newEmail'])) {
    $uid = $_GET['uid'];
    $newEmail = $_GET['newEmail'];

    // Retrieve user data from Firebase Realtime Database
    $firebaseGetURL = "{$firebaseDatabaseURL}/Users/{$uid}.json";
    $userData = file_get_contents($firebaseGetURL);

    if (!$userData) {
        echo "<h2>Failed to retrieve user data.</h2>";
        exit;
    }

    $userDataArray = json_decode($userData, true);
    $oldEmail = $userDataArray['email']; // Current email

    // Update the email field in Firebase Realtime Database
    $userDataArray['email'] = $newEmail;
    $firebaseUpdateURL = "{$firebaseDatabaseURL}/Users/{$uid}.json";
    $data = json_encode($userDataArray);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $firebaseUpdateURL);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PATCH");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);

    $response = curl_exec($ch);
    curl_close($ch);

    if ($response) {
        // Send confirmation email to new email address
        sendEmail($newEmail, "Welcome! Your Email is Updated", "You have successfully updated your email to {$newEmail}.");
        
        // Remove the old email from Firebase Authentication and update it with the new email
        removeOldEmailFromAuth($oldEmail, $newEmail);

        echo "<h2>Email Successfully Updated!</h2>";
    } else {
        echo "<h2>Failed to Update Email. Try Again.</h2>";
    }
} else {
    echo "<h2>Invalid Request!</h2>";
}

function sendEmail($to, $subject, $message) {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'insta.room.1000@gmail.com';
        $mail->Password   = 'mudivopncsdzltii';  // Remember to keep this secure
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        $mail->setFrom('insta.room.1000@gmail.com', 'InstaRoom Support');
        $mail->addAddress($to);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = "<p>{$message}</p>";

        return $mail->send();
    } catch (Exception $e) {
        return false;
    }
}

function removeOldEmailFromAuth($oldEmail, $newEmail) {
    global $auth;
    try {
        // Get the user by old email
        $user = $auth->getUserByEmail($oldEmail);
        
        // Update user with new email
        $auth->updateUser($user->uid, [
            'email' => $newEmail
        ]);
        
        echo "<h3>Email updated in Firebase Authentication!</h3>";
    } catch (AuthException $e) {
        error_log("Error updating user in Firebase Authentication: " . $e->getMessage());
        echo "<h2>Error updating Firebase Authentication email.</h2>";
    }
}
?>
