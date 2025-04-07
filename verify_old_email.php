<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Kreait\Firebase\Factory;

require 'vendor/autoload.php';

$firebaseDatabaseURL = "https://insta-room-4b79a-default-rtdb.firebaseio.com";
$firebase = (new Factory)->withServiceAccount(__DIR__ . DIRECTORY_SEPARATOR . 'firebase-credentials.json');
$auth = $firebase->createAuth();

if (isset($_GET['uid']) && isset($_GET['newEmail'])) {
    $uid = $_GET['uid'];
    $newEmail = $_GET['newEmail'];

    // Step 2: Send Verification Email for NEW email
    $serverIP = "192.168.208.80"; 
    $verificationUrl = "http://{$serverIP}:8000/verify_new_email.php?uid={$uid}&newEmail=" . urlencode($newEmail);

    $emailBody = "
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
            .btn {
                display: inline-block;
                padding: 12px 25px;
                font-size: 16px;
                color: #ffffff !important;
                background-color: #BF8D5C;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
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
            <h2>Verify Your New Email</h2>
            <p>Click the button below to confirm your new email:</p>
            <a href='{$verificationUrl}' class='btn'>Verify Email</a>
            <p class='footer'>If you did not request this change, please contact support immediately.</p>
        </div>
    </body>
    </html>";

    sendEmail($newEmail, "Verify Your New Email", $emailBody);

    echo "<h2>Step 1 complete. Please verify the new email now.</h2>";
} else {
    echo "<h2>Invalid request.</h2>";
}

function sendEmail($to, $subject, $message) {
    $mail = new PHPMailer(true);
    try {
        // SMTP Server Settings
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'insta.room.1000@gmail.com'; // Your Gmail
        $mail->Password   = 'mudivopncsdzltii'; // App Password (not Gmail password)
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        // Email Headers
        $mail->setFrom('insta.room.1000@gmail.com', 'InstaRoom Support');
        $mail->addAddress($to);

        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $message; // Directly use the formatted HTML email body

        // Send Email
        return $mail->send();
    } catch (Exception $e) {
        error_log("Email sending failed: {$mail->ErrorInfo}");
        return false;
    }
}
