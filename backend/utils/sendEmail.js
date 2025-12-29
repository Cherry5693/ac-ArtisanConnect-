require("dotenv").config();
const SibApiV3Sdk = require("sib-api-v3-sdk");

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async (options) => {
  try {
    await emailApi.sendTransacEmail({
      sender: {
        email: process.env.SENDER_EMAIL,
        name: "ArtisanConnect",
      },
      to: [{ email: options.email }],
      subject: options.subject,
      htmlContent: options.message,
    });
  } catch (error) {
    console.error(
      "Brevo email error:",
      error?.response?.body || error.message
    );
    throw error;
  }
};

module.exports = sendEmail;
