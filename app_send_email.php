<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

function sendEmail($to, $subject, $oldEmail, $newEmail, $verificationUrl = '') {
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

        // Verification Button (if link provided)
        $buttonHtml = !empty($verificationUrl) 
            ? "<p style='text-align: center; margin-top: 20px;'>
                  <a href='{$verificationUrl}' class='btn'>Verify New Email</a>
               </p>"
            : "";

            $styledEmail = "
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; text-align: center; }
                    .email-container { background: white; padding: 20px; border-radius: 8px; max-width: 400px; margin: auto; }
                    h2 { color: #333; font-size: 20px; }
                    p { font-size: 14px; color: #555; }
                    .btn {
                        display: inline-block; padding: 10px 20px; font-size: 14px;
                        background: #BF8D5C; color: #ffffff !important; text-decoration: none; 
                        border-radius: 5px;
                    }
                    .footer { font-size: 12px; color: #777; margin-top: 15px; }
                </style>
            </head>
            <body>
                <div class='email-container'>
                    <h2>{$subject}</h2>
                    <p>We received a request to update your email from <strong>{$oldEmail}</strong> to <strong>{$newEmail}</strong>.</p>
                    <p>Click the button below to confirm:</p>
                    <p>
                        <a href='{$verificationUrl}' class='btn' style='color: #ffffff !important;'>Verify New Email</a>
                    </p>
                    <p class='footer'>If you did not request this, please ignore this email.</p>
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

// Handle Incoming Request
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $to = isset($_POST['to']) ? filter_var($_POST['to'], FILTER_SANITIZE_EMAIL) : '';
    $subject = isset($_POST['subject']) ? htmlspecialchars($_POST['subject']) : '';
    $oldEmail = isset($_POST['oldEmail']) ? filter_var($_POST['oldEmail'], FILTER_SANITIZE_EMAIL) : '';
    $newEmail = isset($_POST['newEmail']) ? filter_var($_POST['newEmail'], FILTER_SANITIZE_EMAIL) : '';
    $verificationUrl = isset($_POST['verificationUrl']) ? filter_var($_POST['verificationUrl'], FILTER_SANITIZE_URL) : '';

    if (empty($to) || empty($subject) || empty($oldEmail) || empty($newEmail)) {
        echo json_encode(["success" => false, "message" => "To, Subject, Old Email, and New Email fields are required."]);
        exit;
    }

    if (sendEmail($to, $subject, $oldEmail, $newEmail, $verificationUrl)) {
        echo json_encode(["success" => true, "message" => "Email sent successfully!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to send email. Check SMTP settings."]);
    }
    exit;
}

?>