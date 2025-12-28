require("dotenv").config();
const sendEmail = require("./utils/sendEmail");

const testEmail = async () => {
  try {
    await sendEmail({
      email: process.env.SENDER_EMAIL,
      subject: "Test OTP Email from ArtisanConnect",
      message: "<h2>Your OTP is 123456</h2>",
    });
    console.log("Test email sent successfully!");
  } catch (error) {
    console.error("Failed to send test email:", error);
  }
};

testEmail();
