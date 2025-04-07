<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Kreait\Firebase\Factory;

require 'vendor/autoload.php';

$firebaseDatabaseURL = "https://insta-room-4b79a-default-rtdb.firebaseio.com";
$firebase = (new Factory)->withServiceAccount(__DIR__ . '/firebase-credentials.json');
$auth = $firebase->createAuth();

if (isset($_GET['uid']) && isset($_GET['newEmail'])) {
    $uid = $_GET['uid'];
    $newEmail = $_GET['newEmail'];

    // Retrieve user data from Firebase
    $firebaseGetURL = "{$firebaseDatabaseURL}/System_Users/{$uid}.json";
    $userData = file_get_contents($firebaseGetURL);

    if (!$userData) {
        echo "<h2>Failed to retrieve user data.</h2>";
        exit;
    }

    $userDataArray = json_decode($userData, true);
    $oldEmail = $userDataArray['email'];

    // Update Firebase Realtime Database
    $userDataArray['email'] = $newEmail;
    $firebaseUpdateURL = "{$firebaseDatabaseURL}/System_Users/{$uid}.json";
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
        // Update Firebase Authentication
        $auth->updateUser($uid, ['email' => $newEmail]);
    
        // Send confirmation to new email
        sendEmail($newEmail, "Email Successfully Updated", 
            "Your email has been successfully updated to <strong>{$newEmail}</strong>.", "#");
    
        // Send notification to old email
        sendEmail($oldEmail, "Email Changed Notification", 
            "Your email for InstaRoom has been changed from <strong>{$oldEmail}</strong> to <strong>{$newEmail}</strong>. 
            If this was not you, please contact support immediately.", "#");
    
        echo "<script>
            alert('Email update successful! Redirecting to profile page...');
            window.location.href = 'profile.html';
        </script>";
        exit;
    }    
} else {
    echo "<h2>Invalid request.</h2>";
}

function sendEmail($to, $subject, $message) {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'insta.room.1000@gmail.com';
        $mail->Password   = 'mudivopncsdzltii';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        
        $mail->setFrom('insta.room.1000@gmail.com', 'InstaRoom Support');
        $mail->addAddress($to);
        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';
        
        $styledEmail = "
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    padding: 30px;
                    text-align: center;
                }
                .email-container {
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0px 0px 10px #ccc;
                    max-width: 500px;
                    margin: auto;
                }
                h2 {
                    color: #333;
                    font-size: 22px;
                    font-weight: bold;
                }
                p {
                    font-size: 16px;
                    color: #555;
                    margin-bottom: 20px;
                }
                .footer {
                    font-size: 12px;
                    color: #666;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class='email-container'>
                <h2>Email Update Confirmation</h2>
                <p>{$message}</p>
                <p class='footer'>If you did not request this change, please contact support immediately.</p>
            </div>
        </body>
        </html>";

        $mail->Subject = $subject;
        $mail->Body    = $styledEmail;
        return $mail->send();
    } catch (Exception $e) {
        error_log("Email sending failed: {$mail->ErrorInfo}");
        return false;
    }
}
?>
