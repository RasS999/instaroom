<!-- booking_send_email.php -->

<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

function sendBookingEmail($to, $subject, $message) {
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
                body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; text-align: center; }
                .email-container { background: white; padding: 20px; border-radius: 8px; max-width: 400px; margin: auto; }
                h2 { color: #333; font-size: 20px; }
                p { font-size: 14px; color: #555; }
                .footer { font-size: 14px; color: #777; margin-top: 15px; }
            </style>
        </head>
        <body>
            <div class='email-container'>
                <h2>{$subject}</h2>
                <p>{$message}</p>
                <p class='footer'>Thank you for choosing InstaRoom.</p>
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

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    parse_str(file_get_contents("php://input"), $_POST);

    $to = isset($_POST['to']) ? trim($_POST['to']) : '';
    $subject = isset($_POST['subject']) ? trim($_POST['subject']) : '';
    $message = isset($_POST['message']) ? trim($_POST['message']) : '';

    if (empty($to) || empty($subject) || empty($message)) {
        echo json_encode(["success" => false, "message" => "All fields are required."]);
        exit;
    }

    if (sendBookingEmail($to, $subject, $message)) {
        echo json_encode(["success" => true, "message" => "Email sent successfully!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to send email. Check SMTP settings."]);
    }
    exit;
}

?>
