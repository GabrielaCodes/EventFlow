import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load the .env file
dotenv.config(); 

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        // Use process.env to read the hidden variables
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    }
});

export const sendEventConfirmation = async (userEmail, eventDetails) => {
    try {
        console.log(`📨 Sending email to: ${userEmail}`);

        const mailOptions = {
            // Gmail will automatically overwrite this 'from' address with your real email
            // to prevent spam, but the "Event System" name will usually stay.
            from: '"Event System" <process.env.EMAIL_USER>',
            to: userEmail,
            subject: `Event Booked: ${eventDetails.title}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px;">
                    <h2 style="color: #2563EB;">Event Request Received</h2>
                    <p>Hello,</p>
                    <p>Your event booking request has been successfully recorded.</p>
                    
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Title:</strong> ${eventDetails.title}</p>
                        <p><strong>Date:</strong> ${new Date(eventDetails.event_date).toDateString()}</p>
                        <p><strong>Status:</strong> Pending Approval</p>
                    </div>

                    <p>Our managers will review your request shortly.</p>
                    <p>Best regards,<br/>The EventFlow Team</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent successfully: " + info.response);
        return true;
    } catch (error) {
        console.error("❌ Email Error:", error);
        return false;
    }
};
// ... existing imports and transporter setup ...

// ✅ NEW: Send Approval Email to Employee
export const sendEmployeeApprovalEmail = async (userEmail, userName) => {
    try {
        console.log(`📨 Sending approval email to: ${userEmail}`);

        const mailOptions = {
            from: `"EventFlow HR" <${process.env.EMAIL_USER}>`, // Uses your env var
            to: userEmail,
            subject: '🎉 Account Approved! You can now access the Dashboard',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px;">
                    <h2 style="color: #16A34A;">Welcome to the Team!</h2>
                    <p>Hi <strong>${userName}</strong>,</p>
                    <p>Good news! Your manager has verified your account.</p>
                    
                    <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16A34A;">
                        <p><strong>Status:</strong> ✅ Active / Verified</p>
                        <p>You now have full access to view your schedule and accept tasks.</p>
                    </div>

                    <a href="http://localhost:5173/" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Dashboard</a>

                    <p style="margin-top: 20px; color: #666; font-size: 12px;">If you did not request this, please ignore this email.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Approval email sent: " + info.response);
        return true;
    } catch (error) {
        console.error("❌ Email Error:", error);
        return false;
    }
};